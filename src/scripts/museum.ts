/**
 * The museum controller.
 *
 * Corridor: scrolling walks sideways along the wall; the nearest painting's lamp brightens.
 * Entering: the camera moves square-on to the painting while the gallery lamps go out, until
 * the view is pixel-identical to the depth camera's home view, then hands over to it.
 * Piece: scrolling drives the depth camera (see camera-path.ts), then the plaque and the lens.
 * Leaving: the reverse; the visitor is back at the wall, facing the same painting.
 */
import Lenis from 'lenis';
import * as THREE from 'three';
import { Corridor, lerpPose, newPose } from './corridor';
import { DepthScene, type PieceMeta } from './depth-scene';
import { CameraPath, type CameraPose } from './camera-path';
import type { RoomEntry } from '../pieces/room-1';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (t: number) => t * t * (3 - 2 * t);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const LENS_ZOOM = 2.5;
const WALK = 1.1;        // screen heights of scrolling per painting
const MARGIN = 0.6;      // paintings' worth of wall before the first and after the last
const EXIT_ZONE = 0.5;   // screen heights past the release that walk you back out to the wall

type Mode = 'corridor' | 'entering' | 'piece' | 'leaving';
interface Journey { scene: DepthScene; path: CameraPath }

export async function startMuseum(entries: RoomEntry[]) {
  const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
  const root = document.documentElement;
  const canvas = $<HTMLCanvasElement>('canvas.depth');
  const spacer = $('.spacer'), plaque = $('.plaque'), lens = $('.lens'), cursor = $('.cursor');
  const progress = $('.progress'), progressFill = $('.progress .fill'), blackout = $('.blackout');
  const hint = $('.scroll-hint'), lensBtn = $<HTMLButtonElement>('.lens-btn'), backBtn = $<HTMLButtonElement>('.back-btn');
  const finePointer = matchMedia('(pointer: fine)').matches;
  if (!finePointer) root.classList.add('touch');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ENTER_TIME = reduced ? 0.8 : 2.2, LEAVE_TIME = reduced ? 0.8 : 1.9;
  const small = Math.min(screen.width, screen.height) < 700 || ((navigator as any).deviceMemory ?? 8) < 4;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    root.classList.add('no-webgl');
    return;
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const corridor = new Corridor(renderer, entries);
  await corridor.load();
  const n = entries.length;

  // ---- journeys are loaded on demand, when the visitor walks up to a painting --------
  const journeys = new Map<number, Promise<Journey>>();
  const ready = new Map<number, Journey>();
  function loadJourney(i: number): Promise<Journey> {
    let p = journeys.get(i);
    if (!p) {
      const piece = entries[i].piece!;
      p = (async () => {
        const meta: PieceMeta = await fetch(`${piece.base}/layers.json`).then((r) => r.json());
        const scene = new DepthScene(renderer, meta);
        await scene.load(piece.base, small ? 'half' : 'full');
        const path = new CameraPath(scene, piece.stops);
        scene.resize(vw, vh);
        path.layout(aspect);
        const j = { scene, path };
        ready.set(i, j);
        return j;
      })();
      journeys.set(i, p);
    }
    return p;
  }
  const preload = (i: number) => { if (i >= 0 && entries[i].piece && !journeys.has(i)) loadJourney(i); };

  // ---- state ----------------------------------------------------------------------------
  let mode: Mode = 'corridor';
  let active = -1;
  let lean = 0;
  let transitionStart = 0;
  const pose = newPose(), fromPose = newPose(), toPose = newPose();
  const camPose: CameraPose = { pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 30, focus: 0, visible: 1 };
  let lenis: Lenis | null = null;

  // ---- layout ------------------------------------------------------------------------
  let vw = 0, vh = 0, aspect = 1;
  const home = { w: 0, h: 0, x: 0, y: 0 };
  const corridorScroll = (t: number) => (t + MARGIN) * WALK * vh;
  const walkT = () => (lenis ? lenis.scroll : 0) / (WALK * vh) - MARGIN;
  function homeVisible(i: number) {
    const s0 = entries[i].piece!.stops[0];
    const A = ready.get(i)?.scene.aspect ?? entries[i].aspect;
    return Math.max(s0.h, ((s0.w ?? 0) * A) / aspect);
  }
  function setHome() {
    const j = ready.get(active);
    if (!j) return;
    home.h = vh / homeVisible(active); home.w = home.h * j.scene.aspect;
    home.x = (vw - home.w) / 2; home.y = (vh - home.h) / 2;
  }
  function setSpace() {
    const j = mode === 'corridor' ? null : ready.get(active);
    spacer.style.height = j
      ? `${(j.path.length + entries[active].piece!.release + EXIT_ZONE + 1) * vh}px`
      : `${((n - 1 + MARGIN * 2) * WALK + 1) * vh}px`;
  }
  function resize() {
    const keep = mode === 'corridor' ? walkT() : (lenis?.scroll ?? 0) / Math.max(1, vh);
    vw = innerWidth; vh = innerHeight; aspect = vw / vh;
    renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.75 : 2));
    renderer.setSize(vw, vh, false);
    corridor.layout(aspect);
    for (const j of ready.values()) { j.scene.resize(vw, vh); j.path.layout(aspect); }
    setHome();
    setSpace();
    if (lenis) {
      lenis.resize();
      lenis.scrollTo(mode === 'corridor' ? corridorScroll(keep) : keep * vh, { immediate: true, force: true });
    }
  }
  resize();
  const L = new Lenis({ lerp: reduced ? 1 : 0.07, wheelMultiplier: 0.75, touchMultiplier: 1.2 });
  lenis = L;
  addEventListener('resize', resize);

  // ---- snapping: when the visitor stops near a painting, drift to face it ------------
  let lastUserScroll = performance.now(), snapping = false;
  L.on('scroll', () => { if (!snapping) lastUserScroll = performance.now(); });
  function walkTo(i: number, duration = 1.6) {
    snapping = true;
    L.scrollTo(corridorScroll(i), { duration, easing: easeInOut, onComplete: () => { snapping = false; lastUserScroll = performance.now(); } });
  }
  addEventListener('wheel', () => { snapping = false; }, { passive: true });
  addEventListener('touchstart', () => { snapping = false; }, { passive: true });

  // ---- entering and leaving -----------------------------------------------------------
  async function enter(i: number, instant = false) {
    if (mode !== 'corridor' || !entries[i].piece) return;
    mode = 'entering';
    active = i;
    L.stop();
    root.classList.add('waiting');
    await loadJourney(i);
    root.classList.remove('waiting', 'over');
    fromPose.pos.copy(pose.pos); fromPose.target.copy(pose.target); fromPose.fov = pose.fov;
    corridor.homePose(i, homeVisible(i), toPose);
    transitionStart = performance.now() - (instant ? ENTER_TIME * 1000 : 0);
    plaque.textContent = entries[i].title;
    canvas.setAttribute('aria-label', `${entries[i].title}. ${entries[i].piece!.alt}`);
  }
  function finishEnter() {
    mode = 'piece';
    setHome();
    setSpace();
    L.resize();
    L.scrollTo(0, { immediate: true, force: true });
    L.start();
    root.classList.add('inside');
    if (location.hash.slice(1) !== entries[active].slug) { suppressHash = true; location.hash = entries[active].slug; }
  }
  function leave(atHome: boolean) {
    if (mode !== 'piece') return;
    mode = 'leaving';
    L.stop();
    setLookMode(false);
    root.classList.remove('inside', 'released');
    // from mid-journey, fade to black first, then rise from the home view
    transitionStart = performance.now() + (atHome ? 0 : 450);
    if (!atHome) blackout.classList.add('on');
    corridor.homePose(active, homeVisible(active), fromPose);
    corridor.walkPose(active, 0, toPose);
    if (location.hash.length > 1) { suppressHash = true; location.replace('#'); }
  }
  function finishLeave() {
    mode = 'corridor';
    setSpace();
    L.resize();
    L.scrollTo(corridorScroll(active), { immediate: true, force: true });
    L.start();
    lastUserScroll = performance.now();
  }

  // ---- hash: each piece has its own address --------------------------------------------
  let suppressHash = false;
  function fromHash(instant: boolean) {
    const slug = decodeURIComponent(location.hash.slice(1));
    const i = entries.findIndex((e) => e.slug === slug && e.piece);
    if (mode === 'piece' && entries[active].slug !== slug) leave(false);
    else if (mode === 'corridor' && i >= 0) {
      L.scrollTo(corridorScroll(i), { immediate: true, force: true });
      corridor.walkPose(i, 0, pose);
      enter(i, instant);
    }
  }
  addEventListener('hashchange', () => { if (suppressHash) { suppressHash = false; return; } fromHash(false); });

  // ---- free-look lens ---------------------------------------------------------------------
  let lookMode = false;
  function loadFull() {
    const url = `${entries[active].piece!.base}/full.webp`;
    if (lens.dataset.src !== url) { lens.dataset.src = url; lens.style.backgroundImage = `url(${url})`; }
  }
  function placeLens(cx: number, cy: number, lift = 0) {
    const r = lens.offsetWidth / 2;
    const px = cx - home.x, py = cy - home.y;
    const inside = px >= 0 && py >= 0 && px <= home.w && py <= home.h;
    lens.classList.toggle('on', inside);
    if (!inside) return;
    lens.style.transform = `translate(${cx - r}px, ${cy - r - lift}px)`;
    lens.style.backgroundSize = `${home.w * LENS_ZOOM}px ${home.h * LENS_ZOOM}px`;
    lens.style.backgroundPosition = `${-(px * LENS_ZOOM - r)}px ${-(py * LENS_ZOOM - r)}px`;
  }
  function setLookMode(on: boolean) {
    if (lookMode === on) return;
    lookMode = on;
    root.classList.toggle('looking', on);
    lensBtn.setAttribute('aria-pressed', String(on));
    if (on) { L.stop(); placeLens(vw / 2, vh / 2); } else { if (mode === 'piece') L.start(); lens.classList.remove('on'); }
  }
  lensBtn.addEventListener('click', () => setLookMode(!lookMode));

  // ---- pointer, touch, keys -------------------------------------------------------------
  const ndc = new THREE.Vector2(-9, -9);
  let pointerDirty = false;
  addEventListener('pointermove', (e) => {
    ndc.set((e.clientX / vw) * 2 - 1, -(e.clientY / vh) * 2 + 1);
    pointerDirty = true;
    if (e.pointerType === 'mouse') { cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; root.classList.add('pointer-seen'); }
    if (mode === 'piece' && root.classList.contains('released')) {
      const touch = e.pointerType !== 'mouse';
      if (!touch || lookMode) placeLens(e.clientX, e.clientY, touch ? 90 : 0);
    }
  });
  document.addEventListener('pointerleave', () => { lens.classList.remove('on'); root.classList.remove('over', 'pointer-seen'); });
  canvas.addEventListener('click', (e) => {
    if (mode === 'piece' && lookMode) { placeLens(e.clientX, e.clientY, e.pointerType === 'mouse' ? 0 : 90); return; }
    if (mode !== 'corridor') return;
    const i = corridor.pick((e.clientX / vw) * 2 - 1, -(e.clientY / vh) * 2 + 1);
    if (i < 0) return;
    if (entries[i].piece) enter(i); else walkTo(i);
  });
  backBtn.addEventListener('click', () => leave(false));

  // scrolling back past the very start of a journey returns to the wall
  let pull = 0;
  addEventListener('wheel', (e) => {
    if (mode !== 'piece' || lookMode) return;
    if (L.scroll <= 1 && e.deltaY < 0) { pull += -e.deltaY; if (pull > 260) { pull = 0; leave(true); } } else pull = 0;
  }, { passive: true });
  let touchY = 0;
  addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (mode === 'piece' && !lookMode && L.scroll <= 1 && e.touches[0].clientY - touchY > 120) leave(true);
  }, { passive: true });

  addEventListener('keydown', (e) => {
    if (mode === 'corridor') {
      const t = Math.max(0, Math.min(n - 1, Math.round(walkT())));
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); walkTo(Math.min(n - 1, t + 1)); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); walkTo(Math.max(0, t - 1)); }
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === document.body && entries[t].piece) {
        e.preventDefault();
        enter(t);
      }
    } else if (mode === 'piece' && e.key === 'Escape') {
      if (lookMode) setLookMode(false); else leave(false);
    }
  });

  // keyboard and screen-reader route along the wall
  document.querySelectorAll<HTMLButtonElement>('.wall-nav button').forEach((b) => {
    const i = Number(b.dataset.index);
    b.addEventListener('focus', () => { if (mode === 'corridor') walkTo(i, 1.2); });
    b.addEventListener('click', () => { if (entries[i].piece) enter(i); else walkTo(i); });
  });

  // ---- frame loop -----------------------------------------------------------------------
  let last = performance.now();
  const start = last;
  root.classList.add('ready');
  if (location.hash.length > 1) fromHash(true);
  else setTimeout(() => { if (mode === 'corridor' && L.scroll < 2) walkTo(0, 3.2); }, 900);

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    L.raf(now);
    const time = (now - start) / 1000;

    if (mode === 'corridor') {
      const t = walkT();
      const vel = reduced ? 0 : L.velocity;
      lean += (THREE.MathUtils.clamp(vel * 0.012, -0.55, 0.55) - lean) * Math.min(1, dt * 2.5);
      const nearest = Math.max(0, Math.min(n - 1, Math.round(t)));
      const focus = Math.abs(t - nearest) < 0.32 ? nearest : -1;
      preload(nearest);
      corridor.walkPose(t, lean, pose);
      corridor.apply(pose);
      corridor.setAmbient(1);
      corridor.update(focus, dt);
      if (pointerDirty && finePointer) {
        pointerDirty = false;
        const hover = corridor.pick(ndc.x, ndc.y);
        root.classList.toggle('over', hover >= 0 && !!entries[hover].piece);
      }
      // drift to face the nearest painting once the visitor stops
      const off = t - nearest;
      if (!snapping && now - lastUserScroll > 380 && Math.abs(off) > 0.004 && Math.abs(off) < 0.46) walkTo(nearest, 1.1 + Math.abs(off) * 1.6);
      corridor.render();
      hint.style.opacity = String(1 - clamp01(L.scroll / (0.25 * vh)));
      progress.style.opacity = '0';
    } else if (mode === 'entering' && ready.has(active)) {
      const k = clamp01((now - transitionStart) / (ENTER_TIME * 1000));
      lerpPose(fromPose, toPose, easeInOut(k), pose);
      corridor.apply(pose);
      const dark = ease(clamp01((k - 0.3) / 0.65));
      corridor.setAmbient(1 - dark);
      corridor.setLit(active, 1 - dark);
      corridor.update(active, dt);
      corridor.render();
      if (k >= 1) finishEnter();
    } else if (mode === 'piece') {
      const j = ready.get(active)!;
      const piece = entries[active].piece!;
      const x = L.scroll / vh;
      const tJourney = j.path.length;
      j.path.pose(Math.min(Math.max(x, 0), tJourney), aspect, camPose, time);
      j.scene.camera.position.copy(camPose.pos);
      j.scene.camera.fov = camPose.fov;
      j.scene.camera.updateProjectionMatrix();
      j.scene.camera.lookAt(camPose.target);
      j.scene.setOverscan(clamp01((1 - camPose.visible) / 0.15));
      j.scene.render();
      root.style.setProperty('--focus', camPose.focus.toFixed(3));
      progress.style.opacity = String(1 - clamp01((x - tJourney) * 3));
      progressFill.style.transform = `scaleY(${clamp01(x / tJourney)})`;
      if (progress.dataset.piece !== piece.slug) {
        progress.dataset.piece = piece.slug;
        progress.querySelectorAll('i').forEach((el) => el.remove());
        for (const m of j.path.marks()) {
          const tick = document.createElement('i');
          tick.style.top = `${(m / tJourney) * 100}%`;
          progress.appendChild(tick);
        }
      }
      const r = clamp01((x - tJourney) / piece.release);
      plaque.style.opacity = String(ease(clamp01((r - 0.05) / 0.4)));
      plaque.style.transform = `translate(${home.x + home.w - plaque.offsetWidth}px, ${Math.min(vh - plaque.offsetHeight - 12, home.y + home.h + 14)}px)`;
      const released = r > 0.25;
      if (x > tJourney * 0.75) loadFull();
      root.classList.toggle('released', released);
      if (!released) { setLookMode(false); lens.classList.remove('on'); }
      hint.style.opacity = '0';
      // scrolling on past the end walks back out to the wall
      if (x > tJourney + piece.release + EXIT_ZONE * 0.6) leave(true);
    } else if (mode === 'leaving') {
      if (now < transitionStart) {
        ready.get(active)!.scene.render(); // fading to black over the depth view
      } else {
        blackout.classList.remove('on');
        plaque.style.opacity = '0';
        progress.style.opacity = '0';
        root.style.setProperty('--focus', '0');
        const k = clamp01((now - transitionStart) / (LEAVE_TIME * 1000));
        lerpPose(fromPose, toPose, easeInOut(k), pose);
        corridor.apply(pose);
        const light = ease(clamp01(k / 0.7));
        corridor.setAmbient(light);
        corridor.setLit(active, light);
        corridor.update(active, dt);
        corridor.render();
        if (k >= 1) finishLeave();
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

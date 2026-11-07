/**
 * The museum controller.
 *
 * Hall: drag to look around; click or tap the floor to walk there, or a painting
 * to walk up to it. Arriving at a painting, the camera settles square-on while the
 * hall dims, then hands over (pixel-for-pixel) to the explorer.
 * Explorer: the visitor zooms and moves through the painting freely.
 * Leaving (zoom all the way out, back icon, Escape): step back into the hall.
 */
import * as THREE from 'three';
import { Hall, EYE, copyPose, newPose, type Pose } from './hall';
import { DepthScene, type PieceMeta } from './depth-scene';
import { Explorer } from './explorer';
import { Soundscape } from './sound';
import type { Painting as RoomEntry } from '../pieces/collection';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (t: number) => t * t * (3 - 2 * t);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const HALL_DIM = 0.3;     // how lit the hall stays around a painting being explored
const START = { x: 0, z: 11, yaw: 0, pitch: 0.04 };

type Mode = 'hall' | 'moving' | 'exploring' | 'leaving';
interface Journey { scene: DepthScene; explorer: Explorer }

/** A camera move: position along a curve, gaze turning smoothly between directions. */
interface Move {
  from: Pose; to: Pose; ctrl: THREE.Vector3 | null;
  start: number; dur: number; walk: number; // walk: metres walked on the floor (for the step rhythm)
  stepIdx: number;
  painting: number;                          // painting being approached, or -1
  done: () => void;
}

export async function startMuseum(entries: RoomEntry[]) {
  const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
  const root = document.documentElement;
  const canvas = $<HTMLCanvasElement>('canvas.depth');
  const plaque = $('.plaque'), cursor = $('.cursor'), hint = $('.hint');
  const backBtn = $<HTMLButtonElement>('.back-btn');
  const finePointer = matchMedia('(pointer: fine)').matches;
  if (!finePointer) root.classList.add('touch');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = Math.min(screen.width, screen.height) < 700 || ((navigator as any).deviceMemory ?? 8) < 4;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    root.classList.add('no-webgl');
    return;
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.autoClear = false;
  renderer.setClearColor(0x060606, 1);

  const hall = new Hall(renderer, entries);
  await hall.load();

  // ---- sound: off by default, the visitor's choice is remembered ---------------------------
  const sound = new Soundscape();
  const soundBtn = $<HTMLButtonElement>('.sound-btn');
  const store = { get: () => { try { return localStorage.getItem('tubo-sound'); } catch { return null; } },
    set: (v: string) => { try { localStorage.setItem('tubo-sound', v); } catch { /* storage unavailable */ } } };
  const showSound = (on: boolean) => {
    root.classList.toggle('sound-on', on);
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
  };
  soundBtn.addEventListener('click', () => {
    const on = !sound.on;
    sound.setOn(on);
    showSound(on);
    store.set(on ? 'on' : 'off');
  });
  if (store.get() === 'on') {
    // browsers only allow sound after the visitor's first touch or click
    showSound(true);
    const wake = () => { if (!sound.started && root.classList.contains('sound-on')) sound.setOn(true); };
    addEventListener('pointerdown', wake, { once: true, capture: true });
    addEventListener('keydown', wake, { once: true, capture: true });
  }

  // ---- paintings' depth layers load in the background ----------------------------------
  const journeys = new Map<number, Promise<Journey>>();
  const ready = new Map<number, Journey>();
  function loadJourney(i: number): Promise<Journey> {
    let p = journeys.get(i);
    if (!p) {
      // keep graphics memory to one painting: release every other painting's layers first
      for (const [k, other] of ready) {
        if (k === i) continue;
        other.scene.dispose();
        ready.delete(k);
        journeys.delete(k);
      }
      const base = entries[i].base;
      p = (async () => {
        const meta: PieceMeta = await fetch(`${base}/layers.json`).then((r) => r.json());
        const scene = new DepthScene(renderer, meta);
        await scene.load(base, small ? 'half' : 'full');
        scene.resize(vw, vh);
        const explorer = new Explorer(scene);
        explorer.layout(vw / vh);
        const j = { scene, explorer };
        ready.set(i, j);
        return j;
      })();
      journeys.set(i, p);
    }
    return p;
  }

  // ---- state ----------------------------------------------------------------------------
  let mode: Mode = 'hall';
  let active = -1;
  let move: Move | null = null;
  const pose = newPose();
  // the visitor waits at the entrance, two steps behind the starting point, until they step in
  const look = { pos: new THREE.Vector3(START.x, EYE, START.z + 1.6), yaw: START.yaw, pitch: 0 };
  const goal = { pos: look.pos.clone(), yaw: look.yaw, pitch: look.pitch };
  let hover = -1;

  // ---- layout ------------------------------------------------------------------------
  let vw = 0, vh = 0;
  // resolution adapts to the device: it steps down when frames run slow and back up when there is room
  const dprMax = Math.min(devicePixelRatio, small ? 1.5 : 1.75);
  let dprNow = dprMax;
  function resize() {
    vw = innerWidth; vh = innerHeight;
    const dpr = dprNow;
    renderer.setPixelRatio(dpr);
    renderer.setSize(vw, vh, false);
    hall.layout(vw, vh, dpr);
    for (const j of ready.values()) { j.scene.resize(vw, vh); j.explorer.layout(vw / vh); }
    if (mode === 'exploring' && ready.has(active)) hall.homePose(active, ready.get(active)!.explorer.homeVisible, pose);
  }
  resize();
  addEventListener('resize', resize);

  function lookPose(out: Pose) {
    const cp = Math.cos(look.pitch);
    out.pos.copy(look.pos);
    out.target.set(look.pos.x - Math.sin(look.yaw) * cp * 10, look.pos.y + Math.sin(look.pitch) * 10, look.pos.z - Math.cos(look.yaw) * cp * 10);
    out.fov = hall.fov;
    return out;
  }
  function setLookFrom(p: Pose) {
    const d = new THREE.Vector3().subVectors(p.target, p.pos).normalize();
    look.pos.set(p.pos.x, EYE, p.pos.z);
    look.yaw = Math.atan2(-d.x, -d.z);
    look.pitch = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
    goal.pos.copy(look.pos); goal.yaw = look.yaw; goal.pitch = look.pitch;
  }

  // ---- moves ----------------------------------------------------------------------------
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), q = new THREE.Quaternion(), q0 = new THREE.Quaternion();
  function startMove(to: Pose, opts: { ctrl?: THREE.Vector3 | null; painting?: number; done: () => void; speed?: number }) {
    const from = copyPose(pose, newPose());
    const dist = from.pos.distanceTo(opts.ctrl ?? to.pos) + (opts.ctrl ? opts.ctrl.distanceTo(to.pos) : 0);
    const flat = Math.hypot(to.pos.x - from.pos.x, to.pos.z - from.pos.z);
    const dur = reduced ? 0.6 : THREE.MathUtils.clamp(dist / (opts.speed ?? 3.2) + 0.45, 1.0, 3.6);
    move = { from, to: copyPose(to, newPose()), ctrl: opts.ctrl ?? null, start: performance.now(), dur: dur * 1000, walk: flat, stepIdx: 0, painting: opts.painting ?? -1, done: opts.done };
    mode = 'moving';
  }
  function stepMove(now: number) {
    const m = move!;
    const t = clamp01((now - m.start) / m.dur);
    const e = easeInOut(t);
    // position: straight, or a gentle curve through a control point
    if (m.ctrl) {
      const a = 1 - e;
      pose.pos.set(0, 0, 0).addScaledVector(m.from.pos, a * a).addScaledVector(m.ctrl, 2 * a * e).addScaledVector(m.to.pos, e * e);
    } else pose.pos.lerpVectors(m.from.pos, m.to.pos, e);
    // footsteps: a slight rise and fall while walking on the floor
    if (m.walk > 0.5) {
      const steps = Math.max(2, Math.round(m.walk / 0.75));
      if (!reduced) pose.pos.y += Math.sin(e * Math.PI * steps) * 0.014 * Math.sin(Math.PI * e);
      const n = Math.floor(e * steps + 0.5);
      if (n !== m.stepIdx && n > 0 && n <= steps) { m.stepIdx = n; sound.step(); }
    }
    // gaze: turn toward where we are going a little ahead of the body
    const g = ease(clamp01(t * 1.5));
    tmpA.subVectors(m.from.target, m.from.pos); const la = tmpA.length(); tmpA.normalize();
    tmpB.subVectors(m.to.target, m.to.pos); const lb = tmpB.length(); tmpB.normalize();
    q0.setFromUnitVectors(tmpA, tmpB);
    q.identity().slerp(q0, g);
    tmpA.applyQuaternion(q).multiplyScalar(la + (lb - la) * g);
    pose.target.copy(pose.pos).add(tmpA);
    pose.fov = m.from.fov + (m.to.fov - m.from.fov) * e;
    if (m.painting >= 0) {
      // the hall dims as we settle in front of the painting
      const s = ease(clamp01((t - 0.6) / 0.4));
      hall.setDim(1 - (1 - HALL_DIM) * s);
      hall.setLit(m.painting, 1 - s);
    }
    if (t >= 1) { move = null; m.done(); }
  }

  function walkToPainting(i: number) {
    if (mode === 'exploring' || mode === 'leaving') return;
    active = i;
    root.classList.add('walked');
    const jp = loadJourney(i);
    const visible = ready.get(i)?.explorer.homeVisible ?? Math.max(1.18, (1.12 * entries[i].aspect) / (vw / vh));
    const home = hall.homePose(i, visible, newPose());
    const stand = hall.standPose(i, newPose());
    const fromDist = Math.hypot(pose.pos.x - stand.pos.x, pose.pos.z - stand.pos.z);
    // walk to a spot in front of the painting, then step up close; curve only when coming from afar
    const ctrl = fromDist > 1.5 ? new THREE.Vector3(stand.pos.x, EYE, stand.pos.z) : null;
    startMove(home, {
      ctrl, painting: i,
      done: async () => {
        root.classList.add('waiting');
        const j = await jp;
        root.classList.remove('waiting');
        explore(i, j);
      },
    });
  }

  function walkToPoint(p: THREE.Vector3) {
    if (mode === 'exploring' || mode === 'leaving') return;
    root.classList.add('walked');
    const to = newPose();
    to.pos.set(p.x, EYE, p.z);
    hall.clamp(to.pos);
    const dir = new THREE.Vector3(to.pos.x - pose.pos.x, 0, to.pos.z - pose.pos.z);
    if (dir.lengthSq() < 0.04) return;
    dir.normalize();
    to.target.copy(to.pos).addScaledVector(dir, 10);
    to.target.y = EYE + 0.35;
    to.fov = hall.fov;
    startMove(to, { done: () => { setLookFrom(pose); mode = 'hall'; } });
  }

  // ---- exploring ---------------------------------------------------------------------------
  let outPull = 0;
  function explore(i: number, j: Journey) {
    mode = 'exploring';
    active = i;
    // only the painting being explored keeps its full layers in graphics memory
    for (const [k, other] of ready) {
      if (k === i) continue;
      other.scene.dispose();
      ready.delete(k);
      journeys.delete(k);
    }
    j.explorer.layout(vw / vh);
    j.explorer.reset(true);
    hall.homePose(i, j.explorer.homeVisible, pose);
    hall.apply(pose);
    hall.setDim(HALL_DIM);
    hall.setLit(i, 0);
    plaque.textContent = entries[i].title;
    canvas.setAttribute('aria-label', `${entries[i].title}. ${entries[i].alt}`);
    root.classList.add('inside');
    outPull = 0;
    if (location.hash.slice(1) !== entries[i].slug) { suppressHash = true; location.hash = entries[i].slug; }
  }

  let leaveStart = 0;
  function leave() {
    if (mode !== 'exploring') return;
    mode = 'leaving';
    leaveStart = performance.now();
    ready.get(active)!.explorer.reset();
    root.classList.remove('inside');
    canvas.setAttribute('aria-label', 'A dark exhibition hall with large paintings, each under its own spotlights.');
    if (location.hash.length > 1) { suppressHash = true; location.replace('#'); }
  }
  function stepBack() {
    const i = active;
    const stand = hall.standPose(i, newPose());
    const dimFrom = HALL_DIM;
    startMove(stand, { done: () => { setLookFrom(pose); mode = 'hall'; hall.setDim(1); hall.setLit(i, 1); } });
    // brighten as we step back (reverse of the approach)
    const m = move!;
    const base = m.done;
    m.painting = -1;
    m.done = base;
    lightUp = { start: m.start, dur: m.dur, from: dimFrom, i };
  }
  let lightUp: { start: number; dur: number; from: number; i: number } | null = null;

  // ---- each painting has its own address -----------------------------------------------
  let suppressHash = false;
  function fromHash() {
    const slug = decodeURIComponent(location.hash.slice(1));
    const i = entries.findIndex((e) => e.slug === slug);
    if (mode === 'exploring' && entries[active].slug !== slug) leave();
    else if ((mode === 'hall' || mode === 'moving') && i >= 0) walkToPainting(i);
  }
  addEventListener('hashchange', () => { if (suppressHash) { suppressHash = false; return; } fromHash(); });

  // ---- input --------------------------------------------------------------------------------
  const pointers = new Map<number, { x: number; y: number }>();
  let downAt = { x: 0, y: 0, t: 0 }, dragged = false, lastTap = { t: 0, x: 0, y: 0 };
  let pinch = { dist: 0, mx: 0, my: 0 };
  let lastMoveT = 0;

  canvas.addEventListener('pointerdown', (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch { /* synthetic or already-released pointer */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; dragged = false; lastMoveT = performance.now(); }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      dragged = true;
    }
    if (mode === 'exploring') ready.get(active)!.explorer.stop();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') { cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; root.classList.add('pointer-seen'); }
    const p = pointers.get(e.pointerId);
    if (!p) {
      // hovering (mouse): light up the painting under the cursor
      if (mode === 'hall') {
        const pick = hall.pick((e.clientX / vw) * 2 - 1, -(e.clientY / vh) * 2 + 1);
        hover = pick?.kind === 'painting' ? pick.index : -1;
        root.classList.toggle('over', hover >= 0);
      }
      return;
    }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) dragged = true;
    const now = performance.now(), dt = Math.max(0.001, (now - lastMoveT) / 1000);
    lastMoveT = now;

    if (mode === 'exploring') {
      const ex = ready.get(active)!.explorer;
      if (pointers.size === 1) ex.panBy(dx, dy, vw, vh, dt);
      else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const f = dist / Math.max(1, pinch.dist);
        if (ex.goalZoom <= 1.001 && f < 1) { outPull += 1 - f; if (outPull > 0.35) leave(); }
        else outPull = 0;
        ex.zoomAt(f, mx, my, vw, vh);
        ex.panBy(mx - pinch.mx, my - pinch.my, vw, vh);
        pinch = { dist, mx, my };
      }
    } else if (mode === 'hall' && pointers.size === 1 && dragged) {
      // look around
      const k = (hall.fov / 55) * (e.pointerType === 'touch' ? 0.8 : 1);
      goal.yaw += dx * 0.0042 * k;
      goal.pitch = THREE.MathUtils.clamp(goal.pitch + dy * 0.003 * k, -0.35, 0.5);
    }
  });

  const endPointer = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size === 1) { const [a] = [...pointers.values()]; downAt = { x: a.x, y: a.y, t: performance.now() }; }
    if (pointers.size > 0) return;
    if (mode === 'exploring') ready.get(active)!.explorer.release();
    if (dragged || e.type === 'pointercancel') return;
    const now = performance.now();
    const isTap = now - downAt.t < 450;
    if (!isTap) return;
    if (mode === 'exploring') {
      // double-tap / double-click: look closer here, or step back to the whole painting
      if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
        const ex = ready.get(active)!.explorer;
        if (ex.goalZoom > 2.2) ex.reset(); else ex.zoomAt(2.6, e.clientX, e.clientY, vw, vh);
        lastTap.t = 0;
      } else lastTap = { t: now, x: e.clientX, y: e.clientY };
      return;
    }
    if (mode !== 'hall' && mode !== 'moving') return;
    const pick = hall.pick((e.clientX / vw) * 2 - 1, -(e.clientY / vh) * 2 + 1);
    if (!pick) return;
    if (mode === 'moving') { if (move?.painting !== -1) return; move = null; setLookFrom(pose); mode = 'hall'; }
    if (pick.kind === 'painting') walkToPainting(pick.index);
    else walkToPoint(pick.point);
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  addEventListener('wheel', (e) => {
    e.preventDefault();
    if (!entered) { enterMuseum(); return; }
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
    if (mode === 'exploring') {
      const ex = ready.get(active)!.explorer;
      if (ex.goalZoom <= 1.001 && dy > 0) { outPull += dy; if (outPull > 320) leave(); return; }
      outPull = 0;
      ex.zoomAt(Math.exp(-dy * 0.0016), e.clientX, e.clientY, vw, vh);
    } else if (mode === 'hall') {
      // walk forward and back along the gaze
      const f = new THREE.Vector3(-Math.sin(goal.yaw), 0, -Math.cos(goal.yaw));
      goal.pos.addScaledVector(f, -dy * 0.006);
      hall.clamp(goal.pos);
      root.classList.add('walked');
    }
  }, { passive: false });

  addEventListener('keydown', (e) => {
    if (!entered) {
      if (['Enter', ' ', 'ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key)) { e.preventDefault(); enterMuseum(); }
      return;
    }
    if (mode === 'exploring') {
      const ex = ready.get(active)!.explorer;
      const step = 0.14;
      const keys: Record<string, () => void> = {
        ArrowLeft: () => ex.panBy(vw * step, 0, vw, vh), ArrowRight: () => ex.panBy(-vw * step, 0, vw, vh),
        ArrowUp: () => ex.panBy(0, vh * step, vw, vh), ArrowDown: () => ex.panBy(0, -vh * step, vw, vh),
        '+': () => ex.zoomAt(1.5, vw / 2, vh / 2, vw, vh), '=': () => ex.zoomAt(1.5, vw / 2, vh / 2, vw, vh),
        '-': () => (ex.goalZoom <= 1.001 ? leave() : ex.zoomAt(1 / 1.5, vw / 2, vh / 2, vw, vh)),
        '0': () => ex.reset(), Escape: () => leave(), p: toggleGuide, ' ': toggleGuide,
      };
      if (keys[e.key]) { e.preventDefault(); keys[e.key](); }
    } else if (mode === 'hall') {
      const f = new THREE.Vector3(-Math.sin(goal.yaw), 0, -Math.cos(goal.yaw));
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') goal.pos.addScaledVector(f, 1.2);
      else if (k === 'arrowdown' || k === 's') goal.pos.addScaledVector(f, -1.2);
      else if (k === 'arrowleft' || k === 'a') goal.yaw += 0.25;
      else if (k === 'arrowright' || k === 'd') goal.yaw -= 0.25;
      else return;
      e.preventDefault();
      hall.clamp(goal.pos);
      root.classList.add('walked');
    }
  });

  // on-screen zoom buttons
  $('.zoom-in').addEventListener('click', () => { if (mode === 'exploring') ready.get(active)!.explorer.zoomAt(1.6, vw / 2, vh / 2, vw, vh); });
  $('.zoom-out').addEventListener('click', () => {
    if (mode !== 'exploring') return;
    const ex = ready.get(active)!.explorer;
    if (ex.goalZoom <= 1.001) leave(); else ex.zoomAt(1 / 1.6, vw / 2, vh / 2, vw, vh);
  });
  $('.zoom-fit').addEventListener('click', () => { if (mode === 'exploring') ready.get(active)!.explorer.reset(); });
  function toggleGuide() {
    if (mode !== 'exploring') return;
    const ex = ready.get(active)!.explorer;
    if (ex.guiding) { ex.stopGuide(); return; }
    root.classList.add('guiding');
    guideBtn.setAttribute('aria-pressed', 'true');
    ex.playGuide(entries[active].guide, () => { root.classList.remove('guiding'); guideBtn.setAttribute('aria-pressed', 'false'); }, (_i, hidden) => sound.chime(hidden));
  }
  const guideBtn = $<HTMLButtonElement>('.guide-btn');
  guideBtn.addEventListener('click', toggleGuide);
  backBtn.addEventListener('click', () => leave());

  // keyboard and screen-reader route to each painting
  document.querySelectorAll<HTMLButtonElement>('.wall-nav button').forEach((b) => {
    b.addEventListener('click', () => {
      const i = Number(b.dataset.index);
      if (mode === 'exploring') { leave(); return; }
      walkToPainting(i);
    });
  });

  // ---- the threshold: the lens of the Tubo mark opens like an iris onto the gallery ----------
  const threshold = $('.threshold');
  let entered = false;
  function enterMuseum(instant = false) {
    if (entered) return;
    entered = true;
    root.classList.add('entering');
    const lens = threshold.querySelector('.iris')!.getBoundingClientRect();
    const cx = lens.left + lens.width / 2, cy = lens.top + lens.height / 2;
    threshold.style.setProperty('--x', `${cx}px`);
    threshold.style.setProperty('--y', `${cy}px`);
    const far = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy)) + 40;
    const finish = () => { threshold.remove(); root.classList.remove('entering'); root.classList.add('entered'); };
    if (instant || reduced) {
      threshold.style.transition = 'opacity 0.6s ease';
      threshold.style.opacity = '0';
      setTimeout(finish, instant ? 0 : 650);
      if (!instant) stepIn();
      return;
    }
    const t0 = performance.now(), dur = 1900;
    const open = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      // slow at first, like an eye opening, then quickly wide
      threshold.style.setProperty('--r', `${Math.pow(k, 2.4) * far}px`);
      if (k < 1) requestAnimationFrame(open); else finish();
    };
    requestAnimationFrame(open);
    setTimeout(stepIn, 350);
  }
  /** Two slow steps in from the entrance. */
  function stepIn() {
    if (mode !== 'hall') return;
    const to = newPose();
    look.pos.set(START.x, EYE, START.z); look.yaw = START.yaw; look.pitch = START.pitch;
    lookPose(to);
    look.pos.set(START.x, EYE, START.z + 1.6); look.pitch = 0;
    startMove(to, { speed: 0.75, done: () => { setLookFrom(pose); mode = 'hall'; } });
  }
  threshold.addEventListener('click', () => { if (root.classList.contains('ready')) enterMuseum(); });

  // ---- frame loop ---------------------------------------------------------------------------
  (window as any).__tuboState = () => ({ mode, active, dpr: dprNow, loaded: ready.size, pos: pose.pos.toArray().map((v) => +v.toFixed(2)), target: pose.target.toArray().map((v) => +v.toFixed(2)), fov: +pose.fov.toFixed(1), move: move && { dur: move.dur, painting: move.painting, to: move.to.pos.toArray().map((v) => +v.toFixed(2)) } });
  lookPose(pose);
  let last = performance.now();
  root.classList.add('ready');
  if (location.hash.length > 1) {
    // a link straight to a painting skips the threshold
    enterMuseum(true);
    setTimeout(fromHash, 300);
  }
  // a painting's depth layers load when the visitor walks toward it, one painting at a time


  let perfFrames = 0, perfTime = 0, perfChanged = 0;
  function adaptResolution(dtRaw: number, now: number) {
    if (document.hidden) return;
    perfFrames++; perfTime += dtRaw;
    if (perfFrames < 45) return;
    const avg = perfTime / perfFrames;
    perfFrames = 0; perfTime = 0;
    if (avg > 0.024 && dprNow > 0.6) { dprNow = Math.max(0.6, dprNow - 0.25); perfChanged = now; resize(); }
    else if (avg < 0.0135 && dprNow < dprMax && now - perfChanged > 4000) { dprNow = Math.min(dprMax, dprNow + 0.25); perfChanged = now; resize(); }
  }

  function frame(now: number) {
    adaptResolution((now - last) / 1000, now);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    renderer.setRenderTarget(null);
    renderer.clear();

    if (mode === 'hall') {
      const k = 1 - Math.exp(-dt * 14);
      look.pos.lerp(goal.pos, k);
      look.yaw += (goal.yaw - look.yaw) * k;
      look.pitch += (goal.pitch - look.pitch) * k;
      lookPose(pose);
    } else if (mode === 'moving') {
      stepMove(now);
    }

    if (mode === 'exploring' || mode === 'leaving') {
      const j = ready.get(active)!;
      j.explorer.update(dt);
      const visible = j.explorer.visible;
      // the dimmed hall shows around the painting only while the whole painting is in view
      if (visible > 0.95) { hall.apply(pose); hall.update(-1, dt); hall.render(false); renderer.clearDepth(); }
      j.scene.render();
      plaque.style.opacity = String(mode === 'exploring' ? 1 - clamp01((j.explorer.zoom - 1) / 0.25) : 0);
      const hh = vh / j.explorer.homeVisible, hw = hh * j.scene.aspect;
      plaque.style.transform = `translate(${(vw + hw) / 2 - plaque.offsetWidth}px, ${Math.min(vh - plaque.offsetHeight - 12, (vh + hh) / 2 + 14)}px)`;
      if (mode === 'leaving' && (j.explorer.atHome() || now - leaveStart > 1200)) {
        j.explorer.reset(true);
        stepBack();
      }
    } else {
      if (lightUp && move) {
        const s = ease(clamp01((now - lightUp.start) / lightUp.dur / 0.7));
        hall.setDim(lightUp.from + (1 - lightUp.from) * s);
        hall.setLit(lightUp.i, s);
      } else if (lightUp && !move) lightUp = null;
      plaque.style.opacity = '0';
      hall.apply(pose);
      hall.update(mode === 'hall' ? hover : -1, dt);
      hall.render(true);
    }
    hint.style.opacity = root.classList.contains('walked') || mode !== 'hall' ? '0' : '';
    sound.setPosition(pose.pos.x);
    sound.setFocus(mode === 'exploring' ? 1 : mode === 'leaving' ? 0.6 : mode === 'moving' && move && move.painting >= 0 ? clamp01(((now - move.start) / move.dur) * 1.6 - 0.6) : 0);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

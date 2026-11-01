/**
 * A piece page: approach the painting on the wall, then let the scroll drive
 * the depth camera through it, return, and finally explore freely with a lens.
 */
import Lenis from 'lenis';
import * as THREE from 'three';
import { DepthScene, type PieceMeta } from './depth-scene';
import { CameraPath, type CameraPose } from './camera-path';
import type { Piece } from '../pieces/types';

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const LENS_ZOOM = 2.5;

export async function startPiece(piece: Piece) {
  const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
  const root = document.documentElement;
  if (!matchMedia('(pointer: fine)').matches) root.classList.add('touch');
  const canvas = $<HTMLCanvasElement>('canvas.depth');
  const hang = $('.hang'), frame = $('.frame'), wallImg = $<HTMLImageElement>('.hang img'), wall = $('.wall');
  const spacer = $('.spacer'), plaque = $('.plaque'), lens = $('.lens');
  const progress = $('.progress'), progressFill = $('.progress .fill');
  const hint = $('.scroll-hint'), lensBtn = $<HTMLButtonElement>('.lens-btn'), backBtn = $<HTMLButtonElement>('.back-btn');

  const small = Math.min(screen.width, screen.height) < 700 || ((navigator as any).deviceMemory ?? 8) < 4;
  const meta: PieceMeta = await fetch(`${piece.base}/layers.json`).then((r) => r.json());

  let scene: DepthScene;
  try {
    scene = new DepthScene(canvas, meta);
  } catch {
    root.classList.add('no-webgl');
    return;
  }
  await scene.load(piece.base, small ? 'half' : 'full');
  const path = new CameraPath(scene, piece.stops);
  const A = scene.aspect;

  // scroll layout, in screen heights
  const tApproach = piece.approach, tJourney = path.length, tRelease = piece.release;
  const total = tApproach + tJourney + tRelease;

  // progress line ticks
  for (const m of path.marks()) {
    const tick = document.createElement('i');
    tick.style.top = `${(m / tJourney) * 100}%`;
    progress.appendChild(tick);
  }

  let vw = 0, vh = 0, aspect = 1;
  /** Painting rectangle on screen at the home view (identical for the wall image and the 3D scene). */
  const home = { w: 0, h: 0, x: 0, y: 0 };
  function resize() {
    vw = innerWidth; vh = innerHeight; aspect = vw / vh;
    scene.resize(vw, vh, Math.min(devicePixelRatio, small ? 1.75 : 2));
    path.layout(aspect);
    const first = piece.stops[0];
    const visible = Math.max(first.h, ((first.w ?? 0) * A) / aspect);
    home.h = vh / visible; home.w = home.h * A;
    home.x = (vw - home.w) / 2; home.y = (vh - home.h) / 2;
    spacer.style.height = `${(total + 1) * vh}px`;
  }
  resize();
  addEventListener('resize', resize);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lenis = new Lenis({ lerp: reduced ? 1 : 0.07, wheelMultiplier: 0.75, touchMultiplier: 1.2 });

  // ---- free-look lens ----------------------------------------------------
  let fullLoaded = false;
  function loadFull() {
    if (fullLoaded) return;
    fullLoaded = true;
    lens.style.backgroundImage = `url(${piece.base}/full.webp)`;
  }
  let lookMode = false; // touch devices: explicit mode, page scroll paused
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
  addEventListener('pointermove', (e) => {
    if (!root.classList.contains('released')) return;
    const touch = e.pointerType !== 'mouse';
    if (!touch || lookMode) placeLens(e.clientX, e.clientY, touch ? 90 : 0);
  });
  document.addEventListener('pointerleave', () => lens.classList.remove('on'));
  function setLookMode(on: boolean) {
    lookMode = on;
    root.classList.toggle('looking', on);
    lensBtn.setAttribute('aria-pressed', String(on));
    if (on) { lenis.stop(); placeLens(vw / 2, vh / 2); } else { lenis.start(); lens.classList.remove('on'); }
  }
  lensBtn.addEventListener('click', () => setLookMode(!lookMode));
  addEventListener('pointerdown', (e) => {
    if (lookMode && e.target === canvas) placeLens(e.clientX, e.clientY, e.pointerType === 'mouse' ? 0 : 90);
  });
  backBtn.addEventListener('click', () => {
    if (lookMode) setLookMode(false);
    lenis.scrollTo(0, { duration: 3.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
  });

  // ---- frame loop --------------------------------------------------------
  const pose: CameraPose = { pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 30, focus: 0, visible: 1 };
  const start = performance.now();
  root.classList.add('ready');

  function frameLoop(now: number) {
    lenis.raf(now);
    const x = lenis.scroll / vh;
    const time = (now - start) / 1000;

    // 1 · approach: the painting on the wall comes toward us
    const a = clamp01(x / tApproach);
    const grow = easeOut(clamp01(a / 0.8));
    const enter = ease(clamp01((a - 0.72) / 0.28));
    const h0 = Math.min(vh * 0.46, (vw * 0.5) / A);
    const hNow = h0 + (home.h - h0) * grow;
    const yShift = (1 - grow) * -0.04 * vh;
    hang.style.width = `${hNow * A}px`;
    hang.style.height = `${hNow}px`;
    hang.style.transform = `translate(${(vw - hNow * A) / 2}px, ${(vh - hNow) / 2 + yShift}px)`;
    frame.style.transform = `scale(${1 + enter * 0.45})`;
    frame.style.opacity = String(1 - enter);
    wall.style.opacity = String(1 - enter);
    wallImg.style.opacity = String(1 - ease(clamp01((a - 0.9) / 0.1)));
    canvas.style.opacity = String(enter);
    root.classList.toggle('inside', enter > 0.5);
    hint.style.opacity = String(1 - clamp01(x * 6));

    // 2 · journey through the painting
    const j = x - tApproach;
    const jx = Math.min(Math.max(j, 0), tJourney);
    if (enter > 0) {
      path.pose(jx, aspect, pose, time);
      scene.camera.position.copy(pose.pos);
      scene.camera.fov = pose.fov;
      scene.camera.updateProjectionMatrix();
      scene.camera.lookAt(pose.target);
      scene.render();
    }
    root.style.setProperty('--focus', pose.focus.toFixed(3));
    root.style.setProperty('--depth', clamp01((1 - pose.visible) * 1.2).toFixed(3));
    progress.style.opacity = String(enter * (1 - clamp01((j - tJourney) * 3)));
    progressFill.style.transform = `scaleY(${clamp01(j / tJourney)})`;

    // 3 · release: plaque, then the lens
    const r = clamp01((j - tJourney) / tRelease);
    plaque.style.opacity = String(ease(clamp01((r - 0.05) / 0.4)));
    plaque.style.transform = `translate(${home.x + home.w - plaque.offsetWidth}px, ${Math.min(vh - plaque.offsetHeight - 12, home.y + home.h + 14)}px)`;
    const released = r > 0.25;
    if (j > tJourney * 0.75) loadFull();
    root.classList.toggle('released', released);
    if (!released && lookMode) setLookMode(false);
    if (!released) lens.classList.remove('on');

    requestAnimationFrame(frameLoop);
  }
  requestAnimationFrame(frameLoop);
}

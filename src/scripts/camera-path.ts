/**
 * Turns a piece's camera stops into a smooth, scroll-driven camera path.
 *
 * Each stop is reduced to a numeric vector and interpolated with a Catmull-Rom
 * spline, so the camera drifts and curves between stops instead of moving in
 * straight lines. Zoom and target distance are interpolated in log space so
 * zooming feels even.
 */
import * as THREE from 'three';
import { DepthScene } from './depth-scene';
import type { Stop } from '../pieces/types';

// vector layout: u, v, ln(visible), ln(targetZ), px, py, pz, focus
type Vec = number[];

export interface CameraPose { pos: THREE.Vector3; target: THREE.Vector3; fov: number; focus: number; visible: number }

const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

export class CameraPath {
  private vecs: Vec[] = [];
  /** Start of each stop's travel, and of its hold, in scroll units. */
  private starts: { travel: number; hold: number; end: number }[] = [];
  readonly length: number;

  constructor(private scene: DepthScene, private stops: Stop[]) {
    let x = 0;
    for (const s of stops) {
      const travel = x; x += s.travel;
      const hold = x; x += s.hold;
      this.starts.push({ travel, hold, end: x });
    }
    this.length = x;
  }

  /** Scroll positions (in units) of stops marked for the progress line. */
  marks() { return this.stops.flatMap((s, i) => (s.mark ? [this.starts[i].hold] : [])); }

  /** Recompute for a screen aspect ratio (visible area depends on it). */
  layout(screenAspect: number) {
    const A = this.scene.aspect;
    this.vecs = this.stops.map((s) => {
      const visible = Math.max(s.h, ((s.w ?? 0) * A) / screenAspect);
      // average depth around the target so a stop on an edge does not snap
      let d = 0, n = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        d += this.scene.depthAt(s.u + dx * 0.004, s.v + dy * 0.004); n++;
      }
      const z = this.scene.zAt(d / n);
      const [px, py, pz] = s.pos ?? [0, 0, 0];
      return [s.u, s.v, Math.log(visible), Math.log(z), px, py, pz, s.focus ?? 0];
    });
  }

  /** Camera vector at scroll position x (units from the first stop). */
  private sample(x: number): Vec {
    const n = this.stops.length;
    if (x <= 0) return this.vecs[0];
    for (let i = 0; i < n; i++) {
      const st = this.starts[i];
      if (x < st.hold && i > 0) {
        const t = smoother((x - st.travel) / Math.max(1e-6, st.hold - st.travel));
        const p0 = this.vecs[Math.max(0, i - 2)], p1 = this.vecs[i - 1], p2 = this.vecs[i], p3 = this.vecs[Math.min(n - 1, i + 1)];
        return p1.map((_, k) => catmull(p0[k], p1[k], p2[k], p3[k], t));
      }
      if (x < st.end) return this.vecs[i];
    }
    return this.vecs[n - 1];
  }

  pose(x: number, screenAspect: number, out: CameraPose, time = 0): CameraPose {
    const [u0, v0, lnVis, lnZ, px, py, pz, focus] = this.sample(x);
    const A = this.scene.aspect;
    const visible = Math.exp(lnVis);
    // keep close-ups inside the painting
    // (a view wider than the painting is centred instead)
    const hv = visible / 2, hu = (visible * screenAspect) / (2 * A);
    const keepIn = (c: number, half: number) => {
      return half >= 0.5 ? 0.5 : THREE.MathUtils.clamp(c, half, 1 - half);
    };
    const u = keepIn(u0, hu), v = keepIn(v0, hv);
    const z = Math.exp(lnZ);
    out.target.set((u - 0.5) * A * DepthScene.K0 * z, (0.5 - v) * DepthScene.K0 * z, -z);
    out.pos.set(px, py, pz);
    // a barely-there breath, like a held camera; fades out at the home view
    const breath = THREE.MathUtils.clamp((1 - visible) * 1.4, 0, 1) * 0.0035 * z;
    out.target.x += Math.sin(time * 0.31) * breath;
    out.target.y += Math.sin(time * 0.23 + 1.3) * breath * 0.7;
    const dist = out.pos.distanceTo(out.target);
    const span = visible * z * DepthScene.K0;
    out.fov = THREE.MathUtils.radToDeg(2 * Math.atan(span / (2 * dist)));
    out.focus = focus;
    out.visible = visible;
    return out;
  }
}

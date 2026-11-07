/**
 * Free exploration of one painting through its depth layers.
 *
 * The visitor controls the view: zoom (wheel, pinch, double-tap, buttons) and
 * move (drag, arrow keys). Moving shifts the camera sideways, not just the
 * image, so near layers slide past far ones. Motion is smoothed with inertia.
 */
import * as THREE from 'three';
import { DepthScene } from './depth-scene';

const PARALLAX = 0.55;   // share of a pan made by moving the camera (the rest is turning it)
const MIN_VISIBLE = 0.07; // closest zoom: this fraction of the painting's height fills the screen

/** A stop on the optional guided view. h: fraction of the painting's height in view; hold: seconds to linger. */
export interface GuideStop { u: number; v: number; h: number; hold: number }
interface View { zoom: number; u: number; v: number }
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export class Explorer {
  /** Desired view (set by input) and displayed view (eased toward it). */
  private goal = { zoom: 1, u: 0.5, v: 0.5 };
  private view = { zoom: 1, u: 0.5, v: 0.5 };
  private vel = new THREE.Vector2();   // pan velocity in image units per second, for inertia
  private zRef: number;
  homeVisible = 1.18;
  aspect = 1;
  private target = new THREE.Vector3();
  private guide: { stops: (View & { hold: number; travel: number })[]; from: View; t: number; onEnd: () => void; onArrive?: (i: number, hidden: boolean) => void; arrived: number } | null = null;

  constructor(readonly scene: DepthScene, private firstH = 1.18, private firstW = 1.12) {
    // reference depth: the median of the painting, so panning feels anchored to its middle ground
    const ds: number[] = [];
    for (let y = 0.1; y < 1; y += 0.1) for (let x = 0.1; x < 1; x += 0.1) ds.push(scene.depthAt(x, y));
    ds.sort((a, b) => a - b);
    this.zRef = scene.zAt(ds[Math.floor(ds.length / 2)]);
  }

  layout(aspect: number) {
    this.aspect = aspect;
    this.homeVisible = Math.max(this.firstH, (this.firstW * this.scene.aspect) / aspect);
    this.clampGoal();
  }

  get maxZoom() { return this.homeVisible / MIN_VISIBLE; }
  get zoom() { return this.view.zoom; }
  get goalZoom() { return this.goal.zoom; }
  /** Fraction of the painting's height on screen right now. */
  get visible() { return this.homeVisible / this.view.zoom; }
  /** Size of the screen in image units (u across, v down) at a zoom level. */
  private span(zoom: number) {
    const vis = this.homeVisible / zoom;
    return { su: (vis * this.aspect) / this.scene.aspect, sv: vis };
  }

  get guiding() { return this.guide !== null; }

  /** Play the guided view: the camera travels from stop to stop, then back to the whole painting. */
  playGuide(stops: GuideStop[], onEnd: () => void, onArrive?: (i: number, hidden: boolean) => void) {
    this.vel.set(0, 0);
    let prev: View = { ...this.view };
    const list = [...stops.map((s) => ({ u: s.u, v: s.v, zoom: THREE.MathUtils.clamp(this.homeVisible / s.h, 1, this.maxZoom), hold: s.hold })),
      { u: 0.5, v: 0.5, zoom: 1, hold: 0 }].map((s) => {
      const travel = 2.4 + Math.abs(Math.log(s.zoom / prev.zoom)) * 0.5 + Math.hypot(s.u - prev.u, s.v - prev.v) * 2.2;
      prev = s;
      return { ...s, travel };
    });
    this.guide = { stops: list, from: { ...this.view }, t: 0, onEnd, onArrive, arrived: -1 };
  }

  /** Any input of the visitor's own ends the guided view. */
  stopGuide() {
    const g = this.guide;
    if (!g) return;
    this.guide = null;
    g.onEnd();
  }

  private stepGuide(dt: number) {
    const g = this.guide!;
    g.t += dt;
    let t = g.t, prev: View = g.from;
    for (let i = 0; i < g.stops.length; i++) {
      const s = g.stops[i];
      if (t < s.travel) {
        const k = smoother(t / s.travel);
        // pull back while crossing the painting, then lean in again
        const across = Math.hypot(s.u - prev.u, s.v - prev.v);
        const lift = Math.min(across * 1.6, Math.log(Math.min(prev.zoom, s.zoom))) * Math.sin(Math.PI * k);
        this.goal.zoom = Math.exp(Math.log(prev.zoom) + (Math.log(s.zoom) - Math.log(prev.zoom)) * k - lift);
        this.goal.u = prev.u + (s.u - prev.u) * k;
        this.goal.v = prev.v + (s.v - prev.v) * k;
        this.clampGoal();
        return;
      }
      t -= s.travel;
      if (t < s.hold) {
        // the last stop before the way home is the hidden detail
        if (g.arrived !== i) { g.arrived = i; g.onArrive?.(i, i === g.stops.length - 2); }
        this.goal.zoom = s.zoom; this.goal.u = s.u; this.goal.v = s.v; this.clampGoal(); return; }
      t -= s.hold;
      prev = s;
    }
    this.stopGuide();
  }

  reset(instant = false) {
    this.stopGuide();
    this.goal.zoom = 1; this.goal.u = 0.5; this.goal.v = 0.5;
    this.vel.set(0, 0);
    if (instant) Object.assign(this.view, this.goal);
  }

  /** Drag by a number of screen pixels. */
  panBy(dx: number, dy: number, vw: number, vh: number, dt = 0) {
    this.stopGuide();
    const { su, sv } = this.span(this.goal.zoom);
    const du = (-dx / vw) * su, dv = (-dy / vh) * sv;
    this.goal.u += du; this.goal.v += dv;
    if (dt > 0) this.vel.lerp(new THREE.Vector2(du / dt, dv / dt), 0.5);
    this.clampGoal();
  }

  /** Let go after a drag: keep gliding. */
  release() { if (this.vel.length() < 0.02) this.vel.set(0, 0); }
  stop() { this.vel.set(0, 0); }

  /** Zoom by a factor, keeping the point under (sx, sy) in place. */
  zoomAt(factor: number, sx: number, sy: number, vw: number, vh: number) {
    this.stopGuide();
    const before = this.span(this.goal.zoom);
    const nx = sx / vw - 0.5, ny = sy / vh - 0.5;
    const pu = this.goal.u + nx * before.su, pv = this.goal.v + ny * before.sv;
    this.goal.zoom = THREE.MathUtils.clamp(this.goal.zoom * factor, 1, this.maxZoom);
    const after = this.span(this.goal.zoom);
    this.goal.u = pu - nx * after.su;
    this.goal.v = pv - ny * after.sv;
    this.clampGoal();
  }

  /** Keep the view inside the painting; a view wider than the painting is centred. */
  private clampGoal() {
    const { su, sv } = this.span(this.goal.zoom);
    const keep = (c: number, s: number) => (s >= 1 ? 0.5 : THREE.MathUtils.clamp(c, s / 2, 1 - s / 2));
    this.goal.u = keep(this.goal.u, su);
    this.goal.v = keep(this.goal.v, sv);
  }

  /** Ease the view toward the goal and place the depth camera. Returns true while still moving. */
  update(dt: number) {
    if (this.guide) this.stepGuide(dt);
    if (this.vel.lengthSq() > 0) {
      this.goal.u += this.vel.x * dt; this.goal.v += this.vel.y * dt;
      this.vel.multiplyScalar(Math.exp(-dt * 4.5));
      if (this.vel.length() < 0.002) this.vel.set(0, 0);
      this.clampGoal();
    }
    const k = 1 - Math.exp(-dt * 15);
    // zoom eases in log space so it feels even
    this.view.zoom = Math.exp(Math.log(this.view.zoom) + (Math.log(this.goal.zoom) - Math.log(this.view.zoom)) * k);
    this.view.u += (this.goal.u - this.view.u) * k;
    this.view.v += (this.goal.v - this.view.v) * k;

    const A = this.scene.aspect, K = DepthScene.K0, z = this.zRef;
    this.target.set((this.view.u - 0.5) * A * K * z, (0.5 - this.view.v) * K * z, -z);
    const cam = this.scene.camera;
    cam.position.set(this.target.x * PARALLAX, this.target.y * PARALLAX, 0);
    const dist = cam.position.distanceTo(this.target);
    cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan((this.visible * K * z) / (2 * dist)));
    cam.updateProjectionMatrix();
    cam.lookAt(this.target);
    // the reflected margin past the painting's edge is only needed once parallax could reveal it
    this.scene.setOverscan(THREE.MathUtils.clamp((1 - this.visible) / 0.15, 0, 1));
    const moving = Math.abs(this.goal.zoom - this.view.zoom) > 1e-4 || Math.abs(this.goal.u - this.view.u) > 1e-5 || Math.abs(this.goal.v - this.view.v) > 1e-5;
    return moving;
  }

  /** Home view: the whole painting, square-on (matches the hall camera's home pose). */
  atHome() { return Math.abs(this.view.zoom - 1) < 0.01; }
}

/**
 * The corridor: one long gallery wall in real 3D. Each painting hangs in its
 * own pool of lamp light; the floor carries a soft, blurred reflection.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface WallItem {
  slug: string;
  title: string;
  /** Image shown on the wall (relative URL). */
  image: string;
  /** Width / height. */
  aspect: number;
  /** Painted surface height in metres. */
  height: number;
}

export interface Pose { pos: THREE.Vector3; target: THREE.Vector3; fov: number }
export const newPose = (): Pose => ({ pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 38 });
export function lerpPose(a: Pose, b: Pose, t: number, out: Pose) {
  out.pos.lerpVectors(a.pos, b.pos, t);
  out.target.lerpVectors(a.target, b.target, t);
  out.fov = a.fov + (b.fov - a.fov) * t;
  return out;
}

export const SPACING = 4.2;       // metres between painting centres
const EYE = 1.55;                 // camera height
const HANG = 1.62;                // painting centre height
const CEILING = 4.8;
const LAMP_Y = 3.3;               // track lights hang below a high ceiling
const FRAME = 0.085;              // frame moulding width
const FRAME_DEPTH = 0.07;
const SURFACE_Z = 0.03;           // painted surface sits inside the frame
const LAMP = 16;                  // spotlight intensity (candela)

const paintVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// Painting: the lamp's falloff is applied on top of the raw pixels; at uLit = 0 it is the untouched image.
const paintFrag = /* glsl */ `
  uniform sampler2D map;
  uniform float uLit;
  uniform float uGlow;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(map, vUv).rgb;
    float dx = vUv.x - 0.5, dy = 1.0 - vUv.y;
    float pool = exp(-(dx * dx * 3.2 + dy * dy * 2.0));
    vec3 lit = c * (0.5 + 0.55 * pool) * uGlow;
    gl_FragColor = vec4(mix(c, lit, uLit), 1.0);
  }`;

// Floor reflection: the painting mirrored below the floor line, blurred and fading away from the wall.
const reflFrag = /* glsl */ `
  uniform sampler2D map;
  uniform float uStrength;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(map, vUv, 3.0).rgb;
    float f = pow(1.0 - vUv.y, 2.2);
    gl_FragColor = vec4(c * 0.85, uStrength * f);
  }`;

function noiseTexture(size: number, base: [number, number, number], spread: number, blotches: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.fillStyle = `rgb(${base.join(',')})`;
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < blotches; i++) {
    const r = size * (0.04 + Math.random() * 0.18);
    const x = Math.random() * size, y = Math.random() * size;
    const k = (Math.random() - 0.5) * spread;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    const col = base.map((v) => Math.round(Math.min(255, Math.max(0, v + k))));
    grd.addColorStop(0, `rgba(${col.join(',')},0.35)`);
    grd.addColorStop(1, `rgba(${col.join(',')},0)`);
    g.fillStyle = grd;
    // draw the blotch on all four wraps so the texture tiles seamlessly
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      g.save(); g.translate(ox, oy); g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
    }
  }
  const img = g.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * spread * 0.35;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

interface Hung {
  item: WallItem;
  x: number; w: number; h: number;
  surface: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  refl: THREE.ShaderMaterial;
  lamp: THREE.SpotLight;
  focus: number;
}

export class Corridor {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(38, 1, 0.05, 120);
  private hung: Hung[] = [];
  private hemi = new THREE.HemisphereLight(0x6b5640, 0x0b0907, 0.6);
  private raycaster = new THREE.Raycaster();
  private ambient = 1;
  fov = 38;
  dist = 4.2;

  constructor(private renderer: THREE.WebGLRenderer, readonly items: WallItem[]) {
    this.scene.background = new THREE.Color(0x0b0908);
    this.scene.fog = new THREE.Fog(0x0b0908, 9, 26);
  }

  get count() { return this.items.length; }
  xOf(i: number) { return i * SPACING; }

  async load() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.12;
    this.scene.add(this.hemi);

    const span = (this.count - 1) * SPACING;
    const length = span + 60;
    const mid = span / 2;

    // wall: warm umber plaster
    const plaster = noiseTexture(512, [74, 58, 45], 30, 140);
    plaster.repeat.set(length / 3, CEILING / 3);
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(length, CEILING),
      new THREE.MeshStandardMaterial({ map: plaster, roughness: 0.95, metalness: 0 }),
    );
    wall.position.set(mid, CEILING / 2, 0);
    this.scene.add(wall);

    // skirting board
    const skirt = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.16, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x17110c, roughness: 0.6 }),
    );
    skirt.position.set(mid, 0.08, 0.015);
    this.scene.add(skirt);

    // floor: dark polished stone
    const stone = noiseTexture(512, [19, 15, 12], 16, 90);
    stone.repeat.set(length / 4, 3);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(length, 12),
      new THREE.MeshStandardMaterial({ map: stone, roughness: 0.5, metalness: 0.0, envMapIntensity: 0.05 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(mid, 0, 6);
    this.scene.add(floor);

    // ceiling
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(length, 12), new THREE.MeshStandardMaterial({ color: 0x0d0b09, roughness: 1 }));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(mid, CEILING, 6);
    this.scene.add(ceil);

    const gilt = new THREE.MeshStandardMaterial({ color: 0x80602f, metalness: 0.8, roughness: 0.44 });
    const lip = new THREE.MeshStandardMaterial({ color: 0xb8934f, metalness: 0.9, roughness: 0.3 });
    const loader = new THREE.TextureLoader();
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    await Promise.all(this.items.map(async (item, i) => {
      const map = await loader.loadAsync(item.image);
      map.colorSpace = THREE.NoColorSpace; // raw pixels, matched by the depth camera
      map.anisotropy = Math.min(8, maxAniso);
      const h = item.height, w = h * item.aspect, x = this.xOf(i);
      const group = new THREE.Group();
      group.position.set(x, HANG, 0);

      const mat = new THREE.ShaderMaterial({
        vertexShader: paintVert, fragmentShader: paintFrag,
        uniforms: { map: { value: map }, uLit: { value: 1 }, uGlow: { value: 1 } },
      });
      const surface = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      surface.position.z = SURFACE_Z;
      surface.userData.index = i;
      group.add(surface);

      // frame: four bars plus a bright inner lip
      const bars: [number, number, number, number][] = [
        [0, h / 2 + FRAME / 2, w + FRAME * 2, FRAME], [0, -h / 2 - FRAME / 2, w + FRAME * 2, FRAME],
        [-w / 2 - FRAME / 2, 0, FRAME, h], [w / 2 + FRAME / 2, 0, FRAME, h],
      ];
      for (const [bx, by, bw, bh] of bars) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, FRAME_DEPTH), gilt);
        bar.position.set(bx, by, FRAME_DEPTH / 2);
        group.add(bar);
      }
      const L = 0.014;
      const lips: [number, number, number, number][] = [
        [0, h / 2 + L / 2, w + L * 2, L], [0, -h / 2 - L / 2, w + L * 2, L],
        [-w / 2 - L / 2, 0, L, h], [w / 2 + L / 2, 0, L, h],
      ];
      for (const [bx, by, bw, bh] of lips) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.02), lip);
        bar.position.set(bx, by, SURFACE_Z + 0.008);
        group.add(bar);
      }
      this.scene.add(group);

      // reflection on the floor
      const refl = new THREE.ShaderMaterial({
        vertexShader: paintVert, fragmentShader: reflFrag, transparent: true, depthTest: false, depthWrite: false,
        side: THREE.DoubleSide, uniforms: { map: { value: map }, uStrength: { value: 0.16 } },
      });
      const mirror = new THREE.Mesh(new THREE.PlaneGeometry(w + FRAME * 2, h + FRAME * 2), refl);
      mirror.position.set(x, -HANG, SURFACE_Z);
      mirror.scale.y = -1;
      mirror.renderOrder = 2;
      this.scene.add(mirror);

      // its lamp
      const lamp = new THREE.SpotLight(0xffd2a0, LAMP, 0, 0.52, 0.85, 1.6);
      lamp.position.set(x, LAMP_Y, 1.5);
      lamp.target.position.set(x, HANG - 0.1, 0);
      this.scene.add(lamp, lamp.target);

      this.hung[i] = { item, x, w, h, surface, mat, refl, lamp, focus: 0 };
    }));
  }

  /** Fit the camera to the screen: on narrow screens step back so a whole painting stays in view. */
  layout(aspect: number) {
    this.camera.aspect = aspect;
    this.fov = aspect < 0.8 ? 54 : 41;
    const tan = Math.tan(THREE.MathUtils.degToRad(this.fov) / 2);
    const widest = Math.max(...this.hung.map((p) => p.w + FRAME * 2));
    this.dist = Math.max(4.2, widest / (0.66 * 2 * tan * aspect));
  }

  /** Walking position t is in paintings (0 = first painting); lean turns the head toward the direction of walking. */
  walkPose(t: number, lean: number, out: Pose) {
    const x = t * SPACING;
    out.pos.set(x, EYE, this.dist);
    out.target.set(x + lean, HANG - 0.2, 0); // eyes slightly lowered: the floor and its reflections are in view
    out.fov = this.fov;
    return out;
  }

  /** Square-on view where painting i fills 1/visible of the screen height: identical to the depth camera's home view. */
  homePose(i: number, visible: number, out: Pose) {
    const p = this.hung[i];
    const tan = Math.tan(THREE.MathUtils.degToRad(this.fov) / 2);
    const d = (p.h * visible) / (2 * tan);
    out.pos.set(p.x, HANG, SURFACE_Z + d);
    out.target.set(p.x, HANG, SURFACE_Z);
    out.fov = this.fov;
    return out;
  }

  apply(pose: Pose) {
    this.camera.position.copy(pose.pos);
    this.camera.fov = pose.fov;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(pose.target);
  }

  /** 0 = lamps out (only the painting's own pixels remain), 1 = gallery lit. */
  setAmbient(k: number) { this.ambient = k; }
  /** How much lamp light falls on painting i (0 = raw image). */
  setLit(i: number, k: number) { this.hung[i].mat.uniforms.uLit.value = k; }

  /** Painting index under a screen point (normalised device coordinates), or -1. */
  pick(ndcX: number, ndcY: number) {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const hit = this.raycaster.intersectObjects(this.hung.map((p) => p.surface))[0];
    return hit ? (hit.object.userData.index as number) : -1;
  }

  update(focusIndex: number, dt: number) {
    const k = this.ambient;
    this.hemi.intensity = 0.6 * k;
    this.scene.environmentIntensity = 0.12 * k;
    for (let i = 0; i < this.hung.length; i++) {
      const p = this.hung[i];
      p.focus += ((i === focusIndex ? 1 : 0) - p.focus) * Math.min(1, dt * 3);
      p.lamp.intensity = LAMP * (1 + 0.45 * p.focus) * k;
      p.mat.uniforms.uGlow.value = 1 + 0.2 * p.focus;
      p.refl.uniforms.uStrength.value = 0.16 * k;
    }
  }

  render() { this.renderer.render(this.scene, this.camera); }
}

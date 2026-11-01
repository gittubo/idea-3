/**
 * The hall: a large, dark exhibition space. Monumental unframed paintings stand
 * around the room under ceiling spotlights; the polished concrete floor carries
 * soft, blurred reflections of them.
 */
import * as THREE from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

export interface Placement {
  x: number;
  z: number;
  /** Rotation about the vertical axis in degrees; 0 faces the entrance (+z). */
  yaw: number;
}

export interface HallItem {
  slug: string;
  title: string;
  /** Image shown in the hall (relative URL). */
  image: string;
  /** Width / height. */
  aspect: number;
  /** Painted surface height in metres. */
  height: number;
  place: Placement;
}

export interface Pose { pos: THREE.Vector3; target: THREE.Vector3; fov: number }
export const newPose = (): Pose => ({ pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 55 });
export const copyPose = (from: Pose, to: Pose) => { to.pos.copy(from.pos); to.target.copy(from.target); to.fov = from.fov; return to; };

export type Pick = { kind: 'painting'; index: number } | { kind: 'floor'; point: THREE.Vector3 } | null;

export const EYE = 1.65;
const BASE = 0.38;              // paintings stand this far off the floor
const SURFACE = 0.045;          // painted surface in front of the panel's centre
export const BOUNDS = { minX: -11, maxX: 11, minZ: -5.5, maxZ: 9.5 };
const ROOM = { w: 28, d: 22, h: 9.5, z: 0 }; // centred on x = 0, z = ROOM.z
const SPOT = 260;               // candela per spotlight

const paintVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// The painted surface shows its raw pixels; light falloff is layered on top while lit.
const paintFrag = /* glsl */ `
  uniform sampler2D map;
  uniform float uLit;
  uniform float uGlow;
  uniform float uToLinear;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(map, vUv).rgb;
    float dx = vUv.x - 0.5, dy = 1.0 - vUv.y;
    float pool = exp(-(dx * dx * 2.4 + dy * dy * 1.4));
    vec3 lit = c * (0.62 + 0.45 * pool) * uGlow;
    c = mix(c, lit, uLit);
    // in the reflection pass the target is linear light
    c = mix(c, pow(c, vec3(2.2)), uToLinear);
    gl_FragColor = vec4(c, 1.0);
  }`;

const blurFrag = /* glsl */ `
  uniform sampler2D tMap;
  uniform vec2 uDir;
  varying vec2 vUv;
  void main() {
    vec3 s = texture2D(tMap, vUv).rgb * 0.227;
    s += (texture2D(tMap, vUv + uDir * 1.385).rgb + texture2D(tMap, vUv - uDir * 1.385).rgb) * 0.316;
    s += (texture2D(tMap, vUv + uDir * 3.231).rgb + texture2D(tMap, vUv - uDir * 3.231).rgb) * 0.070;
    gl_FragColor = vec4(s, 1.0);
  }`;

function concreteTexture(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgb(46,46,47)';
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 220; i++) {
    const r = size * (0.03 + Math.random() * 0.16);
    const x = Math.random() * size, y = Math.random() * size;
    const k = Math.round((Math.random() - 0.5) * 22);
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      const grd = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      grd.addColorStop(0, `rgba(${46 + k},${46 + k},${47 + k},0.3)`);
      grd.addColorStop(1, `rgba(${46 + k},${46 + k},${47 + k},0)`);
      g.fillStyle = grd;
      g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
  }
  const img = g.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 9;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, 'rgba(255,240,215,0.55)');
  grd.addColorStop(1, 'rgba(255,230,200,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

interface Hung {
  item: HallItem;
  center: THREE.Vector3;   // centre of the painted surface
  normal: THREE.Vector3;   // facing direction
  w: number; h: number;
  surface: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  lamps: THREE.SpotLight[];
  glow: number;
}

export class Hall {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(55, 1, 0.05, 200);
  /** Everything that appears in the floor's reflection. */
  private world = new THREE.Group();
  private floor!: THREE.Mesh;
  private shell!: THREE.Mesh;
  private hung: Hung[] = [];
  private pickables: THREE.Object3D[] = [];
  private raycaster = new THREE.Raycaster();
  private hemi = new THREE.HemisphereLight(0x9aa3b2, 0x1c1b1a, 0.9);
  private glows: THREE.SpriteMaterial[] = [];
  private rtReflect: THREE.WebGLRenderTarget;
  private rtA: THREE.WebGLRenderTarget;
  private rtB: THREE.WebGLRenderTarget;
  private blurQuad: FullScreenQuad;
  private blurMat: THREE.ShaderMaterial;
  private floorUniforms = {
    tReflect: { value: null as THREE.Texture | null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uStrength: { value: 0.62 },
  };
  private dim = 1;
  fov = 55;

  constructor(private renderer: THREE.WebGLRenderer, readonly items: HallItem[]) {
    this.scene.background = new THREE.Color(0x060606);
    this.scene.fog = new THREE.Fog(0x060606, 26, 70);
    this.scene.add(this.world);
    const opts = { type: THREE.HalfFloatType, depthBuffer: true };
    this.rtReflect = new THREE.WebGLRenderTarget(1, 1, opts);
    this.rtA = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
    this.rtB = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
    this.blurMat = new THREE.ShaderMaterial({
      vertexShader: paintVert, fragmentShader: blurFrag,
      uniforms: { tMap: { value: null }, uDir: { value: new THREE.Vector2() } },
      depthTest: false, depthWrite: false,
    });
    this.blurQuad = new FullScreenQuad(this.blurMat);
    this.floorUniforms.tReflect.value = this.rtB.texture;
  }

  get count() { return this.items.length; }

  async load() {
    const W = this.world;
    W.add(this.hemi);

    // floor: polished concrete, reflection added in its shader
    const concrete = concreteTexture(512);
    concrete.repeat.set(9, 9);
    const floorMat = new THREE.MeshStandardMaterial({ map: concrete, roughness: 0.55, metalness: 0, color: 0xc4c4c6 });
    floorMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.floorUniforms);
      sh.fragmentShader = 'uniform sampler2D tReflect;\nuniform vec2 uRes;\nuniform float uStrength;\n' +
        sh.fragmentShader.replace('#include <tonemapping_fragment>', /* glsl */ `
          {
            vec2 suv = gl_FragCoord.xy / uRes;
            vec3 refl = texture2D(tReflect, suv).rgb;
            float grain = texture2D(map, vMapUv * 3.7).r;
            gl_FragColor.rgb += refl * uStrength * (0.75 + 0.5 * grain);
          }
          #include <tonemapping_fragment>`);
    };
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.set(0, 0, ROOM.z);
    this.scene.add(this.floor);
    this.pickables.push(this.floor);

    // walls and ceiling: near-black, barely there
    const shell = this.shell = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM.w, ROOM.h, ROOM.d),
      new THREE.MeshStandardMaterial({ color: 0x1d1d1f, roughness: 0.95, side: THREE.BackSide }),
    );
    shell.position.set(0, ROOM.h / 2 - 0.02, ROOM.z);
    W.add(shell);
    this.pickables.push(shell);

    // steel trusses with track lights
    const steel = new THREE.MeshStandardMaterial({ color: 0x232325, roughness: 0.5, metalness: 0.5 });
    const fixture = new THREE.MeshBasicMaterial({ color: 0xfff1dc });
    const glowTex = glowTexture();
    const zs = [-9, -5, -1, 3, 7];
    for (const z of zs) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(ROOM.w, 0.55, 0.28), steel);
      beam.position.set(0, ROOM.h - 0.7, z);
      W.add(beam);
      const chord = new THREE.Mesh(new THREE.BoxGeometry(ROOM.w, 0.08, 0.08), steel);
      chord.position.set(0, ROOM.h - 1.35, z);
      W.add(chord);
    }
    for (const x of [-9, -4.5, 0, 4.5, 9]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, ROOM.d), steel);
      rail.position.set(x, ROOM.h - 1.5, ROOM.z);
      W.add(rail);
      for (let z = -9.6; z <= 10; z += 3.4) {
        const zz = z + (x * 0.37) % 1.2;
        const can = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 12), steel);
        can.position.set(x, ROOM.h - 1.68, zz);
        W.add(can);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), fixture);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(x, ROOM.h - 1.8, zz);
        W.add(lens);
        const gm = new THREE.SpriteMaterial({ map: glowTex, color: 0xffe6c4, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false });
        this.glows.push(gm);
        const glow = new THREE.Sprite(gm);
        glow.scale.setScalar(0.75);
        glow.position.set(x, ROOM.h - 1.86, zz);
        W.add(glow);
      }
    }

    // paintings
    const loader = new THREE.TextureLoader();
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const edge = new THREE.MeshStandardMaterial({ color: 0x1d1913, roughness: 0.8 });
    const shadowTex = glowTexture();
    await Promise.all(this.items.map(async (item, i) => {
      const map = await loader.loadAsync(item.image);
      map.colorSpace = THREE.NoColorSpace; // raw pixels, matched by the depth camera
      map.anisotropy = Math.min(8, maxAniso);
      const h = item.height, w = h * item.aspect;
      const yaw = THREE.MathUtils.degToRad(item.place.yaw);
      const normal = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      const group = new THREE.Group();
      group.position.set(item.place.x, BASE + h / 2, item.place.z);
      group.rotation.y = yaw;

      const panel = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, h + 0.04, 0.08), edge);
      group.add(panel);
      const mat = new THREE.ShaderMaterial({
        vertexShader: paintVert, fragmentShader: paintFrag,
        uniforms: { map: { value: map }, uLit: { value: 1 }, uGlow: { value: 1 }, uToLinear: { value: 0 } },
      });
      const surface = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      surface.position.z = SURFACE;
      surface.userData.index = i;
      group.add(surface);
      W.add(group);
      this.pickables.push(surface);

      // contact shadow on the floor
      const sh = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 1.25, 1.4),
        new THREE.MeshBasicMaterial({ map: shadowTex, color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false }),
      );
      sh.rotation.x = -Math.PI / 2;
      sh.position.set(0, -BASE - h / 2 + 0.005, 0.1);
      group.add(sh);

      // two ceiling spotlights per painting
      const center = new THREE.Vector3(item.place.x, BASE + h / 2, item.place.z).addScaledVector(normal, SURFACE);
      const side = new THREE.Vector3(normal.z, 0, -normal.x);
      const lamps: THREE.SpotLight[] = [];
      for (const s of [-1, 1]) {
        const lamp = new THREE.SpotLight(0xffd9ad, SPOT, 0, 0.42, 0.75, 2);
        lamp.position.copy(center).addScaledVector(normal, 4.2).addScaledVector(side, s * w * 0.28);
        lamp.position.y = ROOM.h - 1.8;
        lamp.target.position.copy(center).addScaledVector(side, s * w * 0.12);
        lamp.target.position.y -= h * 0.08;
        W.add(lamp, lamp.target);
        lamps.push(lamp);
      }
      this.hung[i] = { item, center, normal, w, h, surface, mat, lamps, glow: 0 };
    }));
  }

  layout(width: number, height: number, dpr: number) {
    const aspect = width / height;
    this.camera.aspect = aspect;
    this.fov = aspect < 0.8 ? 66 : 48;
    const rw = Math.max(1, Math.round(width * dpr * 0.5)), rh = Math.max(1, Math.round(height * dpr * 0.5));
    this.rtReflect.setSize(rw, rh);
    this.rtA.setSize(rw, rh);
    this.rtB.setSize(rw, rh);
    this.floorUniforms.uRes.value.set(width * dpr, height * dpr);
  }

  /** Square-on view where painting i fills 1/visible of the screen height: identical to the depth camera's home view. */
  homePose(i: number, visible: number, out: Pose) {
    const p = this.hung[i];
    const d = (p.h * visible) / (2 * Math.tan(THREE.MathUtils.degToRad(this.fov) / 2));
    out.pos.copy(p.center).addScaledVector(p.normal, d);
    out.target.copy(p.center);
    out.fov = this.fov;
    return out;
  }

  /** Where a visitor stands to take in painting i: on the floor, at eye height, a few steps back. */
  standPose(i: number, out: Pose) {
    const p = this.hung[i];
    const d = Math.max(3.2, (Math.max(p.h, p.w / this.camera.aspect) * 1.5) / (2 * Math.tan(THREE.MathUtils.degToRad(this.fov) / 2)));
    out.pos.copy(p.center).addScaledVector(p.normal, d);
    out.pos.y = EYE;
    this.clamp(out.pos);
    out.target.copy(p.center);
    out.fov = this.fov;
    return out;
  }

  /** Keep a walking position inside the hall and a respectful distance from every painting. */
  clamp(v: THREE.Vector3) {
    v.x = THREE.MathUtils.clamp(v.x, BOUNDS.minX, BOUNDS.maxX);
    v.z = THREE.MathUtils.clamp(v.z, BOUNDS.minZ, BOUNDS.maxZ);
    for (const p of this.hung) {
      const dx = v.x - p.center.x, dz = v.z - p.center.z;
      const along = dx * p.normal.z - dz * p.normal.x;   // sideways along the panel
      const across = dx * p.normal.x + dz * p.normal.z;  // in front (+) or behind (-)
      if (Math.abs(along) < p.w / 2 + 0.7 && across < 1.8 && across > -1.2) {
        const out = across > -0.2 ? 1.8 : -1.2;
        v.x = p.center.x + p.normal.z * along + p.normal.x * out;
        v.z = p.center.z - p.normal.x * along + p.normal.z * out;
      }
    }
    return v;
  }

  apply(pose: Pose) {
    this.camera.position.copy(pose.pos);
    this.camera.fov = pose.fov;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(pose.target);
  }

  pick(ndcX: number, ndcY: number): Pick {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const hit = this.raycaster.intersectObjects(this.pickables, false)[0];
    if (!hit) return null;
    // the floor, or a wall: walk toward it (the walk stops inside the hall)
    if (hit.object === this.floor || hit.object === this.shell) return { kind: 'floor', point: hit.point.clone() };
    return { kind: 'painting', index: hit.object.userData.index as number };
  }

  /** k: 1 = hall fully lit, lower = dimmed while a painting is being explored. */
  setDim(k: number) { this.dim = k; }
  /** How much spotlight falls on painting i (0 = its raw pixels). */
  setLit(i: number, k: number) { this.hung[i].mat.uniforms.uLit.value = k; }

  update(hover: number, dt: number) {
    const k = this.dim;
    this.hemi.intensity = 0.9 * k;
    for (const g of this.glows) g.opacity = 0.35 + 0.65 * k;
    this.floorUniforms.uStrength.value = 0.62 * k;
    for (let i = 0; i < this.hung.length; i++) {
      const p = this.hung[i];
      p.glow += ((i === hover ? 1 : 0) - p.glow) * Math.min(1, dt * 4);
      for (const l of p.lamps) l.intensity = SPOT * (1 + 0.3 * p.glow) * k;
      p.mat.uniforms.uGlow.value = 1 + 0.12 * p.glow;
    }
  }

  /** Render the floor reflection (the world mirrored under the floor), blurred. */
  private reflect() {
    const r = this.renderer;
    this.floor.visible = false;
    this.world.scale.y = -1;
    for (const p of this.hung) p.mat.uniforms.uToLinear.value = 1;
    this.world.updateMatrixWorld(true);
    r.setRenderTarget(this.rtReflect);
    r.clear();
    r.render(this.scene, this.camera);
    this.world.scale.y = 1;
    for (const p of this.hung) p.mat.uniforms.uToLinear.value = 0;
    this.world.updateMatrixWorld(true);
    this.floor.visible = true;
    // two separable blur passes, stretched vertically like light on polished concrete
    let src: THREE.WebGLRenderTarget = this.rtReflect;
    for (let pass = 0; pass < 2; pass++) {
      for (const [dst, dir] of [[this.rtA, [1, 0]], [this.rtB, [0, 1]]] as const) {
        this.blurMat.uniforms.tMap.value = src.texture;
        this.blurMat.uniforms.uDir.value.set((dir[0] * 0.7) / dst.width, (dir[1] * 2.6) / dst.height).multiplyScalar(1 + pass);
        r.setRenderTarget(dst);
        this.blurQuad.render(r);
        src = dst;
      }
    }
    r.setRenderTarget(null);
  }

  render(withReflection = true) {
    if (withReflection) this.reflect();
    this.renderer.render(this.scene, this.camera);
  }
}

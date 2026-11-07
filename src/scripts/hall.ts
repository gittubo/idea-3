/**
 * The gallery: a long corridor with dark walls, a glossy wood floor and a cream
 * ceiling carrying two black track rails of spotlights. Framed paintings hang along
 * both walls and on the end wall, each in its own pool of light; the floor carries
 * soft reflections of them.
 */
import * as THREE from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

export interface Placement {
  x: number;
  z: number;
  /** Rotation about the vertical axis in degrees; 0 faces the entrance (+z), 90 faces +x. */
  yaw: number;
}

export interface HallItem {
  slug: string;
  title: string;
  /** Image shown on the wall (relative URL). */
  image: string;
  /** Width / height. */
  aspect: number;
  /** Painted surface height in metres. */
  height: number;
  place: Placement;
  /** Colour of its spotlights: warm for oils (Room I), slightly cooler for drawings (Room II). */
  light?: 'warm' | 'cool';
}

export interface Pose { pos: THREE.Vector3; target: THREE.Vector3; fov: number }
export const newPose = (): Pose => ({ pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 55 });
export const copyPose = (from: Pose, to: Pose) => { to.pos.copy(from.pos); to.target.copy(from.target); to.fov = from.fov; return to; };

export type Pick = { kind: 'painting'; index: number } | { kind: 'floor'; point: THREE.Vector3 } | null;

export const EYE = 1.65;
const HANG = 1.72;              // centre height of a hung painting
const SURFACE = 0.03;           // painted surface in front of the wall
const FRAME = 0.045;            // thin black frame
/** The corridor: walls at x = ±HALF_W, from the end wall (z = END_Z) to the entrance (z = START_Z). */
export const HALF_W = 3.5;
export const END_Z = -13;
const START_Z = 13;
const HEIGHT = 4.3;
const RAIL_X = 1.3;
export const BOUNDS = { minX: -2.6, maxX: 2.6, minZ: -11.4, maxZ: 11.8 };
const BENCH = { x: 0, z: -8, w: 2.1, d: 0.62 };
const PPM = 64;                 // pixels per metre in the painted light maps
const WALL_POOL = 8.5;          // strength of the painted pools on the walls
const FLOOR_POOL = 1.6;         // and on the floor

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
    vec3 lit = c * (0.78 + 0.36 * pool) * uGlow;
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

function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D, size: number) => void) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Fine, low-contrast noise over a base colour (painted plaster, ceiling). */
function plasterTexture(rgb: [number, number, number], spread: number) {
  return canvasTexture(256, (g, size) => {
    g.fillStyle = `rgb(${rgb.join(',')})`;
    g.fillRect(0, 0, size, size);
    const img = g.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * spread;
      img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
  });
}

/** Wood planks running along the corridor: 2 m of floor per tile, 14 boards across. */
function woodTexture() {
  return canvasTexture(1024, (g, size) => {
    const boards = 18, bw = size / boards;
    for (let b = 0; b < boards; b++) {
      let y = -Math.random() * size;
      while (y < size) {
        const len = size * (0.9 + Math.random() * 1.2);
        const k = Math.random();
        const r = 96 + k * 18, gg = 62 + k * 11, bl = 38 + k * 7;
        g.fillStyle = `rgb(${r | 0},${gg | 0},${bl | 0})`;
        g.fillRect(b * bw, y, bw, len);
        // grain
        for (let l = 0; l < 9; l++) {
          g.strokeStyle = `rgba(${(r * 0.7) | 0},${(gg * 0.7) | 0},${(bl * 0.7) | 0},${0.15 + Math.random() * 0.25})`;
          g.lineWidth = 0.6 + Math.random() * 1.2;
          const x = b * bw + Math.random() * bw;
          g.beginPath();
          g.moveTo(x, y);
          g.bezierCurveTo(x + (Math.random() - 0.5) * 6, y + len * 0.33, x + (Math.random() - 0.5) * 6, y + len * 0.66, x + (Math.random() - 0.5) * 4, y + len);
          g.stroke();
        }
        // joint
        g.fillStyle = 'rgba(20,12,6,0.55)';
        g.fillRect(b * bw, y + len - 1.5, bw, 1.5);
        y += len;
      }
      g.fillStyle = 'rgba(18,11,6,0.6)';
      g.fillRect(b * bw, 0, 1.2, size);
    }
  });
}

/**
 * Adds a painted light map to a standard material, looked up by world position so it
 * lines up with the paintings whatever the surface's own texture coordinates are.
 * The light multiplies the surface colour, so plaster and wood grain show through.
 */
function injectPool(sh: { uniforms: Record<string, THREE.IUniform>; vertexShader: string; fragmentShader: string }, tex: THREE.Texture, k: THREE.IUniform<number>, uv: string) {
  sh.uniforms.uPool = { value: tex };
  sh.uniforms.uPoolK = k;
  sh.vertexShader = 'varying vec3 vPoolWp;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vPoolWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = 'uniform sampler2D uPool;\nuniform float uPoolK;\nvarying vec3 vPoolWp;\n' + sh.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
    {
      vec3 wp = vPoolWp;
      reflectedLight.indirectDiffuse += diffuseColor.rgb * texture2D(uPool, ${uv}).rgb * uPoolK;
    }`);
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
  glow: number;
}

export class Hall {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(55, 1, 0.05, 200);
  /** Everything that appears in the floor's reflection. */
  private world = new THREE.Group();
  private floor!: THREE.Mesh;
  private hung: Hung[] = [];
  private pickables: THREE.Object3D[] = [];
  private raycaster = new THREE.Raycaster();
  private hemi = new THREE.HemisphereLight(0xfff0dc, 0x3b2a1d, 1.15);
  private pools: { k: THREE.IUniform<number>; base: number }[] = [];
  private ceilMat!: THREE.MeshStandardMaterial;
  private lastView = '';
  private glows: THREE.SpriteMaterial[] = [];
  private rtReflect: THREE.WebGLRenderTarget;
  private rtA: THREE.WebGLRenderTarget;
  private rtB: THREE.WebGLRenderTarget;
  private blurQuad: FullScreenQuad;
  private blurMat: THREE.ShaderMaterial;
  private floorUniforms = {
    tReflect: { value: null as THREE.Texture | null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uStrength: { value: 0.32 },
  };
  private dim = 1;
  fov = 55;

  constructor(private renderer: THREE.WebGLRenderer, readonly items: HallItem[]) {
    this.scene.background = new THREE.Color(0x0e0c0b);
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
    const len = START_Z - END_Z, midZ = (START_Z + END_Z) / 2;

    // floor: glossy wood planks; the reflection is added in its shader
    const wood = woodTexture();
    wood.repeat.set((HALF_W * 2) / 2, len / 2);
    wood.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const floorMat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.34, metalness: 0, color: 0xffffff });
    floorMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.floorUniforms);
      sh.fragmentShader = 'uniform sampler2D tReflect;\nuniform vec2 uRes;\nuniform float uStrength;\n' +
        sh.fragmentShader.replace('#include <tonemapping_fragment>', /* glsl */ `
          {
            vec2 suv = gl_FragCoord.xy / uRes;
            vec3 refl = texture2D(tReflect, suv).rgb;
            float grain = texture2D(map, vMapUv).r;
            gl_FragColor.rgb += refl * uStrength * (0.7 + 0.9 * grain);
          }
          #include <tonemapping_fragment>`);
    };
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W * 2, len), floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.set(0, 0, midZ);
    this.scene.add(this.floor);
    this.pickables.push(this.floor);

    // walls: dark warm charcoal, one-sided so a camera stepping back through one never sees it
    // The pools of light are painted into light maps once, instead of computed from
    // a dozen spotlights on every pixel of every frame: same look, a fraction of the cost.
    const plaster = plasterTexture([62, 58, 55], 7);
    const wallMat = (pools: { along: number; item: HallItem }[], w: number, uv: string) => {
      const c = document.createElement('canvas');
      c.width = Math.round(w * PPM); c.height = Math.round(HEIGHT * PPM);
      const g = c.getContext('2d')!;
      g.fillStyle = 'rgb(40,36,33)';
      g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = 'lighter';
      for (const { along, item } of pools) {
        const h = item.height, pw = h * item.aspect, cy = Math.max(HANG, h / 2 + 0.4);
        const rx = (pw / 2 + 0.8) * PPM, ry = (h + 1.7) * PPM;
        const col = item.light === 'cool' ? '226,226,224' : '255,206,160';
        g.save();
        g.translate(along * PPM, (HEIGHT - (cy + h / 2 + 0.5)) * PPM);
        g.scale(rx / ry, 1);
        const grd = g.createRadialGradient(0, 0, 0, 0, 0, ry);
        grd.addColorStop(0, `rgba(${col},0.95)`);
        grd.addColorStop(0.4, `rgba(${col},0.6)`);
        grd.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = grd;
        g.beginPath(); g.arc(0, 0, ry, 0, Math.PI * 2); g.fill();
        g.restore();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshStandardMaterial({ map: plaster, roughness: 0.92 });
      const k = { value: WALL_POOL };
      mat.onBeforeCompile = (sh) => injectPool(sh, tex, k, uv);
      mat.customProgramCacheKey = () => uv;
      this.pools.push({ k, base: WALL_POOL });
      return mat;
    };
    const along = (side: 'left' | 'right' | 'end') => this.items
      .filter((it) => (side === 'end' ? Math.abs(it.place.yaw) < 45 : side === 'left' ? it.place.yaw > 45 : it.place.yaw < -45))
      .map((item) => ({ item, along: side === 'left' ? START_Z - item.place.z : side === 'right' ? item.place.z - END_Z : item.place.x + HALF_W }));
    const L = len.toFixed(3), Hh = HEIGHT.toFixed(3), W2 = (HALF_W * 2).toFixed(3);
    const mats = {
      left: wallMat(along('left'), len, `vec2(({START} - wp.z) / ${L}, wp.y / ${Hh})`.replace('{START}', START_Z.toFixed(3))),
      right: wallMat(along('right'), len, `vec2((wp.z - (${END_Z.toFixed(3)})) / ${L}, wp.y / ${Hh})`),
      end: wallMat(along('end'), HALF_W * 2, `vec2((wp.x + ${HALF_W.toFixed(3)}) / ${W2}, wp.y / ${Hh})`),
      entrance: new THREE.MeshStandardMaterial({ map: plaster, roughness: 0.92 }),
    };
    const wall = (w: number, x: number, z: number, yaw: number, mat: THREE.Material) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, HEIGHT), mat);
      m.position.set(x, HEIGHT / 2, z);
      m.rotation.y = yaw;
      m.userData.walk = true;
      W.add(m);
      this.pickables.push(m);
      return m;
    };
    wall(len, -HALF_W, midZ, Math.PI / 2, mats.left);
    wall(len, HALF_W, midZ, -Math.PI / 2, mats.right);
    wall(HALF_W * 2, 0, END_Z, 0, mats.end);
    wall(HALF_W * 2, 0, START_Z, Math.PI, mats.entrance);
    const skirt = new THREE.MeshStandardMaterial({ color: 0x1c1816, roughness: 0.6 });
    for (const sx of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, len), skirt);
      b.position.set(sx * (HALF_W - 0.01), 0.05, midZ);
      W.add(b);
    }

    // ceiling: warm cream, lit from the track lights, with a dropped bulkhead along each wall
    const ceilMat = this.ceilMat = new THREE.MeshStandardMaterial({ map: plasterTexture([222, 210, 192], 5), roughness: 0.95, emissive: 0xb59b7c, emissiveIntensity: 0.5 });
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W * 2, len), ceilMat);
    ceilMat.map!.repeat.set(4, 12);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, HEIGHT, midZ);
    W.add(ceil);
    const bulkMat = new THREE.MeshStandardMaterial({ color: 0x8c7c6a, roughness: 0.9, emissive: 0x2c241c, emissiveIntensity: 0.6 });
    for (const sx of [-1, 1]) {
      const bulk = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.32, len), bulkMat);
      bulk.position.set(sx * (HALF_W - 0.375), HEIGHT - 0.16, midZ);
      W.add(bulk);
    }

    // two black track rails with spotlight cans and their glow
    const black = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.45, metalness: 0.4 });
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xfff4e2, toneMapped: false });
    const glowTex = glowTexture();
    for (const sx of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, len - 1), black);
      rail.position.set(sx * RAIL_X, HEIGHT - 0.02, midZ);
      W.add(rail);
      for (let z = END_Z + 1.2; z < START_Z - 0.8; z += 1.55) {
        const can = new THREE.Group();
        can.position.set(sx * RAIL_X, HEIGHT - 0.13, z);
        // aimed down and toward this side's wall
        can.rotation.z = sx * 0.6;
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.17, 12), black);
        can.add(body);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.038, 16), lensMat);
        lens.rotation.x = Math.PI / 2;
        lens.position.y = -0.087;
        can.add(lens);
        W.add(can);
        const gm = new THREE.SpriteMaterial({ map: glowTex, color: 0xffe9cc, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false });
        this.glows.push(gm);
        const glow = new THREE.Sprite(gm);
        glow.scale.setScalar(0.3);
        glow.position.set(sx * (RAIL_X + 0.06), HEIGHT - 0.24, z);
        W.add(glow);
      }
    }
    // floor: pools of light in front of each painting and down the middle
    {
      const c = document.createElement('canvas');
      const fp = 24;
      c.width = Math.round(HALF_W * 2 * fp); c.height = Math.round(len * fp);
      const g = c.getContext('2d')!;
      g.fillStyle = 'rgb(28,24,21)';
      g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = 'lighter';
      const pool = (x: number, z: number, r: number, a: number) => {
        const px = (x + HALF_W) * fp, pz = (z - END_Z) * fp;
        const grd = g.createRadialGradient(px, pz, 0, px, pz, r * fp);
        grd.addColorStop(0, `rgba(255,214,170,${a})`);
        grd.addColorStop(1, 'rgba(255,214,170,0)');
        g.fillStyle = grd;
        g.fillRect(px - r * fp, pz - r * fp, r * 2 * fp, r * 2 * fp);
      };
      for (const it of this.items) {
        const yaw = THREE.MathUtils.degToRad(it.place.yaw);
        pool(it.place.x + Math.sin(yaw) * 0.7, it.place.z + Math.cos(yaw) * 0.7, 1.5, 0.55);
      }
      for (let z = END_Z + 4; z < START_Z - 1; z += 8) pool(0, z, 2.2, 0.35);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      // canvas row 0 is the end wall (v = 1)
      const uv = `vec2((wp.x + ${HALF_W.toFixed(3)}) / ${(HALF_W * 2).toFixed(3)}, 1.0 - (wp.z - (${END_Z.toFixed(3)})) / ${len.toFixed(3)})`;
      const k = { value: FLOOR_POOL };
      const reflectHook = floorMat.onBeforeCompile;
      floorMat.onBeforeCompile = (sh, r) => { reflectHook.call(floorMat, sh, r); injectPool(sh, tex, k, uv); };
      this.pools.push({ k, base: FLOOR_POOL });
    }

    // a bench and a pedestal before the end wall
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(BENCH.w, 0.12, BENCH.d), new THREE.MeshStandardMaterial({ color: 0xbfa98c, roughness: 0.85 }));
    cushion.position.set(BENCH.x, 0.44, BENCH.z);
    const base = new THREE.Mesh(new THREE.BoxGeometry(BENCH.w - 0.12, 0.38, BENCH.d - 0.1), new THREE.MeshStandardMaterial({ color: 0x3a281b, roughness: 0.55 }));
    base.position.set(BENCH.x, 0.19, BENCH.z);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.05, 0.42), new THREE.MeshStandardMaterial({ color: 0x2c2420, roughness: 0.5 }));
    plinth.position.set(0, 0.525, -12.2);
    const vessel = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 16), new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.35, metalness: 0.3 }));
    vessel.scale.y = 1.3;
    vessel.position.set(0, 1.23, -12.2);
    W.add(cushion, base, plinth, vessel);

    // paintings
    const loader = new THREE.TextureLoader();
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111010, roughness: 0.4, metalness: 0.2 });
    const labelMat = new THREE.MeshStandardMaterial({ color: 0xece6dc, roughness: 0.6 });
    await Promise.all(this.items.map(async (item, i) => {
      let map: THREE.Texture;
      try {
        map = await loader.loadAsync(item.image);
      } catch {
        // one missing image must not keep the whole gallery from opening
        console.warn('Could not load', item.image);
        map = new THREE.DataTexture(new Uint8Array([24, 21, 19, 255]), 1, 1);
        map.needsUpdate = true;
      }
      map.colorSpace = THREE.NoColorSpace; // raw pixels, matched by the depth camera
      map.anisotropy = Math.min(8, maxAniso);
      const h = item.height, w = h * item.aspect;
      const cy = Math.max(HANG, h / 2 + 0.4);
      const yaw = THREE.MathUtils.degToRad(item.place.yaw);
      const normal = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      const group = new THREE.Group();
      group.position.set(item.place.x, cy, item.place.z);
      group.rotation.y = yaw;

      const mat = new THREE.ShaderMaterial({
        vertexShader: paintVert, fragmentShader: paintFrag,
        uniforms: { map: { value: map }, uLit: { value: 1 }, uGlow: { value: 1 }, uToLinear: { value: 0 } },
      });
      const surface = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      surface.position.z = SURFACE;
      surface.userData.index = i;
      group.add(surface);
      const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), frameMat);
      back.position.z = SURFACE - 0.012;
      group.add(back);
      const bars: [number, number, number, number][] = [
        [0, h / 2 + FRAME / 2, w + FRAME * 2, FRAME], [0, -h / 2 - FRAME / 2, w + FRAME * 2, FRAME],
        [-w / 2 - FRAME / 2, 0, FRAME, h], [w / 2 + FRAME / 2, 0, FRAME, h],
      ];
      for (const [bx, by, bw, bh] of bars) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.05), frameMat);
        bar.position.set(bx, by, 0.025);
        group.add(bar);
      }
      // a blank wall label beside it
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.15), labelMat);
      label.position.set(w / 2 + FRAME + 0.28, 1.45 - cy, 0.004);
      group.add(label);
      W.add(group);
      this.pickables.push(surface);

      const center = new THREE.Vector3(item.place.x, cy, item.place.z).addScaledVector(normal, SURFACE);
      this.hung[i] = { item, center, normal, w, h, surface, mat, glow: 0 };
    }));
  }

  layout(width: number, height: number, dpr: number) {
    const aspect = width / height;
    this.camera.aspect = aspect;
    this.fov = aspect < 0.8 ? 68 : 54;
    // the reflection is blurred anyway: a third of the screen's resolution is plenty
    const rw = Math.max(1, Math.round(width * dpr * 0.33)), rh = Math.max(1, Math.round(height * dpr * 0.33));
    this.lastView = '';
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
    const d = Math.max(2.6, (Math.max(p.h, p.w / this.camera.aspect) * 1.45) / (2 * Math.tan(THREE.MathUtils.degToRad(this.fov) / 2)));
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
    // step around the bench
    if (Math.abs(v.x - BENCH.x) < BENCH.w / 2 + 0.35 && Math.abs(v.z - BENCH.z) < BENCH.d / 2 + 0.35) {
      v.z = BENCH.z + Math.sign(v.z - BENCH.z || 1) * (BENCH.d / 2 + 0.35);
    }
    for (const p of this.hung) {
      const dx = v.x - p.center.x, dz = v.z - p.center.z;
      const along = dx * p.normal.z - dz * p.normal.x;   // sideways along the panel
      const across = dx * p.normal.x + dz * p.normal.z;  // in front (+) or behind (-)
      if (Math.abs(along) < p.w / 2 + 0.5 && across < 1.4 && across > -1.2) {
        const out = across > -0.2 ? 1.4 : -1.2;
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
    if (hit.object === this.floor || hit.object.userData.walk) return { kind: 'floor', point: hit.point.clone() };
    return { kind: 'painting', index: hit.object.userData.index as number };
  }

  /** k: 1 = hall fully lit, lower = dimmed while a painting is being explored. */
  setDim(k: number) { this.dim = k; }
  /** How much spotlight falls on painting i (0 = its raw pixels). */
  setLit(i: number, k: number) { this.hung[i].mat.uniforms.uLit.value = k; }

  update(hover: number, dt: number) {
    const k = this.dim;
    this.hemi.intensity = 1.15 * k;
    for (const p of this.pools) p.k.value = p.base * k;
    this.ceilMat.emissiveIntensity = 0.5 * k;
    for (const g of this.glows) g.opacity = 0.35 + 0.65 * k;
    this.floorUniforms.uStrength.value = 0.32 * k;
    for (let i = 0; i < this.hung.length; i++) {
      const p = this.hung[i];
      p.glow += ((i === hover ? 1 : 0) - p.glow) * Math.min(1, dt * 4);
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
    // two separable blur passes, stretched vertically like light on a glossy floor
    let src: THREE.WebGLRenderTarget = this.rtReflect;
    for (let pass = 0; pass < 2; pass++) {
      for (const [dst, dir] of [[this.rtA, [1, 0]], [this.rtB, [0, 1]]] as const) {
        this.blurMat.uniforms.tMap.value = src.texture;
        this.blurMat.uniforms.uDir.value.set((dir[0] * 0.5) / dst.width, (dir[1] * 1.8) / dst.height).multiplyScalar(1 + pass);
        r.setRenderTarget(dst);
        this.blurQuad.render(r);
        src = dst;
      }
    }
    r.setRenderTarget(null);
  }

  render(withReflection = true) {
    // the reflection only needs redrawing when the view or the lighting changed
    if (withReflection) {
      const e = this.camera.matrixWorld.elements, p = this.camera.projectionMatrix.elements;
      const key = `${e.map((v) => v.toFixed(4)).join()}|${p[0].toFixed(4)}|${p[5].toFixed(4)}|${this.dim.toFixed(3)}`;
      if (key !== this.lastView) { this.lastView = key; this.reflect(); }
    }
    this.renderer.render(this.scene, this.camera);
  }
}

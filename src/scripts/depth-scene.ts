/**
 * Depth camera: renders a painting split into depth layers as real 3D geometry.
 *
 * Every pixel is placed along the ray it is seen on from the "home" camera,
 * at a distance taken from the depth map. From home the image is pixel-exact;
 * any other camera position reveals true parallax. Nothing is redrawn.
 */
import * as THREE from 'three';

export interface LayerMeta { name: string; rect: [number, number, number, number]; dmin: number; dmax: number }
export interface PieceMeta { width: number; height: number; z: { far: number; near: number }; layers: LayerMeta[] }

/** Vertical field of view of the home camera the geometry is built for. */
export const HOME_FOV = 30;
const K0 = 2 * Math.tan(THREE.MathUtils.degToRad(HOME_FOV) / 2);

const vert = /* glsl */ `
  uniform sampler2D uDepth;
  uniform vec4 uRect;      // layer rect in image space: x, y (from top), w, h
  uniform vec2 uRange;     // dmin, dmax
  uniform vec2 uDisp;      // disparity at depth 0 (far) and 1 (near)
  uniform float uAspect;   // image width / height
  uniform float uK;        // 2 * tan(homeFov / 2)
  varying vec2 vUv;
  void main() {
    vUv = uv;
    float d = mix(uRange.x, uRange.y, texture2D(uDepth, uv).r);
    float z = 1.0 / mix(uDisp.x, uDisp.y, d);
    vec2 g = vec2(uRect.x + uv.x * uRect.z, uRect.y + (1.0 - uv.y) * uRect.w);
    vec3 p = vec3((g.x - 0.5) * uAspect * uK, (0.5 - g.y) * uK, -1.0) * z;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }`;

const frag = /* glsl */ `
  uniform sampler2D uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(uColor, vUv);
    if (c.a < 0.004) discard;
    gl_FragColor = vec4(c.rgb, c.a * uOpacity);
  }`;

export class DepthScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(HOME_FOV, 1, 0.05, 100);
  readonly aspect: number;
  private depthGlobal: { data: Uint8ClampedArray; w: number; h: number } | null = null;
  private materials: THREE.ShaderMaterial[] = [];

  constructor(private canvas: HTMLCanvasElement, private meta: PieceMeta) {
    this.aspect = meta.width / meta.height;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x0e0d0c, 1);
    // Textures and output both stay in raw sRGB values: the painting is shown exactly as stored.
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  }

  /** Disparity (1/z) is linear in depth, so near objects separate more than far ones. */
  disparity(): [number, number] { return [1 / this.meta.z.far, 1 / this.meta.z.near]; }
  zAt(d: number) { const [a, b] = this.disparity(); return 1 / (a + (b - a) * d); }

  async load(base: string, quality: 'full' | 'half') {
    const loader = new THREE.TextureLoader();
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const load = (url: string) => loader.loadAsync(url).then((t) => {
      t.colorSpace = THREE.NoColorSpace;
      t.anisotropy = Math.min(8, maxAniso);
      return t;
    });
    const suffix = quality === 'half' ? '@half' : '';
    const [disp0, disp1] = this.disparity();
    const jobs = this.meta.layers.map(async (L, i) => {
      const [color, depth] = await Promise.all([load(`${base}/${L.name}${suffix}.webp`), load(`${base}/${L.name}-depth.png`)]);
      depth.anisotropy = 1;
      const seg = Math.round(Math.max(L.rect[2] * 260, 8));
      const geo = new THREE.PlaneGeometry(1, 1, seg, Math.round(seg * (L.rect[3] / L.rect[2]) / this.aspect));
      const mat = new THREE.ShaderMaterial({
        vertexShader: vert, fragmentShader: frag, transparent: true, depthTest: false, depthWrite: false,
        uniforms: {
          uColor: { value: color }, uDepth: { value: depth }, uOpacity: { value: 1 },
          uRect: { value: new THREE.Vector4(...L.rect) }, uRange: { value: new THREE.Vector2(L.dmin, L.dmax) },
          uDisp: { value: new THREE.Vector2(disp0, disp1) }, uAspect: { value: this.aspect }, uK: { value: K0 },
        },
      });
      this.materials.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      mesh.renderOrder = i; // layers are stored far → near; painter's order
      this.scene.add(mesh);
    });
    const depthImg = new Image();
    depthImg.src = `${base}/depth-global.png`;
    await Promise.all([...jobs, depthImg.decode()]);
    const c = document.createElement('canvas');
    c.width = depthImg.naturalWidth; c.height = depthImg.naturalHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(depthImg, 0, 0);
    this.depthGlobal = { data: ctx.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height };
  }

  /** Depth (0 far … 1 near) of the painting at image coordinates u, v. */
  depthAt(u: number, v: number) {
    const g = this.depthGlobal!;
    const x = Math.min(g.w - 1, Math.max(0, Math.round(u * (g.w - 1))));
    const y = Math.min(g.h - 1, Math.max(0, Math.round(v * (g.h - 1))));
    return g.data[(y * g.w + x) * 4] / 255;
  }

  /** World-space point of the painting at u, v. */
  pointAt(u: number, v: number, out = new THREE.Vector3()) {
    const z = this.zAt(this.depthAt(u, v));
    return out.set((u - 0.5) * this.aspect * K0 * z, (0.5 - v) * K0 * z, -z);
  }

  /** Image-height units that span the screen when looking at a point at distance z from home. */
  static readonly K0 = K0;

  resize(w: number, h: number, dpr: number) {
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render() { this.renderer.render(this.scene, this.camera); }
}

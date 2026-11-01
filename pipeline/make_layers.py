"""Split a painting into depth layers for the Tubo depth camera.

Usage: python3 pipeline/make_layers.py <painting.png> <depth.npy> <out_dir> <config.json>

Visible pixels are never altered. Only regions hidden behind nearer layers
are filled (so the camera can peek slightly around objects).
"""
import json, sys, os
import numpy as np, cv2
from PIL import Image

img_p, depth_p, out_dir, cfg_p = sys.argv[1:5]
cfg = json.load(open(cfg_p))
os.makedirs(out_dir, exist_ok=True)

rgb = np.asarray(Image.open(img_p).convert('RGB')).astype(np.float32) / 255.
H, W = rgb.shape[:2]
d_lo = np.load(depth_p).astype(np.float32)
D = cv2.resize(d_lo, (W, H), interpolation=cv2.INTER_CUBIC).clip(0, 1)
D = cv2.GaussianBlur(D, (0, 0), 1.5)

def soft(x, t, w):  # soft step at threshold t
    return np.clip((x - t) / w + 0.5, 0, 1)

t_far, t_near, edge = cfg['t_far'], cfg['t_near'], cfg['edge']
a_far = 1 - soft(D, t_far, edge)            # landscape seen through the window
a_front = soft(D, t_near, edge)             # figure + parapet
# keep only large connected regions (drops stray wall specks at the edges)
n, lab, stats, _ = cv2.connectedComponentsWithStats((a_front > 0.5).astype(np.uint8))
keep = np.zeros(n, bool); keep[1:] = stats[1:, cv2.CC_STAT_AREA] > 0.02 * H * W
km = cv2.GaussianBlur(cv2.dilate(keep[lab].astype(np.float32), np.ones((9, 9))), (0, 0), 3)
a_front = a_front * km.clip(0, 1)
a_mid = np.clip(1 - a_far - a_front, 0, 1)  # loggia architecture

def push_pull(col, w, levels=9):
    """Fill pixels with low weight from their surroundings (multi-scale)."""
    if col.ndim == 3 and col.shape[2] == 1:
        return push_pull(np.repeat(col, 3, 2), w, levels)[..., :1]
    c = [col * w[..., None]]; ws = [w]
    for _ in range(levels):
        c.append(cv2.pyrDown(c[-1])); ws.append(cv2.pyrDown(ws[-1]))
    fc = c[-1] / np.maximum(ws[-1][..., None], 1e-6)
    for i in range(levels - 1, -1, -1):
        up = cv2.resize(fc, (c[i].shape[1], c[i].shape[0]), interpolation=cv2.INTER_LINEAR)
        cur = c[i] / np.maximum(ws[i][..., None], 1e-6)
        k = np.clip(ws[i] * 4, 0, 1)[..., None]
        fc = cur * k + up * (1 - k)
    return fc

def inpaint(col, hole, scale=4, radius=9):
    """Fill a hole with surrounding paint (OpenCV Telea at reduced size)."""
    small = cv2.resize((col * 255).astype(np.uint8), (W // scale, H // scale), interpolation=cv2.INTER_AREA)
    hs = cv2.resize(hole.astype(np.uint8) * 255, (W // scale, H // scale), interpolation=cv2.INTER_NEAREST)
    hs = cv2.dilate(hs, np.ones((5, 5), np.uint8))
    filled = cv2.inpaint(small, hs, radius, cv2.INPAINT_TELEA)
    filled = cv2.GaussianBlur(filled, (0, 0), 1.2)
    return cv2.resize(filled, (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255.

def dilate(m, px):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * px + 1, 2 * px + 1))
    return cv2.dilate(m.astype(np.float32), k)

def mirror_fill(col, mask):
    """Extend the landscape past the window edges by mirroring it (rows, then below the sill)."""
    rows = np.where(mask.any(1))[0]
    yb = rows.max()
    yy = np.arange(H)
    src_y = np.where(yy > yb, np.clip(2 * yb - yy, rows.min(), yb), yy)
    m = mask[src_y]
    xs = np.arange(W)[None, :].repeat(H, 0)
    has = m.any(1)
    xl = np.where(has, m.argmax(1), 0)[:, None]
    xr = np.where(has, W - 1 - m[:, ::-1].argmax(1), W - 1)[:, None]
    mx = np.where(xs < xl, 2 * xl - xs, np.where(xs > xr, 2 * xr - xs, xs))
    mx = np.clip(mx, xl, xr).astype(np.float32)
    my = src_y[:, None].repeat(W, 1).astype(np.float32)
    out = cv2.remap(col, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return cv2.GaussianBlur(out, (0, 0), 1.5)

layers = []

single = cfg.get('mode') == 'single'
if single:
    # one layer: the whole painting on a smoothed depth surface (gentle parallax, nothing can tear)
    Ds = cv2.GaussianBlur(D, (0, 0), cfg.get('blur', 14))
    ones = np.ones((H, W), np.float32); zeros = np.zeros((H, W), np.float32)
    a_far = a_mid = zeros; a_front = ones
    far_depth = mid_depth = zeros; front_depth = Ds
    layers = [('front', rgb, ones, Ds)]
else:
    # ---- far: landscape -------------------------------------------------------
    pad = int(cfg['far_pad'] * W)
    far_region = dilate((a_far > 0.5), pad)
    far_region = cv2.GaussianBlur(far_region, (0, 0), 4).clip(0, 1)
    hole = (a_far < 0.98) & (far_region > 0)
    far_col = rgb.copy()
    far_col[hole] = mirror_fill(rgb, a_far > 0.5)[hole]
    ys = np.linspace(0, 1, H, dtype=np.float32)[:, None].repeat(W, 1)
    h0, h1 = cfg['far_horizon'], cfg['far_bottom']
    t = np.clip((ys - h0) / (h1 - h0), 0, 1); t = t * t * (3 - 2 * t)
    far_depth = cfg['far_d0'] + (cfg['far_d1'] - cfg['far_d0']) * t
    layers.append(('far', far_col, far_region, far_depth))

    # ---- mid: architecture ----------------------------------------------------
    mid_alpha = np.clip(1 - a_far, 0, 1)  # opaque everywhere except the window
    hole = (a_mid < 0.98) & (mid_alpha > 0)
    mid_col = rgb.copy()
    mid_fill = inpaint(push_pull(rgb, (a_mid > 0.98).astype(np.float32)), hole & (a_front > 0.02))
    mid_col[hole] = mid_fill[hole]
    mid_depth = push_pull(D[..., None], (a_mid > 0.98).astype(np.float32))[..., 0]
    mid_depth = cv2.GaussianBlur(mid_depth, (0, 0), 6)
    mid_depth = np.clip(mid_depth, t_far + 0.12, t_near - 0.01)  # architecture never reads as distance
    layers.append(('mid', mid_col, mid_alpha, mid_depth))

    # ---- front: figure + parapet ---------------------------------------------
    front_col = push_pull(rgb, (a_front > 0.98).astype(np.float32))
    front_col = np.where(a_front[..., None] > 0.02, rgb, front_col)  # bleed colour past edges
    front_depth = push_pull(D[..., None], (a_front > 0.9).astype(np.float32))[..., 0]
    front_depth = cv2.GaussianBlur(front_depth, (0, 0), 3)
    layers.append(('front', front_col, a_front, front_depth))

meta = {'width': W, 'height': H, 'z': cfg['z'], 'layers': []}
P = int(cfg['pad'] * W)  # reflected margin so parallax never shows past the painting's edge
for name, col, alpha, dep in layers:
    col = cv2.copyMakeBorder(col, P, P, P, P, cv2.BORDER_REFLECT_101)
    alpha = cv2.copyMakeBorder(alpha.astype(np.float32), P, P, P, P, cv2.BORDER_REFLECT_101)
    dep = cv2.copyMakeBorder(dep.astype(np.float32), P, P, P, P, cv2.BORDER_REFLECT_101)
    ys_, xs_ = np.where(alpha > 0.01)
    p = 16
    x0, x1 = max(0, xs_.min() - p), min(W + 2 * P, xs_.max() + p + 1)
    y0, y1 = max(0, ys_.min() - p), min(H + 2 * P, ys_.max() + p + 1)
    rgba = np.dstack([col, alpha])[y0:y1, x0:x1]
    im = Image.fromarray((rgba.clip(0, 1) * 255).round().astype(np.uint8), 'RGBA')
    im.save(f'{out_dir}/{name}.webp', quality=cfg['webp_q'], method=6)
    im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(f'{out_dir}/{name}@half.webp', quality=cfg['webp_q'], method=6)
    dc = dep[y0:y1, x0:x1]; dmin, dmax = float(dc.min()), float(dc.max())
    dn = (dc - dmin) / max(dmax - dmin, 1e-6)
    Image.fromarray((dn * 255).round().astype(np.uint8)).resize(((x1 - x0) // 4, (y1 - y0) // 4), Image.LANCZOS).save(f'{out_dir}/{name}-depth.png')
    meta['layers'].append({'name': name, 'rect': [(x0 - P) / W, (y0 - P) / H, (x1 - x0) / W, (y1 - y0) / H], 'dmin': dmin, 'dmax': dmax})
    print(name, (x0 - P, y0 - P, x1 - P, y1 - P), round(dmin, 3), round(dmax, 3))

json.dump(meta, open(f'{out_dir}/layers.json', 'w'), indent=1)

# ---- extras for the site ---------------------------------------------------
# Global depth (what the visitor sees from the home view) for camera targeting.
g = far_depth * a_far + mid_depth * a_mid + front_depth * a_front
g = g / np.maximum(a_far + a_mid + a_front, 1e-6)
Image.fromarray((g.clip(0, 1) * 255).round().astype(np.uint8)).resize((W // 8, H // 8), Image.LANCZOS).save(f'{out_dir}/depth-global.png')
src = Image.open(img_p).convert('RGB')
src.resize((W // 2, H // 2), Image.LANCZOS).save(f'{out_dir}/wall.webp', quality=84, method=6)  # on the wall
print('extras written')

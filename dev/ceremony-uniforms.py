"""The officers in each world's uniform (doc 98): every admiral and pilot cut-out -> its -space, -jungle and -steppe variant.

usage: python3 -I dev/ceremony-uniforms.py src/data/ceremony-layers.ts src/assets/ceremony
The clothes are found by colour: the admiral's navy (blue clearly over red, dark, below the head), the pilot's whites
(light, unsaturated; the pilot's own skin and hair pixels from the layer table are never clothes). Each clothes pixel
keeps its shading — its brightness within the clothes — and takes the outfit's colour: for space the admiral's suit goes
grey and the pilot's orange with a light-grey cap; for the jungle both wear a blotchy woodland camouflage that sits on
the figure (its pattern counted from the cut-out's foot point, so it stays put from pose to pose), with faded patches
and mud towards the boots; for the steppe (map 7) a clean, brighter desert camouflage — a sand ground with khaki
blotches and smaller brown and olive ones — with a little light dust towards the boots. Skin, hair, shoes, buttons,
glasses and badges stay. Writes <file>-space.png, <file>-jungle.png and <file>-steppe.png beside each cut-out.
"""
import json
import math
import os
import re
import sys

import numpy as np
from PIL import Image

GREY = ['#454b54', '#59606a', '#6f7681', '#878f9a', '#a2aab4', '#c2c9d1']
ORANGE = ['#7a300e', '#a8441a', '#cc5820', '#e26a26', '#f07c2e', '#fa9440']
CAP = ['#6f7681', '#9aa1ac', '#c2c8d0', '#e2e6ea']
CAMO = ['#283019', '#3e4c24', '#5f6c34', '#7a663e']  # black-green, dark green, olive, brown
FADED = (138, 136, 104)
MUD = (86, 64, 42)
# The steppe's desert camouflage: sand ground, khaki blotches, brown and olive spots; light dust at the boots.
SAND, KHAKI, BROWN, OLIVE = '#c8b48a', '#9a8458', '#6a5034', '#7a7a4a'
DUST = (216, 202, 168)


def layers(ts_path):
    """The layer table as a dict (the TS file is generated JSON with single quotes)."""
    text = open(ts_path).read()
    body = text[text.index('= {') + 2:text.index('} as const') + 1]
    return json.loads(re.sub(r"'", '"', body))


def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def ramp(colours, v):
    return hexrgb(colours[min(len(colours) - 1, max(0, int(v * len(colours))))])


def noise(x, y, s):
    """Smooth value noise at scale s (art px), 0 … 1."""
    def h(ix, iy):
        n = math.sin(ix * 127.1 + iy * 311.7) * 43758.5453
        return n - math.floor(n)
    fx, fy = x / s, y / s
    ix, iy = math.floor(fx), math.floor(fy)
    tx, ty = fx - ix, fy - iy
    tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
    a, b, c, d = h(ix, iy), h(ix + 1, iy), h(ix, iy + 1), h(ix + 1, iy + 1)
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty


def clothes(px, box, admiral):
    """Where the clothes are (bool h × w)."""
    rgb = px[:, :, :3].astype(int)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    seen = px[:, :, 3] > 0
    if admiral:
        m = seen & (b >= r + 10) & (b >= 28) & (lum < 110)
        m[: int(px.shape[0] * 0.17)] = False  # the head: his grey hair has blue in its shadows
        return m
    m = seen & (lum > 118) & (sat < 46)
    for key in ('skinPx', 'hairPx'):
        pts = box.get(key, [])
        for k in range(0, len(pts) - 1, 2):
            m[pts[k + 1], pts[k]] = False
    return m


def shade(px, m):
    """Each clothes pixel's brightness within the clothes, 0 … 1."""
    lum = (0.3 * px[:, :, 0] + 0.59 * px[:, :, 1] + 0.11 * px[:, :, 2]).astype(float)
    lo, hi = lum[m].min(), lum[m].max()
    return np.clip((lum - lo) / max(1.0, hi - lo), 0, 0.999)


def space(px, m, v, admiral):
    out = px.copy()
    h = px.shape[0]
    cap_line = int(h * 0.12)
    for y, x in zip(*np.nonzero(m)):
        if admiral:
            out[y, x, :3] = ramp(GREY, v[y, x])
        else:
            out[y, x, :3] = ramp(CAP if y < cap_line else ORANGE, v[y, x])
    return out


def jungle(px, m, v, box):
    out = px.copy()
    h = px.shape[0]
    top = int(np.nonzero(m.any(axis=1))[0].min()) if m.any() else 0
    for y, x in zip(*np.nonzero(m)):
        bx, by = box['x'] + x - box['footX'], box['y'] + y - box['footY']
        n = 0.65 * noise(bx, by, 6.0) + 0.35 * noise(bx + 40, by + 17, 2.8)
        c = hexrgb(CAMO[min(3, int(n * 4.6))])
        k = 0.8 + 0.45 * v[y, x]
        rgb = [min(255, int(ch * k)) for ch in c]
        wear = noise(bx + 70, by + 30, 3.0)
        if wear > 0.8:  # faded, scrubbed patches
            rgb = [int(0.55 * a + 0.45 * f) for a, f in zip(rgb, FADED)]
        depth = (y - top) / max(1, h - top)
        if depth > 0.72 and noise(bx * 2.3 + 9, by * 2.3, 1.5) < (depth - 0.72) * 3.6:  # mud towards the boots
            rgb = [int(0.35 * a + 0.65 * f) for a, f in zip(rgb, MUD)]
        out[y, x, :3] = rgb
    return out


def steppe_colour(bx, by):
    """The desert camouflage at a figure point: brown and olive spots over khaki blotches over the sand ground."""
    spot = noise(bx + 91, by + 47, 3.6)
    if spot > 0.74:
        return hexrgb(BROWN)
    if spot < 0.24:
        return hexrgb(OLIVE)
    blotch = 0.65 * noise(bx + 13, by + 5, 6.5) + 0.35 * noise(bx + 52, by + 29, 3.0)
    return hexrgb(KHAKI if blotch > 0.56 else SAND)


def steppe(px, m, v, box):
    out = px.copy()
    h = px.shape[0]
    top = int(np.nonzero(m.any(axis=1))[0].min()) if m.any() else 0
    for y, x in zip(*np.nonzero(m)):
        bx, by = box['x'] + x - box['footX'], box['y'] + y - box['footY']
        k = 0.78 + 0.34 * v[y, x]
        rgb = [min(255, int(ch * k)) for ch in steppe_colour(bx, by)]
        depth = (y - top) / max(1, h - top)
        if depth > 0.78 and noise(bx * 2.3 + 5, by * 2.3, 1.5) < (depth - 0.78) * 2.6:  # a little dust at the boots
            rgb = [int(0.6 * a + 0.4 * f) for a, f in zip(rgb, DUST)]
        out[y, x, :3] = rgb
    return out


def main(ts_path, out_dir):
    for box in layers(ts_path).values():
        f = box['file']
        if not (f.startswith('admiral') or f.startswith('pilot')):
            continue
        px = np.asarray(Image.open(os.path.join(out_dir, f + '.png')).convert('RGBA')).copy()
        admiral = f.startswith('admiral')
        m = clothes(px, box, admiral)
        v = shade(px, m)
        looks = (('space', space(px, m, v, admiral)), ('jungle', jungle(px, m, v, box)), ('steppe', steppe(px, m, v, box)))
        for name, img in looks:
            dest = os.path.join(out_dir, f'{f}-{name}.png')
            Image.fromarray(img.astype('uint8'), 'RGBA').save(dest, optimize=True)
        print(f, int(m.sum()), 'clothes px')


if __name__ == '__main__':
    main(*sys.argv[1:3])

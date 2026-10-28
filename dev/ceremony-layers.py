"""Ceremony layers (doc 25): ComfyUI edits -> one 320x180 grid, one shared palette, keyed cut-outs + a TS table.

usage: python3 -I dev/ceremony-layers.py <edits dir> <assets out dir> <ts out file>
The edits dir (kept outside the repo) holds, all in the key frame's framing:
  plate.png                       the deck without the two officers ('Top Gun ceremony layers (edit)')
  crew-src.png, crew-helmets.png  the crew row crop and its helmet edit ('Top Gun ceremony crew salute (crop edit)')
  crew-salute-src.png, crew-salute.png   the helmeted row and its salute edit (same workflow)
  raw-<pose>.png                  both officers on flat magenta in a pose (see POSES)
Every pilot is a grown-up (kid looks show grown-up, owner 2026-10-28); the recolouring masks are found here too.
"""
import colorsys
import json
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ceremony_cutouts import CREW, H, W, crew_overlay, figures, patch_crew  # noqa: E402
COLORS = 48
ACCENTS = 8
# Small but important: the gold of medals, shoulder boards and buttons always keeps its own two entries.
FIXED = [(214, 164, 52), (246, 214, 120)]
# The crew row's saturated colours (the deck crew's vests) get ACCENTS palette entries.


def grid(path):
    return Image.open(path).convert('RGB').resize((W, H), Image.BOX)


# pose edit -> (pilot sprite or None, admiral sprite or None)
POSES = {
    'raw-pin': (None, 'admiral-pin'),
    'raw-stand': ('pilot-adult-male-short-attention', 'admiral-stand'),
    'raw-salute': ('pilot-adult-male-short-salute', 'admiral-salute'),
    'raw-walk-a': (None, 'admiral-walk-a'),
    'raw-walk-b': (None, 'admiral-walk-b'),
    'raw-man-long-stand': ('pilot-adult-male-long-attention', None),
    'raw-man-long-salute': ('pilot-adult-male-long-salute', None),
    'raw-woman-stand': ('pilot-adult-female-long-attention', None),
    'raw-woman-salute': ('pilot-adult-female-long-salute', None),
}


def median_cut(pixels, n):
    """The n median-cut colours of a pixel list (N x 3 uint8)."""
    side = int(np.ceil(np.sqrt(len(pixels))))
    pad = np.zeros((side * side, 3), 'uint8')
    pad[:len(pixels)] = pixels
    pad[len(pixels):] = pixels[0]
    q = Image.fromarray(pad.reshape(side, side, 3), 'RGB').quantize(colors=n, method=Image.Quantize.MEDIANCUT)
    return np.array(q.getpalette()[: n * 3], 'uint8').reshape(-1, 3)


def build_palette(images, accents):
    """One palette for every layer: median cut over the plate and every sprite's opaque pixels, plus ACCENTS colours
    reserved for the saturated pixels of the crew row (the vests are too few pixels to win a slot on their own)."""
    pixels = []
    for im in images:
        a = np.asarray(im.convert('RGBA'))
        pixels.append(a[a[..., 3] > 0][:, :3])
    base = median_cut(np.concatenate(pixels), COLORS - ACCENTS - len(FIXED))
    a = np.asarray(accents).reshape(-1, 3).astype(float)
    mx, mn = a.max(axis=1), a.min(axis=1)
    vivid = a[(mx - mn) / np.maximum(mx, 1) > 0.45].astype('uint8')
    extra = median_cut(vivid, ACCENTS) if len(vivid) >= ACCENTS else np.zeros((0, 3), 'uint8')
    colours = np.concatenate([base, extra, np.array(FIXED, 'uint8')])[:COLORS]
    pal = Image.new('P', (1, 1))
    pal.putpalette(colours.flatten().tolist() + [0] * (768 - colours.size))
    return pal


def onto(im, pal):
    rgba = im.convert('RGBA')
    q = rgba.convert('RGB').quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB')
    out = np.dstack([np.asarray(q), np.asarray(rgba)[..., 3]])
    return Image.fromarray(out, 'RGBA')


def hsv(rgb):
    return colorsys.rgb_to_hsv(*(c / 255 for c in rgb))


def is_skin(rgb):
    h, s, v = hsv(rgb)
    return (h < 0.1 or h > 0.97) and 0.18 < s < 0.72 and v > 0.3


def skin_hair(box, reach=5):
    """Pixel masks of the pilot's skin (skin-coloured with a skin neighbour) and hair (dark pixels behind the face,
    from just above it to a little below the jaw: hair, a bun or a ponytail under the cap)."""
    h, w = box.shape[:2]
    op = box[..., 3] > 0
    sk = np.zeros((h, w), bool)
    for y in range(h):
        for x in range(w):
            sk[y, x] = op[y, x] and is_skin(tuple(int(v) for v in box[y, x, :3]))
    n = sum(np.roll(np.roll(sk, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)
    sk &= n >= 2
    head = [y for y in range(int(0.35 * h)) if sk[y].any()]
    hair = np.zeros((h, w), bool)
    if head:
        top, jaw = head[0], head[-1]
        lefts = {y: int(np.nonzero(sk[y])[0].min()) for y in head}
        for y in range(top, min(h, jaw + reach)):
            # behind the face in this row (above / below the face: its top / bottom row's edge)
            edge = lefts.get(y, lefts[top] if y < top else lefts[jaw])
            for x in range(min(w, edge)):
                hair[y, x] = op[y, x] and hsv(tuple(int(v) for v in box[y, x, :3]))[2] < 0.38
    return sk, hair


def mask_meta(box, mask):
    ys, xs = np.nonzero(mask)
    cols = {tuple(int(v) for v in box[y, x, :3]) for y, x in zip(ys, xs)}
    return hex_list(cols), [int(v) for pair in zip(xs, ys) for v in pair]


def hex_list(cols):
    return ['#%02x%02x%02x' % tuple(c) for c in sorted(cols, key=sum)]


def crop_meta(name, file, im):
    a = np.asarray(im)
    ys, xs = np.nonzero(a[..., 3])
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    feet = xs[ys >= y1 - 3]
    meta = {'file': file, 'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0),
            'footX': int(round(feet.mean())), 'footY': int(y1)}
    if name.startswith('pilot'):
        box = a[y0:y1, x0:x1]
        sk, hair = skin_hair(box, 16 if '-long-' in name else 5)
        meta['skin'], meta['skinPx'] = mask_meta(box, sk)
        meta['hair'], meta['hairPx'] = mask_meta(box, hair)
        cy = round(0.31 * (y1 - y0))
        rows = box[cy - 2: cy + 2, :, 3] > 0
        meta['chestX'] = int(x0 + max(np.nonzero(rows.any(axis=0))[0]) - 2)
        meta['chestY'] = int(y0 + cy)
    return im.crop((x0, y0, x1, y1)), meta


def main(src, out, ts):
    os.makedirs(out, exist_ok=True)
    plate = grid(os.path.join(src, 'plate.png'))
    j = lambda f: os.path.join(src, f)
    if os.path.exists(j('crew-helmets.png')):
        plate = patch_crew(plate, j('crew-src.png'), j('crew-helmets.png'))
    salute = crew_overlay(j('crew-salute-src.png'), j('crew-salute.png')) if os.path.exists(j('crew-salute.png')) else None
    sprites = {}
    for raw, names in POSES.items():
        path = os.path.join(src, raw + '.png')
        if not os.path.exists(path):
            continue
        for name, layer in zip(names, figures(path, raw)):
            if name:
                sprites[name] = layer
    cx, cy, cw, ch = CREW
    crew_px = plate.crop((cx, cy, cx + cw, cy + ch))
    pal = build_palette([plate] + ([salute] if salute else []) + list(sprites.values()), crew_px)
    plate_q = onto(plate, pal)
    plate_q.convert('RGB').save(os.path.join(out, 'plate.png'), optimize=True)
    table = {}
    if salute:
        img, table['crewSalute'] = crop_meta('crew', 'crew-salute', onto(salute, pal))
        img.save(os.path.join(out, 'crew-salute.png'), optimize=True)
    for n, im in sprites.items():
        img, meta = crop_meta(n, n, onto(im, pal))
        img.save(os.path.join(out, n + '.png'), optimize=True)
        table[''.join(p.capitalize() if i else p for i, p in enumerate(n.split('-')))] = meta
    with open(ts, 'w') as f:
        f.write('// Ceremony layers (doc 25): where each cut-out sits on the 320 x 180 art grid of the key frame, its foot\n')
        f.write('// point (anchor for moving it) and, for the pilot, its skin and hair colours dark -> light and the chest point\n')
        f.write('// the medals hang from. Generated by dev/ceremony-layers.py from the ComfyUI edits (doc 25); do not edit by hand.\n\n')
        f.write('export interface LayerBox {\n  file: string; x: number; y: number; w: number; h: number; footX: number; footY: number;\n')
        f.write('  /** Pilot only: its skin / hair colours dark -> light and the pixels (x, y pairs, in the cut-out) that are skin / hair. */\n')
        f.write('  skin?: readonly string[]; skinPx?: readonly number[]; hair?: readonly string[]; hairPx?: readonly number[];\n')
        f.write('  chestX?: number; chestY?: number;\n}\n\n')
        f.write('export const CEREMONY_LAYERS = ' + json.dumps(table, indent=1).replace('"', "'") + ' as const satisfies Record<string, LayerBox>;\n')
    print(json.dumps(table))


if __name__ == '__main__':
    main(*sys.argv[1:4])

"""World ceremonies (doc 75): a world's ceremony picture and its crew salute -> the 320 x 180 grid + a TS table.

usage: python3 -I dev/ceremony-sets.py <edits dir> <assets out dir> <ts out file>
The edits dir (kept outside the repo) holds, for each stage in STAGES:
  <stage>.png                              the 1280 x 720 render ('Top Gun pixel scene 16:9')
  <stage>-crew-src.png, <stage>-crew.png   the enlarged crew-row crop and its salute edit ('Top Gun ceremony crew salute
                                           (crop edit)', node 5 cropping 384 x 144 at CROP on the 768 x 432 frame)
Writes <stage>.png and <stage>-crew-salute.png (one 48-colour palette per stage, no dither) and the table. A stage whose
render is not in the edits dir keeps what the table had for it (doc 98 rebuilt only the hangar and the camp).
"""
import json
import os
import sys

import numpy as np
from PIL import Image

W, H = 320, 180
COLORS = 48
# The crop edit's 384 x 144 at 768 x 432 is 160 x 60 art px at (x, y) / 2.4.
CROP_W, CROP_H, SCALE = 160, 60, 2.4
STAR_COUNT = 24
# Per stage: the crew crop's top-left on the 768 x 432 frame, and the window whose dark pixels may twinkle
# (art px x, y, w, h; None = no window).
STAGES = {
    'pier': {'crop': (48, 192), 'window': None},
    'hangar': {'crop': (48, 228), 'window': (122, 46, 100, 66)},  # the battle-station hangar's opening (doc 98)
    'camp': {'crop': (60, 204), 'window': None},  # the jungle camp (doc 98)
    'steppe': {'crop': (110, 186), 'window': None},  # the steppe field camp at golden hour (map 7)
}


def grid(path):
    return Image.open(path).convert('RGB').resize((W, H), Image.BOX)


def crop_grid(path):
    return np.asarray(Image.open(path).convert('RGB').resize((CROP_W, CROP_H), Image.BOX)).astype(int)


def changed(src, edit):
    """Where the edit differs from its source (dilated by one art px)."""
    diff = np.abs(src - edit).sum(axis=2) > 60
    d = diff.copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            d |= np.roll(np.roll(diff, dy, 0), dx, 1)
    return d


def palette_of(plate):
    """The plate on its own 48-colour palette (median cut, no dither), as an indexed image."""
    return plate.quantize(colors=COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)


def onto(rgb, pal):
    return np.asarray(Image.fromarray(rgb.astype('uint8'), 'RGB').quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB'))


def without_specks(m, least=18):
    """The changed mask without its small islands (stray pixels on the wall or the floor; one changed pixel is a
    3 x 3 island after the dilation)."""
    seen = np.zeros_like(m)
    keep = np.zeros_like(m)
    h, w = m.shape
    for y0, x0 in zip(*np.nonzero(m)):
        if seen[y0, x0]:
            continue
        stack, part = [(y0, x0)], []
        seen[y0, x0] = True
        while stack:
            y, x = stack.pop()
            part.append((y, x))
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < h and 0 <= nx < w and m[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        if len(part) >= least:
            for y, x in part:
                keep[y, x] = True
    return keep


def crew_overlay(src_path, edit_path, at, pal):
    """The saluting crew: the changed pixels of the edit, cut to their box, and where the box sits on the grid."""
    src, edit = crop_grid(src_path), crop_grid(edit_path)
    m = without_specks(changed(src, edit))
    ys, xs = np.nonzero(m)
    if len(xs) == 0:
        return None, None
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgb = onto(edit[y0:y1, x0:x1], pal)
    alpha = np.where(m[y0:y1, x0:x1], 255, 0).astype('uint8')
    img = Image.fromarray(np.dstack([rgb, alpha]), 'RGBA')
    return img, {'x': int(round(at[0] / SCALE)) + int(x0), 'y': int(round(at[1] / SCALE)) + int(y0)}


def stars(plate, window):
    """Up to STAR_COUNT dark pixels of the window, spread out (x, y pairs)."""
    if window is None:
        return []
    x, y, w, h = window
    a = np.asarray(plate).astype(int)
    dark = a.sum(axis=2) < 150
    # Dark with dark neighbours all round: the night sky, not the window's frame or a shadow line.
    pts = [(c, r) for r in range(y + 1, y + h - 1) for c in range(x + 1, x + w - 1) if dark[r - 1:r + 2, c - 1:c + 2].all()]
    if not pts:
        return []
    step = max(1, len(pts) // STAR_COUNT)
    out = []
    for k in range(0, len(pts), step)[:STAR_COUNT]:
        c, r = pts[(k * 7919) % len(pts)]
        out += [c, r]
    return out


def previous(ts):
    """The table as it is (the TS file is generated JSON with single quotes), or empty."""
    if not os.path.exists(ts):
        return {}
    text = open(ts).read()
    return json.loads(text[text.index('= {') + 2:text.index('} as const') + 1].replace("'", '"'))


def main(src, out, ts):
    os.makedirs(out, exist_ok=True)
    kept = previous(ts)
    table = {}
    for stage, conf in STAGES.items():
        path = os.path.join(src, stage + '.png')
        if not os.path.exists(path):
            if stage in kept:
                table[stage] = kept[stage]
            print(f'{stage}: render missing, kept as it was' if stage in kept else f'{stage}: render missing, skipped')
            continue
        plate = grid(path)
        pal = palette_of(plate)
        pal.save(os.path.join(out, stage + '.png'), optimize=True)
        entry = {'plate': stage, 'crew': None, 'stars': stars(pal.convert('RGB'), conf['window'])}
        crew_src, crew_edit = (os.path.join(src, f'{stage}-crew{s}.png') for s in ('-src', ''))
        if os.path.exists(crew_src) and os.path.exists(crew_edit):
            img, at = crew_overlay(crew_src, crew_edit, conf['crop'], pal)
            if img is not None:
                img.save(os.path.join(out, stage + '-crew-salute.png'), optimize=True)
                entry['crew'] = {'file': stage + '-crew-salute', **at}
        table[stage] = entry
    with open(ts, 'w') as f:
        f.write('// World ceremonies (doc 75): each stage\'s picture, where its crew-salute overlay sits on the 320 x 180 art grid\n')
        f.write('// and the window pixels whose stars twinkle (x, y pairs). Generated by dev/ceremony-sets.py from the ComfyUI\n')
        f.write('// renders (doc 75); do not edit by hand.\n\n')
        f.write('export interface CeremonySetBox {\n  plate: string;\n  crew: { file: string; x: number; y: number } | null;\n')
        f.write('  stars: readonly number[];\n}\n\n')
        body = json.dumps(table, indent=1).replace('"', "'")
        for stage, entry in table.items():  # the star pairs on one line each
            body = body.replace(json.dumps(entry['stars'], indent=1).replace('\n', '\n  ').replace('"', "'"), json.dumps(entry['stars']), 1)
        f.write('export const CEREMONY_SETS = ' + body + ' as const satisfies Record<string, CeremonySetBox>;\n')
    print(json.dumps({k: {**v, 'stars': len(v['stars']) // 2} for k, v in table.items()}))


if __name__ == '__main__':
    main(*sys.argv[1:4])

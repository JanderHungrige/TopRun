"""The crew in each world's outfit (doc 76): an outfit edit of a portrait -> its 240 x 288 frames.

usage: python3 -I dev/crew-outfits.py <edit raw 720x864> <character> <look> <portraits dir>
The edit ('Top Gun pixel pilot – flight helmet' workflow, prompt per outfit) changes only the clothes and the background,
so the face stays where it was. The base frame is the edit box-downscaled to 240 x 288 on its own 64-colour palette (no
dither); the talk / half / blink frames are that base with the pixels where the carrier frame differs from the carrier
base (the mouth, the eyes, doc 33) laid over, relit like the skin around them and mapped onto the new palette. An edit
made from another picture of the face (Duke's jungle look starts from his helmet-less portrait, doc 97) may sit a few
pixels off: the overlay is moved by the shift that best lays the new face over the old around the eyes and mouth.
Writes <character>-<look>[-talk|-half|-blink].png.
"""
import os
import sys

import numpy as np
from PIL import Image

W, H = 240, 288
COLORS = 64
FRAMES = ('talk', 'half', 'blink')


def rgb(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(int)


def tint(old, new, mask, reach=4):
    """Per channel, how the edit relit the skin around the changed pixels (new / old over a ring around them), so the
    carrier frame's eyelids and lips take the new light instead of showing as a patch."""
    grown = mask.copy()
    for _ in range(reach):
        g = grown.copy()
        g[1:, :] |= grown[:-1, :]
        g[:-1, :] |= grown[1:, :]
        g[:, 1:] |= grown[:, :-1]
        g[:, :-1] |= grown[:, 1:]
        grown = g
    ring = grown & ~mask
    return np.clip(new[ring].mean(axis=0) / np.maximum(old[ring].mean(axis=0), 1), 0.5, 2.0)


def with_white(base, cut):
    """The median-cut palette plus the picture's own white (its lightest unsaturated colour), so teeth and eye whites stay
    white instead of taking the nearest tint of a green jungle or a red control room."""
    a = np.asarray(base).astype(int)
    grey = a[(a.max(axis=2) - a.min(axis=2)) < 28]
    white = grey[grey.sum(axis=1).argmax()] if len(grey) else np.array([240, 238, 230])
    colours = cut.getpalette()[: 3 * (COLORS - 1)] + [int(v) for v in white]
    pal = Image.new('P', (1, 1))
    pal.putpalette(colours)
    return base.quantize(palette=pal, dither=Image.Dither.NONE)


def face_shift(old, new, mask, reach=16):
    """The (dy, dx) that best lays the new face over the old one around the changed pixels (luma, mean abs diff)."""
    ys, xs = np.nonzero(mask)
    if len(ys) == 0:
        return 0, 0
    y0, y1 = max(0, ys.min() - 12), min(H, ys.max() + 13)
    x0, x1 = max(0, xs.min() - 12), min(W, xs.max() + 13)
    lo, ln = old.mean(axis=2), new.mean(axis=2)
    best, at = None, (0, 0)
    for dy in range(-reach, reach + 1):
        for dx in range(-reach, reach + 1):
            d = np.abs(np.roll(np.roll(lo, dy, 0), dx, 1)[y0:y1, x0:x1] - ln[y0:y1, x0:x1]).mean()
            if best is None or d < best:
                best, at = d, (dy, dx)
    return at


def shifted(a, at):
    return np.roll(np.roll(a, at[0], 0), at[1], 1)


def main(edit, character, look, portraits):
    base = Image.open(edit).convert('RGB').resize((W, H), Image.BOX)
    pal = with_white(base, base.quantize(colors=COLORS - 1, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE))
    out = os.path.join(portraits, f'{character}-{look}')
    pal.save(out + '.png', optimize=True)
    new = np.asarray(pal.convert('RGB')).astype(int)
    old = rgb(os.path.join(portraits, character + '.png'))
    frames = {f: rgb(os.path.join(portraits, f'{character}-{f}.png')) for f in FRAMES if os.path.exists(os.path.join(portraits, f'{character}-{f}.png'))}
    face = np.zeros((H, W), bool)
    for cur in frames.values():
        face |= np.abs(cur - old).sum(axis=2) > 0
    at = face_shift(old, new, face)
    print(f'{character}-{look}: the face sits {at} (dy, dx) from the carrier one')
    old = shifted(old, at)
    for frame, cur in frames.items():
        cur = shifted(cur, at)
        diff = np.abs(cur - old).sum(axis=2) > 0
        merged = new.copy()
        lit = np.clip(cur * tint(old, new, diff), 0, 255)
        white = cur.sum(axis=2) > 600  # teeth and eye whites keep their own colour
        merged[diff & ~white] = lit[diff & ~white]
        merged[diff & white] = cur[diff & white]
        img = Image.fromarray(merged.astype('uint8'), 'RGB').quantize(palette=pal, dither=Image.Dither.NONE)
        img.save(f'{out}-{frame}.png', optimize=True)
        print(f'{character}-{look}-{frame}: {int(diff.sum())} px from the carrier frame')


if __name__ == '__main__':
    main(*sys.argv[1:5])

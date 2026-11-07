"""The crew in each world's outfit (doc 76): an outfit edit of a portrait -> its 240 x 288 frames.

usage: python3 -I dev/crew-outfits.py <edit raw 720x864> <character> <look> <portraits dir>
The edit ('Top Gun pixel pilot – flight helmet' workflow, prompt per outfit) changes only the clothes and the background,
so the face stays where it was. The base frame is the edit box-downscaled to 240 x 288 on its own 64-colour palette (no
dither); the talk / half / blink frames are that base with the pixels where the carrier frame differs from the carrier
base (the mouth, the eyes, doc 33) laid over, relit like the skin around them and mapped onto the new palette.
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


def main(edit, character, look, portraits):
    base = Image.open(edit).convert('RGB').resize((W, H), Image.BOX)
    pal = base.quantize(colors=COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    out = os.path.join(portraits, f'{character}-{look}')
    pal.save(out + '.png', optimize=True)
    new = np.asarray(pal.convert('RGB')).astype(int)
    old = rgb(os.path.join(portraits, character + '.png'))
    for frame in FRAMES:
        path = os.path.join(portraits, f'{character}-{frame}.png')
        if not os.path.exists(path):
            continue
        cur = rgb(path)
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

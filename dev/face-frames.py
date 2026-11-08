"""A new character's talk / half / blink frame (doc 33): an edit of its portrait -> the base with only the mouth or eyes.

usage: python3 -I dev/face-frames.py <base raw 720x864> <edit raw 720x864> <character> <frame> <portraits dir> [eye line]
The edit ('Top Gun pixel pilot – flight helmet' workflow, 'Change only the mouth / eyes …') redraws the whole picture a
little; only the face's change may show. Both renders are box-downscaled to 240 x 288; pixels that differ by more than
THRESHOLD (summed over the channels) form blobs, the blobs near the biggest one (the mouth, or the two eyes) are kept,
grown by a pixel, and laid over <character>.png in that portrait's own palette (no dither). A blink only looks above
the eye line (art px between the eyes and the mouth, EYE_LINE by default): the edits like to close the mouth instead of
the eyes, and that must not ship as a blink.
Writes <character>-<frame>.png.
"""
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

W, H = 240, 288
THRESHOLD = 75
MIN_BLOB = 5
# How far from the biggest blob's centre another blob may sit and still belong to the face (art px).
REACH_X, REACH_Y = 48, 22
# The eyes of the crew portraits sit at about a third of the height, the mouth at a half.
EYE_LINE = 0.42 * H


def small(path):
    return np.asarray(Image.open(path).convert('RGB').resize((W, H), Image.BOX)).astype(int)


def blobs(mask):
    """4-connected components of the mask, as lists of (y, x)."""
    seen = np.zeros_like(mask)
    found = []
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]:
            continue
        seen[y, x] = True
        todo, blob = deque([(y, x)]), []
        while todo:
            cy, cx = todo.popleft()
            blob.append((cy, cx))
            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    todo.append((ny, nx))
        found.append(blob)
    return found


def face_mask(base, edit, eye_line):
    """The changed face; with an eye line (a blink) only what changed above it."""
    diff = np.abs(edit - base).sum(axis=2) > THRESHOLD
    found = [b for b in blobs(diff) if len(b) >= MIN_BLOB and (eye_line is None or np.mean(b, axis=0)[0] < eye_line)]
    if not found:
        return np.zeros((H, W), bool)
    big = max(found, key=len)
    cy, cx = np.mean(big, axis=0)
    mask = np.zeros((H, W), bool)
    for b in found:
        by, bx = np.mean(b, axis=0)
        if abs(bx - cx) <= REACH_X and abs(by - cy) <= REACH_Y:
            for y, x in b:
                mask[y, x] = True
    grown = mask.copy()
    grown[1:, :] |= mask[:-1, :]
    grown[:-1, :] |= mask[1:, :]
    grown[:, 1:] |= mask[:, :-1]
    grown[:, :-1] |= mask[:, 1:]
    return grown


def main(base_raw, edit_raw, character, frame, portraits, eye_line=None):
    pal = Image.open(os.path.join(portraits, character + '.png'))
    line = (float(eye_line) if eye_line else EYE_LINE) if frame == 'blink' else None
    mask = face_mask(small(base_raw), small(edit_raw), line)
    edit = Image.fromarray(small(edit_raw).astype('uint8'), 'RGB').quantize(palette=pal, dither=Image.Dither.NONE)
    out = np.where(mask, np.asarray(edit), np.asarray(pal))
    img = Image.fromarray(out.astype('uint8'), 'P')
    img.putpalette(pal.getpalette())
    img.save(os.path.join(portraits, f'{character}-{frame}.png'), optimize=True)
    print(f'{character}-{frame}: {int(mask.sum())} px from the edit')


if __name__ == '__main__':
    main(*sys.argv[1:7])

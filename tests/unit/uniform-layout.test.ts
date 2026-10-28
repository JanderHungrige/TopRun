import { describe, expect, it } from 'vitest';
import { MEDAL_IDS, MEDALS, type MedalId, type MedalShape } from '../../src/data/medals';
import { LOCKER_CHEST, MEDAL_ART, moveSlot, rackRows, slotAt, uniformLayout, type SlotKind, type UniformLayout } from '../../src/game/uniform-layout';
import { MEDAL_W, medalBottom, paintMedal } from '../../src/render/medals';
import { Pix } from '../../src/render/pixel/raster';

// Doc 31: the rack on the locker's dress whites — catalogue order; hanging medals on the left breast, rows filling
// up from the pocket under the wings; campaign ribbons as bars on the right breast above the name plate.

const C = LOCKER_CHEST;
const rowsOf = (l: UniformLayout, kind: SlotKind): MedalId[][] => {
  const out: MedalId[][] = [];
  for (const s of l.slots) if (s.kind === kind) (out[s.row] ??= []).push(s.id);
  return out;
};
const rowSpan = (l: UniformLayout, kind: SlotKind, row: number): { x0: number; x1: number; y0: number; y1: number } => {
  const b = l.slots.filter((s) => s.kind === kind && s.row === row).map((s) => s.box);
  return {
    x0: Math.min(...b.map((r) => r.x)), x1: Math.max(...b.map((r) => r.x + r.w)),
    y0: Math.min(...b.map((r) => r.y)), y1: Math.max(...b.map((r) => r.y + r.h)),
  };
};

describe('uniform layout', () => {
  it('splits rows like a real rack: the top row takes the remainder', () => {
    expect(rackRows([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([[1], [2, 3, 4], [5, 6, 7]]);
    expect(rackRows([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
    expect(rackRows([], 5)).toEqual([]);
  });

  it('shows only the wings, right above the pocket, when no medal is earned', () => {
    const l = uniformLayout([]);
    expect(l.slots).toEqual([]);
    expect(l.wings.y + C.wingsH).toBeLessThanOrEqual(C.pocketTop);
    expect(l.wings.y).toBeGreaterThan(C.pocketTop - 40);
  });

  it('puts all 18 in catalogue order: ribbon bars 2 + 3, medals 3 + 5 + 5', () => {
    const l = uniformLayout(MEDAL_IDS);
    expect(l.slots.map((s) => s.id)).toEqual([...MEDAL_IDS]);
    expect(rowsOf(l, 'ribbon').map((r) => r.length)).toEqual([2, 3]);
    expect(rowsOf(l, 'medal').map((r) => r.length)).toEqual([3, 5, 5]);
    for (const s of l.slots) expect(s.kind).toBe(MEDALS[s.id].look.shape === 'ribbon' ? 'ribbon' : 'medal');
  });

  it('keeps the medals on the left breast, under the shoulder boards and the wings, above the pocket', () => {
    const l = uniformLayout(MEDAL_IDS);
    expect(l.top).toBeGreaterThanOrEqual(C.minTop);
    for (const s of l.slots.filter((x) => x.kind === 'medal')) {
      expect(s.box.x, s.id).toBeGreaterThanOrEqual(C.left - 0.01);
      expect(s.box.x + s.box.w, s.id).toBeLessThanOrEqual(C.right + 0.01);
      expect(s.box.y + s.box.h, s.id).toBeLessThanOrEqual(C.pocketTop);
      expect(s.box.y, s.id).toBeGreaterThan(l.wings.y + C.wingsH - 0.01);
    }
  });

  it('sits at chest height (a third down the tunic) and tucks a full rack under the collar', () => {
    // The tunic in the locker picture runs from the shoulders (≈ 200) to the hem (≈ 688): the breast line is high.
    expect(C.pocketTop).toBeLessThan(200 + (688 - 200) * 0.4);
    const full = uniformLayout(MEDAL_IDS);
    expect(full.top).toBeGreaterThanOrEqual(C.minTop);
    const [r0, r1, r2] = [0, 1, 2].map((r) => rowSpan(full, 'medal', r));
    expect(r0 && r1 && r0.y1 > r1.y0).toBe(true);
    expect(r1 && r2 && r1.y1 > r2.y0).toBe(true);
    expect(r2?.y1).toBeLessThanOrEqual(C.pocketTop);
    const two = uniformLayout(['victory', 'ace', 'topace', 'giant', 'untouchable', 'gunslinger']);
    expect(rowSpan(two, 'medal', 0).y1).toBeLessThanOrEqual(rowSpan(two, 'medal', 1).y0);
  });

  it('stands the ribbon bars on the name plate, centred on the right breast', () => {
    const l = uniformLayout(MEDAL_IDS);
    const bottom = rowSpan(l, 'ribbon', 1);
    const top = rowSpan(l, 'ribbon', 0);
    expect(bottom.y1).toBe(C.ribbonBottom);
    expect(top.y1).toBeLessThanOrEqual(bottom.y0);
    for (const r of [top, bottom]) expect(Math.abs((r.x0 + r.x1) / 2 - C.ribbonCentre)).toBeLessThan(0.5);
    expect(bottom.x1).toBeLessThan(C.left);
  });

  it('fills up from the pocket and centres every medal row on the breast', () => {
    const one = uniformLayout(['ace']);
    const s = one.slots[0];
    expect(s && s.box.y + s.box.h).toBeGreaterThan(C.pocketTop - 10);
    const l = uniformLayout(['victory', 'ace', 'topace', 'giant', 'untouchable', 'gunslinger']);
    expect(rowsOf(l, 'medal')).toEqual([['victory'], ['ace', 'topace', 'giant', 'untouchable', 'gunslinger']]);
    const mid = (C.left + C.right) / 2;
    for (let r = 0; r < 2; r++) {
      const span = rowSpan(l, 'medal', r);
      expect(Math.abs((span.x0 + span.x1) / 2 - mid), `row ${r}`).toBeLessThan(0.5);
    }
    expect(rowSpan(l, 'medal', 0).y1).toBeLessThanOrEqual(rowSpan(l, 'medal', 1).y0);
  });

  it('describes each shape like the medal art paints it', () => {
    const widest = new Map<MedalShape, number>();
    for (const id of MEDAL_IDS) {
      const W = 2 * Math.ceil(MEDAL_W / 2) + 2;
      const p = new Pix(W, 100, 1, W / 2, 1);
      paintMedal(p, id);
      let half = 0;
      p.data.forEach((v, i) => {
        if (v) half = Math.max(half, Math.abs((i % W) + 0.5 - W / 2));
      });
      const shape = MEDALS[id].look.shape;
      widest.set(shape, Math.max(widest.get(shape) ?? 0, half));
      expect(MEDAL_ART[shape].half, `${id}: painted ${half}`).toBeGreaterThanOrEqual(half - 0.5);
      expect(MEDAL_ART[shape].bottom, id).toBe(medalBottom(id));
    }
    for (const [shape, half] of widest) expect(MEDAL_ART[shape].half, `${shape}: widest ${half}`).toBeLessThanOrEqual(half + 2);
  });
});

describe('uniform navigation', () => {
  const l = uniformLayout(MEDAL_IDS);
  const at = (id: MedalId): number => l.slots.findIndex((s) => s.id === id);

  it('steps left and right through the catalogue order, across rows and blocks, clamped at the ends', () => {
    expect(moveSlot(l, at('topace'), 'right')).toBe(at('giant'));
    expect(moveSlot(l, at('giant'), 'left')).toBe(at('topace'));
    expect(moveSlot(l, at('ace'), 'right')).toBe(at('topace'));
    expect(moveSlot(l, at('leviathan'), 'right')).toBe(at('victory'));
    expect(moveSlot(l, at('victory'), 'left')).toBe(at('leviathan'));
    expect(moveSlot(l, 0, 'left')).toBe(0);
    expect(moveSlot(l, 17, 'right')).toBe(17);
  });

  it('moves up and down to the nearest slot above or below', () => {
    expect(moveSlot(l, at('allstars'), 'down')).toBe(at('untouchable'));
    expect(moveSlot(l, at('untouchable'), 'up')).toBe(at('allstars'));
    expect(l.slots[moveSlot(l, at('triple'), 'up')]?.row).toBe(1);
    expect(moveSlot(l, at('pacific'), 'down')).not.toBe(at('pacific'));
    expect(moveSlot(l, at('allstars'), 'up')).toBe(at('allstars'));
  });

  it('starts on the first slot when nothing is selected and never leaves an empty rack', () => {
    expect(moveSlot(l, -1, 'left')).toBe(0);
    expect(moveSlot(uniformLayout([]), -1, 'up')).toBe(-1);
  });

  it('finds the slot under a point and prefers the selected one where they overlap', () => {
    const s = l.slots[at('ace')];
    if (!s) throw new Error('missing slot');
    expect(slotAt(l, { x: s.box.x + s.box.w / 2, y: s.box.y + s.box.h / 2 })).toBe(at('ace'));
    expect(slotAt(l, { x: 0, y: 0 })).toBe(-1);
    expect(slotAt(l, { x: s.box.x + 0.5, y: s.box.y + s.box.h / 2 }, at('ace'))).toBe(at('ace'));
  });
});

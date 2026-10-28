import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CEREMONY_LAYERS, type LayerBox } from '../../src/data/ceremony-layers';
import { pilotCutout, type PilotBase, type PilotPose } from '../../src/game/ceremony-stage';

const LAYERS: Readonly<Record<string, LayerBox>> = CEREMONY_LAYERS;
const has = (key: string): boolean => key in LAYERS;
const BASES: readonly PilotBase[] = ['adultMaleShort', 'adultMaleLong', 'adultFemaleShort', 'adultFemaleLong'];
const POSES: readonly PilotPose[] = ['attention', 'salute'];

describe('ceremony layers (generated table)', () => {
  it('has the deck, the crew salute and every admiral pose, all as files inside the 320 × 180 grid', () => {
    expect(existsSync('src/assets/ceremony/plate.png')).toBe(true);
    for (const key of ['crewSalute', 'admiralWalkA', 'admiralWalkB', 'admiralStand', 'admiralPin', 'admiralSalute']) expect(has(key), key).toBe(true);
    for (const [key, b] of Object.entries(LAYERS)) {
      expect(existsSync(`src/assets/ceremony/${b.file}.png`), key).toBe(true);
      expect(b.x >= 0 && b.y >= 0 && b.x + b.w <= 320 && b.y + b.h <= 180, key).toBe(true);
      expect(b.footY, key).toBe(b.y + b.h);
    }
  });

  it('every pilot base and pose shows a grown-up cut-out of its own kind (short-haired women: the bun), no kids', () => {
    for (const base of BASES) for (const pose of POSES) expect(has(pilotCutout(base, pose, has)), `${base} ${pose}`).toBe(true);
    expect(pilotCutout('adultFemaleShort', 'attention', has)).toBe('pilotAdultFemaleLongAttention');
    expect(pilotCutout('adultMaleLong', 'salute', has)).toBe('pilotAdultMaleLongSalute');
    expect(Object.keys(LAYERS).filter((k) => k.startsWith('pilotKid'))).toEqual([]);
  });

  it('pilot cut-outs carry skin and hair pixels inside themselves and a chest point', () => {
    for (const [key, b] of Object.entries(LAYERS)) {
      if (!key.startsWith('pilot')) continue;
      for (const px of [b.skinPx ?? [], b.hairPx ?? []]) {
        expect(px.length, key).toBeGreaterThan(10);
        for (let i = 0; i + 1 < px.length; i += 2) expect((px[i] ?? -1) < b.w && (px[i + 1] ?? -1) < b.h, key).toBe(true);
      }
      expect((b.skin ?? []).length && (b.hair ?? []).length, key).toBeGreaterThan(0);
      expect(b.chestX !== undefined && b.chestX >= b.x && b.chestX < b.x + b.w, key).toBe(true);
    }
  });
});

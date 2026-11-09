import { describe, expect, it } from 'vitest';
import { ENEMIES, isAir } from '../../src/data/enemies';
import { ALL_MISSIONS as MISSIONS } from '../../src/data/missions';
import type { EnemyKind } from '../../src/data/types';
import { generateTimeline } from '../../src/game/waves';
import { ringHeadings } from '../../src/game/spores';
import { ENEMIES_DE, ENEMIES_EN_PLURAL } from '../../src/i18n/content-de';

// The jungle planet's alien creatures and plants (doc 96).

const GROUND: readonly EnemyKind[] = ['sporepod', 'lasher', 'rhino', 'toad', 'spire', 'totem', 'lurker'];
const AIR: readonly EnemyKind[] = ['glider', 'leatherwing', 'dragonfly', 'balloon', 'skyjelly'];
const ALIENS = [...GROUND, ...AIR];

describe('Alien jungle enemies (doc 96)', () => {
  it('defines twelve aliens, seven rooted or heavy on the ground and five in the air', () => {
    expect(ALIENS).toHaveLength(12);
    for (const k of GROUND) expect(isAir(k), k).toBe(false);
    for (const k of AIR) expect(isAir(k), k).toBe(true);
    for (const k of ALIENS) {
      const d = ENEMIES[k];
      expect(d.kind).toBe(k);
      expect(d.hp, k).toBeGreaterThan(0);
      expect(d.radius, k).toBeGreaterThanOrEqual(12);
      expect(d.bounty, k).toBeGreaterThan(0);
      expect(d.behaviors.length, k).toBeGreaterThan(0);
    }
  });

  it('gives the spore pod and the crystal totem the spore ring, the rhino and the totem armour, the spire homing larvae', () => {
    expect(ENEMIES.sporepod.weapon).toBe('ring');
    expect(ENEMIES.totem.weapon).toBe('ring');
    expect(ENEMIES.totem.period).toBeLessThan(ENEMIES.sporepod.period); // the totem's spiral
    expect(ENEMIES.rhino.armor).toBeLessThan(1);
    expect(ENEMIES.totem.armor).toBeLessThan(1);
    expect(ENEMIES.spire.weapon).toBe('missile');
    expect(ENEMIES.rhino.speed).toBeGreaterThan(ENEMIES.beetle.speed); // it charges
    expect(ENEMIES.leatherwing.behaviors).toContain('dive');
  });

  it('lets the spore balloon burst into spores when it dies, and nothing else', () => {
    expect(ENEMIES.balloon.burst).toBe(10);
    for (const k of Object.keys(ENEMIES) as EnemyKind[]) if (k !== 'balloon') expect(ENEMIES[k].burst, k).toBeUndefined();
  });

  it('spreads a spore ring evenly and turns it with the source\'s age', () => {
    const ring = ringHeadings(8, 0);
    expect(ring).toHaveLength(8);
    for (let i = 1; i < 8; i++) expect((ring[i] ?? 0) - (ring[i - 1] ?? 0)).toBeCloseTo(Math.PI / 4, 9);
    const turned = ringHeadings(8, 0.3);
    expect(turned[0]).toBeCloseTo((ring[0] ?? 0) + 0.3, 9);
    expect(ringHeadings(8, 0.3)).not.toEqual(ring);
    expect(ringHeadings(5, 1)).toHaveLength(5);
  });

  it('puts every alien into the map-6 missions of its theater and nowhere else', () => {
    const map6 = MISSIONS.filter((m) => m.campaign === 6);
    const others = MISSIONS.filter((m) => m.campaign !== 6);
    for (const k of ALIENS) {
      expect(map6.some((m) => m.pool.includes(k)), k).toBe(true);
      expect(others.some((m) => m.pool.includes(k)), k).toBe(false);
    }
    const swamp = map6.filter((m) => m.theater === 'swamp').flatMap((m) => m.pool);
    for (const k of ['toad', 'lurker', 'skyjelly'] as const) expect(swamp, k).toContain(k);
    const ruins = map6.filter((m) => m.theater === 'ruins').flatMap((m) => m.pool);
    expect(ruins).toContain('totem');
    const hive = map6.filter((m) => m.theater === 'hive').flatMap((m) => m.pool);
    expect(hive).toContain('spire');
  });

  it('sends the big slow drifters alone', () => {
    const m = MISSIONS.find((x) => x.campaign === 6 && x.pool.includes('balloon'));
    if (!m) throw new Error('no balloon mission');
    const events = generateTimeline({ ...m, pool: ['balloon'] }).filter((e) => e.type === 'enemy' && e.kind === 'balloon');
    const times = events.map((e) => e.t);
    const together = times.filter((t, i) => times.some((u, j) => j !== i && Math.abs(u - t) < 0.5));
    expect(together.length).toBeLessThanOrEqual(times.length / 2);
  });

  it('names every alien in English and German', () => {
    for (const k of ALIENS) {
      expect(ENEMIES[k].name.length, k).toBeGreaterThan(3);
      expect(ENEMIES_EN_PLURAL[k].length, k).toBeGreaterThan(3);
      const de = ENEMIES_DE[k];
      expect(de[0].length, k).toBeGreaterThan(3);
      expect(de[1].length, k).toBeGreaterThan(3);
    }
  });
});

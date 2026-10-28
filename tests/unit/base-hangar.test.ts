import { describe, expect, it } from 'vitest';
import { BASE_AREA_IDS, BASE_AREAS, STRIDE_PX, WALK_FRAMES, type BaseAreaId } from '../../src/data/base-areas';
import {
  areaAt, areaRoute, arrivedAt, neighbour, stepWalker, walkerAt, walkFrame, walkTo, type Walker,
} from '../../src/game/base-hangar';

const DT = 1 / 60;

function walkUntilStopped(w: Walker, speed: number, cap = 2000): { w: Walker; frames: number } {
  let frames = 0;
  while (w.moving && frames < cap) {
    w = stepWalker(w, DT, speed);
    frames++;
  }
  return { w, frames };
}

describe('Hangar base areas', () => {
  it('lists six areas left to right, each with a hotspot, a plate and a stand point inside the screen', () => {
    expect(BASE_AREA_IDS).toEqual(['fun', 'locker', 'photos', 'ladder', 'chalk', 'exit']);
    let lastX = -Infinity;
    for (const id of BASE_AREA_IDS) {
      const a = BASE_AREAS[id];
      expect(a.id).toBe(id);
      expect(a.hot.x).toBeGreaterThanOrEqual(0);
      expect(a.hot.x + a.hot.w).toBeLessThanOrEqual(1280);
      expect(a.hot.y + a.hot.h).toBeLessThanOrEqual(720);
      expect(a.standX).toBeGreaterThanOrEqual(a.hot.x);
      expect(a.standX).toBeLessThanOrEqual(a.hot.x + a.hot.w);
      expect(a.hot.x).toBeGreaterThan(lastX);
      lastX = a.hot.x;
    }
  });

  it('hotspots do not overlap', () => {
    for (const a of BASE_AREA_IDS) {
      for (const b of BASE_AREA_IDS) {
        if (a >= b) continue;
        const r = BASE_AREAS[a].hot;
        const s = BASE_AREAS[b].hot;
        const overlap = r.x < s.x + s.w && s.x < r.x + r.w && r.y < s.y + s.h && s.y < r.y + r.h;
        expect(overlap, `${a} / ${b}`).toBe(false);
      }
    }
  });

  it('maps every area to its route', () => {
    expect(areaRoute('fun')).toEqual({ to: 'recRoom' });
    expect(areaRoute('locker')).toEqual({ to: 'locker' });
    expect(areaRoute('photos')).toEqual({ to: 'photoWall' });
    expect(areaRoute('ladder')).toEqual({ to: 'ladder' });
    expect(areaRoute('chalk')).toEqual({ to: 'chalkboard' });
    expect(areaRoute('exit')).toEqual({ to: 'map' });
  });

  it('hit-tests the hotspots (centres hit their own area, the bare floor hits nothing)', () => {
    for (const id of BASE_AREA_IDS) {
      const h = BASE_AREAS[id].hot;
      expect(areaAt({ x: h.x + h.w / 2, y: h.y + h.h / 2 })).toBe(id);
    }
    expect(areaAt({ x: 640, y: 700 })).toBeNull();
    expect(areaAt({ x: -5, y: 300 })).toBeNull();
  });
});

describe('Hangar base navigation', () => {
  it('← / → step through the left-to-right order and stop at the ends', () => {
    expect(neighbour('fun', 'right')).toBe('locker');
    expect(neighbour('locker', 'right')).toBe('photos');
    expect(neighbour('photos', 'right')).toBe('ladder');
    expect(neighbour('ladder', 'right')).toBe('chalk');
    expect(neighbour('chalk', 'right')).toBe('exit');
    expect(neighbour('exit', 'right')).toBe('exit');
    expect(neighbour('exit', 'left')).toBe('chalk');
    expect(neighbour('locker', 'left')).toBe('fun');
    expect(neighbour('fun', 'left')).toBe('fun');
  });

  it('↑ / ↓ go to the nearest area in any row above / below (wall, chalkboard, floor; a tie: the nearer row)', () => {
    const up: Record<BaseAreaId, BaseAreaId> = {
      fun: 'photos', locker: 'photos', photos: 'photos', ladder: 'ladder', chalk: 'ladder', exit: 'chalk',
    };
    const down: Record<BaseAreaId, BaseAreaId> = {
      fun: 'fun', locker: 'locker', photos: 'locker', ladder: 'chalk', chalk: 'exit', exit: 'exit',
    };
    for (const id of BASE_AREA_IDS) {
      expect(neighbour(id, 'up'), `${id} up`).toBe(up[id]);
      expect(neighbour(id, 'down'), `${id} down`).toBe(down[id]);
    }
  });

  it('every area is reachable from every other with the arrows', () => {
    for (const from of BASE_AREA_IDS) {
      const seen = new Set<BaseAreaId>([from]);
      const queue: BaseAreaId[] = [from];
      while (queue.length > 0) {
        const at = queue.shift() ?? from;
        for (const dir of ['left', 'right', 'up', 'down'] as const) {
          const next = neighbour(at, dir);
          if (!seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }
      expect(seen.size).toBe(BASE_AREA_IDS.length);
    }
  });
});

describe('Hangar base walker', () => {
  it('stands still until sent somewhere', () => {
    const w = walkerAt(300);
    expect(w.moving).toBe(false);
    expect(stepWalker(w, DT, 300)).toBe(w);
  });

  it('walks to the target at the given speed, faces the way it goes and stops exactly on it', () => {
    let w = walkTo(walkerAt(BASE_AREAS.fun.standX), BASE_AREAS.locker.standX);
    expect(w.moving).toBe(true);
    w = stepWalker(w, 0.5, 300);
    expect(w.x).toBeCloseTo(BASE_AREAS.fun.standX + 150, 6);
    expect(w.facing).toBe(1);
    const done = walkUntilStopped(w, 300);
    expect(done.w.x).toBe(BASE_AREAS.locker.standX);
    expect(done.w.moving).toBe(false);
    expect(arrivedAt(done.w, 'locker')).toBe(true);
    expect(done.w.dist).toBeCloseTo(BASE_AREAS.locker.standX - BASE_AREAS.fun.standX, 6);
  });

  it('turns round when sent back the other way, and hurrying is faster', () => {
    const start = walkTo(walkerAt(BASE_AREAS.exit.standX), BASE_AREAS.fun.standX);
    const slow = walkUntilStopped(start, 300);
    const fast = walkUntilStopped(start, 900);
    expect(slow.w.facing).toBe(-1);
    expect(fast.frames).toBeLessThan(slow.frames / 2);
    expect(fast.w.x).toBe(BASE_AREAS.fun.standX);
  });

  it('cycles through the walk key frames with the distance', () => {
    const w = walkerAt(0);
    expect(walkFrame(w)).toBe(0);
    expect(walkFrame({ ...w, dist: STRIDE_PX / WALK_FRAMES })).toBe(1);
    expect(walkFrame({ ...w, dist: STRIDE_PX })).toBe(0);
    expect(walkFrame({ ...w, dist: STRIDE_PX * 2.5 })).toBe(WALK_FRAMES / 2);
  });
});

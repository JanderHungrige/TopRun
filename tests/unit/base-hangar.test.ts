import { describe, expect, it } from 'vitest';
import { areaDef, areaIds, BASE_AREAS, STRIDE_PX, WALK_FRAMES, type BaseAreaId } from '../../src/data/base-areas';
import {
  areaAt, areaRoute, arrivedAt, neighbour, stepWalker, walkerAt, walkFrame, walkTo, type Walker,
} from '../../src/game/base-hangar';

const DT = 1 / 60;
const A = (id: BaseAreaId) => areaDef(BASE_AREAS, id);
const BASE_AREA_IDS = areaIds(BASE_AREAS);

function walkUntilStopped(w: Walker, speed: number, cap = 2000): { w: Walker; frames: number } {
  let frames = 0;
  while (w.moving && frames < cap) {
    w = stepWalker(w, DT, speed);
    frames++;
  }
  return { w, frames };
}

describe('Hangar base areas', () => {
  it('lists eight areas left to right, each with a hotspot, a plate and a stand point inside the screen', () => {
    expect(BASE_AREA_IDS).toEqual(['fun', 'tv', 'locker', 'photos', 'jet', 'ladder', 'chalk', 'exit']);
    let lastX = -Infinity;
    for (const id of BASE_AREA_IDS) {
      const a = A(id);
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

  it('hotspots do not overlap, except the TV standing in front of the rec room (doc 63)', () => {
    for (const a of BASE_AREA_IDS) {
      for (const b of BASE_AREA_IDS) {
        if (a >= b || (a === 'fun' && b === 'tv')) continue;
        const r = A(a).hot;
        const s = A(b).hot;
        const overlap = r.x < s.x + s.w && s.x < r.x + r.w && r.y < s.y + s.h && s.y < r.y + r.h;
        expect(overlap, `${a} / ${b}`).toBe(false);
      }
    }
  });

  it('maps every area to its route', () => {
    expect(areaRoute('fun')).toEqual({ to: 'recRoom' });
    expect(areaRoute('tv')).toEqual({ to: 'tapes' });
    expect(areaRoute('locker')).toEqual({ to: 'locker' });
    expect(areaRoute('photos')).toEqual({ to: 'photoWall' });
    expect(areaRoute('jet')).toEqual({ to: 'hangar' });
    expect(areaRoute('ladder')).toEqual({ to: 'ladder' });
    expect(areaRoute('chalk')).toEqual({ to: 'chalkboard' });
    expect(areaRoute('exit')).toEqual({ to: 'map' });
  });

  it('hit-tests the hotspots (centres hit their own area, the bare floor hits nothing)', () => {
    for (const id of BASE_AREA_IDS) {
      const h = A(id).hot;
      expect(areaAt({ x: h.x + h.w / 2, y: h.y + h.h / 2 })).toBe(id);
    }
    expect(areaAt({ x: 640, y: 700 })).toBeNull();
    expect(areaAt({ x: -5, y: 300 })).toBeNull();
  });
});

describe('Hangar base navigation', () => {
  it('← / → step through the left-to-right order and stop at the ends', () => {
    expect(neighbour('fun', 'right')).toBe('tv');
    expect(neighbour('tv', 'right')).toBe('locker');
    expect(neighbour('tv', 'left')).toBe('fun');
    expect(neighbour('locker', 'right')).toBe('photos');
    expect(neighbour('photos', 'right')).toBe('jet');
    expect(neighbour('jet', 'right')).toBe('ladder');
    expect(neighbour('ladder', 'left')).toBe('jet');
    expect(neighbour('ladder', 'right')).toBe('chalk');
    expect(neighbour('chalk', 'right')).toBe('exit');
    expect(neighbour('exit', 'right')).toBe('exit');
    expect(neighbour('exit', 'left')).toBe('chalk');
    expect(neighbour('locker', 'left')).toBe('tv');
    expect(neighbour('fun', 'left')).toBe('fun');
  });

  it('↑ / ↓ go to the nearest area in any row above / below (wall, chalkboard, floor; a tie: the nearer row)', () => {
    const up: Partial<Record<BaseAreaId, BaseAreaId>> = {
      fun: 'photos', tv: 'photos', locker: 'photos', photos: 'photos', jet: 'chalk', ladder: 'ladder', chalk: 'ladder', exit: 'chalk',
    };
    const down: Partial<Record<BaseAreaId, BaseAreaId>> = {
      fun: 'fun', tv: 'tv', locker: 'locker', photos: 'locker', jet: 'jet', ladder: 'chalk', chalk: 'jet', exit: 'exit',
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
    let w = walkTo(walkerAt(A('fun').standX), A('locker').standX);
    expect(w.moving).toBe(true);
    w = stepWalker(w, 0.5, 300);
    expect(w.x).toBeCloseTo(A('fun').standX + 150, 6);
    expect(w.facing).toBe(1);
    const done = walkUntilStopped(w, 300);
    expect(done.w.x).toBe(A('locker').standX);
    expect(done.w.moving).toBe(false);
    expect(arrivedAt(done.w, 'locker')).toBe(true);
    expect(done.w.dist).toBeCloseTo(A('locker').standX - A('fun').standX, 6);
  });

  it('turns round when sent back the other way, and hurrying is faster', () => {
    const start = walkTo(walkerAt(A('exit').standX), A('fun').standX);
    const slow = walkUntilStopped(start, 300);
    const fast = walkUntilStopped(start, 900);
    expect(slow.w.facing).toBe(-1);
    expect(fast.frames).toBeLessThan(slow.frames / 2);
    expect(fast.w.x).toBe(A('fun').standX);
  });

  it('cycles through the walk key frames with the distance', () => {
    const w = walkerAt(0);
    expect(walkFrame(w)).toBe(0);
    expect(walkFrame({ ...w, dist: STRIDE_PX / WALK_FRAMES })).toBe(1);
    expect(walkFrame({ ...w, dist: STRIDE_PX })).toBe(0);
    expect(walkFrame({ ...w, dist: STRIDE_PX * 2.5 })).toBe(WALK_FRAMES / 2);
  });

  it('walks into the room up a lane and back out of it, at half pace in depth (doc 92)', () => {
    const FRONT = 640;
    let w = walkTo(walkerAt(200), 900, 512, 750);
    expect(w.path).toEqual([[750, FRONT], [750, 512], [900, 512]]);
    w = walkUntilStopped(w, 300).w;
    expect([w.x, w.y, w.lane, w.moving]).toEqual([900, 512, 750, false]);
    expect(w.dist).toBeCloseTo(550 + 128 + 150, 6);
    const up = stepWalker(walkTo(walkerAt(750), 750, 512), 0.1, 300);
    expect(up.y).toBeCloseTo(FRONT - 15, 6); // 300 px/s at half pace
    expect(up.facing).toBe(1);
    const back = walkTo(w, 1030);
    expect(back.path).toEqual([[750, 512], [750, FRONT], [1030, FRONT]]);
    const along = walkTo(w, 728, 556, 750);
    expect(along.path).toEqual([[750, 512], [750, 556], [728, 556]]); // same lane: no detour to the front line
  });

  it('walks straight across between spots on one row deeper in the room, also mid-walk (doc 92)', () => {
    const atLockers = walkTo(walkerAt(205, 1, 545, 205), 400, 545, 400);
    expect(atLockers.path).toEqual([[400, 545]]);
    expect(atLockers.lane).toBe(400); // the way back out runs down the lockers' lane
    const midway = walkTo(stepWalker(atLockers, 0.2, 300), 205, 545, 205);
    expect(midway.path).toEqual([[205, 545]]);
    const climbing = walkTo(stepWalker(walkTo(walkerAt(400), 400, 545), 0.1, 300), 205, 545, 205);
    expect(climbing.path).toEqual([[400, 640], [205, 640], [205, 545]]); // on the way up, not yet on the row: back out
  });
});

import { describe, expect, it } from 'vitest';
import { createDocking, DOCK, DOCKING_MEDALS, dockPoints, portAt, stepDocking, type DockState } from '../../src/game/minigames/docking';

// STATION DOCKING (doc 89): thrusters, inertia, a port to hit slowly and centred; three dockings.

const DT = 1 / 60;

/** A careful pilot: burn right to a cruise speed, coast, brake before the face, follow the port up and down. */
function careful(s: DockState): { x: number; y: number } {
  const want = s.x < DOCK.face - 220 ? 70 : 12;
  const x = s.vx < want - 2 ? 1 : s.vx > want + 2 ? -1 : 0;
  const dy = s.portY - s.y;
  const wantVy = Math.max(-40, Math.min(40, dy * 1.2));
  const y = s.vy < wantVy - 2 ? 1 : s.vy > wantVy + 2 ? -1 : 0;
  return { x, y };
}

function play(pilot: (s: DockState) => { x: number; y: number }): DockState {
  let s = createDocking();
  for (let i = 0; i < 60 * 60 * 4 && !s.over; i++) s = stepDocking(s, pilot(s), DT);
  return s;
}

describe('station docking (doc 89)', () => {
  it('keeps drifting without thrust: nothing slows the shuttle', () => {
    let s: DockState = { ...createDocking(), vx: 20 };
    for (let i = 0; i < 60; i++) s = stepDocking(s, { x: 0, y: 0 }, DT);
    expect(s.vx).toBe(20);
    expect(s.x).toBeCloseTo(DOCK.start.x + 20, 3);
    expect(s.fuel).toBe(DOCK.fuel);
  });

  it('burns fuel while thrusting and stops pushing when it is gone', () => {
    let s: DockState = { ...createDocking(), fuel: 1 };
    for (let i = 0; i < 60; i++) s = stepDocking(s, { x: 1, y: 0 }, DT);
    expect(s.fuel).toBe(0);
    expect(s.vx).toBeLessThan(DOCK.accel * 0.2);
  });

  it('docks a careful pilot three times for a gold, and crashes a reckless one', () => {
    const good = play(careful);
    expect(good.over).toBe(true);
    expect(good.results.every((r) => r > 0)).toBe(true);
    expect(good.points).toBeGreaterThanOrEqual(DOCKING_MEDALS.gold);
    const reckless = play(() => ({ x: 1, y: 0 }));
    expect(reckless.points).toBe(0);
  });

  it('scores slow, centred, quick and frugal dockings higher', () => {
    expect(dockPoints(10, 0, 10, 80)).toBeGreaterThan(dockPoints(30, 0, 10, 80));
    expect(dockPoints(10, 0, 10, 80)).toBeGreaterThan(dockPoints(10, 15, 10, 80));
    expect(dockPoints(10, 0, 10, 80)).toBeGreaterThan(dockPoints(10, 0, 25, 80));
    expect(portAt(0, 5)).toBe(388);
    expect(portAt(2, 3)).not.toBe(388);
  });
});

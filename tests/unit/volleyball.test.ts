import { describe, expect, it } from 'vitest';
import {
  apexOf, drive, flyBall, isIn, landingX, lob, netCrossHeight, timeToHeight, VB, xAt, yAt, type Ball,
} from '../../src/game/minigames/volleyball-ball';
import {
  BODY_RULES as BR, jumpAthlete, makeAthlete, runAthlete, startDive, startSwing, swingLive, tickSwing, type Athlete,
} from '../../src/game/minigames/volleyball-athlete';
import {
  AIM_DIST, airDist, blocks, contactQuality, deflect, diveDir, groundDist, HIT, REACH, strike, type Strike,
} from '../../src/game/minigames/volleyball-hit';

const DT = 1 / 60;
const fly = (b: Ball, seconds: number): Ball => {
  let out = b;
  for (let i = 0; i < Math.round(seconds * 60); i++) out = flyBall(out, DT).ball;
  return out;
};
const landsAt = (b: Ball): number => landingX(b);
const at = (a: Athlete, patch: Partial<Athlete>): Athlete => ({ ...a, ...patch });
const S = (patch: Partial<Strike>): Strike => ({ kind: 'pass', x: -4, y: 1, dir: 1, aim: 'mid', acc: 1, target: -1.3, ...patch });

describe('Beach Volleyball — ball', () => {
  it('flies an exact parabola away from the net', () => {
    const b: Ball = { x: -6, y: 1, vx: 1.5, vy: 6 };
    const after = fly(b, 0.75);
    expect(after.x).toBeCloseTo(xAt(b, 0.75), 9);
    expect(after.y).toBeCloseTo(yAt(b, 0.75), 9);
    expect(after.vy).toBeCloseTo(6 - VB.g * 0.75, 9);
  });

  it('times the way down through a height and knows the apex', () => {
    const b: Ball = { x: 0, y: 2, vx: 0, vy: 5 };
    expect(apexOf(b)).toBeCloseTo(2 + 25 / (2 * VB.g), 9);
    const t = timeToHeight(b, 1) ?? -1;
    expect(t).toBeGreaterThan(5 / VB.g);
    expect(yAt(b, t)).toBeCloseTo(1, 9);
    expect(timeToHeight(b, 10)).toBeNull();
  });

  it('predicts the landing x where the ball centre reaches its radius', () => {
    const b: Ball = { x: 2, y: 3, vx: 2, vy: 1 };
    const t = timeToHeight(b, VB.ballR) ?? 0;
    expect(landingX(b)).toBeCloseTo(2 + 2 * t, 9);
  });

  it('lob() peaks at the apex and comes down through the target point', () => {
    const b = lob(-4, 1, -1.3, 2, 4.3);
    expect(apexOf(b)).toBeCloseTo(4.3, 6);
    const t = timeToHeight(b, 2) ?? 0;
    expect(xAt(b, t)).toBeCloseTo(-1.3, 6);
  });

  it('drive() lands on the target with the given horizontal speed', () => {
    const b = drive(-1, 3.2, 3.6, 14);
    expect(b.vx).toBeCloseTo(14, 9);
    expect(landsAt(b)).toBeCloseTo(3.6, 6);
  });

  it('knows the height at which a ball crosses the net plane', () => {
    const b = drive(-1, 3.2, 3.6, 14);
    const h = netCrossHeight(b) ?? 0;
    expect(h).toBeCloseTo(yAt(b, 1 / 14), 9);
    expect(netCrossHeight({ x: 2, y: 2, vx: 3, vy: 0 })).toBeNull(); // moving away from the net
  });

  it('bounces a low ball off the side of the net back to its own side', () => {
    let b: Ball = { x: -1, y: 1.2, vx: 8, vy: 0.5 };
    let net = false;
    for (let i = 0; i < 60 && b.y > VB.ballR; i++) {
      const r = flyBall(b, DT);
      net = net || r.net;
      b = r.ball;
    }
    expect(net).toBe(true);
    expect(b.x).toBeLessThan(0);
    expect(Math.abs(b.vx)).toBeLessThan(8 * 0.3);
  });

  it('lets a ball over the tape pass and makes a tape clip pop up', () => {
    const high = fly({ x: -1, y: 3.2, vx: 6, vy: 0 }, 0.4);
    expect(high.x).toBeGreaterThan(0);
    const r = flyBall({ x: -0.16, y: VB.netH + 0.06, vx: 2, vy: -0.2 }, DT);
    expect(r.net).toBe(true);
    expect(r.ball.vy).toBeGreaterThan(-0.2);
  });

  it('counts a ball touching the line as in', () => {
    expect(isIn(VB.half)).toBe(true);
    expect(isIn(-VB.half - VB.ballR)).toBe(true);
    expect(isIn(VB.half + VB.ballR + 0.01)).toBe(false);
  });
});

describe('Beach Volleyball — reach and quality', () => {
  const you = makeAthlete('you', -3);

  it('measures the ground zone as a capsule in front of the body', () => {
    expect(groundDist(you, { x: -3 + REACH.ground.ahead, y: 1.2, vx: 0, vy: 0 })).toBeCloseTo(0, 9);
    expect(groundDist(you, { x: -3 + REACH.ground.ahead, y: REACH.ground.high + 0.5, vx: 0, vy: 0 })).toBeCloseTo(0.5, 9);
    expect(groundDist(you, { x: -3 + REACH.ground.ahead + 0.6, y: 1, vx: 0, vy: 0 })).toBeCloseTo(0.6, 9);
  });

  it('measures the air zone above the head, moving with the jump', () => {
    const up = at(you, { y: 0.9 });
    const centre = { x: -3 + REACH.air.ahead, y: 0.9 + REACH.air.up, vx: 0, vy: 0 };
    expect(airDist(up, centre)).toBeCloseTo(0, 9);
    expect(airDist(you, centre)).toBeCloseTo(0.9, 9);
  });

  it('rates contact 1 at the centre, 0 at the edge (square fall-off), less on a hard ball', () => {
    expect(contactQuality(0, 0.75, 0)).toBe(1);
    expect(contactQuality(0.75, 0.75, 0)).toBe(0);
    expect(contactQuality(0.375, 0.75, 0)).toBeCloseTo(0.75, 9);
    expect(contactQuality(0, 0.75, HIT.hardFrom)).toBe(1);
    expect(contactQuality(0, 0.75, HIT.hardFrom + HIT.hardSpan)).toBeCloseTo(1 - HIT.hardMax, 9);
    expect(contactQuality(0, 0.75, 40)).toBeCloseTo(1 - HIT.hardMax, 9);
  });

  it('offers a dive towards a low ball just out of reach, not to one in reach or high', () => {
    expect(diveDir(you, { x: -1.4, y: 0.5, vx: 0, vy: -3 })).toBe(1);
    expect(diveDir(you, { x: -4.8, y: 0.5, vx: 0, vy: -3 })).toBe(-1);
    expect(diveDir(you, { x: -2.7, y: 0.5, vx: 0, vy: -3 })).toBe(0); // in reach already
    expect(diveDir(you, { x: -1.4, y: 1.8, vx: 0, vy: -3 })).toBe(0); // too high
    expect(diveDir(you, { x: 0.5, y: 0.5, vx: 0, vy: -3 })).toBe(0); // too far
  });

  it('blocks only in the air near the net, between the tape and the fingertips', () => {
    const blocker = at(makeAthlete('breaker', 0.4), { y: 0.8, vy: 0 });
    expect(blocks(blocker, 2.7)).toBe(true);
    expect(blocks(blocker, 0.8 + REACH.block.top - 0.01)).toBe(true);
    expect(blocks(blocker, 0.8 + REACH.block.top + 0.05)).toBe(false);
    expect(blocks(at(blocker, { y: 0 }), 2.4)).toBe(false);
    expect(blocks(at(blocker, { x: 1.5 }), 2.7)).toBe(false);
  });

  it('stuffs a spike back to the attackers, a fingertip touch pops up on the blocking side', () => {
    const spike: Ball = { x: 0, y: 2.7, vx: 14, vy: -8 };
    const stuff = deflect(spike, 2.7, 3.2);
    expect(stuff.vx).toBeLessThan(0);
    expect(stuff.x).toBeLessThan(0);
    const soft = deflect(spike, 3.2 - REACH.block.soft / 2, 3.2);
    expect(soft.vx).toBeGreaterThan(0);
    expect(soft.vy).toBeGreaterThan(0);
  });
});

describe('Beach Volleyball — strikes', () => {
  it('passes a perfect touch to the target at the receiving height', () => {
    const b = strike(S({ kind: 'pass', target: -1.3 }), 0.9, 0.1);
    const t = timeToHeight(b, 2) ?? 0;
    expect(xAt(b, t)).toBeCloseTo(-1.3, 6);
    expect(apexOf(b)).toBeCloseTo(4.3, 6);
  });

  it('spreads a poor pass with (1 − acc)² and shanks below 0.2 behind the hitter', () => {
    const err = (acc: number): number => Math.abs(xAt(strike(S({ acc }), 1, 0.5), timeToHeight(strike(S({ acc }), 1, 0.5), 2) ?? 0) + 1.3);
    expect(err(0.9)).toBeLessThan(0.05);
    expect(err(0.5)).toBeGreaterThan(0.5);
    const shank = strike(S({ acc: 0.1 }), 0.5, 0.5);
    expect(landingX(shank)).toBeLessThan(-4);
  });

  it('sets high to the attack spot', () => {
    const b = strike(S({ kind: 'set', x: -1.3, y: 2.1, target: -2.2 }), 0.5, 0.5);
    expect(apexOf(b)).toBeCloseTo(5.2, 6);
    expect(xAt(b, timeToHeight(b, 3.1) ?? 0)).toBeCloseTo(-2.2, 6);
  });

  it('spikes a perfect hit over the tape to the aimed depth', () => {
    for (const aim of ['mid', 'deep'] as const) {
      const b = strike(S({ kind: 'spike', x: -1, y: 3.3, aim }), 0.5, 0.5);
      expect(netCrossHeight(b) ?? 0).toBeGreaterThan(VB.netH + VB.ballR);
      expect(landingX(b)).toBeCloseTo(AIM_DIST[aim], 1);
      expect(b.vx).toBeCloseTo(HIT.spikeBase + HIT.spikeGain, 6);
    }
  });

  it('puts a mishit spike into the net and lands a poor one long or short, still over the tape', () => {
    const mishit = strike(S({ kind: 'spike', x: -1, y: 3.3, acc: 0.1 }), 0.5, 0.5);
    expect(netCrossHeight(mishit) ?? 99).toBeLessThan(VB.netH);
    const long = strike(S({ kind: 'spike', x: -1, y: 3.3, acc: 0.4 }), 0.99, 0.5);
    expect(landingX(long)).toBeGreaterThan(AIM_DIST.mid + 0.8);
    const short = strike(S({ kind: 'spike', x: -1, y: 3.3, acc: 0.4 }), 0.01, 0.5);
    expect(netCrossHeight(short) ?? 0).toBeGreaterThan(VB.netH + VB.ballR);
  });

  it('pushes a spike from deep in the court further back until it clears', () => {
    const b = strike(S({ kind: 'spike', x: -4.5, y: 3.2, aim: 'mid' }), 0.5, 0.5);
    expect(netCrossHeight(b) ?? 0).toBeGreaterThan(VB.netH + VB.ballR);
    expect(isIn(landingX(b))).toBe(true);
  });

  it('tips softly over the block to the short zone', () => {
    const b = strike(S({ kind: 'tip', x: -1, y: 3.3, aim: 'short' }), 0.5, 0.5);
    expect(netCrossHeight(b) ?? 0).toBeGreaterThan(3.5);
    expect(landingX(b)).toBeCloseTo(AIM_DIST.short, 1);
  });

  it('lobs a third ground touch over the net', () => {
    const b = strike(S({ kind: 'lob', x: -3, y: 1, aim: 'deep' }), 0.5, 0.5);
    expect(netCrossHeight(b) ?? 0).toBeGreaterThan(VB.netH + VB.ballR);
    expect(landingX(b)).toBeCloseTo(AIM_DIST.deep, 1);
  });

  it('serves over the net from the baseline; a mistimed serve goes into the net', () => {
    const good = strike(S({ kind: 'serve', x: -7.5, y: 2.55, aim: 'mid' }), 0.5, 0.5);
    expect(netCrossHeight(good) ?? 0).toBeGreaterThan(VB.netH + VB.ballR);
    expect(isIn(landingX(good))).toBe(true);
    const bad = strike(S({ kind: 'serve', x: -7.5, y: 2.55, acc: 0.1 }), 0.5, 0.5);
    expect(netCrossHeight(bad) ?? 99).toBeLessThan(VB.netH);
  });

  it('works mirrored for the other team', () => {
    const b = strike(S({ kind: 'spike', x: 1, y: 3.3, dir: -1, aim: 'mid' }), 0.5, 0.5);
    expect(landingX(b)).toBeCloseTo(-AIM_DIST.mid, 1);
  });
});

describe('Beach Volleyball — athletes', () => {
  it('runs at most at run speed and stays on its own side', () => {
    let a = makeAthlete('you', -2);
    for (let i = 0; i < 120; i++) a = runAthlete(a, BR.run * 2, DT);
    expect(a.x).toBeCloseTo(-BR.minGap, 9);
    let b = makeAthlete('breaker', 2);
    for (let i = 0; i < 30; i++) b = runAthlete(b, BR.run, DT);
    expect(b.vx).toBeLessThanOrEqual(BR.run + 1e-9);
  });

  it('jumps about 0.96 m high for about 0.8 s', () => {
    let a = jumpAthlete(makeAthlete('you', -2));
    let top = 0;
    let ticks = 0;
    while (a.y > 0 || ticks === 0) {
      a = runAthlete(a, 0, DT);
      top = Math.max(top, a.y);
      ticks++;
    }
    expect(top).toBeCloseTo(BR.jumpV ** 2 / (2 * BR.g), 1);
    expect(ticks / 60).toBeCloseTo((2 * BR.jumpV) / BR.g, 1);
    expect(jumpAthlete(at(a, { y: 0.5, vy: 1 })).vy).toBe(1); // no double jump
  });

  it('swings for the active window, then recovers before the next swing', () => {
    let a = startSwing(makeAthlete('you', -2), 'ground', 'mid');
    expect(swingLive(a)).toBe(true);
    for (let i = 0; i < Math.ceil(BR.swingActive * 60) + 1; i++) a = tickSwing(a, DT);
    expect(swingLive(a)).toBe(false);
    expect(startSwing(a, 'ground', 'mid')).toBe(a); // still recovering
    for (let i = 0; i < Math.ceil(BR.swingRecover * 60) + 1; i++) a = tickSwing(a, DT);
    expect(swingLive(startSwing(a, 'ground', 'mid'))).toBe(true);
  });

  it('dives towards the ball, slides and lies in the sand for a moment', () => {
    let a = startDive(makeAthlete('you', -4), 1);
    const x0 = a.x;
    for (let i = 0; i < 20; i++) a = runAthlete(a, -BR.run, DT);
    expect(a.x).toBeGreaterThan(x0 + 0.5);
    expect(a.dive).toBeGreaterThan(0);
    for (let i = 0; i < Math.ceil(BR.diveTime * 60); i++) a = runAthlete(a, 0, DT);
    expect(a.dive).toBe(0);
    expect(jumpAthlete(startDive(makeAthlete('you', -4), 1)).vy).toBe(0); // can't jump out of a dive
  });
});

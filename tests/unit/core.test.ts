import { describe, it, expect } from 'vitest';
import { computeViewport, toLogical } from '../../src/core/canvas';
import { FixedStepper } from '../../src/core/loop';
import { createRng } from '../../src/core/rng';
import { ActionState } from '../../src/core/input';

describe('Game Core', () => {
  describe('computeViewport', () => {
    it('scales 1280x720 into a wider window with side letterbox', () => {
      const vp = computeViewport(1920, 720, 2);
      expect(vp.scale).toBe(1);
      expect(vp.offsetX).toBe(320);
      expect(vp.offsetY).toBe(0);
      expect(vp.dpr).toBe(2);
    });

    it('scales into a taller window with top/bottom letterbox', () => {
      const vp = computeViewport(640, 720, 1);
      expect(vp.scale).toBe(0.5);
      expect(vp.offsetX).toBe(0);
      expect(vp.offsetY).toBe(180);
    });

    it('maps a screen point back to logical coordinates', () => {
      const vp = computeViewport(1920, 720, 1);
      expect(toLogical(vp, 320, 0)).toEqual({ x: 0, y: 0 });
      expect(toLogical(vp, 960, 360)).toEqual({ x: 640, y: 360 });
      expect(toLogical(vp, 1600, 720)).toEqual({ x: 1280, y: 720 });
    });
  });

  describe('FixedStepper', () => {
    it('runs one update per 1/60 s of accumulated time', () => {
      const s = new FixedStepper(1 / 60, 5);
      expect(s.advance(1 / 60)).toBe(1);
      expect(s.advance(1 / 120)).toBe(0);
      expect(s.advance(1 / 120)).toBe(1);
      expect(s.advance(3 / 60)).toBe(3);
    });

    it('caps updates per frame and drops excess time (spiral-of-death guard)', () => {
      const s = new FixedStepper(1 / 60, 5);
      expect(s.advance(2)).toBe(5);
      expect(s.advance(0)).toBe(0);
      expect(s.advance(-1)).toBe(0);
    });
  });

  describe('createRng', () => {
    it('produces the same sequence for the same seed', () => {
      const a = createRng(42);
      const b = createRng(42);
      const c = createRng(43);
      const seqA = Array.from({ length: 5 }, () => a.next());
      const seqB = Array.from({ length: 5 }, () => b.next());
      const seqC = Array.from({ length: 5 }, () => c.next());
      expect(seqA).toEqual(seqB);
      expect(seqA).not.toEqual(seqC);
    });

    it('produces values in [0, 1)', () => {
      const r = createRng(7);
      for (let i = 0; i < 2000; i++) {
        const v = r.next();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
      const ints = new Set(Array.from({ length: 500 }, () => r.int(1, 3)));
      expect([...ints].sort()).toEqual([1, 2, 3]);
    });
  });

  describe('InputState', () => {
    it('reports pressed only on the first tick after key down', () => {
      const s = new ActionState();
      s.press('key:Space', ['fire', 'confirm']);
      s.tick();
      expect(s.pressed('fire')).toBe(true);
      expect(s.pressed('confirm')).toBe(true);
      expect(s.held('fire')).toBe(true);
      s.press('key:Space', ['fire', 'confirm']); // auto-repeat must not re-latch
      s.tick();
      expect(s.pressed('fire')).toBe(false);
      expect(s.held('fire')).toBe(true);
      s.release('key:Space');
      s.tick();
      expect(s.held('fire')).toBe(false);
    });
  });
});

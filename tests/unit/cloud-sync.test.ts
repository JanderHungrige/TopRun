import { afterEach, describe, expect, it, vi } from 'vitest';
import { CloudSync, type CloudUpload } from '../../src/core/cloud-sync';
import { defaultSave } from '../../src/game/save';

const base: CloudUpload = { id: 'p_0123456789abcdefghijkl', secret: 's'.repeat(43), save: { ...defaultSave(), money: 10 } };

function setup(ok = true) {
  let current: CloudUpload | null = base;
  const order: string[] = [];
  const sync = new CloudSync(
    () => current,
    () => { order.push('ladder'); return Promise.resolve(); },
    (id) => { order.push(`save:${id}`); return Promise.resolve(ok); },
    100,
  );
  return { sync, order, set: (u: CloudUpload | null) => { current = u; } };
}

afterEach(() => vi.useRealTimers());

describe('Cloud sync (doc 34)', () => {
  it('debounces pokes and uploads after the ladder post', async () => {
    vi.useFakeTimers();
    const { sync, order } = setup();
    sync.poke();
    sync.poke();
    await vi.advanceTimersByTimeAsync(150);
    expect(order).toEqual(['ladder', `save:${base.id}`]);
  });

  it('uploads only changed saves, retries a failed one, and nothing while not shared', async () => {
    const { sync, order, set } = setup();
    expect(await sync.flush()).toBe(true);
    expect(await sync.flush()).toBe(true);
    expect(order.filter((o) => o.startsWith('save'))).toHaveLength(1);
    set({ ...base, save: { ...base.save, money: 20 } });
    await sync.flush();
    expect(order.filter((o) => o.startsWith('save'))).toHaveLength(2);
    set(null);
    expect(await sync.flush()).toBe(false);
    const failing = setup(false);
    expect(await failing.sync.flush()).toBe(false);
    expect(await failing.sync.flush()).toBe(false);
    expect(failing.order.filter((o) => o.startsWith('save'))).toHaveLength(2);
  });
});

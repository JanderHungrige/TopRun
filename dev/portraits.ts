// Dev-only portrait preview: http://localhost:5173/dev/portraits.html (not part of the production build).
// #<id> focuses one character: its three sizes plus every mood and every gesture side by side.
// #loupe renders every character at 90×108 at 1× and enlarges it 2× (nearest neighbour) to judge the smallest size.
// &mood= &gesture= &mouth= &radio=0|1 in the hash pin those values; ?t=<seconds> freezes time for screenshots.
import { drawPortrait, type CharacterId, type Gesture, type Mood, type PortraitState } from '../src/render/portraits';

const IDS: readonly CharacterId[] = ['admiral', 'chief', 'shooter', 'wingman'];
const MOODS: readonly Mood[] = ['neutral', 'happy', 'stern', 'worried'];
const GESTURES: readonly Gesture[] = ['none', 'thumbsUp', 'point', 'salute', 'facepalm'];
const SIZES: readonly (readonly [number, number])[] = [[90, 108], [140, 168], [260, 312]];
const W = 1280;
const H = 780;

const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const dpr = window.devicePixelRatio || 1;
canvas.width = W * dpr;
canvas.height = H * dpr;
canvas.style.width = `${W}px`;
canvas.style.height = `${H}px`;

interface View { loupe: boolean; id: CharacterId | null; mood: Mood | null; gesture: Gesture | null; mouth: number | null; radio: boolean | null }

const LOUPE_ROWS: readonly Partial<PortraitState>[] = [
  { mood: 'neutral', gesture: 'none', mouth: 0 },
  { mood: 'happy', gesture: 'thumbsUp', mouth: 0.6 },
  { mood: 'stern', gesture: 'point', mouth: 0.3 },
];
const small = document.createElement('canvas');
small.width = 90;
small.height = 108;
const sctx = small.getContext('2d') as CanvasRenderingContext2D;

const pick = <T extends string>(list: readonly T[], v: string | null): T | null => list.find((x) => x === v) ?? null;
const cycle = <T>(list: readonly T[], i: number): T => list[((Math.floor(i) % list.length) + list.length) % list.length] as T;

function parseView(): View {
  const [head = '', ...rest] = location.hash.replace(/^#/, '').split('&');
  const q = new URLSearchParams(rest.join('&'));
  const mouth = q.get('mouth');
  const radio = q.get('radio');
  return {
    loupe: head === 'loupe',
    id: pick(IDS, head),
    mood: pick(MOODS, q.get('mood')),
    gesture: pick(GESTURES, q.get('gesture')),
    mouth: mouth === null ? null : Number(mouth),
    radio: radio === null ? null : radio === '1',
  };
}

const frozenParam = new URLSearchParams(location.search).get('t');
const frozen = frozenParam === null ? null : Number(frozenParam);
const t0 = performance.now();
let radioToggle: boolean | null = null;

/** Syllable-ish mouth flaps in 2.6 s phrases with short pauses. */
function talk(t: number): number {
  if (((t % 3.6) + 3.6) % 3.6 > 2.6) return 0;
  return Math.max(0, Math.sin(t * 13) * 0.6 + Math.sin(t * 7.3) * 0.4);
}

function state(id: CharacterId, t: number, i: number, v: View, over: Partial<PortraitState> = {}): PortraitState {
  return {
    t,
    mouth: v.mouth ?? talk(t + i * 1.3),
    mood: v.mood ?? cycle(MOODS, t / 2.5 + i),
    gesture: v.gesture ?? cycle(GESTURES, t / 3.5 + i * 2),
    radio: v.radio ?? radioToggle ?? id === 'wingman',
    ...over,
  };
}

function portrait(id: CharacterId, x: number, y: number, w: number, h: number, s: PortraitState, label: string): void {
  drawPortrait(ctx, id, { x, y, w, h }, s);
  ctx.strokeStyle = 'rgba(160,190,220,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
  ctx.fillStyle = '#cfd8e3';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y + h + 14);
}

/** One character at the three sizes, bottom-aligned, starting at (x, baseline - 312). */
function sizesRow(id: CharacterId, x: number, base: number, t: number, i: number, v: View): void {
  const s = state(id, t, i, v);
  let cx = x;
  for (const [w, h] of SIZES) {
    portrait(id, cx, base - h, w, h, s, `${w}×${h}`);
    if (w === 90) ctx.fillText(`${id} · ${s.mood} · ${s.gesture}`, cx, base - h - 8);
    cx += w + 14;
  }
}

function overview(t: number, v: View): void {
  IDS.forEach((id, i) => sizesRow(id, 40 + (i % 2) * 610, 340 + Math.floor(i / 2) * 375, t, i, v));
}

function focus(id: CharacterId, t: number, v: View): void {
  sizesRow(id, 40, 330, t, 0, v);
  MOODS.forEach((mood, i) => portrait(id, 580 + i * 170, 20, 140, 168, state(id, t, 0, v, { mood }), mood));
  GESTURES.forEach((gesture, i) => portrait(id, 40 + i * 170, 380, 140, 168, state(id, t, 0, v, { gesture }), gesture));
  const mouths = [0, 0.35, 0.7, 1];
  mouths.forEach((mouth, i) => portrait(id, 40 + i * 120, 590, 90, 108, state(id, t, 0, v, { mouth }), `mouth ${mouth}`));
  portrait(id, 540, 590, 90, 108, state(id, t, 0, v, { radio: !(v.radio ?? radioToggle ?? id === 'wingman') }), 'radio flip');
  portrait(id, 660, 590, 150, 108, state(id, t, 0, v), 'wide box');
  portrait(id, 840, 560, 90, 138, state(id, t, 0, v), 'tall box');
}

function loupe(t: number, v: View): void {
  ctx.imageSmoothingEnabled = false;
  IDS.forEach((id, col) => LOUPE_ROWS.forEach((row, r) => {
    const s = state(id, t, col, v, { mood: v.mood ?? row.mood, gesture: v.gesture ?? row.gesture, mouth: v.mouth ?? row.mouth });
    sctx.clearRect(0, 0, 90, 108);
    drawPortrait(sctx, id, { x: 0, y: 0, w: 90, h: 108 }, s);
    ctx.drawImage(small, 20 + col * 192, 10 + r * 240, 180, 216);
    ctx.fillStyle = '#cfd8e3';
    ctx.fillText(`${id} · ${s.mood} · ${s.gesture}`, 20 + col * 192, 240 + r * 240);
  }));
  ctx.imageSmoothingEnabled = true;
}

function render(t: number): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0d1520';
  ctx.fillRect(0, 0, W, H);
  const v = parseView();
  ctx.font = '11px system-ui, sans-serif';
  if (v.loupe) loupe(t, v);
  else if (v.id) focus(v.id, t, v);
  else overview(t, v);
  ctx.fillStyle = '#7f93a8';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(`t = ${t.toFixed(2)} s`, W - 90, H - 10);
}

const now = (): number => frozen ?? (performance.now() - t0) / 1000;
function tick(): void {
  render(now());
  if (frozen === null) requestAnimationFrame(tick);
}
tick(); // renders immediately, even when rAF is throttled in a background tab
window.addEventListener('hashchange', () => render(now()));
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() !== 'r') return;
  radioToggle = !(radioToggle ?? false);
  render(now());
});
(window as unknown as { __portraits: { render: (t: number) => void } }).__portraits = { render };

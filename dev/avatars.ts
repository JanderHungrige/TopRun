// Dev-only avatar preview: http://localhost:5173/dev/avatars.html (not part of the production build).
// One column per avatar: 240×288, 120×144 and 56×66 (unselected + selected), cycling moods, talking and blinking,
// plus the 56×66 size rendered at 1× and enlarged 3× (nearest neighbour) to judge the smallest size honestly.
// Hash pins values (#mood=happy&mouth=0.5&selected=1); ?t=<seconds> freezes time for screenshots.
import type { AvatarId } from '../src/game/profiles';
import { AVATAR_COLORS, drawAvatar, type AvatarState } from '../src/render/avatars';
import type { Mood } from '../src/render/portraits';

const IDS: readonly AvatarId[] = ['pilot1', 'pilot2', 'pilot3'];
const MOODS: readonly Mood[] = ['neutral', 'happy', 'stern', 'worried'];
const W = 900;
const H = 830;

const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const dpr = window.devicePixelRatio || 1;
canvas.width = W * dpr;
canvas.height = H * dpr;
canvas.style.width = `${W}px`;
canvas.style.height = `${H}px`;
const small = document.createElement('canvas');
small.width = 56;
small.height = 66;
const sctx = small.getContext('2d') as CanvasRenderingContext2D;

interface View { mood: Mood | null; mouth: number | null; selected: boolean | null }

function parseView(): View {
  const q = new URLSearchParams(location.hash.replace(/^#/, ''));
  const mouth = q.get('mouth');
  const sel = q.get('selected');
  return {
    mood: MOODS.find((m) => m === q.get('mood')) ?? null,
    mouth: mouth === null ? null : Number(mouth),
    selected: sel === null ? null : sel === '1',
  };
}

const frozenParam = new URLSearchParams(location.search).get('t');
const frozen = frozenParam === null ? null : Number(frozenParam);
const t0 = performance.now();

/** Syllable-ish mouth flaps in 2.6 s phrases with short pauses. */
function talk(t: number): number {
  if (((t % 3.6) + 3.6) % 3.6 > 2.6) return 0;
  return Math.max(0, Math.sin(t * 13) * 0.6 + Math.sin(t * 7.3) * 0.4);
}

function state(t: number, i: number, v: View, over: Partial<AvatarState> = {}): AvatarState {
  return {
    t,
    mouth: v.mouth ?? talk(t + i * 1.3),
    mood: v.mood ?? MOODS[Math.floor(t / 2.5 + i) % MOODS.length] ?? 'neutral',
    selected: v.selected ?? false,
    ...over,
  };
}

function avatar(id: AvatarId, x: number, y: number, w: number, h: number, s: AvatarState, label: string): void {
  drawAvatar(ctx, id, { x, y, w, h }, s);
  ctx.strokeStyle = AVATAR_COLORS[id];
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
  ctx.fillStyle = '#cfd8e3';
  ctx.fillText(label, x, y + h + 13);
}

function column(id: AvatarId, i: number, t: number, v: View): void {
  const x = 30 + i * 290;
  const s = state(t, i, v);
  avatar(id, x, 14, 240, 288, { ...s, selected: v.selected ?? Math.floor(t / 2) % 2 === 0 }, `${id} · ${s.mood} · 240×288`);
  avatar(id, x, 324, 120, 144, s, '120×144');
  avatar(id, x + 130, 324, 120, 144, { ...s, selected: true }, 'selected');
  avatar(id, x, 492, 56, 66, s, '56×66');
  avatar(id, x + 66, 492, 56, 66, { ...s, selected: true }, 'sel');
  avatar(id, x + 132, 492, 56, 66, { ...s, mood: 'happy', mouth: 0 }, 'happy');
  avatar(id, x + 198, 492, 56, 66, { ...s, mood: 'worried', mouth: 0 }, 'worried');
  sctx.clearRect(0, 0, 56, 66);
  drawAvatar(sctx, id, { x: 0, y: 0, w: 56, h: 66 }, s);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, x, 590, 168, 198);
  ctx.imageSmoothingEnabled = true;
  ctx.fillText('56×66 at 1×, enlarged 3×', x, 590 + 198 + 13);
}

function render(t: number): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0d1520';
  ctx.fillRect(0, 0, W, H);
  ctx.font = '11px system-ui, sans-serif';
  const v = parseView();
  IDS.forEach((id, i) => column(id, i, t, v));
  ctx.fillStyle = '#7f93a8';
  ctx.fillText(`t = ${t.toFixed(2)} s`, W - 90, H - 8);
}

const now = (): number => frozen ?? (performance.now() - t0) / 1000;
function tick(): void {
  render(now());
  if (frozen === null) requestAnimationFrame(tick);
}
tick(); // renders immediately, even when rAF is throttled in a background tab
window.addEventListener('hashchange', () => render(now()));
(window as unknown as { __avatars: { render: (t: number) => void } }).__avatars = { render };

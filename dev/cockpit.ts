// Dev-only cockpit console preview: http://localhost:5173/dev/cockpit.html (not part of the production build).
// Renders the full 1280×720 mission frame at 1:1 with fake views cycling through every state every 3 s (four
// phases): button states, special ready/cooldown/active, all warning lamps, radar contacts with early warning on
// and off, boss present/absent/enraged, stores full/empty. ?x= pans the strip for the narrow browser pane,
// ?zoom= scales it, ?t= freezes time, ?phase= pins a phase, ?lang=de switches to long German labels.
import type { Contact } from '../src/game/cockpit';
import { drawLeftConsole, drawRightConsole } from '../src/render/cockpit';
import type { CockpitLabels, LeftConsoleView, RightConsoleView } from '../src/render/cockpit/types';

const EN: CockpitLabels = {
  radar: 'RADAR', early: 'EARLY WARN', hull: 'HULL', cannon: 'CANNON', power: 'POWER', stores: 'STORES', noStores: 'NO STORES',
  missile: 'MISSILE', switch: 'SWITCH', flare: 'FLARE', special: 'SPECIAL', pause: 'PAUSE', objective: 'OBJECTIVE', kills: 'KILLS',
  cash: 'CASH', route: 'ROUTE', empty: 'EMPTY', none: 'N/A', warnMissile: 'MISSILE', warnLowHull: 'LOW HULL', warnBoss: 'BOSS',
  warnPower: 'POWER', warnEcm: 'ECM', warnDmgCtrl: 'DMG CTRL',
};
const DE: CockpitLabels = {
  radar: 'RADAR', early: 'FRÜHWARN', hull: 'PANZERUNG', cannon: 'BORDKANONE', power: 'LEISTUNG', stores: 'AUSSENLASTEN',
  noStores: 'KEINE AUSSENLASTEN', missile: 'RAKETE', switch: 'WECHSELN', flare: 'TÄUSCHKÖRPER', special: 'SPEZIALMANÖVER',
  pause: 'PAUSE', objective: 'MISSIONSZIEL', kills: 'ABSCHÜSSE', cash: 'GUTHABEN', route: 'FLUGROUTE', empty: 'LEER', none: 'K. A.',
  warnMissile: 'RAKETE', warnLowHull: 'PANZERUNG', warnBoss: 'ENDGEGNER', warnPower: 'LEISTUNG', warnEcm: 'STÖRSENDER', warnDmgCtrl: 'SCHADENSK.',
};

const q = new URLSearchParams(location.search);
const num = (k: string): number | null => (q.get(k) === null ? null : Number(q.get(k)));
const frozen = num('t');
const pinned = num('phase');
const labels = q.get('lang') === 'de' ? DE : EN;
const zoom = num('zoom') ?? 1;

const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const dpr = (window.devicePixelRatio || 1) * zoom;
canvas.width = 1280 * dpr;
canvas.height = 720 * dpr;
canvas.style.width = '1280px';
canvas.style.height = '720px';
canvas.style.transform = `scale(${zoom}) translateX(${-(num('x') ?? 0)}px)`;

const pick = <T>(list: readonly T[], p: number): T => list[p % list.length] as T;

function contacts(t: number, p: number): Contact[] {
  const out: Contact[] = [];
  for (let i = 0; i < 5; i++) {
    const y = ((((t * 0.08 + i * 0.37) % 1.6) + 1.6) % 1.6) - 0.9;
    out.push({ x: Math.sin(i * 2.1) * 0.6, y, kind: i % 2 ? 'ground' : 'air' });
  }
  out.push({ x: Math.sin(t * 1.4) * 0.25, y: 0.3 - ((t * 0.3) % 0.3), kind: 'missile' });
  if (p >= 2) out.push({ x: 0.1, y: -0.55, kind: 'boss' });
  if (p % 2 === 1) for (let i = 0; i < 3; i++) out.push({ x: -0.5 + i * 0.45, y: -0.82 + i * 0.05, kind: 'upcoming' });
  return out;
}

const STORES: LeftConsoleView['stores'][] = [
  [{ id: 'aim9', short: 'AIM-9', ammo: 4, selected: true }, { id: 'rockets', short: 'ROCKETS', ammo: 10, selected: false }, { id: 'mk82', short: 'MK-82', ammo: 6, selected: false }],
  [{ id: 'agm65', short: 'AGM-65', ammo: 0, selected: true }],
  [],
  [
    { id: 'aim9', short: 'AIM-9', ammo: 6, selected: false }, { id: 'rockets', short: 'ROCKETS', ammo: 0, selected: false },
    { id: 'mk82', short: 'MK-82', ammo: 6, selected: false }, { id: 'agm65', short: 'AGM-65', ammo: 2, selected: false },
    { id: 'aim54', short: 'AIM-54', ammo: 2, selected: true },
  ],
];

function leftView(t: number, p: number): LeftConsoleView {
  const ratio = 0.5 + 0.5 * Math.sin(t * 0.6);
  return {
    plane: pick(['f14', 'f16', 'sr71'] as const, Math.floor(p / 2)), planeName: p < 2 ? 'F-14 TOMCAT' : 'F-16 FIGHTING FALCON',
    callsign: labels === DE ? 'KAMPFADLER' : 'MAVERICK',
    radar: { contacts: contacts(t, p), early: p % 2 === 1 },
    hull: { ratio, value: Math.round(ratio * 160), max: 160 },
    cannon: { level: p + 2, powered: p !== 1, powerRatio: 1 - ((t / 3) % 1) },
    stores: pick(STORES, p),
    buttons: { missile: pick(['ready', 'cooldown', 'empty', 'none'] as const, p), switch: p % 2 ? 'none' : 'ready' },
    keys: { missile: 'X', switch: 'C' },
    labels,
  };
}

function rightView(t: number, p: number): RightConsoleView {
  const special = pick([
    { state: 'ready' as const, progress: 1 }, { state: 'cooldown' as const, progress: (t / 3) % 1 },
    { state: 'active' as const, progress: 1 }, { state: 'cooldown' as const, progress: 0.25 },
  ], p);
  return {
    missionNumber: 7 + p, missionName: labels === DE ? 'STÄHLERNER VORHANG ÜBER DER NORDSEE' : 'IRON CURTAIN',
    objective: labels === DE ? 'Zerstöre alle Radarstationen entlang der Küste, bevor der Konvoi eintrifft.' : 'Destroy the radar sites along the coast.',
    progress: p === 2 ? null : { current: p + 2, required: 6 },
    kills: 12 + p * 7, cash: `$${(14250 + p * 1500).toLocaleString('en-US')}`, route: (t / 12) % 1,
    boss: p >= 2 ? { name: labels === DE ? 'EISERNER LEVIATHAN' : 'LEVIATHAN', title: labels === DE ? 'Schlachtschiff der Sturmklasse' : 'Storm-class battleship', ratio: p === 3 ? 0.22 : 0.8, enraged: p === 3 } : null,
    warnings: {
      missile: p === 0 || p === 3, lowHull: p === 1 || p === 3, boss: p >= 2, power: p !== 1, ecm: p === 1 || p === 3,
      damageControl: pick(['armed', 'used', 'none', 'armed'] as const, p),
    },
    flare: { state: pick(['ready', 'empty', 'none', 'ready'] as const, p), count: p === 1 ? 0 : 6 - p },
    special: { ...special, name: labels === DE ? 'FASSROLLE' : 'BARREL ROLL' },
    attitude: { bank: Math.sin(t * 0.9), forward: (Math.sin(t * 0.5) + 1) / 2 },
    keys: { flare: 'F', special: 'SPACE', pause: 'ESC' },
    labels,
  };
}

function render(t: number): void {
  const p = pinned ?? Math.floor(t / 3) % 4;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0b2a44';
  ctx.fillRect(320, 0, 640, 720);
  ctx.fillStyle = '#9fb6c9';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(`phase ${p} · t = ${t.toFixed(2)} s`, 340, 30);
  drawLeftConsole(ctx, leftView(t, p), t);
  drawRightConsole(ctx, rightView(t, p), t);
}

const t0 = performance.now();
const now = (): number => frozen ?? (performance.now() - t0) / 1000;
function tick(): void {
  render(now());
  if (frozen === null) requestAnimationFrame(tick);
}
tick(); // renders immediately, even when rAF is throttled in a background tab
(window as unknown as { __cockpit: { render: (t: number) => void } }).__cockpit = { render };

import type { ShellInk } from '../detail/organic';
import type { Box } from '../detail/sprite';

// The alien steppe's army in detail (doc 115): the faction's palette — violet-grey bio-armour, darker chitin seams, teal
// emissive trim, magenta glowing eyes and cores — per kind, its one-colour version for the flash and the shadow, and the
// half extents of each kind's cached body (legs, wings and tails are drawn live around it).

export interface AlienPal {
  mono: boolean;
  shell: string;
  dark: string;
  light: string;
  under: string;
  trim: string;
  glow: string;
  core: string;
  metal: string;
  hide: string;
  ink: string;
}

export const alienMono = (c: string): AlienPal =>
  ({ mono: true, shell: c, dark: c, light: c, under: c, trim: c, glow: c, core: c, metal: c, hide: c, ink: c });

const pal = (shell: string, dark: string, light: string, extra: Partial<AlienPal> = {}): AlienPal => ({
  mono: false, shell, dark, light, under: dark, trim: '#3ad8c8', glow: '#ff4ad8', core: '#ffe0f8', metal: '#5c5a6a',
  hide: '#7a6a58', ink: 'rgba(16,10,22,0.88)', ...extra,
});

export type SteppeKind =
  | 'crawler' | 'trooper' | 'rider' | 'landingpod' | 'shieldbearer' | 'broodcarrier'
  | 'tripod' | 'siegebug' | 'plasmagun' | 'wartripod' | 'scoutdisc' | 'discfighter' | 'manta';

export const STEPPE_PAL: Readonly<Record<SteppeKind, AlienPal>> = {
  crawler: pal('#6e5c80', '#2e2238', '#b2a0c4'),
  trooper: pal('#5e4e70', '#281e32', '#a490bc', { metal: '#4a4658' }),
  rider: pal('#5e4e70', '#281e32', '#a490bc', { hide: '#7e6a54' }),
  landingpod: pal('#7c6c8c', '#342840', '#bcaccc'),
  shieldbearer: pal('#4e5e70', '#1e2a36', '#90a8bc', { trim: '#5ae6dc' }),
  broodcarrier: pal('#6e4e70', '#2e1a30', '#b088b4', { glow: '#ff7ae0', under: '#8a6a8a' }),
  tripod: pal('#6c667a', '#2a2634', '#b0aac0'),
  siegebug: pal('#5e4e62', '#261c2a', '#968aa0', { glow: '#ff7a3a', core: '#ffe2c0' }),
  plasmagun: pal('#5c5c6c', '#262632', '#a0a0b0', { hide: '#6a5a48' }),
  wartripod: pal('#5a5468', '#22202c', '#a29cb0'),
  scoutdisc: pal('#8c8ca2', '#36364a', '#d0d0e2'),
  discfighter: pal('#6c6c88', '#28283c', '#acacc8'),
  manta: pal('#4c5c6c', '#1e2c36', '#8ea6b6', { glow: '#ff7ae0', under: '#2a3a46' }),
};

export const STEPPE_BOX: Readonly<Record<SteppeKind, Box>> = {
  crawler: [10, 17], trooper: [12, 9], rider: [12, 22], landingpod: [24, 22], shieldbearer: [17, 14], broodcarrier: [18, 24],
  tripod: [16, 16], siegebug: [22, 34], plasmagun: [24, 24], wartripod: [36, 32], scoutdisc: [14, 13], discfighter: [17, 26],
  manta: [12, 20],
};

/** The shell colours of a palette for the organic painters. */
export const ink = (p: AlienPal): ShellInk => ({ base: p.shell, dark: p.dark, light: p.light, ink: p.ink });
export const metalInk = (p: AlienPal): ShellInk => ({ base: p.metal, dark: p.dark, light: p.light, ink: p.ink });
export const hideInk = (p: AlienPal): ShellInk => ({ base: p.hide, dark: p.mono ? p.hide : '#3a2e24', light: p.mono ? p.hide : '#b09a7c', ink: p.ink });

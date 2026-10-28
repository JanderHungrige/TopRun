// Rank Quiz (doc 41): four charts of real ranks — US Navy, US Army, German Navy (Marine), German Army (Heer) — each
// lowest first, every rank with its insignia as a descriptor that render/minigames/rank-insignia*.ts draws in pixel
// art. Names are proper names (the same in EN and DE). Owner exception to the no-insignia rule (doc 41); sources:
// Wikipedia "Ranks and insignia of NATO armies / navies", officers and enlisted, viewed 2026-10-28.

export type Chart = 'usn' | 'usa' | 'marine' | 'heer';
export const CHARTS: readonly Chart[] = Object.freeze(['usn', 'usa', 'marine', 'heer'] as const);

/** Sleeve stripes, listed bottom → top. */
export type Stripe = 'wide' | 'medium' | 'thin';
/** What a US Army senior NCO wears between chevrons and rockers. */
export type ArmyDevice = 'none' | 'diamond' | 'star' | 'wreath';
export type UsOfficerDevice = 'goldBar' | 'silverBar' | 'twoBars' | 'goldLeaf' | 'silverLeaf' | 'eagle';
export type German = 'heer' | 'marine';

export type Insignia =
  /** US Navy E-1 … E-3: white diagonal stripes. */
  | { kind: 'groupRate'; stripes: number }
  /** US Navy E-4 … E-6: eagle over chevrons. */
  | { kind: 'pettyOfficer'; chevrons: number }
  /** US Navy E-7 … E-9: fouled anchor with "USN", stars above. */
  | { kind: 'chief'; stars: number }
  /** Navy officers (US and German): gold sleeve stripes under a star. */
  | { kind: 'sleeve'; stripes: readonly Stripe[] }
  | { kind: 'armyChevrons'; chevrons: number; rockers: number; device: ArmyDevice }
  | { kind: 'specialist' }
  | { kind: 'usOfficer'; device: UsOfficerDevice }
  | { kind: 'usGeneral'; stars: number }
  /** German enlisted: diagonal bars; `wide` adds the Korporal's wide bar under them. */
  | { kind: 'deBars'; service: German; bars: number; wide: boolean }
  /** German NCOs from Unteroffizier / Bootsmann up: braid (Heer only), chevrons, the loop. */
  | { kind: 'deNco'; service: German; braid: 'none' | 'open' | 'full'; chevrons: number; loop: boolean }
  /** Maat / Obermaat: the hexagon, Obermaat with a chevron. */
  | { kind: 'maat'; chevron: boolean }
  /** Heer officers: pips in rows (bottom → top), over an oak wreath from Major up. */
  | { kind: 'pips'; rows: readonly number[]; wreath: 'none' | 'silver' | 'gold' };

export interface QuizRank { name: string; insignia: Insignia }

const r = (name: string, insignia: Insignia): QuizRank => Object.freeze({ name, insignia });
const M = 'medium';
const sleeve = (...stripes: Stripe[]): Insignia => ({ kind: 'sleeve', stripes });
const army = (chevrons: number, rockers = 0, device: ArmyDevice = 'none'): Insignia => ({ kind: 'armyChevrons', chevrons, rockers, device });
const bars = (service: German, n: number, wide = false): Insignia => ({ kind: 'deBars', service, bars: n, wide });
const pips = (rows: readonly number[], wreath: 'none' | 'silver' | 'gold' = 'none'): Insignia => ({ kind: 'pips', rows, wreath });

const US_NAVY: readonly QuizRank[] = [
  r('Seaman Recruit', { kind: 'groupRate', stripes: 1 }),
  r('Seaman Apprentice', { kind: 'groupRate', stripes: 2 }),
  r('Seaman', { kind: 'groupRate', stripes: 3 }),
  r('Petty Officer Third Class', { kind: 'pettyOfficer', chevrons: 1 }),
  r('Petty Officer Second Class', { kind: 'pettyOfficer', chevrons: 2 }),
  r('Petty Officer First Class', { kind: 'pettyOfficer', chevrons: 3 }),
  r('Chief Petty Officer', { kind: 'chief', stars: 0 }),
  r('Senior Chief Petty Officer', { kind: 'chief', stars: 1 }),
  r('Master Chief Petty Officer', { kind: 'chief', stars: 2 }),
  r('Ensign', sleeve(M)),
  r('Lieutenant Junior Grade', sleeve(M, 'thin')),
  r('Lieutenant', sleeve(M, M)),
  r('Lieutenant Commander', sleeve(M, 'thin', M)),
  r('Commander', sleeve(M, M, M)),
  r('Captain', sleeve(M, M, M, M)),
  r('Rear Admiral (lower half)', sleeve('wide')),
  r('Rear Admiral', sleeve('wide', M)),
  r('Vice Admiral', sleeve('wide', M, M)),
  r('Admiral', sleeve('wide', M, M, M)),
];

const US_ARMY: readonly QuizRank[] = [
  r('Private', army(1)),
  r('Private First Class', army(1, 1)),
  r('Specialist', { kind: 'specialist' }),
  r('Corporal', army(2)),
  r('Sergeant', army(3)),
  r('Staff Sergeant', army(3, 1)),
  r('Sergeant First Class', army(3, 2)),
  r('Master Sergeant', army(3, 3)),
  r('First Sergeant', army(3, 3, 'diamond')),
  r('Sergeant Major', army(3, 3, 'star')),
  r('Command Sergeant Major', army(3, 3, 'wreath')),
  r('Second Lieutenant', { kind: 'usOfficer', device: 'goldBar' }),
  r('First Lieutenant', { kind: 'usOfficer', device: 'silverBar' }),
  r('Captain', { kind: 'usOfficer', device: 'twoBars' }),
  r('Major', { kind: 'usOfficer', device: 'goldLeaf' }),
  r('Lieutenant Colonel', { kind: 'usOfficer', device: 'silverLeaf' }),
  r('Colonel', { kind: 'usOfficer', device: 'eagle' }),
  r('Brigadier General', { kind: 'usGeneral', stars: 1 }),
  r('Major General', { kind: 'usGeneral', stars: 2 }),
  r('Lieutenant General', { kind: 'usGeneral', stars: 3 }),
  r('General', { kind: 'usGeneral', stars: 4 }),
];

/** Gefreiter … Stabskorporal: the same ladder in both German services, drawn in their own colours. */
const deEnlisted = (s: German): QuizRank[] => [
  r('Gefreiter', bars(s, 1)),
  r('Obergefreiter', bars(s, 2)),
  r('Hauptgefreiter', bars(s, 3)),
  r('Stabsgefreiter', bars(s, 4)),
  r('Oberstabsgefreiter', bars(s, 5)),
  r('Korporal', bars(s, 0, true)),
  r('Stabskorporal', bars(s, 1, true)),
];

const nco = (s: German, braid: 'none' | 'open' | 'full', chevrons: number, loop = false): Insignia => ({ kind: 'deNco', service: s, braid, chevrons, loop });

const MARINE: readonly QuizRank[] = [
  r('Matrose', bars('marine', 0)),
  ...deEnlisted('marine'),
  r('Maat', { kind: 'maat', chevron: false }),
  r('Obermaat', { kind: 'maat', chevron: true }),
  r('Bootsmann', nco('marine', 'none', 1)),
  r('Oberbootsmann', nco('marine', 'none', 2)),
  r('Hauptbootsmann', nco('marine', 'none', 1, true)),
  r('Stabsbootsmann', nco('marine', 'none', 2, true)),
  r('Oberstabsbootsmann', nco('marine', 'none', 3, true)),
  r('Leutnant zur See', sleeve(M)),
  r('Oberleutnant zur See', sleeve(M, M)),
  r('Kapitänleutnant', sleeve(M, 'thin', M)),
  r('Stabskapitänleutnant', sleeve(M, 'thin', 'thin', M)),
  r('Korvettenkapitän', sleeve(M, M, M)),
  r('Fregattenkapitän', sleeve(M, M, 'thin', M)),
  r('Kapitän zur See', sleeve(M, M, M, M)),
  r('Flottillenadmiral', sleeve('wide', 'thin')),
  r('Konteradmiral', sleeve('wide', M)),
  r('Vizeadmiral', sleeve('wide', M, M)),
  r('Admiral', sleeve('wide', M, M, M)),
];

const HEER: readonly QuizRank[] = [
  r('Soldat', bars('heer', 0)),
  ...deEnlisted('heer'),
  r('Unteroffizier', nco('heer', 'open', 0)),
  r('Stabsunteroffizier', nco('heer', 'full', 0)),
  r('Feldwebel', nco('heer', 'full', 1)),
  r('Oberfeldwebel', nco('heer', 'full', 2)),
  r('Hauptfeldwebel', nco('heer', 'full', 1, true)),
  r('Stabsfeldwebel', nco('heer', 'full', 2, true)),
  r('Oberstabsfeldwebel', nco('heer', 'full', 3, true)),
  r('Leutnant', pips([1])),
  r('Oberleutnant', pips([1, 1])),
  r('Hauptmann', pips([1, 1, 1])),
  r('Stabshauptmann', pips([2, 1, 1])),
  r('Major', pips([1], 'silver')),
  r('Oberstleutnant', pips([1, 1], 'silver')),
  r('Oberst', pips([1, 1, 1], 'silver')),
  r('Brigadegeneral', pips([1], 'gold')),
  r('Generalmajor', pips([1, 1], 'gold')),
  r('Generalleutnant', pips([1, 1, 1], 'gold')),
  r('General', pips([1, 1, 1, 1], 'gold')),
];

export const RANK_CHARTS: Readonly<Record<Chart, readonly QuizRank[]>> = Object.freeze({
  usn: Object.freeze(US_NAVY), usa: Object.freeze(US_ARMY), marine: Object.freeze(MARINE), heer: Object.freeze(HEER),
});

/** The rank whose insignia shows on a chart's card in the pick screen. */
export const CHART_SAMPLE: Readonly<Record<Chart, number>> = Object.freeze({ usn: 13, usa: 7, marine: 21, heer: 17 });

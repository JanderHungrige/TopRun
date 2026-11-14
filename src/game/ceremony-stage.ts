import type { CampaignId } from '../data/types';
import type { AvatarLook } from './avatar-look';
import type { Beat } from './ceremony';

// Medal ceremony (doc 25), layered image version: which cut-out of the key frame each figure shows at a beat and
// where the admiral stands. Pure; positions are art pixels on the 320 × 180 grid of the key frame.

/** Where the ceremony is held (docs 75, 98): the carrier deck, a submarine pier (map 4), a battle-station hangar (map 5),
 *  the run-down jungle camp (map 6), the steppe field camp at golden hour (map 7, doc 110). */
export type CeremonySet = 'deck' | 'pier' | 'hangar' | 'camp' | 'steppe';
const SET_OF: Readonly<Record<CampaignId, CeremonySet>> = {
  1: 'deck', 2: 'deck', 3: 'deck', 4: 'pier', 5: 'hangar', 6: 'camp', 7: 'steppe',
};
/** The stage of the world the pilot is on. */
export const ceremonySet = (world: CampaignId): CeremonySet => SET_OF[world];

/** What the admiral and the pilot wear (doc 98): dress uniforms, the space kit (a grey uniform, an orange flight suit) or
 *  worn jungle camouflage or the steppe's sand camouflage (doc 110). */
export type StageOutfit = 'dress' | 'space' | 'jungle' | 'steppe';
export function stageOutfit(set: CeremonySet): StageOutfit {
  switch (set) {
    case 'deck': case 'pier': return 'dress';
    case 'hangar': return 'space';
    case 'camp': return 'jungle';
    case 'steppe': return 'steppe';
    default: throw new Error(`unhandled: ${set satisfies never}`);
  }
}

export type AdmiralPose = 'walkA' | 'walkB' | 'stand' | 'pin' | 'salute';
export type PilotPose = 'attention' | 'salute';
/**
 * The pilot cut-outs: woman or man, short or long hair (a bun, hair tied back). Always grown-ups — a kid look shows as
 * the grown-up of its gender (owner, 2026-10-28: "Kids would like to be seen as adults").
 */
export type PilotBase = 'adultMaleShort' | 'adultMaleLong' | 'adultFemaleShort' | 'adultFemaleLong';

export interface StagePlan {
  admiral: AdmiralPose;
  /** The admiral's foot x (art px). */
  admiralX: number;
  pilot: PilotPose;
  /** The crew row shows its saluting overlay (after the pilot and admiral have saluted). */
  crewSalute: boolean;
}

/** Where the admiral's feet are when he pins (from the key frame), where he starts off-screen, how far he steps back. */
export const ADMIRAL_PIN_X = 199;
export const ADMIRAL_START_X = 372;
export const STEP_BACK = 12;
/** Art px of walking per walk frame. */
export const STRIDE = 7;

/** The pilot cut-out for a look (the builder's pick, or a preset's look checked against its portrait); age is ignored. */
export function pilotBase(look: Pick<AvatarLook, 'gender' | 'length'>): PilotBase {
  const g = look.gender === 'female' ? 'Female' : 'Male';
  const l = look.length === 'long' ? 'Long' : 'Short';
  return `adult${g}${l}`;
}

/** The two skin tones the cut-outs come in (owner, 2026-10-28: "just white and black"). */
export type SkinTone = 'light' | 'dark';
export const skinTone = (skin: AvatarLook['skin']): SkinTone => (skin === 'fair' || skin === 'olive' ? 'light' : 'dark');

function admiralPose(beat: Beat, x: number): AdmiralPose {
  if (beat.salute > 0.5) return 'salute';
  if (beat.reach > 0.5) return 'pin';
  const moving = beat.walking || (beat.back > 0.02 && beat.back < 0.98);
  if (!moving) return 'stand';
  return Math.floor((ADMIRAL_START_X - x) / STRIDE) % 2 === 0 ? 'walkA' : 'walkB';
}

/** The figures at one beat of the scene stage. */
export function stagePlan(beat: Beat): StagePlan {
  const x = Math.round(ADMIRAL_START_X + (ADMIRAL_PIN_X - ADMIRAL_START_X) * beat.walk + STEP_BACK * beat.back);
  return { admiral: admiralPose(beat, x), admiralX: x, pilot: beat.salute > 0.5 ? 'salute' : 'attention', crewSalute: beat.crew > 0.5 };
}

/** A pilot cut-out's name in the layer table: `pilot<Base><Pose>`. */
export const pilotKeyOf = (base: PilotBase, pose: PilotPose): string =>
  `pilot${base[0]?.toUpperCase() ?? ''}${base.slice(1)}${pose === 'salute' ? 'Salute' : 'Attention'}`;

/**
 * The base a missing cut-out falls back to: the other hair length (a short-haired woman shows with the bun —
 * drawn with short hair she read as the male pilot; a bun is standard with dress whites), then the grown-up man.
 */
const FALLBACK: Readonly<Record<PilotBase, PilotBase>> = {
  adultMaleShort: 'adultMaleShort', adultMaleLong: 'adultMaleShort', adultFemaleLong: 'adultFemaleShort', adultFemaleShort: 'adultFemaleLong',
};

/** The cut-out a base and pose show, given which cut-outs exist. */
export function pilotCutout(base: PilotBase, pose: PilotPose, has: (key: string) => boolean): string {
  for (const b of [base, FALLBACK[base], 'adultMaleShort'] as const) if (has(pilotKeyOf(b, pose))) return pilotKeyOf(b, pose);
  return pilotKeyOf('adultMaleShort', pose);
}

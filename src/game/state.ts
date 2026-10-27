import type { AudioEngine } from '../core/audio';
import type { Viewport } from '../core/canvas';
import type { Input } from '../core/input';
import type { LadderSync } from '../core/ladder-sync';
import type { Music } from '../core/music';
import type { MedalId } from '../data/medals';
import type { MinigameId } from '../data/minigames';
import type { MissionDef, MissionResult, TakeoffRating } from '../data/types';
import type { AvatarLook } from './avatar-look';
import type { PilotMatch } from './ladder-cloud';
import type { AvatarId, CreateResult, ImportResult, Profile } from './profiles';
import type { SaveData } from './save';
import type { Settings } from './settings';

/** NEW PILOT's unfinished form, kept while the avatar builder is open (doc 29): `pick` = chosen card (3 = own look). */
export interface NewPilotDraft { callsign: string; look: AvatarLook | null; pick: number }
/** Whose look the avatar builder edits (doc 29): a pilot being created (starting from `start`; CANCEL returns
 *  the draft unchanged), or an existing pilot. */
export type BuilderTarget = { kind: 'new'; draft: NewPilotDraft; start: AvatarLook } | { kind: 'pilot'; profileId: string };

export type Route =
  | { to: 'title' }
  | { to: 'pilots' }
  /** Back up / restore a pilot as text or a file (doc 08); BACK returns to `from`. */
  | { to: 'pilotCode'; from: 'pilots' | 'newPilot' }
  | { to: 'pilotLoad'; from: 'pilots' | 'newPilot' }
  | { to: 'newPilot'; draft?: NewPilotDraft }
  | { to: 'avatarBuilder'; target: BuilderTarget }
  | { to: 'joystick' }
  | { to: 'ladder' }
  | { to: 'map'; select?: string }
  | { to: 'hangar' }
  /** The home-base hangar (doc 30). */
  | { to: 'base' }
  /** The rec room: the off-duty minigame list behind the hangar's FUN MISSIONS area (doc 11). */
  | { to: 'recRoom' }
  | { to: 'locker' }
  | { to: 'photoWall' }
  | { to: 'offer'; id: MinigameId; isNew: boolean }
  | { to: 'minigame'; id: MinigameId; from: 'recRoom' | 'offer' }
  /** Medal ceremony (doc 25), then on to `then`. */
  | { to: 'ceremony'; medals: MedalId[]; then: Route }
  | { to: 'takeoff'; mission: MissionDef }
  | { to: 'mission'; mission: MissionDef; takeoff: TakeoffRating }
  | { to: 'debrief'; mission: MissionDef; result: MissionResult };

export interface GameContext {
  /** The ACTIVE pilot's progress (doc 08). */
  readonly save: SaveData;
  /** Device-wide settings shared by all pilots. */
  readonly settings: Settings;
  readonly profile: Profile | null;
  /** All pilots, most recently played first. */
  readonly profiles: readonly Profile[];
  readonly input: Input;
  readonly audio: AudioEngine;
  readonly music: Music;
  /** Keeps the active pilot's online ladder entry current (doc 28). */
  readonly ladder: LadderSync;
  /** Where DOM overlays (the callsign field) are placed over the canvas. */
  readonly dom: { host: HTMLElement; viewport: () => Viewport };
  /** Replaces the active pilot's save and persists the profile store. */
  setSave(next: SaveData): void;
  /** Replaces the device settings, applies them (sound / music switches, volumes, language) and persists. */
  setSettings(next: Settings): void;
  createProfile(callsign: string, avatar: AvatarId): CreateResult;
  /** Adds or replaces a pilot restored from a pilot code (doc 08); it becomes active. */
  importProfile(profile: Profile): ImportResult;
  /** Adds or replaces a pilot loaded from the cloud by callsign (doc 34); it becomes active. */
  loadCloudPilot(match: PilotMatch, save: SaveData): ImportResult;
  selectProfile(id: string): void;
  deleteProfile(id: string): void;
  go(route: Route): void;
  /** Seconds since start, for UI animation. */
  readonly time: number;
}

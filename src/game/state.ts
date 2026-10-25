import type { AudioEngine } from '../core/audio';
import type { Viewport } from '../core/canvas';
import type { Input } from '../core/input';
import type { Music } from '../core/music';
import type { MinigameId } from '../data/minigames';
import type { MissionDef, MissionResult, TakeoffRating } from '../data/types';
import type { AvatarId, CreateResult, Profile } from './profiles';
import type { SaveData } from './save';
import type { Settings } from './settings';

export type Route =
  | { to: 'title' }
  | { to: 'pilots' }
  | { to: 'newPilot' }
  | { to: 'joystick' }
  | { to: 'map'; select?: string }
  | { to: 'hangar' }
  | { to: 'base' }
  | { to: 'offer'; id: MinigameId; isNew: boolean }
  | { to: 'minigame'; id: MinigameId; from: 'base' | 'offer' }
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
  /** Where DOM overlays (the callsign field) are placed over the canvas. */
  readonly dom: { host: HTMLElement; viewport: () => Viewport };
  /** Replaces the active pilot's save and persists the profile store. */
  setSave(next: SaveData): void;
  /** Replaces the device settings, applies them (sound / music switches, volumes, language) and persists. */
  setSettings(next: Settings): void;
  createProfile(callsign: string, avatar: AvatarId): CreateResult;
  selectProfile(id: string): void;
  deleteProfile(id: string): void;
  go(route: Route): void;
  /** Seconds since start, for UI animation. */
  readonly time: number;
}

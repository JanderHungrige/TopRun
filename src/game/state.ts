import type { AudioEngine } from '../core/audio';
import type { Input } from '../core/input';
import type { Music } from '../core/music';
import type { MissionDef, MissionResult, TakeoffRating } from '../data/types';
import type { SaveData } from './save';

export type Route =
  | { to: 'title' }
  | { to: 'map'; select?: string }
  | { to: 'hangar' }
  | { to: 'takeoff'; mission: MissionDef }
  | { to: 'mission'; mission: MissionDef; takeoff: TakeoffRating }
  | { to: 'debrief'; mission: MissionDef; result: MissionResult };

export interface GameContext {
  save: SaveData;
  readonly input: Input;
  readonly audio: AudioEngine;
  readonly music: Music;
  /** Replaces the save in memory and persists it. The only way scenes change saved state. */
  setSave(next: SaveData): void;
  go(route: Route): void;
  /** Seconds since start, for UI animation. */
  readonly time: number;
}

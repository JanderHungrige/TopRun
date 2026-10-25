import { AudioEngine } from './core/audio';
import { Screen, type Viewport } from './core/canvas';
import { Input } from './core/input';
import { startLoop } from './core/loop';
import { Music } from './core/music';
import { SceneManager, type Scene } from './core/scene';
import {
  activeProfile, createProfile, deleteProfile, loadStore, newProfileId, persistStore, selectProfile,
  sortedProfiles, updateActiveSave, updateSettings, type AvatarId, type CreateResult, type Profile, type ProfileStore,
} from './game/profiles';
import { defaultSave, type SaveData } from './game/save';
import { toggleAllSound, type Settings } from './game/settings';
import type { GameContext, Route } from './game/state';
import { setLang } from './i18n/i18n';
import { DebriefScene } from './scenes/debrief';
import { HangarScene } from './scenes/hangar';
import { MapScene } from './scenes/map';
import { MissionScene } from './scenes/mission/mission-scene';
import { NewPilotScene } from './scenes/new-pilot';
import { BaseHubScene } from './scenes/base-hub';
import { JoystickSetupScene } from './scenes/joystick-setup';
import { MinigameOfferScene } from './scenes/minigame-offer';
import { moduleFor } from './scenes/minigames/registry';
import { MinigameScene } from './scenes/minigames/shell';
import { PilotsScene } from './scenes/pilots';
import { TakeoffScene } from './scenes/takeoff';
import { TitleScene } from './scenes/title';

class Game implements GameContext {
  private store: ProfileStore = loadStore();
  /** Progress shown before any pilot is chosen (never persisted). */
  private scratch: SaveData = defaultSave();
  time = 0;
  readonly audio: AudioEngine;
  readonly music: Music;

  constructor(readonly input: Input, private readonly scenes: SceneManager, readonly dom: { host: HTMLElement; viewport: () => Viewport }) {
    const st = this.store.settings;
    this.audio = new AudioEngine(st);
    setLang(st.lang);
    input.joystick = st.joystick;
    this.music = new Music(this.audio);
  }

  get save(): SaveData {
    return activeProfile(this.store)?.save ?? this.scratch;
  }

  get settings(): Settings {
    return this.store.settings;
  }

  get profile(): Profile | null {
    return activeProfile(this.store);
  }

  get profiles(): readonly Profile[] {
    return sortedProfiles(this.store);
  }

  private commit(store: ProfileStore): void {
    this.store = store;
    persistStore(store);
  }

  setSave(next: SaveData): void {
    if (!this.store.activeId) {
      this.scratch = next;
      return;
    }
    this.commit(updateActiveSave(this.store, next));
  }

  setSettings(next: Settings): void {
    this.audio.setLevels(next);
    setLang(next.lang);
    this.input.joystick = next.joystick;
    this.commit(updateSettings(this.store, next));
  }

  createProfile(callsign: string, avatar: AvatarId): CreateResult {
    const r = createProfile(this.store, callsign, avatar, Date.now(), newProfileId());
    if (r.ok) this.commit(r.store);
    return r;
  }

  selectProfile(id: string): void {
    this.commit(selectProfile(this.store, id, Date.now()));
  }

  deleteProfile(id: string): void {
    this.commit(deleteProfile(this.store, id));
  }

  go(route: Route): void {
    this.scenes.go(createScene(this, route));
  }

  toggleMute(): void {
    this.setSettings(toggleAllSound(this.settings));
  }
}

function createScene(game: GameContext, route: Route): Scene {
  switch (route.to) {
    case 'title': return new TitleScene(game);
    case 'pilots': return new PilotsScene(game);
    case 'newPilot': return new NewPilotScene(game);
    case 'joystick': return new JoystickSetupScene(game);
    case 'map': return new MapScene(game, route.select);
    case 'hangar': return new HangarScene(game);
    case 'base': return new BaseHubScene(game);
    case 'offer': return new MinigameOfferScene(game, route.id, route.isNew);
    case 'minigame': {
      const mod = moduleFor(route.id);
      return mod ? new MinigameScene(game, mod, route.from) : new BaseHubScene(game);
    }
    case 'takeoff': return new TakeoffScene(game, route.mission);
    case 'mission': return new MissionScene(game, route.mission, route.takeoff);
    case 'debrief': return new DebriefScene(game, route.mission, route.result);
    default: throw new Error(`unhandled: ${route satisfies never}`);
  }
}

function boot(): void {
  const canvas = document.getElementById('game');
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('missing #game canvas');
  const screen = new Screen(canvas);
  const input = new Input(canvas, () => screen.vp);
  const scenes = new SceneManager(() => input.clearPressed());
  const game = new Game(input, scenes, { host: document.body, viewport: () => screen.vp });
  input.onFirstGesture(() => game.audio.unlock());
  window.addEventListener('resize', () => screen.resize());
  window.addEventListener('blur', () => scenes.blur());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) scenes.blur();
  });
  canvas.focus();
  game.go({ to: 'title' });
  const update = (dt: number): void => {
    input.tick();
    game.time += dt;
    if (input.pressed('mute')) game.toggleMute();
    scenes.update(dt);
  };
  const render = (): void => {
    const ctx = screen.begin();
    scenes.render(ctx);
    screen.end();
    game.music.tick();
  };
  startLoop({ update, render });
  if (import.meta.env.DEV) installDebugHook(game, scenes, update, render);
}

/** Dev-only test hook (stripped from production builds): step frames and jump between scenes. */
function installDebugHook(game: Game, scenes: SceneManager, update: (dt: number) => void, render: () => void): void {
  Object.assign(window, {
    __toprun: {
      game,
      scene: () => scenes.scene,
      step(frames = 1): void {
        for (let i = 0; i < frames; i++) update(1 / 60);
        render();
      },
      go(route: Route): void {
        game.go(route);
      },
    },
  });
}

boot();

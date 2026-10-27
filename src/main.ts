import { AudioEngine } from './core/audio';
import { Screen, type Viewport } from './core/canvas';
import { Input } from './core/input';
import { LadderSync } from './core/ladder-sync';
import { requestPersistence } from './core/persist';
import { startLoop } from './core/loop';
import { Music } from './core/music';
import { SceneManager, type Scene } from './core/scene';
import {
  activeProfile, createProfile, deleteProfile, importProfile, loadStore, newProfileId, persistStore, selectProfile,
  sortedProfiles, updateActiveSave, updateSettings, type AvatarId, type CreateResult, type ImportResult, type Profile,
  type ProfileStore,
} from './game/profiles';
import type { Submission } from './game/ladder';
import { deviceCountry, withLadderCountry } from './game/ladder-country';
import { ladderAvatar, withLadderLink } from './game/ladder-stats';
import { defaultSave, type SaveData } from './game/save';
import { toggleAllSound, type Settings } from './game/settings';
import type { GameContext, Route } from './game/state';
import { setLang } from './i18n/i18n';
import { DebriefScene } from './scenes/debrief';
import { HangarScene } from './scenes/hangar';
import { MapScene } from './scenes/map';
import { MissionScene } from './scenes/mission/mission-scene';
import { NewPilotScene } from './scenes/new-pilot';
import { AvatarBuilderScene } from './scenes/avatar-builder';
import { BaseHubScene } from './scenes/base-hub';
import { CeremonyScene } from './scenes/ceremony';
import { HangarBaseScene } from './scenes/hangar-base';
import { JoystickSetupScene } from './scenes/joystick-setup';
import { LadderScene } from './scenes/ladder';
import { LockerScene } from './scenes/locker';
import { PhotoWallScene } from './scenes/photo-wall';
import { MinigameOfferScene } from './scenes/minigame-offer';
import { moduleFor } from './scenes/minigames/registry';
import { MinigameScene } from './scenes/minigames/shell';
import { pilotStats } from './scenes/pilot-rating';
import { PilotCodeScene } from './scenes/pilot-code';
import { PilotsScene } from './scenes/pilots';
import { TakeoffScene } from './scenes/takeoff';
import { TitleScene } from './scenes/title';
import { preloadPortraits } from './render/portraits';

class Game implements GameContext {
  private store: ProfileStore = loadStore();
  /** Progress shown before any pilot is chosen (never persisted). */
  private scratch: SaveData = defaultSave();
  time = 0;
  readonly audio: AudioEngine;
  readonly music: Music;
  readonly ladder = new LadderSync(() => this.ladderSubmission());

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
    const linked = withLadderLink(next, () => crypto.getRandomValues(new Uint8Array(48)));
    this.commit(updateActiveSave(this.store, withLadderCountry(linked, this.localCountry())));
    this.ladder.poke();
  }

  /** The device's country for the ladder flag (doc 28): its time zone, else its language region. */
  private localCountry(): string | null {
    return deviceCountry(Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.languages ?? [navigator.language]);
  }

  /** What the active pilot reports to the online ladder; null while not shared (doc 28). */
  private ladderSubmission(): Submission | null {
    const p = activeProfile(this.store);
    const link = p?.save.ladder;
    if (!p || !link?.share) return null;
    const avatar = ladderAvatar(p.avatar, p.save.look);
    return { id: link.id, secret: link.secret, callsign: p.callsign, avatar, country: link.country, stats: pilotStats(p.save) };
  }

  setSettings(next: Settings): void {
    this.audio.setLevels(next);
    setLang(next.lang);
    this.input.joystick = next.joystick;
    this.commit(updateSettings(this.store, next));
  }

  createProfile(callsign: string, avatar: AvatarId): CreateResult {
    const r = createProfile(this.store, callsign, avatar, Date.now(), newProfileId());
    if (r.ok) {
      this.commit(r.store);
      requestPersistence();
    }
    return r;
  }

  importProfile(profile: Profile): ImportResult {
    const r = importProfile(this.store, profile, Date.now());
    if (r.ok) {
      this.commit(r.store);
      requestPersistence();
      this.ladder.poke();
    }
    return r;
  }

  selectProfile(id: string): void {
    this.commit(selectProfile(this.store, id, Date.now()));
    const save = activeProfile(this.store)?.save;
    // An entry catches up as soon as its pilot is picked: its avatar, and a flag it has none of yet (doc 28).
    if (save?.ladder?.country === null) this.setSave(save); // setSave pokes the ladder too
    else this.ladder.poke();
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
    case 'pilotCode': return new PilotCodeScene(game, route.from);
    case 'newPilot': return new NewPilotScene(game, route.draft);
    case 'avatarBuilder': return new AvatarBuilderScene(game, route.target);
    case 'joystick': return new JoystickSetupScene(game);
    case 'ladder': return new LadderScene(game);
    case 'map': return new MapScene(game, route.select);
    case 'hangar': return new HangarScene(game);
    case 'base': return new HangarBaseScene(game);
    case 'recRoom': return new BaseHubScene(game);
    case 'locker': return new LockerScene(game);
    case 'photoWall': return new PhotoWallScene(game);
    case 'offer': return new MinigameOfferScene(game, route.id, route.isNew);
    case 'ceremony': return new CeremonyScene(game, route.medals, route.then);
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
  preloadPortraits(); // the owner's portrait images (doc 33)
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

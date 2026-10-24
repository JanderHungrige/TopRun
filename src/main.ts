import { AudioEngine } from './core/audio';
import { Screen } from './core/canvas';
import { Input } from './core/input';
import { startLoop } from './core/loop';
import { Music } from './core/music';
import { SceneManager, type Scene } from './core/scene';
import { loadSave, persistSave, type SaveData } from './game/save';
import type { GameContext, Route } from './game/state';
import { DebriefScene } from './scenes/debrief';
import { HangarScene } from './scenes/hangar';
import { MapScene } from './scenes/map';
import { MissionScene } from './scenes/mission/mission-scene';
import { TakeoffScene } from './scenes/takeoff';
import { TitleScene } from './scenes/title';

class Game implements GameContext {
  save: SaveData = loadSave();
  time = 0;
  readonly audio: AudioEngine;
  readonly music: Music;

  constructor(readonly input: Input, private readonly scenes: SceneManager) {
    this.audio = new AudioEngine({ music: this.save.settings.music, sfx: this.save.settings.sfx });
    this.audio.setMuted(this.save.settings.muted);
    this.music = new Music(this.audio);
  }

  setSave(next: SaveData): void {
    this.save = next;
    persistSave(next);
  }

  go(route: Route): void {
    this.scenes.go(createScene(this, route));
  }

  toggleMute(): void {
    const muted = !this.save.settings.muted;
    this.audio.setMuted(muted);
    this.setSave({ ...this.save, settings: { ...this.save.settings, muted } });
  }
}

function createScene(game: GameContext, route: Route): Scene {
  switch (route.to) {
    case 'title': return new TitleScene(game);
    case 'map': return new MapScene(game, route.select);
    case 'hangar': return new HangarScene(game);
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
  const game = new Game(input, scenes);
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
    __topgun: {
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

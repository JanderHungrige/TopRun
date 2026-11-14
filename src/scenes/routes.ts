import type { Scene } from '../core/scene';
import type { MissionDef } from '../data/types';
import type { GameContext, Route } from '../game/state';
import { DebriefScene } from './debrief';
import { HangarScene } from './hangar';
import { MapScene } from './map';
import { MissionScene } from './mission/mission-scene';
import { NewPilotScene } from './new-pilot';
import { LiftoffScene } from './liftoff';
import { AvatarBuilderScene } from './avatar-builder';
import { BaseHubScene } from './base-hub';
import { CelebrationScene } from './celebration';
import { IntroScene } from './intro';
import { CeremonyScene } from './ceremony';
import { HangarBaseScene } from './hangar-base';
import { JoystickSetupScene } from './joystick-setup';
import { LadderScene } from './ladder';
import { LockerScene } from './locker';
import { ChalkboardScene } from './chalkboard';
import { PhotoWallScene } from './photo-wall';
import { MinigameOfferScene } from './minigame-offer';
import { moduleFor } from './minigames/registry';
import { MinigameScene } from './minigames/shell';
import { PilotCodeScene } from './pilot-code';
import { PilotLoadScene } from './pilot-load';
import { PilotsScene } from './pilots';
import { TakeoffScene } from './takeoff';
import { TitleScene } from './title';
import { RocketLaunchScene } from './rocket-launch';
import { ShipyardScene } from './shipyard';
import { TapesScene } from './tapes';
import { DiveLaunchScene } from './dive-launch';
import { DropLaunchScene } from './drop-launch';
import { RampStartScene } from './ramp-start';
import { LabScene } from './lab';
import { OutpostScene } from './outpost';
import { PaintShopScene } from './paint-shop';
import { SteppeLabScene } from './steppe-lab';

// Which scene each route opens (docs 01, 53, 55, 56, 59, 63, 64, 71).

/** Jets launch from the catapult, helicopters lift off the deck (doc 53), the spacecraft rides a rocket (doc 59), a sub
 *  dives out of the well deck (doc 71), a mech drops from a dropship (doc 84). */
function takeoffScene(game: GameContext, mission: MissionDef): Scene {
  if (mission.campaign === 6) return new DropLaunchScene(game, mission); // mechs drop from a dropship (doc 84)
  if (mission.campaign === 7) return new RampStartScene(game, mission); // tanks roll off a lander's ramp (doc 109)
  if (mission.campaign === 4) return new DiveLaunchScene(game, mission);
  if (mission.campaign === 5) return new RocketLaunchScene(game, mission);
  return mission.campaign === 3 ? new LiftoffScene(game, mission) : new TakeoffScene(game, mission);
}

export function createScene(game: GameContext, route: Route): Scene {
  switch (route.to) {
    case 'title': return new TitleScene(game);
    case 'pilots': return new PilotsScene(game);
    case 'pilotCode': return new PilotCodeScene(game, route.from);
    case 'pilotLoad': return new PilotLoadScene(game, route.from);
    case 'newPilot': return new NewPilotScene(game, route.draft);
    case 'avatarBuilder': return new AvatarBuilderScene(game, route.target);
    case 'joystick': return new JoystickSetupScene(game);
    case 'ladder': return new LadderScene(game);
    case 'map': return new MapScene(game, route.select);
    case 'hangar': return game.save.kit === 'ship' ? new ShipyardScene(game) : new HangarScene(game); // map 5: the shipyard (docs 55, 74)
    case 'base': return new HangarBaseScene(game);
    case 'outpost': return new OutpostScene(game);
    case 'lab': return game.home === 7 ? new SteppeLabScene(game) : new LabScene(game); // the steppe lab on map 7 (doc 107)
    case 'paintShop': return new PaintShopScene(game, route.mech);
    case 'recRoom': return new BaseHubScene(game);
    case 'locker': return new LockerScene(game);
    case 'photoWall': return new PhotoWallScene(game);
    case 'chalkboard': return new ChalkboardScene(game);
    case 'offer': return new MinigameOfferScene(game, route.id, route.isNew);
    case 'ceremony': return new CeremonyScene(game, route.medals, route.then);
    case 'celebration': return new CelebrationScene(game, route.world, route.then);
    case 'intro': return new IntroScene(game, route.world, route.then);
    case 'tapes': return new TapesScene(game);
    case 'minigame': {
      const mod = moduleFor(route.id);
      return mod ? new MinigameScene(game, mod, route.from) : new BaseHubScene(game);
    }
    // Map 3 takes off from the deck by helicopter (doc 53).
    case 'takeoff': return takeoffScene(game, route.mission);
    case 'mission': return new MissionScene(game, route.mission, route.takeoff);
    case 'debrief': return new DebriefScene(game, route.mission, route.result);
    default: throw new Error(`unhandled: ${route satisfies never}`);
  }
}

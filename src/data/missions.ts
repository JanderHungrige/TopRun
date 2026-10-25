import { THEATERS } from './theaters';
import type { EnemyKind, MissionDef, Objective, TheaterId } from './types';

interface MissionSeed {
  name: string;
  objective: Objective;
  pool: readonly EnemyKind[];
  briefing: string;
}

const patrol: Objective = { type: 'patrol' };
const intercept = (count: number): Objective => ({ type: 'intercept', count });
const strike = (target: EnemyKind, count: number): Objective => ({ type: 'strike', target, count });

const SEEDS: Readonly<Record<TheaterId, readonly MissionSeed[]>> = {
  pacific: [
    { name: 'First Sortie', objective: patrol, pool: ['drone', 'fishbed'], briefing: 'Welcome to the squadron, rookie. Fly the training range and stay alive. Range control reports target drones that have turned hostile.' },
    { name: 'Bandits at Angels 12', objective: intercept(12), pool: ['fishbed', 'drone'], briefing: 'A flight of MiG-21s is probing the fleet air-defence zone. Splash at least 12 bandits.' },
    { name: 'Island Radar', objective: strike('radar', 3), pool: ['fishbed', 'radar', 'aa'], briefing: 'An enemy listening post on the atoll chain is tracking our carrier. Knock out 3 radar stations.' },
    { name: 'Picket Line', objective: intercept(18), pool: ['fishbed', 'fulcrum', 'hind', 'boat'], briefing: 'Fighters and gunships are forming a picket line in front of the fleet. Break it: 18 kills.' },
    { name: 'Convoy Breaker', objective: strike('boat', 4), pool: ['fishbed', 'hind', 'boat', 'aa'], briefing: 'A fast-attack convoy is running supplies between the islands. Sink 4 patrol boats.' },
    { name: 'Ironclad', objective: { type: 'boss', boss: 'ironclad' }, pool: ['fishbed', 'fulcrum', 'boat'], briefing: 'The battleship IRONCLAD is steaming for the fleet. Strip its turrets, then send it to the bottom.' },
  ],
  gulf: [
    { name: 'Desert Dawn', objective: patrol, pool: ['fishbed', 'fulcrum', 'aa', 'tank'], briefing: 'New theater, new rules. Fly the dawn patrol over the desert and get the lay of the land.' },
    { name: 'SAM Alley', objective: strike('sam', 4), pool: ['fishbed', 'aa', 'sam', 'tank'], briefing: 'A belt of SAM sites guards the pass. Take out 4 so the bombers can get through. Flares recommended.' },
    { name: 'Oil Depot Raid', objective: strike('depot', 3), pool: ['fulcrum', 'hind', 'aa', 'depot', 'tank'], briefing: 'Cut their fuel. Destroy 3 depots. Bombs make short work of them.' },
    { name: 'Fulcrum Fury', objective: intercept(24), pool: ['fulcrum', 'fishbed', 'hind', 'aa'], briefing: 'Their best MiG-29 squadron is up. Shoot down 24 aircraft.' },
    { name: 'Tank Column', objective: strike('tank', 6), pool: ['tank', 'aa', 'hind', 'fulcrum'], briefing: 'An armoured column is racing for the border. Stop it: destroy 6 tanks.' },
    { name: 'Sandstorm', objective: { type: 'boss', boss: 'sandstorm' }, pool: ['fulcrum', 'aa', 'sam', 'tank'], briefing: 'The SANDSTORM fortress anchors their entire defence line. Bring it down.' },
  ],
  arctic: [
    { name: 'Northern Watch', objective: patrol, pool: ['fishbed', 'fulcrum', 'boat', 'radar'], briefing: 'Arctic patrol. Cold water, colder welcome. Stay sharp and come home.' },
    { name: 'Ice Breaker', objective: strike('destroyer', 2), pool: ['destroyer', 'boat', 'fulcrum', 'flanker'], briefing: 'Two destroyers are escorting icebreakers through the pack ice. Sink both.' },
    { name: 'Radar Blackout', objective: strike('radar', 4), pool: ['radar', 'sam', 'flanker', 'fulcrum'], briefing: 'Blind them. Four radar stations on the ice shelf must go dark.' },
    { name: 'Bear Hunt', objective: strike('bear', 5), pool: ['bear', 'flanker', 'fulcrum'], briefing: 'Long-range Tu-95 bombers are inbound. Splash 5 Bears before they reach launch range.' },
    { name: 'Whiteout', objective: intercept(30), pool: ['fishbed', 'fulcrum', 'flanker', 'drone', 'bear'], briefing: 'A blizzard and a sky full of bandits. 30 kills.' },
    { name: 'Blackjack', objective: { type: 'boss', boss: 'blackjack' }, pool: ['flanker', 'fulcrum', 'drone'], briefing: 'BLACKJACK, their heaviest strategic bomber, is airborne behind a drone screen. Intercept and destroy.' },
  ],
  canyon: [
    { name: 'Red Canyon Run', objective: patrol, pool: ['fulcrum', 'hind', 'aa', 'tank'], briefing: 'Thread the Red Canyon below their radar. Low, fast and alive.' },
    { name: "Hornet's Nest", objective: strike('sam', 5), pool: ['sam', 'aa', 'flanker', 'hind'], briefing: 'The canyon walls hide a dense SAM network. Destroy 5 SAM sites.' },
    { name: 'Gunship Graveyard', objective: strike('hind', 8), pool: ['hind', 'fulcrum', 'aa', 'tank'], briefing: 'A gunship regiment is staging in the canyon. Shoot down 8 Hinds.' },
    { name: 'Supply Line', objective: strike('depot', 5), pool: ['depot', 'tank', 'aa', 'sam', 'flanker'], briefing: 'Their forward bases live on these depots. Torch 5 of them.' },
    { name: 'Flanker Ace', objective: intercept(34), pool: ['flanker', 'fulcrum', 'drone'], briefing: 'Their top ace and his Su-27 squadron are hunting you. 34 kills.' },
    { name: 'Typhoon', objective: { type: 'boss', boss: 'typhoon' }, pool: ['flanker', 'fulcrum', 'sam'], briefing: 'TYPHOON, an experimental flying wing, is overhead. Nothing that big should fly. Fix that.' },
  ],
  leviathan: [
    { name: 'Storm Front', objective: patrol, pool: ['fulcrum', 'flanker', 'boat', 'drone'], briefing: 'Operation Leviathan begins. Push through the storm front into enemy home waters.' },
    { name: 'Picket Destroyers', objective: strike('destroyer', 3), pool: ['destroyer', 'boat', 'flanker', 'fulcrum'], briefing: 'Three destroyers screen the enemy supercarrier. Sink them.' },
    { name: 'Drone Swarm', objective: intercept(45), pool: ['drone', 'fulcrum', 'flanker'], briefing: 'They are launching everything they have. Swat 45 drones and fighters.' },
    { name: 'Shore Batteries', objective: strike('sam', 6), pool: ['sam', 'aa', 'flanker', 'bear', 'boat'], briefing: 'Volcanic island batteries cover the carrier group. Silence 6 SAM sites.' },
    { name: 'Eye of the Storm', objective: intercept(40), pool: ['fishbed', 'fulcrum', 'flanker', 'bear', 'hind'], briefing: 'The final air battle. 40 kills and the sky is ours.' },
    { name: 'Leviathan', objective: { type: 'boss', boss: 'leviathan' }, pool: ['fishbed', 'fulcrum', 'flanker', 'destroyer'], briefing: 'LEVIATHAN, the enemy supercarrier. End this war. Good hunting, pilot.' },
  ],
};

const round100 = (v: number): number => Math.round(v / 100) * 100;

function nodePosition(theater: TheaterId, k: number): { x: number; y: number } {
  const { route, index } = THEATERS[theater];
  const f = k / 5;
  const dx = route.x1 - route.x0;
  const dy = route.y1 - route.y0;
  const len = Math.hypot(dx, dy) || 1;
  const wiggle = Math.sin(k * 1.9 + index * 1.3) * 22;
  return {
    x: Math.round(route.x0 + dx * f + (-dy / len) * wiggle),
    y: Math.round(route.y0 + dy * f + (dx / len) * wiggle),
  };
}

function buildMissions(): MissionDef[] {
  const order: readonly TheaterId[] = ['pacific', 'gulf', 'arctic', 'canyon', 'leviathan'];
  const list: MissionDef[] = [];
  order.forEach((theater) => {
    SEEDS[theater].forEach((seed, k) => {
      const n = list.length + 1;
      const isBoss = seed.objective.type === 'boss';
      const baseReward = round100(1200 + (n - 1) * 380);
      list.push({
        id: `m${String(n).padStart(2, '0')}`,
        number: n,
        name: seed.name,
        theater,
        briefing: seed.briefing,
        objective: seed.objective,
        difficulty: n,
        reward: isBoss ? round100(baseReward * 1.5) : baseReward,
        length: isBoss ? 45 + n : 70 + Math.round((n - 1) * 2.1),
        pool: Object.freeze([...seed.pool]),
        map: nodePosition(theater, k),
      });
    });
  });
  return list;
}

export const MISSIONS: readonly MissionDef[] = Object.freeze(buildMissions());

export function missionById(id: string): MissionDef | undefined {
  return MISSIONS.find((m) => m.id === id);
}

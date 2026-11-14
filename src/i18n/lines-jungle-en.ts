// The jungle planet's lines (docs 78, 82, 83): the admiral opening and closing map 6, Major "Dozer" Brennan at the
// ground base, Dr. Ada "Flask" Moreau in the lab, the chief in the mech bay. Same {placeholders} in every variant;
// German in lines-jungle-de.ts. The alien steppe's lines (doc 102) are nested here.
import { STEPPE_LINES_EN } from './lines-steppe-en';

export const JUNGLE_LINES_EN = {
  ...STEPPE_LINES_EN,
  'adm.jungle': [
    "And one more world, {callsign}: a jungle planet. No runway, no water, so we walk. Your mechs are waiting. Check the globe.",
  ],
  'adm.finale6': [
    "The hive is dead and the jungle is quiet, {callsign}. You walked through a whole planet's war.",
  ],
  'adm.celebrate6': ["From the decks to a jungle on another world, {callsign}. Nothing out there can stop you now."],
  'maj.hello': [
    "Welcome to the dirt, {callsign}! Major Brennan. I build what we need, you keep the bugs off my building site.",
    "{callsign}! Mind the mud. What are we building today?",
  ],
  'maj.firstVisit': [
    "Here's the deal, {callsign}: money pays for buildings. The generator first, it powers everything. The refinery makes alloy, alloy builds your mechs, guns and rounds.",
  ],
  'maj.built': [
    "Up she goes! {building} is running.",
    "Done and dusted. The {building} is up.",
  ],
  'maj.upgraded': [
    "{building} is bigger and better now. Level {level}!",
  ],
  'maj.broke': [
    "That needs more money than we've got, {callsign}. Fly a few sorties and come back.",
  ],
  'maj.lowPower': [
    "We're short of power: everything runs at {share}%. Build up the generator, {callsign}.",
  ],
  'maj.rounds': [
    "{n} {kind} off the line. They're in the magazine.",
  ],
  'maj.noFactory': [
    "No factory, no rounds. Build the munitions factory first, {callsign}.",
  ],
  'maj.magazineFull': [
    "The magazine is full. Upgrade the factory if you want to store more.",
  ],
  'doc.hello': [
    "Ah, {callsign}! Dr. Moreau. Mind the frog. What shall we invent today?",
    "{callsign}! Come in, come in. The planet is full of surprises, and so is my lab.",
  ],
  'doc.noLab': [
    "No lab building yet, {callsign}. Ask the Major to build one, and I'll invent you anything.",
  ],
  'doc.started': [
    "{project}! A splendid idea. After every sortie I'll put the lab's work into it.",
  ],
  'doc.invented': [
    "Eureka! {project} works! Go and try it out, {callsign}.",
    "It's done, {callsign}: {project}. Don't point it at the lab, please.",
  ],
  'doc.needsLab': [
    "That one needs a bigger lab: level {level}. The Major can build it.",
  ],
  'doc.needsFirst': [
    "We have to invent {project} first. One step at a time.",
  ],
  'sh.bayOpen': [
    "Bay doors open, {callsign}. Green light in three… two…",
    "Over the landing zone, {callsign}. Hold on to something.",
  ],
  'sh.drop': [
    "Drop, drop, drop! Hold the retros and bring her down soft, {callsign}!",
    "You're out! Light the retros in the green and land soft, {callsign}!",
  ],
  'sh.dropPerfect': [
    "Feather-light! Right on the pad.",
    "Textbook drop. Not a crack in the mud.",
  ],
  'sh.dropGood': [
    "Down and walking. Good drop.",
    "Bit of a thump, but you're down.",
  ],
  'sh.dropEarly': [
    "You burned the fuel too high! That was a long last drop.",
    "Retros dry above the trees. Next time, wait for the green.",
  ],
  'sh.dropLate': [
    "Too late on the retros! You made a crater, {callsign}.",
    "That landing shook the whole jungle, {callsign}. Fire earlier next time.",
  ],
  'chief.helloMechs': [
    "Welcome to the mech bay, {callsign}. Alloy in, mechs out. Whatever you need, I'll bolt it on.",
  ],
} as const satisfies Record<string, readonly string[]>;

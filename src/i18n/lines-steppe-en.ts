// The alien steppe's lines (docs 102, 103): the admiral opening and closing map 7, the wingman at an outpost, the chief
// in the motor pool. Same {placeholders} in every variant; German in lines-steppe-de.ts. Nested in lines-jungle-en.ts.
export const STEPPE_LINES_EN = {
  'adm.steppe': [
    "One more world, {callsign}: Kharsa, a steppe planet, and an alien army is marching across it. We go in with tanks and buggies. Check the globe.",
  ],
  'adm.finale7': [
    "The mothership is down and the steppe is ours again, {callsign}. You drove an invasion back into the sky.",
  ],
  'adm.celebrate7': ["From the carrier deck to the grass of Kharsa, {callsign}. Seven worlds, and every one of them stands because of you."],
  'wing.startDefend': [
    "Outpost in sight, {callsign}. Build on the pads and hold it for {n} waves.",
    "Here they come, {callsign}. Towers up, guns hot: {n} waves to hold.",
  ],
  'chief.helloTanks': [
    "Welcome to the motor pool, {callsign}. Tracks, wheels, guns. Pick your ride and I'll gas it up.",
    "Dust in everything again, {callsign}. Which one are we taking out today?",
  ],
  'ort.start': [
    "Captain Ortega, outpost command. Build on the pads, {callsign}. They'll be here soon.",
    "Ortega here. The pads are yours, {callsign}: get towers up before they come.",
  ],
  'ort.wave': ["Wave {n} of {total}, coming down the lanes!", "Here comes wave {n} of {total}!", "Contact! Wave {n} of {total}."],
  'ort.lastWave': ["Last wave, {callsign}! Everything they've got.", "This is the last of them, {callsign}. Hold!"],
  'ort.held': ["Wave held, {callsign}. Use the time: build, upgrade.", "That one's done, {callsign}. Get ready for the next.", "Held! Spend that supply, {callsign}."],
  'ort.half': ["They're getting through the gate, {callsign}!", "We're taking hits at the wall, {callsign}!"],
  'ort.quarter': ["The wall won't hold much longer!", "One more push and we're overrun!"],
  'ort.boss': ["{boss} is coming for the outpost! Bring it down before it flattens us!"],
  'ort.victory': ["The outpost stands. Good driving, {callsign}.", "We held. Hot food tonight is on me, {callsign}."],
  'ort.special': ["That's how it's done, {callsign}!", "Nice one, {callsign}!"],
  'nov.hello': [
    "Dr. Novak, delighted! Their tech is a marvel, {callsign}: give me sorties and I'll give you weapons.",
    "{callsign}! Come in, mind the cables. What shall we take apart today?",
  ],
  'nov.noLab': ["No lab yet, {callsign}. A container, some power, a microscope: {price}. Press U and I start at once."],
  'nov.bought': ["A level {level} lab! Now we're cooking.", "Level {level}! More benches, more research."],
  'nov.broke': ["Not enough money for that yet, {callsign}. Fly a few more sorties."],
  'nov.started': ["{project}, splendid choice. The points from every sortie go into it.", "On it: {project}. Keep flying, I keep tinkering."],
  'nov.invented': ["Eureka! {project} is ready, {callsign}.", "It works, {callsign}! {project}, invented."],
  'nov.needsLab': ["That needs a level {level} lab, {callsign}. Press U when you can afford it."],
  'nov.needsFirst': ["First things first: {project}, then this."],
  'sh.rampOpen': ["Ramp's coming down, {callsign}. Watch the lights.", "Lander's down, {callsign}. Rev up on the reds, go on green."],
  'sh.rampLights': ["Reds are on! Keep the needle in the green.", "Here come the lights. Feather that throttle!"],
  'sh.rampPerfect': ["Perfect start! Off you go, {callsign}!", "Textbook, {callsign}. Clean off the ramp!"],
  'sh.rampGood': ["Good start. Go get them, {callsign}.", "Not bad at all, {callsign}. Rolling!"],
  'sh.rampEarly': ["Too many revs! You're spinning the wheels, {callsign}.", "Easy on the gas, {callsign}! That's a lot of dust."],
  'sh.rampLate': ["You bogged it down, {callsign}. More revs before the green.", "Slow off the ramp, {callsign}. Rev it up next time."],
} as const satisfies Record<string, readonly string[]>;

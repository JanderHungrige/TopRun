// Lt. Sam "Shooter" Reyes calling the launches of the late worlds (doc 76): the sub's dive out of the well deck (map 4)
// and the rocket launch (map 5). Same {placeholders} in every variant; German in lines-launch-de.ts.
export const LAUNCH_LINES_EN = {
  'sh.flood': [
    "Flooding the well deck, {callsign}. Hold her steady.",
    "Water's coming in, {callsign}. Easy now.",
  ],
  'sh.dive': [
    "You're clear! Flood the tanks and slot her between the net and the reef!",
    "Out you go! Take her down into the gap, under the net, over the reef!",
  ],
  'sh.divePerfect': [
    "Perfect trim! Right through the middle of the gap.",
    "Textbook dive! Not a scratch on her.",
  ],
  'sh.diveGood': [
    "Good dive. You're through.",
    "Through the gap. Nicely done.",
  ],
  'sh.diveShallow': [
    "A bit shallow, {callsign}! That was close to the net.",
    "Too high, {callsign}! Mind the net next time.",
  ],
  'sh.diveDeep': [
    "A bit deep, {callsign}! That was close to the reef.",
    "Too low, {callsign}! Go easy on the ballast.",
  ],
  'sh.countdown': [
    "Launch control to {callsign}: all systems go. T-minus ten.",
    "You're go for launch, {callsign}. Counting down.",
  ],
  'sh.liftoff': [
    "Liftoff! Drop each stage the moment it burns out!",
    "We have liftoff! Watch the fuel and separate when it's empty!",
  ],
  'sh.sepPerfect': [
    "Clean separation! Right on the mark.",
    "Perfect staging!",
  ],
  'sh.sepGood': [
    "Good separation.",
    "Stage away. Good.",
  ],
  'sh.sepEarly': [
    "Too early, {callsign}! That stage still had fuel in it.",
    "Early separation, {callsign}. You threw fuel away.",
  ],
  'sh.sepLate': [
    "Late on the separation, but you're still climbing.",
    "You coasted a while there. Still going up.",
  ],
  'sh.orbit': [
    "You're in orbit, {callsign}. Good hunting up there.",
    "Orbit reached. The rest is up to you, {callsign}.",
  ],
} as const satisfies Record<string, readonly string[]>;

export type LaunchLineKey = keyof typeof LAUNCH_LINES_EN;

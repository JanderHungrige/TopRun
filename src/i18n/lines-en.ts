// Spoken lines (doc 06). Every variant of a key uses the same {placeholders}.
export const LINES_EN = {
  // Admiral "Ace" Kincaid — debrief
  'adm.open3': [
    "Outstanding flying, {callsign}! Textbook from catapult to touchdown.",
    "Now THAT's how it's done, {callsign}. The whole fleet is talking about you.",
    "Flawless, {callsign}. I haven't seen flying like that since my own glory days.",
  ],
  'adm.open2': [
    "Good work out there, {callsign}. Mission accomplished.",
    "Solid sortie, {callsign}. The job's done and the jet came home.",
  ],
  'adm.open1': [
    "You got the job done, {callsign}. Barely. My hair went grey watching that.",
    "Mission accomplished... but that was ugly. Tighten it up, {callsign}.",
  ],
  'adm.shotDown': [
    "You punched out over hostile waters. The rescue crew earned their pay today.",
    "We lost a jet today, pilot. Shake it off, learn from it, fly again.",
  ],
  'adm.objFailed': [
    "You came home, but the targets are still standing. That's not a win.",
    "Nice flying, wrong result. The objective WAS the mission, pilot.",
  ],
  'adm.aborted': [
    "Aborting is never easy. Sometimes it's the smart call. Regroup and go again.",
    "You brought the jet back in one piece. Now go back and finish the job.",
  ],
  'adm.boss': [
    "{boss} is history. They'll be telling that story at the bar for years.",
    "Taking down {boss}? That's the stuff of legends, pilot.",
  ],
  'adm.perfectLaunch': [
    "And that carrier launch? Perfect. The deck crew is still cheering.",
    "Perfect cat shot, too. Shooter says you're a natural.",
  ],
  'adm.cleanHull': [
    "Not a scratch on that jet. The chief will finally smile.",
    "You brought her back without a scratch. That's real airmanship.",
  ],
  'adm.kills': [
    "{kills} kills today. The enemy will remember your callsign.",
    "{kills} confirmed kills. Not bad at all, pilot.",
  ],
  'adm.pay': [
    "Your pay: {total}. Spend it wisely in the hangar.",
    "{total} is in your account. The chief has some new toys for you.",
  ],
  'adm.salvage': [
    "Salvage pays {total}. Get some rest, then get back up there.",
    "You keep {total} from the salvage. Now go and earn the rest.",
  ],
  'adm.nextTheater': [
    "Pack your bags. Next stop: {theater}.",
    "Your next orders send you to {theater}. Good luck, pilot.",
  ],
  'adm.finale': [
    "That's the war, {callsign}. You're the best of the best. Welcome to TopGun.",
  ],
  'adm.livery': [
    "And the paint shop has something for you: {livery}. Wear it with pride.",
    "One more thing. The crew painted up a new scheme for you: {livery}. It's waiting in the hangar.",
  ],
  'adm.liveryRare': [
    "Three stars on every sortie out there. That earns you something special: {livery}.",
    "A flawless theater, pilot. The paint shop broke out the good stuff: {livery}.",
  ],
  // Admiral — medal ceremony (doc 25)
  'adm.medal': [
    "Attention on deck! {callsign}, it is my honour to present you with this award: {medal}.",
    "{callsign}, the whole fleet saw what you did out there. For that: {medal}. Wear it with pride.",
    "Stand tall, {callsign}. On behalf of every sailor on this ship: {medal}. You earned it.",
  ],
  'adm.medalMore': [
    "And one more, {callsign}: {medal}.",
    "Hold still, {callsign}, I'm not done yet. {medal}, too.",
    "Somebody find {callsign} a bigger chest. Here comes {medal}.",
  ],
  // Chief "Wrench" Kowalski — hangar
  'chief.hello': [
    "Welcome to my hangar, {callsign}. Look all you want, touch nothing you can't pay for.",
    "Back again, {callsign}? Let's see what we can bolt onto your bird.",
  ],
  'chief.helloRich': [
    "Well, well. {callsign} is loaded! Let's go shopping.",
    "Big paycheck, huh, {callsign}? I've got just the thing for you.",
  ],
  'chief.helloBroke': [
    "Empty pockets again, {callsign}? Fly a mission and come back with some cash.",
    "Money's tight, {callsign}. Window shopping is free, at least.",
  ],
  'chief.buyPlane': [
    "The {plane}! Treat her well. She's a beauty.",
    "One {plane}, fresh off the line. Try not to scratch the paint.",
  ],
  'chief.buyGun': [
    "More barrels, more fun. That cannon will sing now.",
    "Upgraded the cannon. You'll feel the difference.",
  ],
  'chief.buySecondary': [
    "{item} it is. Remember to mount it on a hardpoint.",
    "Nice pick. {item} is in the rack. Mount it and go.",
  ],
  'chief.buyEquipment': [
    "{item} installed. That'll keep you flying.",
    "Done. {item} is fitted and tested.",
  ],
  'chief.mount': [
    "{item} locked and loaded.",
    "Hardpoint armed with {item}. Good hunting.",
  ],
  'chief.unmount': [
    "Pulled it off the rail. Lighter jet, less bang.",
    "Hardpoint cleared.",
  ],
  'chief.select': [
    "I'll have the {plane} on the catapult in five.",
    "{plane} it is. Fuelled and ready.",
  ],
  'chief.denied': [
    "That's {amount} more than you've got, flyboy.",
    "Nice try. Come back with {amount} more.",
  ],
  'chief.restricted': [
    "The Phoenix only fits the Tomcat, kid.",
    "Wrong jet for that one. The Phoenix needs an F-14.",
  ],
  'chief.idle': [
    "Don't touch the paint.",
    "Take your time. I've got all day. Actually, I don't.",
    "Back in my day we flew with a wrench and a prayer.",
  ],
  'chief.painted': [
    "Fresh paint! She looks mean in {livery}.",
    "{livery}, done. Try not to scratch it on the first sortie.",
  ],
  // Lt. Sam "Shooter" Reyes — carrier launch
  'sh.spool': [
    "Throttle up, {callsign}! Keep that needle in the green.",
    "Engines up, {callsign}! Show me full power, nice and steady.",
  ],
  'sh.green': [
    "That's it, right in the green! Lock it with E!",
    "Green! Hit E to lock it in!",
  ],
  'sh.overspeed': [
    "Easy! You'll cook those engines!",
    "Too much! Back it off a hair!",
  ],
  'sh.launch': [
    "Go, go, go!",
    "Launch!",
  ],
  'sh.perfect': [
    "Textbook launch! Beautiful!",
    "Perfect shot! That's how it's done!",
  ],
  'sh.good': [
    "Good launch. Have a nice flight.",
    "Clean shot. You're airborne.",
  ],
  'sh.late': [
    "A bit slow on the trigger, but you're flying.",
    "Took your time, huh? You're airborne anyway.",
  ],
  'sh.notYet': [
    "Not yet! More throttle, get it into the green.",
    "Too little! Push it up into the green.",
  ],
  'sh.locked': [
    "Locked! Stand by... three, two, one...",
    "Throttle locked. Hold tight... three, two, one...",
  ],
  'sh.waitForIt': [
    "Wait for it!",
    "Not yet, not yet!",
  ],
  'sh.go': [
    "GO! Hit E!",
    "Launch, launch, launch! Press E!",
  ],
  // Lt. "Duke" Carter — wingman on the radio
  'wing.startPatrol': [
    "Duke here, {callsign}. I've got your six. Let's fly the route and come home.",
    "Wingman on station, {callsign}. Eyes open. It's quiet... too quiet.",
  ],
  'wing.startIntercept': [
    "Duke here. Bandits incoming. We need {n} kills.",
    "Radar's lighting up. Splash {n} and we go home.",
  ],
  'wing.startStrike': [
    "Duke here. Targets: {n} {targets}. Let's light 'em up.",
    "Ground targets ahead: {n} {targets}. Watch for flak.",
  ],
  'wing.startBoss': [
    "Duke here. Intel says {boss} is out there. Stay sharp.",
    "Word is {boss} is waiting for us. Let's ruin its day.",
  ],
  'wing.halfway': [
    "Halfway there. Keep it tight.",
    "Half the route done. You're doing great.",
  ],
  'wing.objectiveDone': [
    "Objective complete! Let's head home.",
    "That's the job done. Nice work!",
  ],
  'wing.bossWarning': [
    "Big bogey inbound! That's {boss}!",
    "Heads up! {boss}, dead ahead!",
  ],
  'wing.hullLow': [
    "You're trailing smoke! Careful!",
    "You're hit bad! Grab a repair kit if you see one!",
  ],
  'wing.special': [
    "Coming in on your wing!",
    "Duke on your wing. Let's dance!",
  ],
  'wing.victory': [
    "Yeehaw! That's how it's done, {callsign}!",
    "Great flying, {callsign}! Drinks are on me tonight.",
  ],
  'wing.base': [
    "Welcome back to base, {callsign}. Fancy a little off-duty fun?",
    "Downtime, {callsign}! What'll it be?",
  ],
  'wing.baseLocked': [
    "That one opens up after mission {n}. Keep flying!",
    "Not yet. Clear mission {n} first.",
  ],
  'wing.offer': [
    "Good flying! Up for a round of {game} before the next sortie?",
    "Hey, the crew's doing {game}. You in?",
  ],
  'wing.offerNew': [
    "New on base: {game}! Want to give it a go?",
    "Check it out, {game} just opened up. Try it?",
  ],
} as const satisfies Record<string, readonly string[]>;

export type LineKey = keyof typeof LINES_EN;

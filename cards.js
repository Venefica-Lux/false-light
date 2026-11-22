// FALSE LIGHT — the deck. Every card is public-edition fiction from THE_POISONER_OF_FALSE_LIGHT.md:
// the Wardens and the Wolves (§13), the Eight Chains (§14), the Compass (§10), the False Light (§7).
//
// Card:    { id, who, tier (0 world · 1 whisper · 2 wolf · 3 geometry), art, text, left, right,
//            weight?, when?(s), once?, named? (ending if this card pushes Mark to 6) }
// Choice:  { label, fx?, text? } or { label, roll: { stat, mod?, adv?, dis?, light? }, hit, mid, miss }
// Outcome: { fx?, text }
// fx keys: mark strain favor hollow longing untag gnosis cage apo rest reveal commune reckon set unset then end bond

const o = (text, fx) => ({ text, fx });
// The scattered light (the cards at the end of the deck) reaches the Vigil on this night. Every earlier night keeps the
// deck it had. Move it only to the first night of a release that carries them, never earlier than the day it ships,
// or a night someone already played would replay differently from Past Vigils. (2026-11-20: moved from 2026-11-09,
// which passed before any public build carried these cards; the public builds dealt the old deck on those nights.)
export const SPARK_DAY = "2026-11-23";
export const sparkDeck = (s) => (s.mode === "vigil" ? s.seedLabel >= SPARK_DAY : s.mode === "ascension");
const lit = (when) => (s) => sparkDeck(s) && (!when || !!when(s));
// Word gets around (2026-11-20): the Vigil's from SPARK_DAY, and Exodus's from 2026-11-21 (owner call: no players yet, so
// the occult control hashes were re-recorded and older Exodus links replay on the new deck). Never legacy Endless.
export const heardDeck = (s) => sparkDeck(s);
const heard = (when) => (s) => heardDeck(s) && (!when || !!when(s));
// A Bond counts as earned whether it's still held or already spent catching you.
const earned = (s, k) => s.bonds.includes(k) || (s.spent || []).includes(k);

export const CARDS = [
  // ---------------- first-run tutorial (forced, never drawn; the rest is taught in context by app.js) ----------------
  {
    id: "t_dawn", tutorial: true, tier: 0, art: "bell", who: "The Warrens",
    text: "Dawn at the almshouse. Drag the card left or right to choose. Every choice moves something.",
    left: { label: "Eat first", fx: { hollow: -1 }, text: "You eat first. The fog lifts some, and Hollow goes down." },
    right: { label: "Check the letters", fx: { favor: 1, strain: 1 }, text: "Two letters. One of them is real. Favor goes up and so does Strain, which is basically how every choice in here works." },
  },

  // ---------------- the False Light ----------------
  {
    id: "whisper", tier: 0, art: "sun", who: "The False Light",
    text: "Prosay. A pinch of the counterfeit sun, within reach. It would fix everything. For a while.",
    when: (s) => s.communion === 0 && (s.hollow >= 3 || s.strain >= 5 || s.longing >= 3 || s.cascade || s.reckoning > 0),
    // Seized by Lilith, the Eye is open and the Light finds it twice as easily.
    weight: (s) => (s.cascade ? 14 : 5) * (s.maskLocked && s.mask === "lilith" ? 2 : 1),
    left: {
      label: "Hold",
      roll: { stat: "steel", light: true },
      hit: o("You hold. You know exactly what it would fix. You always will. On the way home, a lantern in a basement window.", { gnosis: 1, set: { rooms: true } }),
      mid: o("You hold. Your body negotiates the whole way home. You don't sign.", { strain: 1, gnosis: 1 }),
      miss: o("The Light waited for the moment you were most empty. That is what it does.", { commune: true }),
    },
    right: { label: "Take the Light", fx: { commune: true }, text: "Hollow's gone, Strain's gone, and for once you're not lonely. The bill's already in the mail." },
  },
  {
    id: "reckoning", forcedOnly: true, tier: 0, art: "sun", who: "The Reckoning",
    text: "The gold drains out of everything. There's a little left in the paper. There's always a little left.",
    left: { label: "Endure", fx: { reckon: true, gnosis: 1, set: { rooms: true } }, text: "Hollow to 3, Strain up 3, Longing and Mark up 1, and your Wits go soft for a while. Eventually things stop getting worse, and you know the Light's price by heart now. Somebody from the Lantern Rooms leaves a card under your door." },
    right: { label: "More light", fx: { commune: true, mark: 1 }, text: "You put it off. The seller knows your face now, and the bill is still coming." },
  },

  // ---------------- Tier 1 — Whispers ----------------
  {
    id: "collector", tier: 1, art: "letter", who: "The Collector",
    text: "“Loved your work. Could you send a little more? Just to be sure.” Third letter. Still no actual request.",
    left: { label: "Silence", fx: { untag: 1 }, text: "One correction was already generous. Silence." },
    right: { label: "One more sample", fx: { favor: 2, strain: 1, mark: 1 }, text: "He pays, and pays well. He'll show it to everyone he knows, and none of them will." },
  },
  {
    id: "impatient", tier: 1, art: "letter", who: "The Impatient",
    text: "“Now. Come now. I'm at the Tanner's Gate.” No name. No format. The Bell is halfway.",
    left: {
      label: "Format, once",
      roll: { stat: "wits" },
      hit: o("He actually follows the format. He's real, which nobody had money on.", { favor: 1 }),
      mid: o("Silence. Time spent, nothing gained.", { strain: 1 }),
      miss: o("He escalates. Six letters by noon.", { strain: 1, mark: 1 }),
    },
    right: { label: "Go now", fx: { favor: 2, mark: 1, strain: 1 }, text: "Paid. But you broke your own protocol, and the gate-watch saw you run." },
  },
  {
    id: "pusher", tier: 1, art: "letter", who: "The Pusher",
    text: "“Everyone else does it cheaper. Make an exception, just for me?”",
    left: { label: "No. Block.", fx: { strain: 1, untag: 1 }, text: "One no. Don't explain. Explaining is the second exchange." },
    right: { label: "Negotiate", fx: { favor: 1, strain: 1, mark: 1 }, text: "You made an exception. He'll tell his friends what you cost now." },
  },
  {
    id: "extortion", tier: 1, art: "letter", who: "The Extortionist", named: "named_clerk",
    text: "“Pay, or I name you to the Inquisition.” He quotes your alms-roll number.",
    left: { label: "Pay him", fx: { favor: -2, strain: 1, set: { extortPaid: true } }, text: "Quiet, for now. Payers get a second letter." },
    right: { label: "Log it. Block.", fx: { mark: 1, strain: 2, untag: 1 }, text: "No payment and no reply. You keep the evidence and tell somebody you trust." },
  },
  {
    id: "extortion2", tier: 1, art: "letter", who: "The Extortionist", named: "named_clerk",
    text: "“Same again. Double, this time.” Of course.",
    when: (s) => s.flags.extortPaid,
    weight: 4,
    left: { label: "Pay again", fx: { favor: -3, strain: 1, cage: 2 }, text: "Now you're on a payment schedule with a blackmailer." },
    right: { label: "Stop paying", fx: { mark: 2, strain: 1, untag: 1, unset: "extortPaid" }, text: "He bluffs, sulks, and moves on to someone easier. Mostly." },
  },
  {
    id: "probe", tier: 1, art: "eye", who: "The Past-Life Probe",
    text: "“I've been watching you. Admiringly. Black tea, the east stair, Thursdays.” You never told him any of that.",
    left: {
      label: "Confirm nothing",
      roll: { stat: "wits" },
      hit: o("You trace how he knew. A gossip at the well. Closed.", { untag: 2 }),
      mid: o("You give him nothing. You still don't know how he knew.", { strain: 1 }),
      miss: o("Your silence confirmed Thursdays.", { strain: 2, mark: 1 }),
    },
    right: { label: "“How sweet.”", fx: { longing: 1, mark: 1, strain: 1 }, text: "You confirmed the east stair." },
  },
  {
    id: "entangler", tier: 1, art: "letter", who: "The Entangler",
    text: "Six long letters in two days. He's never told anyone this. When can you meet?",
    left: {
      label: "Logistics first",
      roll: { stat: "wits" },
      hit: o("Asked for a time and a place, he vanished. Intensity without logistics.", { untag: 2 }),
      mid: o("He sends a seventh letter instead of a time.", { strain: 1 }),
      miss: o("You wrote back a little. Just a little.", { longing: 1, strain: 1 }),
    },
    right: { label: "Write back, deep", fx: { longing: -1, cage: 2 }, text: "It feels like being seen. That's what makes it bait." },
  },

  // ---------------- Tier 2 — Wolves ----------------
  {
    id: "master", tier: 2, art: "hand", who: "The Master-Seeker",
    text: "“I'll handle everything. My carriage, my house, my hour.”",
    left: {
      label: "My transport or nothing",
      roll: { stat: "steel" },
      hit: o("He blinks, then agrees. Your terms, your exit.", { favor: 2 }),
      mid: o("He agrees, sulking. You'll be watching the door all night.", { favor: 1, strain: 1 }),
      miss: o("He changes the place an hour before. You exit loud.", { strain: 2, mark: 1 }),
    },
    right: { label: "Let him handle it", fx: { favor: 2, cage: 2, strain: 1 }, text: "Paid well. You didn't choose the room." },
  },
  {
    id: "scout", tier: 2, art: "hood", who: "The Friendly Questions", named: "named_scout",
    text: "Where do you sleep? Do you work alone? Who else knows you're here tonight?",
    left: { label: "Red. Block.", fx: { strain: 1, untag: 1 }, text: "Never answer living-situation or network questions. Logged in full." },
    right: { label: "Answer vaguely", fx: { favor: 2, mark: 2 }, text: "He books the whole night and pays up front. Vague was still data." },
  },
  {
    id: "fevered", tier: 2, art: "hood", who: "The Fevered",
    text: "Letters at the fourth hour. Weeping, then furious. He can't hold a time or a place.",
    left: { label: "Decline. No reply.", text: "You don't owe him a correction, so he doesn't get one." },
    right: { label: "Try to calm him", fx: { strain: 2, mark: 1, gnosis: 1 }, text: "You talk him down to a whisper before the patrol comes. They take him anyway, and your name with him." },
  },
  {
    id: "follower", tier: 2, art: "hood", who: "Footsteps", named: "named_hunt",
    text: "A man has been behind you since the dye-yards. He stops when you stop.",
    left: { label: "Into the crowd", fx: { strain: 1, untag: 1, set: { watch1: true } }, text: "Public Witness. Many honest eyes. He peels away at the fountain, and a woman there who saw all of it waves you over." },
    right: {
      label: "Turn and face him",
      roll: { stat: "steel" },
      hit: o("He runs. You enjoyed that. Note that you enjoyed that.", { apo: 1, untag: 2 }),
      mid: o("He laughs and walks off. Now he knows your face, too.", { strain: 1, mark: 1, apo: 1 }),
      miss: o("He had friends.", { strain: 2, mark: 2 }),
    },
  },

  // ---------------- Tier 3 — the Geometry ----------------
  {
    id: "hunt", tier: 3, art: "hood", who: "The Hunting Party", named: "named_hunt",
    text: "Two passes. Same grey cloaks. They're between you and your billet.",
    left: {
      label: "Slip home, it's close",
      roll: { stat: "shade", mod: -1 },
      hit: o("Lost them in the dye-yards. You still feel it in your shoulders.", { strain: 1 }),
      mid: o("Lost them. Probably. You sleep in your boots.", { strain: 2, mark: 2 }),
      miss: o("They didn't lose you.", { end: "billet" }),
    },
    right: { label: "Exit to eyes and light", fx: { mark: 1, strain: 2, untag: 1 }, text: "The market square, lamps lit, a hundred witnesses. They peel off." },
  },
  {
    id: "clerk", tier: 3, art: "scroll", who: "The Inquisitor's Clerk", named: "named_clerk",
    text: "The almoner asks unusual questions today. An audit, no cause given.",
    left: {
      label: "Weaponized boring",
      roll: { stat: "shade" },
      hit: o("Processed and forgotten. The most unremarkable case of the day.", { untag: 2 }),
      mid: o("Processed. Noted.", { mark: 1 }),
      miss: o("Something about you stuck in her memory.", { mark: 2, strain: 1 }),
    },
    right: { label: "Demand who filed it", fx: { mark: 1, strain: 1, gnosis: 1, set: { darvo: true } }, text: "You get a name. The clerk writes down that you were difficult." },
  },
  {
    id: "report", tier: 3, art: "scroll", who: "The Watch-House",
    text: "Someone keeps circling the almshouse after dark. You could report it to the watch.",
    left: {
      label: "Report it",
      roll: { stat: "fortune" },
      hit: o("A decent sergeant. The circling stops.", { untag: 2 }),
      mid: o("They take the report. They also take your details.", { mark: 1, set: { darvo: true } }),
      miss: o("They seem more interested in why you're out after dark.", { mark: 2, set: { darvo: true } }),
    },
    right: { label: "Log it privately", fx: { strain: 1 }, text: "Date, time, cloak colour. The Quiet Record." },
  },
  {
    id: "darvo", tier: 3, art: "scroll", who: "The Reversal", named: "named_darvo",
    text: "You made a report. Now there's a file, and it's on you. Somewhere the wording went from what happened to you to what you did.",
    when: (s) => s.flags.darvo,
    weight: 5,
    left: {
      label: "Press further",
      roll: { stat: "steel", mod: -1 },
      hit: o("A second clerk reads it straight and corrects the file, in pencil. You'll tell this story for years, a little too often.", { untag: 1, gnosis: 1, apo: 1, unset: "darvo" }),
      mid: o("They staple your appeal to the file. It's a thicker file now.", { mark: 2, strain: 1, apo: 1 }),
      miss: o("You are now generating evidence against yourself.", { mark: 3, strain: 1, apo: 1 }),
    },
    right: { label: "Disengage. Keep the record.", fx: { strain: 1, gnosis: 1, unset: "darvo" }, text: "Never escalate inside a system that has already reversed you." },
  },
  {
    id: "zealot", tier: 3, art: "sun", who: "The Zealot", named: "named_zealot",
    text: "A preacher of the false sun points at you. “Devil. Informer.” The crowd turns to look.",
    left: {
      label: "Argue",
      roll: { stat: "steel" },
      hit: o("You win the argument, and it feels like a hot bath. The crowd will remember your face.", { mark: 1, apo: 1, strain: -2 }),
      mid: o("You land a good line. Everyone repeats it. With your description.", { mark: 2, apo: 1 }),
      miss: o("He was hoping you'd bite.", { mark: 2, strain: 2, apo: 1 }),
    },
    right: { label: "One line. Silence.", fx: { untag: 1, strain: 1 }, text: "You say one thing and walk off. You don't debate these people. Not ever, however much it itches." },
  },
  {
    id: "recruiter", tier: 3, art: "hand", who: "The Recruiter",
    text: "“I can get you off the alms roll. I know people. Let me help.”",
    left: { label: "What do you want for this?", fx: { gnosis: 1 }, text: "“Nothing.” The most expensive word in the room." },
    right: { label: "Accept the help", fx: { favor: 3, strain: -1, cage: 2 }, text: "The help is real. You didn't set the terms." },
  },
  {
    id: "tithe", tier: 3, art: "coin", who: "The Ledger", named: "named_clerk",
    text: "The tithe-house has noticed your income is above the tolerated line.",
    when: (s) => s.favor >= 4,
    weight: 3,
    left: { label: "Pay the tithe", fx: { favor: -2 }, text: "Invisible again. Poorer." },
    right: {
      label: "Hide it",
      roll: { stat: "shade" },
      hit: o("Two ledgers. Only one of them is theirs.", { untag: 2 }),
      mid: o("A clerk circles a number.", { mark: 1 }),
      miss: o("Audited, fined, and now they know your name at the tithe-house.", { mark: 2, favor: -1 }),
    },
  },

  // ---------------- the False Shepherd (apex; the Cage) ----------------
  {
    id: "shepherd1", tier: 0, art: "candle", who: "A Kind Almoner", once: true,
    text: "He remembers your name. Bread, no questions. “Come by any time. Any time at all.”",
    left: { label: "Thank him. Keep distance.", text: "Kindness noted. Not yet trusted." },
    right: { label: "Come by any time", fx: { hollow: -1, longing: -1, cage: 1, set: { sh1: true } }, text: "It felt like relief." },
  },
  {
    id: "shepherd2", tier: 3, art: "candle", who: "The Kind Almoner", once: true,
    text: "“The clerk's been asking about you. I can make it go away. Just let me handle it.”",
    when: (s) => s.flags.sh1,
    weight: 4,
    left: {
      label: "Discern: true, or merely effective?",
      roll: { stat: "wits" },
      hit: o("He wants you managed, not known. You can see the Cage now.", { gnosis: 1, cage: -1, reveal: true }),
      mid: o("A warning, not the whole shape. A number flickers behind his smile.", { reveal: true }),
      miss: o("The false light answers in Wisdom's voice. He's lovely, it says.", { cage: 1, longing: 1 }),
    },
    right: { label: "Let him handle it", fx: { mark: -2, cage: 2, longing: 1, set: { sh2: true } }, text: "The clerk stops asking. The almoner starts." },
  },
  {
    id: "shepherd3", tier: 3, art: "candle", who: "The Kind Almoner", once: true,
    text: "“Move your things to the chapter house. It's safer. Only — tell no one. They wouldn't understand.”",
    when: (s) => s.flags.sh2 || s.cage >= 4,
    weight: 5,
    left: {
      label: "“I move slow. I don't do pressure.”",
      roll: { stat: "steel" },
      hit: o("He reacts badly to slow. It was never connection. It was acquisition.", { cage: -3, gnosis: 1, reveal: true }),
      mid: o("He smiles a beat too long. The door stays open. For now, anyway.", { cage: -1, strain: 1 }),
      miss: o("He sulks for days. You feel guilty. That's the lever.", { strain: 2, cage: 1 }),
    },
    right: { label: "Go with him", fx: { cage: 3, hollow: -1, strain: -1 }, text: "A warm room. Locked from the outside, a little more each day." },
  },

  // ---------------- the Eight Chains ----------------
  {
    id: "isolation", tier: 1, art: "chain", who: "Isolation",
    text: "“Your friends don't understand what we have. Come to me. I'll keep you safe from all that.”",
    when: (s) => s.cage >= 2,
    weight: 2,
    left: { label: "Go see your people", fx: { cage: -1, longing: -1, strain: 1 }, text: "It's loud and awkward and they ask too many questions, which is how you know they're yours. The chain slips a link." },
    right: { label: "Maybe they don't", fx: { cage: 1, longing: 1 }, text: "One fewer witness." },
  },
  {
    id: "indulgence", tier: 1, art: "candle", who: "Occasional Indulgence",
    text: "The patron who was cruel last week sends flowers and a beautiful apology.",
    left: {
      label: "Discern the pattern",
      roll: { stat: "wits" },
      hit: o("Cruel, kind, cruel, kind. The kindness is the chain.", { gnosis: 2, reveal: true, cage: -1 }),
      mid: o("Something's off. You keep the flowers and you lock the door.", { longing: 1 }),
      miss: o("Maybe last week was a bad week. Maybe.", { longing: 1, cage: 1 }),
    },
    right: { label: "Accept it", fx: { longing: 1, cage: 1, favor: 1 }, text: "The good day makes you doubt the bad weeks." },
  },
  {
    id: "trivial", tier: 3, art: "bell", who: "Trivial Demands",
    text: "“Report at the chapel at the sixth bell. Wear the grey. Kneel on the left side.”",
    left: { label: "Refuse", fx: { mark: 1 }, text: "You've been noticed. Resistance is visible; compliance never is." },
    right: { label: "Comply", fx: { cage: 1 }, text: "Nothing happens. That's the point." },
  },
  {
    id: "degradation", tier: 3, art: "scroll", who: "Degradation",
    text: "The new register lists you as “tolerated deviant, class IV.” A clerk slides it over for your mark.",
    left: {
      label: "Refuse the classification",
      roll: { stat: "freq" },
      hit: o("A name reclaimed. The clerk writes what you tell her to.", { gnosis: 2, untag: 1 }),
      mid: o("She writes it anyway. You said it out loud; that counts.", { gnosis: 1, strain: 1 }),
      miss: o("She adds a note: uncooperative.", { mark: 1, strain: 1 }),
    },
    right: { label: "Sign it", fx: { strain: 1, cage: 1 }, text: "Class IV. It's on paper now, so that's what they'll call you." },
  },
  {
    id: "omnipotence", tier: 2, art: "eye", who: "Demonstrating Omnipotence",
    text: "A note under your door lists your route this week. Exactly. Unsigned.",
    left: {
      label: "Assess the ground",
      roll: { stat: "wits" },
      hit: o("The leak was a chatty stable boy. Closed.", { untag: 2 }),
      mid: o("You don't find the leak. You change the lock.", { mark: 1 }),
      miss: o("They still know. Now they know you know.", { mark: 2, strain: 1 }),
    },
    right: { label: "Change everything", fx: { strain: 2, favor: -1, untag: 1 }, text: "New routes, new hours. It's exhausting, and it works." },
  },
  {
    id: "knowchains", tier: 0, art: "chain", who: "Know the Chains",
    text: "The pattern has a shape. Isolation, then kindness, then small demands. You've read about this.",
    when: (s) => s.cage >= 3 && !s.cageSeen,
    weight: 4,
    left: {
      label: "Name it",
      roll: { stat: "freq" },
      hit: o("Named, it stops being weather and becomes architecture.", { reveal: true, cage: -2, gnosis: 1 }),
      mid: o("You named it, so now you can see it. It's still tight.", { reveal: true }),
      miss: o("You name the wrong chain. The right one tightens.", { cage: 1, mark: 1 }),
    },
    right: { label: "You're overthinking it", fx: { cage: 1 }, text: "Probably. That's what it wants you to think." },
  },
  {
    id: "cutchain", tier: 0, art: "blade", who: "Cut the Chain",
    text: "You can see the Cage now. Which link do you cut first?",
    when: (s) => s.cageSeen && s.cage >= 2,
    weight: 3,
    left: {
      label: "Reconnect a severed friend",
      roll: { stat: "steel" },
      hit: o("The chain breaks. That vector is gone.", { cage: -2, longing: -1 }),
      mid: o("It loosens. The source adapts.", { cage: -1 }),
      miss: o("Visible attempt. The source tightens.", { cage: 1, mark: 1 }),
    },
    right: {
      label: "Find a second source of truth",
      roll: { stat: "wits" },
      hit: o("Two voices now. Neither owns what you know.", { cage: -2, gnosis: 1 }),
      mid: o("A second voice, faint. It's a start.", { cage: -1 }),
      miss: o("The second source reports back to the first.", { cage: 1, mark: 1 }),
    },
  },
  {
    id: "devil", tier: 1, art: "hand", who: "A Devil's Bargain",
    text: "A moneylender with soft hands. Coin now. Terms later.",
    when: (s) => s.favor <= 1,
    weight: 4,
    left: { label: "No", fx: { strain: 1 }, text: "Your purse stays empty. Your hands stay clean." },
    right: { label: "Take the coin", fx: { favor: 3, cage: 2, mark: 1 }, text: "Relief now. He collects later, and he picks when." },
  },

  // ---------------- work ----------------
  {
    id: "commission", tier: 0, art: "coin", who: "A Clean Inquiry", weight: 3,
    text: "Name, format, terms met, deposit sent. It's almost suspicious how normal this is.",
    left: { label: "Not today", fx: { strain: -1 }, text: "Rest is also income, on a longer ledger." },
    right: { label: "Take it", fx: { favor: 2, strain: 1 }, text: "Clean work. Paid in advance." },
  },
  {
    id: "kept", tier: 0, art: "coin", who: "A Kept Patron", weight: 2,
    text: "He's back. Respectful, prompt, asks about your week like he means it.",
    left: { label: "Keep it professional", fx: { favor: 1 }, text: "Good work, well kept." },
    right: { label: "Let him see you a little", fx: { favor: 1, strain: -1, longing: 1 }, text: "This one hurts because it's real, and still transactional." },
  },
  {
    id: "late", tier: 0, art: "bell", who: "The Bell",
    text: "Curfew's close. One more job across the river pays double.",
    when: (s) => s.bell >= 2,
    weight: 2,
    left: { label: "Behind the wall before the Bell", fx: { strain: -1 }, text: "Door barred before the Bell. Whoever's still out there, that's their problem tonight." },
    right: { label: "Take the job", fx: { favor: 2, mark: 1, hollow: 1 }, text: "Paid. Home past the Bell, and someone wrote down the time." },
  },
  {
    id: "stall", tier: 1, art: "bell", who: "Manufactured Urgency",
    text: "“The offer expires at the next bell. Now or never.”",
    left: {
      label: "The Stall",
      roll: { stat: "steel" },
      hit: o("The urgency was false. The offer waits. On your timeline now.", { favor: 1, gnosis: 1 }),
      mid: o("It waits, grudgingly. So do you.", { strain: 1 }),
      miss: o("It really did expire. Rare. It happens.", {}),
    },
    right: { label: "Now", fx: { favor: 2, strain: 1, cage: 1 }, text: "A reasonable pause would have angered them. That was the tell." },
  },
  {
    id: "guillotine", tier: 1, art: "blade", who: "A Regular",
    text: "He's started “forgetting” your terms. Small things. Every time a little smaller.",
    left: { label: "Let it slide", fx: { cage: 1, strain: 1 }, text: "Small things are the whole grammar." },
    right: {
      label: "The Velvet Guillotine",
      roll: { stat: "steel" },
      hit: o("Soft surface, hard boundary. Clean. No blowback.", { untag: 2 }),
      mid: o("It holds, but he talks.", { mark: 1, favor: -1 }),
      miss: o("He pushes back, loud, in public.", { mark: 1, strain: 2 }),
    },
  },
  {
    id: "stash", tier: 0, art: "key", who: "The Floorboard",
    text: "Everything you own is under one floorboard.",
    when: (s) => s.favor >= 2 && !s.flags.split,
    left: { label: "Split it across two doors", fx: { favor: -1, untag: 2, set: { split: true } }, text: "Distributed. No single failure collapses it now." },
    right: { label: "It's fine where it is", fx: { set: { oneStash: true } }, text: "It's been fine every night so far." },
  },
  {
    id: "robbed", tier: 0, art: "key", who: "The Floorboard", once: true,
    text: "The floorboard is pried up. Everything is gone.",
    when: (s) => s.flags.oneStash && s.day >= 3,
    weight: 3,
    left: { label: "Breathe", fx: { favor: -3, strain: 2, gnosis: 1, unset: "oneStash" }, text: "One point of failure. It failed. You let yourself feel all of it, then you start a second hiding place." },
    right: { label: "The Jest", fx: { favor: -3, strain: 1, unset: "oneStash" }, text: "You laugh until it stops hurting. Mostly." },
  },

  // ---------------- the Masks' own work ----------------
  {
    id: "glyph", tier: 0, art: "serpent", who: "A Ward-Glyph",
    text: "Cut over the tithe-house door. You can feel it cataloguing everyone who passes.",
    left: { label: "Walk past", text: "It logs you. It logs everyone." },
    right: {
      label: "Unweave the rune",
      roll: { stat: "freq" },
      hit: o("Unwoven. The Geometry loses that grip on you.", { gnosis: 2, untag: 1 }),
      mid: o("Unwoven, but it bites.", { gnosis: 1, mark: 1 }),
      miss: o("The heresy drew the wrong witness.", { mark: 2 }),
    },
  },
  {
    id: "rota", tier: 0, art: "veil", who: "The Patrol Rota",
    text: "Posted in clerk's cipher on the chapter-house door. Nobody's watching it.",
    left: { label: "Not your business", text: "Probably smart. You'll never know." },
    right: {
      label: "Copy it, unseen",
      roll: { stat: "shade" },
      hit: o("You know where they'll be all week.", { untag: 2 }),
      mid: o("Half of it. And a deacon glanced your way.", { untag: 1, mark: 1 }),
      miss: o("The deacon didn't just glance.", { mark: 2 }),
    },
  },
  {
    id: "route", tier: 0, art: "veil", who: "Your Routine",
    text: "You've taken the east stair eleven days running.",
    left: { label: "Same way, it's faster", fx: { mark: 1 }, text: "The Warrens punish routine." },
    right: { label: "Route Shift", fx: { mark: -1, strain: 1, untag: 1 }, text: "Different stair, different hour, different hood. It takes longer, and nobody can set a clock by you." },
  },
  {
    id: "ward", tier: 0, art: "key", who: "The Chapel Keeper",
    text: "An old keeper offers you a key to the crypt stair. It's a Ward, if you can pay for it.",
    when: (s) => s.favor >= 2 && !s.flags.ward,
    left: { label: "Too dear", text: "Maybe next week." },
    right: { label: "Claim the Ward", fx: { favor: -2, untag: 2, set: { ward: true } }, text: "A door that's yours. The Light whispers quieter behind it." },
  },
  {
    id: "threshold", tier: 0, art: "door", who: "The Tolerant Chapel",
    text: "The door is open. Staffed, warm, full of people who don't want anything from you.",
    when: (s) => s.mark >= 2 || s.strain >= 3,
    weight: 2,
    left: { label: "Lie low inside", fx: { mark: -1, set: { table: true } }, text: "Out of the Geometry's eye for an hour. They call it the Open Table, and they mean the door too." },
    right: { label: "Just sit", fx: { strain: -1, set: { table: true } }, text: "Nobody asks you anything. It's the best thing that's happened all week." },
  },

  // ---------------- rest & the Compass ----------------
  {
    id: "meal", tier: 0, art: "cup", who: "The Almshouse", weight: 3,
    text: "Something warm in a chipped bowl. No questions today.",
    left: { label: "Eat. Slowly.", fx: { hollow: -1 }, text: "The body's ledger, one line lighter." },
    right: { label: "No time, work", fx: { favor: 1, hollow: 1 }, text: "Paid. Emptier." },
  },
  {
    id: "sleep", tier: 0, art: "door", who: "Your Billet", weight: (s) => (s.hollow >= 2 || s.strain >= 4 ? 5 : 3),
    text: "The door holds. You could sleep six whole hours if the letters wait.",
    left: { label: "Let them wait", fx: { hollow: -1, strain: -1, rest: true }, text: "Real sleep. Things stop getting worse." },
    right: { label: "Answer the letters", fx: { favor: 1, strain: 1 }, text: "Three answered. One was worth it." },
  },
  {
    id: "kin", tier: 0, art: "eye", who: "Someone From Before",
    text: "Someone who knew you before the Warrens asks how you actually are.",
    when: (s) => s.longing >= 1,
    weight: 2,
    left: { label: "“Fine. Busy.”", fx: { longing: 1 }, text: "Managed, not known." },
    right: { label: "Tell the truth", fx: { longing: -1, gnosis: 1, strain: 1, cage: -1 }, text: "They actually listened, which is a different thing from being watched. It cost you something to say it." },
  },
  {
    id: "sabbath", tier: 0, art: "candle", who: "The Sabbath", weight: 2,
    text: "A quiet hour. Deliberate smallness before something larger than you.",
    left: { label: "Keep working", fx: { favor: 1, strain: 1 }, text: "The ledger doesn't rest, so neither do you." },
    right: { label: "Orient", fx: { strain: -1, gnosis: 1, apo: -2, rest: true }, text: "You address the light. You don't become it." },
  },
  {
    id: "jest", tier: 0, art: "mask", who: "A New Decree",
    text: "The Dominion has banned laughter in the tithe-queue. The notice is posted in the tithe-queue.",
    when: (s) => s.strain >= 2,
    left: { label: "Stay grave", text: "Compliance, invisible as ever." },
    right: {
      label: "The Jest",
      roll: { stat: "shade" },
      hit: o("The whole queue cracks up. Nobody can prove who started it.", { strain: -2 }),
      mid: o("A few snorts. It helps.", { strain: -1 }),
      miss: o("A deacon heard you.", { mark: 1 }),
    },
  },
  {
    id: "menace", tier: 0, art: "crown", who: "The Architect's Oldest Trap",
    text: "You could let them see what you really are. Terror is a kind of armor.",
    left: { label: "Stay small", fx: { apo: -1, strain: 1 }, text: "It's harder. Looking dangerous was never the same thing as being safe." },
    right: { label: "Show them", fx: { strain: -1, apo: 2 }, text: "They step back. The wolves step closer." },
  },
  {
    id: "certainty", tier: 0, art: "eye", who: "A Coherent Theory",
    text: "The baker's boy is an Inquisition informer. It all fits. It arrived very fast.",
    left: { label: "The Two-Column Test", fx: { gnosis: 1, strain: 1 }, text: "Column A: he looked twice. Column B: everything else. Doubting yourself on purpose is slow, tiring work." },
    right: {
      label: "Act on it",
      roll: { stat: "fortune" },
      hit: o("You were right. This time. You change your bread route.", { untag: 2, apo: 1 }),
      mid: o("Inconclusive. You were rude to a child.", { apo: 1 }),
      miss: o("He was just a baker's boy. The street saw it.", { apo: 1, mark: 2 }),
    },
  },
  {
    id: "overbuild", tier: 0, art: "scroll", who: "The Ward-Map",
    text: "Two nights perfecting the map of safe doors instead of walking to any of them.",
    when: (s) => s.day >= 2,
    left: { label: "One more revision", fx: { strain: -1, mark: 1 }, text: "It's soothing. The world moved while you perfected the model of it." },
    right: { label: "Go walk it", fx: { untag: 1, hollow: 1 }, text: "You walk it. Two of the doors are actually open, which the map never told you." },
  },

  // ================= the long war: allies, ghosts, demons, and the Masks' own roads =================
  // A Bond (fx bond) is someone who will catch you once: the Sister stops a Naming, the Sponsor a
  // Fracture, the Open Table a nightfall that would end you. Earn all three and a room at the House,
  // rest through a night, and you've reached Ordinary Time.

  // ---------------- the Sororal Watch (the Sister) ----------------
  {
    id: "watch_book", tier: 1, art: "rose", who: "The Sororal Watch",
    text: "A woman you half know slides a little black book across the table. Names, descriptions, what each of them did. “Add yours. Take what you need.”",
    when: (s) => !s.flags.watch1,
    weight: 3,
    left: { label: "Add the ones you know", fx: { untag: 1, strain: 1, set: { watch1: true } }, text: "Three names, in your hand. Some woman you'll never meet doesn't get in that carriage." },
    right: { label: "Just read it", fx: { strain: -1 }, text: "Two of your regulars are in it. You'd had a feeling about both." },
  },
  {
    id: "watch_warn", tier: 2, art: "rose", who: "The Sororal Watch",
    text: "Word comes down the line. The man you're meeting tonight is in the book. Twice.",
    when: (s) => s.flags.watch1 && !s.flags.watch2,
    weight: 3,
    left: { label: "Cancel. Thank her.", fx: { favor: -1, strain: -1, set: { watch2: true } }, text: "You lose the fee and keep everything else. You send her a thank-you she won't answer, which is how you know she's busy." },
    right: {
      label: "Go anyway, ready",
      roll: { stat: "steel" },
      hit: o("He behaves. You were ready if he didn't, and he could tell.", { favor: 2 }),
      mid: o("He tries it. You leave early with half and a story for the book.", { favor: 1, strain: 2 }),
      miss: o("The book was right. You get out. It costs.", { strain: 2, mark: 2 }),
    },
  },
  {
    id: "watch_sister", tier: 0, art: "rose", who: "A Sister", once: true,
    text: "She walks you home past the dye-yards without being asked. At your door: “Same time Thursday?”",
    when: (s) => s.flags.watch1 && !earned(s, "sister"),
    weight: 8,
    left: { label: "Same time Thursday", fx: { bond: "sister", longing: -1 }, text: "Somebody knows your route, on purpose. That's a different thing from being tracked." },
    right: { label: "“I work alone.”", fx: { untag: 1, longing: 1 }, text: "You do. Nobody else knows your route, and that counts for something. It'll be heavier every other night." },
  },
  {
    id: "watch_call", tier: 1, art: "rose", who: "The Sororal Watch",
    text: "A sister's in trouble across the river. The Watch is calling everyone who can stand in a doorway and look large.",
    when: (s) => earned(s, "sister"),
    left: { label: "Go", fx: { strain: 1, hollow: 1, untag: 1 }, text: "An hour in a doorway. Nothing happens. That was the job, and it worked." },
    right: { label: "Not tonight", fx: { longing: 1 }, text: "Somebody else went. You'll hear how it went, and you'll hear who didn't." },
  },

  // ---------------- the Lantern Rooms (the Sponsor) ----------------
  {
    id: "rooms_door", tier: 0, art: "lantern", who: "The Lantern Rooms",
    text: "A basement under the cooper's. Folding chairs, bad tea, a lantern on a crate. Everyone down here has tasted the counterfeit sun.",
    when: (s) => !s.flags.rooms && (s.tolerance >= 1 || s.strain >= 2 || s.hollow >= 2),
    weight: 3,
    left: { label: "Sit in the back", fx: { strain: -1, set: { rooms: true } }, text: "Nobody makes you talk. Somebody says your exact thought out loud, which is worse and better." },
    right: { label: "Not your people", fx: { favor: 1 }, text: "You work the hour instead. They're exactly your people. That's the problem." },
  },
  {
    id: "rooms_token", tier: 0, art: "lantern", who: "The Lantern Rooms", once: true,
    text: "They hand a white token to anyone who wants to start over tonight. No speech required.",
    when: (s) => s.flags.rooms,
    weight: 3,
    left: { label: "Take the white token", fx: { gnosis: 1, set: { token: true } }, text: "It weighs nothing. You'll carry it in your boot. From now on, when the Light comes calling, you hold a little steadier." },
    right: { label: "Starting over is for people with time", fx: { favor: 1, longing: 1 }, text: "You slip out early for a late fare. You've started over eleven times. This could have been twelve." },
  },
  {
    id: "rooms_sponsor", tier: 0, art: "lantern", who: "An Old-Timer", once: true,
    text: "An older woman with a smoker's laugh writes a number on your wrist. “Call before. Not after.”",
    when: (s) => s.flags.rooms && !earned(s, "sponsor"),
    weight: 8,
    left: { label: "Call her tomorrow", fx: { bond: "sponsor" }, text: "She answers on the second ring and talks about her tomatoes for twenty minutes. That's the whole point, it turns out." },
    right: { label: "Wash it off", fx: { strain: -1, longing: 1 }, text: "Three scrubs, and the relief of owing nobody. You remember the first four digits anyway." },
  },
  {
    id: "rooms_share", tier: 0, art: "lantern", who: "The Lantern Rooms",
    text: "Your turn to talk. The room waits. Somebody's chair creaks.",
    when: (s) => s.flags.rooms,
    left: { label: "Tell it plainly", fx: { strain: -1, gnosis: 1 }, text: "No flourish. A man in the front row nods like you read his mail." },
    right: { label: "Do the funny version", fx: { strain: -2, longing: 1 }, text: "They laugh in all the right places. Walking home, you notice you skipped the part that mattered." },
  },
  {
    id: "rooms_slip", tier: 1, art: "sun", who: "The Day After",
    text: "You went back to the Light. The Rooms meet tonight. Everyone will know by your face.",
    when: (s) => s.flags.rooms && s.reckoning > 0,
    weight: 4,
    left: { label: "Go anyway", fx: { strain: 1, longing: -1 }, text: "You take a white token again. Nobody claps louder for the first one than the second." },
    right: { label: "Hide until it's gone", fx: { longing: 1, hollow: 1 }, text: "Shame is the Light's best salesman. It never needs a day off." },
  },

  // ---------------- the Open Table (the heretic chapel) ----------------
  {
    id: "table_bread", tier: 0, art: "cup", who: "The Open Table",
    text: "A chapel with a rainbow nailed above a saint. Bread and wine, and the priest says “everyone” and means it. Even you. Especially you.",
    when: (s) => !s.flags.table,
    weight: 3,
    left: { label: "Go up to the rail", fx: { hollow: -1, set: { table: true } }, text: "Nobody checked your name against anything. It's the other communion. This one doesn't send a bill." },
    right: { label: "Stay in the pew", fx: { strain: -1 }, text: "You watch. Next week, maybe." },
  },
  {
    id: "table_auntie", tier: 0, art: "cup", who: "The Open Table", once: true,
    text: "After service they need someone to cut sandwiches and run the door. Somebody says you'd be good at it. They're right.",
    when: (s) => s.flags.table && !earned(s, "table"),
    weight: 8,
    left: { label: "Run the door", fx: { bond: "table", hollow: 1 }, text: "You're the church auntie now. Nobody gets past you who shouldn't, and nobody leaves hungry." },
    right: { label: "“I'm not the type.”", fx: { longing: 1 }, text: "You're exactly the type. You'll figure that out on your own time." },
  },
  {
    id: "table_sermon", tier: 0, art: "cup", who: "The Open Table",
    text: "The priest preaches on the Architect's ledger and the Christ who tore it up. Half the pews look uncomfortable. You don't.",
    when: (s) => s.flags.table,
    left: { label: "Amen", fx: { strain: -1 }, text: "Wisdom isn't whatever you already wanted. Tonight it happens to agree with you." },
    right: {
      label: "Argue the footnotes after",
      roll: { stat: "freq" },
      hit: o("She takes notes. On you. Next week's sermon has your fingerprints on it.", { gnosis: 2 }),
      mid: o("A good argument. The coffee went cold. You'll be chewing on it all week.", { gnosis: 1, strain: 1 }),
      miss: o("You win the point and lose the room. The deacon's wife stops saving you a seat.", { apo: 1, longing: 1 }),
    },
  },

  // ---------------- the House ----------------
  {
    id: "house_door", tier: 0, art: "house", who: "The House",
    text: "A house for people getting out of the Light. Peer-run. Rent at the new moon, a meeting every Sabbath, and seven people voted you into the empty room.",
    when: (s) => !s.flags.house && s.day >= 2 && s.favor >= 3,
    weight: (s) => 2 + (s.bonds.length + (s.spent || []).length) * 2,
    left: { label: "Pay the deposit", fx: { favor: -2, hollow: -1, set: { house: true } }, text: "A key, a shelf in the pantry, an address. Tomorrow means something when it has an address." },
    right: { label: "Too many rules", text: "The Warrens have rules too. Nobody votes on those." },
  },
  {
    id: "house_rent", tier: 0, art: "house", who: "The House",
    text: "Rent's due at the new moon. The treasurer is nineteen, carries a ledger, and has very strong feelings about it.",
    when: (s) => s.flags.house,
    weight: 2,
    left: { label: "Pay it", fx: { favor: -1 }, text: "Paid. The receipt has a smiley face on it." },
    right: {
      label: "Ask for a week",
      roll: { stat: "wits" },
      hit: o("Granted, on a contract. You sign it like a grown woman.", {}),
      mid: o("Granted, after a meeting about it.", { strain: 1 }),
      miss: o("Denied. That's a strike.", { strain: 1, set: { strike: true } }),
    },
  },
  {
    id: "house_meeting", tier: 3, art: "house", who: "The House Meeting",
    text: "Emergency house meeting. The agenda is you.",
    when: (s) => s.flags.house && s.flags.strike,
    weight: 6,
    left: { label: "Own it plainly", fx: { strain: 1, gnosis: 1, unset: "strike" }, text: "What happened, what it cost, what you'll do. No flourish, no counter-suit. They vote to keep you." },
    right: {
      label: "Prosecute the treasurer",
      roll: { stat: "steel" },
      hit: o("You win, and everybody watched you win. Nobody will forget that, in either direction.", { apo: 1, unset: "strike" }),
      mid: o("A draw. The strike stands, and so does the treasurer.", { apo: 1, strain: 2 }),
      miss: o("You won the argument and lost the room. Out by the Sabbath.", { strain: 2, hollow: 1, unset: ["house", "strike"] }),
    },
  },
  {
    id: "house_chores", tier: 0, art: "house", who: "The Chore Wheel",
    text: "You drew the bathroom again. You suspect the wheel.",
    when: (s) => s.flags.house,
    left: { label: "Do it right", fx: { strain: -1 }, text: "Clean tile. Boring, small, yours. Nobody files a report on a clean bathroom." },
    right: { label: "Trade it for a favor", fx: { favor: -1, longing: -1 }, text: "You do her laundry run instead. You learn about her kid. A trade is also a conversation." },
  },

  // ---------------- ghosts: the Old Banner ----------------
  {
    id: "banner1", tier: 1, art: "flag", who: "The Old Banner", once: true,
    text: "Faces from the yard you grew up in. Same songs, same jokes, same flag stitched on a jacket. “You went soft. Come home.”",
    when: (s) => s.day >= 2,
    weight: 2,
    left: { label: "Walk on", fx: { longing: 1 }, text: "Belonging was always the hook." },
    right: { label: "One drink with them", fx: { strain: -1, apo: 1, set: { banner: 1 } }, text: "It's easy. It explains everything. That's what's wrong with it." },
  },
  {
    id: "banner2", tier: 2, art: "flag", who: "The Old Banner", once: true,
    text: "They've picked out a target. Somebody weaker, somebody different. “You used to be the smart one.”",
    when: (s) => s.flags.banner === 1,
    weight: 5,
    left: {
      label: "Lay it down, out loud",
      roll: { stat: "freq" },
      hit: o("You tell them you were wrong back then. They look at you like a traitor. Good.", { gnosis: 1, apo: -1, unset: "banner" }),
      mid: o("You say it badly, and you say it. They let you leave.", { strain: 1, unset: "banner" }),
      miss: o("They laugh it off and follow you out. Some of them know where you sleep.", { mark: 1, strain: 2, unset: "banner" }),
    },
    right: { label: "Point at the target", fx: { apo: 2, favor: 1, set: { banner: 2 } }, text: "The certainty comes back like it never left. Gnosis doesn't grow in that soil." },
  },
  {
    id: "banner3", tier: 3, art: "flag", who: "The Old Banner", once: true,
    text: "Now they want you to lead. Somebody has to tell them who's to blame, and you were always good with words.",
    when: (s) => s.flags.banner === 2,
    weight: 6,
    left: { label: "Burn the jacket", fx: { strain: 2, gnosis: 1, apo: -2, unset: "banner" }, text: "Wool stinks when it burns. It burns anyway. You were wrong, and you're done being wrong." },
    right: { label: "Lead them", fx: { end: "flag" }, text: "You pick up the flag." },
  },

  // ---------------- ghosts: an old contact ----------------
  {
    id: "runner1", tier: 1, art: "hand", who: "An Old Contact", once: true,
    text: "Somebody from the old circuit. Same corner, same grin. “Got work. Got the other thing, too. Like old times.”",
    when: (s) => s.favor <= 2 || s.hollow >= 2,
    weight: 3,
    left: { label: "Delete the route", fx: { strain: 1, untag: 1 }, text: "You don't walk that corner anymore. It adds twenty minutes. It's worth every one." },
    right: { label: "Just the work", fx: { favor: 3, mark: 1, set: { runner: true } }, text: "Fast money. Faster than the honest kind, which is the entire sales pitch." },
  },
  {
    id: "runner2", tier: 2, art: "sun", who: "An Old Contact", once: true,
    text: "Tonight's pay comes with a pinch of the counterfeit sun folded into the paper. “On the house.”",
    when: (s) => s.flags.runner && s.communion === 0,
    weight: 5,
    left: {
      label: "Hand it back",
      roll: { stat: "steel", light: true },
      hit: o("You hand it back and walk. Your hands shake for a block. Then they don't.", { strain: -1, unset: "runner" }),
      mid: o("You hand it back. He shrugs, like he knows he'll see you again. Your hands know it too.", { strain: 1, gnosis: 1 }),
      miss: o("You meant to hand it back.", { commune: true }),
    },
    right: { label: "Take it all", fx: { favor: 2, commune: true }, text: "Everything is gold again. You know how this song goes. You know the bridge." },
  },
  {
    id: "runner3", tier: 3, art: "hood", who: "The Raid", once: true,
    text: "Wagons on the old corner. They're taking everyone who's been seen there this month.",
    when: (s) => s.flags.runner && s.day >= 3,
    weight: 5,
    left: {
      label: "Run",
      roll: { stat: "shade" },
      hit: o("Over a wall and through a laundry. Your name stays off the list.", { strain: 1, unset: "runner" }),
      mid: o("You get clear. Somebody shouts your old name.", { mark: 2, unset: "runner" }),
      miss: o("The wagon doesn't ask why you were there.", { end: "corner" }),
    },
    right: { label: "Stand still, look boring", fx: { mark: 1, favor: -2, unset: "runner" }, text: "A fine and a cold night on a bench. You're nowhere near the corner when the wagons come back." },
  },

  // ---------------- ghosts: the dead and the record ----------------
  {
    id: "dead1", tier: 0, art: "grave", who: "Two Candles", once: true,
    text: "An anniversary, or close enough. There are fewer people left every year who remember how they laughed.",
    when: (s) => s.day >= 2,
    left: { label: "Light them. Say the names.", fx: { strain: 1, gnosis: 1, longing: -1 }, text: "Heavy, and honest. For once the weight is the right shape." },
    right: { label: "Work through it", fx: { favor: 1, longing: 1, set: { grief: true } }, text: "Busy is a good place to put it. It'll keep." },
  },
  {
    id: "dead2", tier: 1, art: "grave", who: "A Ghost in the Market", once: true,
    text: "The grief you put off is back, wearing a stranger's coat. Same walk. You almost call out.",
    when: (s) => s.flags.grief,
    weight: 4,
    left: { label: "Sit down on the curb", fx: { strain: 1, longing: -1, unset: "grief" }, text: "Ten minutes on a curb in the middle of the market. Nobody arrests you for crying, which is a surprise." },
    right: { label: "Keep walking", fx: { favor: 1, strain: 1, longing: 1 }, text: "You make your appointment on time. It walks with you the whole way." },
  },
  {
    id: "archive", tier: 0, art: "scroll", who: "The Archive",
    text: "You could write down everything that happened, in order, before the city's version replaces yours.",
    when: (s) => s.gnosis >= 3,
    left: { label: "Write it down", fx: { gnosis: 1, hollow: 1 }, text: "Your ledger, not theirs. It cost a night's sleep and it's yours. They can't edit it." },
    right: { label: "Sleep instead", fx: { strain: -1 }, text: "The record can wait. You can't." },
  },
  {
    id: "record1", tier: 3, art: "scroll", who: "The Magistrate's Brand", once: true,
    text: "An old conviction turns up in a clerk's drawer. Your record is your record. What's left to decide is whose story it is.",
    when: (s) => s.day >= 2,
    left: { label: "State it plainly, once", fx: { strain: 1, gnosis: 1, set: { record: true } }, text: "Fact, consequence, done. You don't hand them jurisdiction along with the paperwork." },
    right: {
      label: "Deny it",
      roll: { stat: "shade" },
      hit: o("It slides back into the drawer. For now.", {}),
      mid: o("They file it, and the denial, together.", { mark: 1, set: { record: true } }),
      miss: o("Now there's a lie stapled to the record.", { mark: 2, strain: 1, set: { record: true } }),
    },
  },
  {
    id: "record2", tier: 1, art: "scroll", who: "The Brand Follows",
    text: "The chandler was hiring. Then he saw the brand.",
    when: (s) => s.flags.record,
    weight: 2,
    left: { label: "Next door", fx: { strain: 1 }, text: "Next door wasn't hiring either. Next door never is." },
    right: {
      label: "Ask for the owner",
      roll: { stat: "freq" },
      hit: o("She did time too. You start Monday.", { favor: 2 }),
      mid: o("Not now. Maybe after the season. She actually means it.", { longing: -1 }),
      miss: o("He calls the watch about the woman who wouldn't leave.", { mark: 1, strain: 1 }),
    },
  },

  // ---------------- demons ----------------
  {
    id: "sleepless", tier: 1, art: "horn", who: "Sleepless",
    text: "The fourth hour. You haven't slept, and you've never thought so clearly. Everything connects.",
    when: (s) => s.noRestDays >= 1 || s.hollow >= 2,
    weight: 2,
    left: { label: "Lie down anyway", fx: { hollow: -1, rest: true }, text: "You lie in the dark, furious. You wake up dumber and safer." },
    right: { label: "Follow the thread", fx: { strain: 1, hollow: 1, apo: 1, untag: 2 }, text: "By dawn you have a theory of everything, a map of every patrol on the east side, and a headache. Two of those are real." },
  },
  {
    id: "campaign", tier: 1, art: "horn", who: "The Campaign",
    text: "He's beaten. Blocked, logged, warned off. You could still make sure everybody knows.",
    when: (s) => s.untag >= 4 && s.day >= 2,
    weight: 2,
    left: { label: "Stop. It worked.", fx: { gnosis: 1 }, text: "The remedy worked, so you stop prosecuting. It's the hardest win on the board." },
    right: { label: "Finish him in public", fx: { apo: 2, mark: 1, strain: -2 }, text: "It feels incredible. Everyone watched, including the ones who keep files." },
  },
  {
    id: "burn", tier: 1, art: "horn", who: "Intensity",
    text: "It feels true because it burns. At this hour, the taboo and the sacred and the dangerous all read like proof.",
    when: (s) => s.strain >= 3,
    left: { label: "Say it plainly to yourself", fx: { gnosis: 1, strain: 1 }, text: "Plainly, it's a hunch. A good hunch, but only that." },
    right: {
      label: "Trust the burn",
      roll: { stat: "fortune" },
      hit: o("Lucky. The burn was right this time.", { gnosis: 1 }),
      mid: o("Half right. The wrong half was loud.", { apo: 1, strain: 1 }),
      miss: o("Wrong, out loud, in front of people.", { apo: 1, mark: 1, longing: 1 }),
    },
  },
  {
    id: "mirror", tier: 1, art: "horn", who: "The Mirror",
    text: "You got something wrong in front of people who matter. Small, real, and yours.",
    when: (s) => s.turns >= 6,
    left: { label: "Own it. No flourish.", fx: { strain: 1, gnosis: 1, cage: -1 }, text: "What happened, what it cost, how you'll fix it. You keep your jurisdiction. They keep their respect for you." },
    right: { label: "Smile and take the room", fx: { apo: 1, longing: 1 }, text: "Nobody can make you feel small. Nobody can get close, either." },
  },
  {
    id: "omen", tier: 1, art: "horn", who: "Overmeaning",
    text: "She smiled at you after service, and the cards, the stars and the hymn all said the same thing at once.",
    when: (s) => s.longing >= 2,
    left: { label: "Watch what she does", fx: { gnosis: 1 }, text: "Who calls, who shows up, who follows through. You'll know in a month. Signs don't know anything." },
    right: { label: "It's fate", fx: { strain: -1, longing: 2, cage: 1 }, text: "It feels wonderful to be sure. It might even be true. It's also a Tuesday." },
  },

  // ---------------- the Masks' own roads (drawn only while that Mask is worn) ----------------
  {
    id: "nyx_dead", tier: 0, art: "veil", who: "Nyx · the Revenant Road",
    text: "Behind the Veil the Warrens go quiet enough to hear the dead. One of them knows where the patrols sleep.",
    when: (s) => s.mask === "nyx",
    weight: 2,
    left: {
      label: "Listen",
      roll: { stat: "shade" },
      hit: o("What dies walks again, and it walks the patrol routes. You know them all now.", { untag: 2 }),
      mid: o("Half the routes, and a chill you don't shake.", { strain: 1, mark: -1 }),
      miss: o("You listened too long. Something followed you back.", { strain: 2 }),
    },
    right: { label: "Let the dead rest", text: "They keep. Keeping is mostly what they do." },
  },
  {
    id: "nyx_stair", tier: 0, art: "veil", who: "Nyx · the Unlit Stair",
    text: "A stair nobody's mapped, black as a pocket. Behind the Veil you're harder to see than the dark is.",
    when: (s) => s.mask === "nyx" && s.mark >= 2,
    weight: 2,
    left: { label: "Take it", fx: { mark: -2, strain: 1 }, text: "Down, through, and out by the tannery. The Geometry loses the thread." },
    right: { label: "The lit way", fx: { mark: 1 }, text: "Lamps and faces. One of them was writing." },
  },
  {
    id: "eris_apple", tier: 2, art: "blade", who: "Eris · the Golden Apple",
    text: "Two wolves hunting the same street. Each of them would love to know what the other said about him.",
    when: (s) => s.mask === "eris",
    weight: 2,
    left: {
      label: "Roll the apple between them",
      roll: { stat: "steel" },
      hit: o("They spend the week on each other. Sweet discord burns brighter.", { mark: -2, apo: 1 }),
      mid: o("They fight. One of them wonders who started it.", { mark: -1, apo: 1, strain: 1 }),
      miss: o("They compare notes, and your name comes up.", { mark: 2, apo: 1 }),
    },
    right: { label: "Leave them be", text: "Let wolves be wolves somewhere else." },
  },
  {
    id: "eris_outcast", tier: 0, art: "blade", who: "Eris · the Ones Cast Out",
    text: "The ones cast out first are gathering in the old dye-yard. They need somebody loud enough to make it a party.",
    when: (s) => s.mask === "eris",
    weight: 2,
    left: { label: "Make it a party", fx: { strain: -1, longing: -1, mark: 1 }, text: "Music, noise, far too many people for one clerk. For a night, you're nobody's case file." },
    right: { label: "Keep the edge to yourself", fx: { longing: 1 }, text: "Power without connection. Eris knows that tax." },
  },
  {
    id: "lilith_refusal", tier: 3, art: "serpent", who: "Lilith · the First Refusal",
    text: "A decree: every woman in the quarter registers her trade by the Bell. Whoever goes through the door first sets the tone.",
    when: (s) => s.mask === "lilith",
    weight: 2,
    left: {
      label: "Refuse, first and loud",
      roll: { stat: "freq" },
      hit: o("You walk out. Six women walk out behind you. The clerk has nobody left to register.", { gnosis: 2, untag: 1 }),
      mid: o("You refuse. Two follow. The clerk writes down three names.", { gnosis: 1, mark: 1 }),
      miss: o("You refuse alone, in front of the deacons.", { mark: 2, strain: 1 }),
    },
    right: { label: "Register quietly", fx: { cage: 1 }, text: "Name, trade, address. The ledger smiles." },
  },
  {
    id: "lilith_transmute", tier: 0, art: "serpent", who: "Lilith · Transmutation",
    text: "Take the worst thing that happened this week and make it into something with an edge.",
    when: (s) => s.mask === "lilith" && s.strain >= 2,
    weight: 2,
    left: { label: "Make it a song", fx: { strain: -2, gnosis: 1, longing: 1 }, text: "Poison in, medicine out. It still tastes like poison. It works anyway." },
    right: { label: "Let it stay a wound", fx: { strain: 1 }, text: "Some nights you don't make anything out of it. That's allowed. It's just expensive." },
  },
  {
    id: "bare_seen", tier: 0, art: "door", who: "The Bare Face · On Your Terms",
    text: "No mask tonight. Just your own face in the tithe-house window. All of it, and it survived.",
    when: (s) => s.mask === "bare" && s.turns >= 3,
    weight: 2,
    left: { label: "Let them see you", fx: { longing: -1, mark: 1, gnosis: 1 }, text: "Seen, not surveilled. You'd forgotten there was a difference." },
    right: { label: "Lower your eyes", fx: { strain: 1 }, text: "Safe, and smaller. The window doesn't care either way." },
  },
  {
    id: "bare_author", tier: 0, art: "door", who: "The Bare Face · Authorship",
    text: "You've got enough of the story now to tell it yourself. Beauty in resistance is still a draft.",
    when: (s) => s.mask === "bare" && s.gnosis >= 4,
    weight: 2,
    left: { label: "Write the first line", fx: { gnosis: 1, strain: 1 }, text: "Your record. Your order. Your verbs." },
    right: { label: "Later", text: "Later is a real place. You've been there." },
  },

  // ================= the scattered light (2026-10-26) =================
  // The rest of the rulebook's mythology: Wisdom's fallen spark (§2.1) and the Witness (§10.2), the name taken as a title
  // (§3), the Eye in the Empire's own standard (§1.3), the epistemic ward (§2.3), an internal chain (§14.5), debts and the
  // Replacement Map (§15, §19.2), the Contradiction Seat (§19.5), Lightness (§19.1), the Ledger's line (§18), movement
  // (§16), the three arcs (§23), the ritual close (§20.1), and one more road per Mask from her own move or exit (§9).
  // Every one is gated by lit(): the Vigil deals them from SPARK_DAY on, so every earlier night plays exactly as it did
  // (exodus.test.mjs's golden trace holds it), Exodus deals them at once, and a run saved in the old Endless never does.

  // ---------------- the fallen spark ----------------
  {
    id: "spark1", tier: 0, art: "candle", who: "The Scattered Light", once: true,
    text: "In the gutter by the tithe-house, a glint the rain can't put out. Old women say it's a piece of Wisdom, from when she fell. The clerks say it's glass.",
    when: lit((s) => s.day >= 2),
    left: { label: "Pick it up", fx: { gnosis: 1, mark: 1, set: { spark: 1 } }, text: "Warm, like a coin someone just let go of. A clerk watched you kneel in the gutter and wrote down where." },
    right: { label: "Leave it for someone poorer", fx: { strain: -1 }, text: "Somebody will need it more tonight. You walk home lighter, which is a strange thing to get from leaving something behind." },
  },
  {
    id: "spark2", tier: 1, art: "eye", who: "The Witness", once: true,
    text: "A woman at the well sees the glint through your pocket and doesn't ask for it. “Oh,” she says. “You too.” She doesn't want anything. She just saw.",
    when: lit((s) => s.flags.spark === 1),
    weight: 4,
    left: { label: "Let her see", fx: { longing: -1, gnosis: 1, strain: 1, set: { spark: 2 } }, text: "Seen, not catalogued. It costs something to be looked at that plainly. It's worth what it costs." },
    right: { label: "“It's glass.”", fx: { untag: 1, longing: 1, unset: "spark" }, text: "She nods like she's heard that one before. Safe, and lonely in the exact shape you're used to." },
  },
  {
    id: "spark3", tier: 0, art: "candle", who: "The Scattered Light", once: true,
    text: "In the dark the glint is brighter than it has any right to be. You could hold it up and let the quarter see what you carry. Or you could keep turning toward where it came from.",
    when: lit((s) => s.flags.spark === 2),
    weight: 5,
    left: { label: "Orient", fx: { gnosis: 2, apo: -2, strain: 1, rest: true, unset: "spark" }, text: "You address the light. You don't become it. The glint dims to a pulse, which is how you know it's still alive." },
    right: { label: "Hold it up", fx: { apo: 2, mark: 1, strain: -2, unset: "spark" }, text: "For one night you're the brightest thing in the Warrens. The wolves have always loved a lamp." },
  },

  // ---------------- the name ----------------
  {
    id: "venefica1", tier: 3, art: "serpent", who: "The Name", once: true, named: "named_zealot",
    text: "A deacon points across the tithe-queue. “Venefica.” Poisoner. The queue goes quiet to see what you'll do with it.",
    when: lit((s) => s.day >= 2),
    left: {
      label: "Take the name",
      roll: { stat: "freq" },
      hit: o("“Yes,” you say, like he paid you a compliment. The queue laughs at him, not you. The word was meant as a brand. It fits better as a title.", { gnosis: 2, untag: 1, set: { name: true } }),
      mid: o("You take it, a little too loud. It's yours now. So is the deacon's interest.", { gnosis: 1, mark: 1, set: { name: true } }),
      miss: o("You take it, and he writes it down. A title and a file: same word, two ledgers.", { mark: 2, strain: 1 }),
    },
    right: { label: "“Not me.”", fx: { mark: -1, longing: 1 }, text: "He moves on to someone else. The word stays in the queue, unclaimed, waiting for whoever will pick it up." },
  },
  {
    id: "venefica2", tier: 0, art: "serpent", who: "The Name Travels", once: true,
    text: "A girl in the dye-yards has painted a little serpent on a wall and signed it Venefica. She doesn't know it's you. She doesn't need to.",
    when: lit((s) => s.flags.name),
    weight: 4,
    left: { label: "Let it be hers", fx: { gnosis: 1, apo: -1, unset: "name" }, text: "The name was never a crown. It's a working, and now somebody else is working it." },
    right: { label: "Tell her it's you", fx: { longing: -1, apo: 1, mark: 1, unset: "name" }, text: "Her face. You'll keep that for years. So will she, and she talks." },
  },

  // ---------------- the Eye in the Empire ----------------
  {
    id: "standard", tier: 2, art: "eye", who: "The Eye in the Standard", named: "named_zealot",
    text: "A Preliator standard on the processional way, purple and black iron. Woven into the hem, where no deacon ever looks: an eye that isn't theirs.",
    when: lit(),
    weight: 0.6,
    left: { label: "Walk on, knowing", fx: { gnosis: 1, strain: 1 }, text: "It was there the whole parade: the Empire's own banner, carrying a witness it can't see. You carry that home. It's heavy, in a good way." },
    right: {
      label: "Show the woman beside you",
      roll: { stat: "shade" },
      hit: o("One look, one nod, gone into the crowd. Now two people know the Empire is compromised.", { gnosis: 1, untag: 1, longing: -1 }),
      mid: o("She sees it. So does the standard-bearer's sergeant, who sees you pointing.", { gnosis: 1, mark: 1 }),
      miss: o("Pointing at a standard during the litany. They write that down.", { mark: 2, strain: 1 }),
    },
  },
  {
    id: "litany", tier: 1, art: "bell", who: "The Litany",
    text: "The Dominion's litany has a tune, and the tune has hooks. You catch yourself humming it at the well.",
    when: lit(),
    weight: 0.6,
    left: { label: "Hum something else", fx: { strain: 1, gnosis: 1 }, text: "It takes work to keep your own song in your head. That's the point of theirs." },
    right: { label: "Let it play", fx: { strain: -1, cage: 1 }, text: "It's catchy. It's meant to be. By noon you know all the words." },
  },

  // ---------------- the ward and the internal chain ----------------
  {
    id: "three_q", tier: 0, art: "scroll", who: "The Three Questions",
    text: "A broken latch, a letter opened, a man who looked twice. It feels like one hand did all of it. The feeling arrived very fast.",
    when: lit((s) => s.day >= 2),
    weight: 0.6,
    left: { label: "Ask the three questions", fx: { gnosis: 1, strain: 1, apo: -1 }, text: "Did it happen? Is there intent? Is there a thread? Yes, no, no. A broken latch is a broken latch. You fix it." },
    right: { label: "It's one hand", fx: { untag: 1, apo: 1, strain: 1 }, text: "You change the latch, the route and the well. Some of that was smart. You'll never know which part." },
  },
  {
    id: "enemy1", tier: 1, art: "horn", who: "The Enemy", once: true,
    text: "He's been gone a month. Blocked, warned off, moved districts. You still walk past his old door, just to check.",
    when: lit((s) => s.day >= 2 && s.untag >= 2),
    weight: 2,
    left: { label: "Name a goal that isn't him", fx: { gnosis: 1, strain: 1 }, text: "A goal with nobody's name in it. It takes the whole walk home to think of one." },
    right: { label: "Just to check", fx: { untag: 1, strain: -1, set: { enemy: 1 } }, text: "The door's still there. He's still gone. It feels like vigilance. It feels good." },
  },
  {
    id: "enemy2", tier: 2, art: "horn", who: "The Enemy", once: true,
    text: "You know his new address, his new hours, the name of his new dog. You haven't learned one thing about yourself in weeks.",
    when: lit((s) => s.flags.enemy === 1),
    weight: 5,
    left: {
      label: "Turn the compass",
      roll: { stat: "wits" },
      hit: o("You burn the notes. For an hour you don't know where he is, and the Warrens are bigger than they've been in weeks.", { gnosis: 1, apo: -1, unset: "enemy" }),
      mid: o("You burn half. You'd memorized the other half.", { strain: 1, unset: "enemy" }),
      miss: o("You meant to burn them. You read them one more time instead.", { apo: 1, strain: 1, set: { enemy: 2 } }),
    },
    right: { label: "Keep the file", fx: { untag: 1, apo: 1, mark: 1, set: { enemy: 2 } }, text: "It's a good file. Thorough. It reads a lot like the Inquisition's." },
  },
  {
    id: "enemy3", tier: 3, art: "horn", who: "The Enemy", once: true,
    text: "He wins without lifting a finger: every hour of yours points at him. You could set him down. Or you could spend the rest of your life guarding a door he walked out of.",
    when: lit((s) => s.flags.enemy === 2),
    weight: 6,
    left: { label: "Set him down", fx: { strain: 2, gnosis: 2, apo: -2, unset: "enemy" }, text: "You don't forgive him. You just stop carrying him. The weight was never his to begin with." },
    right: { label: "Keep watch", fx: { end: "shadow" }, text: "You take up your post." },
  },

  // ---------------- the people who hold the wall ----------------
  {
    id: "contradiction", tier: 0, art: "rose", who: "The Contradiction Seat",
    text: "Your oldest friend reads your plan for the week and says, “No.” Not unkind. Just no. She's allowed. You gave her the seat.",
    when: lit((s) => s.day >= 2 && (s.apo >= 1 || s.gnosis >= 2)),
    left: {
      label: "Hear her out",
      roll: { stat: "wits" },
      hit: o("She was wrong, and she says so. Your plan holds, and now it's been checked by someone who isn't you.", { longing: -1 }),
      mid: o("One assumption was bad. You fix it. The plan is better and your pride is smaller.", { untag: 1, strain: 1 }),
      miss: o("She was right. You'd have walked straight into it. It stings, and it saved you.", { strain: 1, apo: -1 }),
    },
    right: { label: "Find someone who agrees", fx: { strain: -1, longing: 1, apo: 1 }, text: "There's always someone. It's warm in the echo. Nothing in there ever tells you no." },
  },
  {
    id: "replacement", tier: 0, art: "key", who: "The Replacement Map",
    text: "The ferry boy who got you across the river after dark has gone to sea. He was your only way across.",
    when: lit((s) => s.day >= 2 && !s.flags.onePath),
    weight: 0.6,
    left: { label: "Find a backup tonight", fx: { strain: 2, untag: 1 }, text: "Two names, a cart schedule, and the long bridge as the last resort. Nobody cuts you off with one stone now." },
    right: { label: "Work this side of the water", fx: { favor: 1, set: { onePath: true } }, text: "Saves the fare, for now. There's no second way home." },
  },
  {
    id: "replacement2", tier: 2, art: "hood", who: "The River", once: true, named: "named_hunt",
    text: "Night, the far bank, the Bell close. The only crossing you knew is gone, and a patrol is coming down the quay.",
    when: lit((s) => s.flags.onePath && s.day >= 3),
    weight: 3,
    left: {
      label: "Find another way, now",
      roll: { stat: "wits" },
      hit: o("A laundress with a skiff. A fair price and no questions. Now you know two ways.", { favor: -1, unset: "onePath" }),
      mid: o("The long bridge, past the watch-house. You make the Bell, barely, and they see you make it.", { mark: 1, strain: 1, unset: "onePath" }),
      miss: o("No crossing. A doorway, a cold night, and a patrol that took your name.", { mark: 2, hollow: 1, strain: 1, unset: "onePath" }),
    },
    right: { label: "Pay a stranger with a boat", fx: { favor: -2, cage: 1, unset: "onePath" }, text: "He rows you over and remembers your face, your purse, and where you got off." },
  },
  {
    id: "debt1", tier: 0, art: "coin", who: "A Debt", once: true,
    text: "The chandler's widow is short for the tithe, the kind of short that ends things. You could cover her. She'd owe you, and here owing means something.",
    when: lit((s) => s.favor >= 2),
    left: { label: "Cover her", fx: { favor: -2, set: { debt: true } }, text: "She doesn't thank you. She writes your name in the back of her book, which is better." },
    right: { label: "You can't carry everyone", fx: { longing: 1 }, text: "You can't. You know that. You keep knowing it all evening." },
  },
  {
    id: "debt2", tier: 0, art: "coin", who: "The Debt",
    text: "The widow heard the watch is asking about you. She's at your door with her book open to your page.",
    when: lit((s) => s.flags.debt && (s.mark >= 3 || s.strain >= 4)),
    weight: 4,
    left: { label: "Call it in", fx: { mark: -2, unset: "debt" }, text: "She tells the sergeant you were at her shop all week. She's very boring about it. He leaves." },
    right: { label: "Save it for worse", fx: { strain: -1 }, text: "“Not yet.” She closes the book and makes you tea, which isn't in the book." },
  },
  {
    id: "lightness", tier: 0, art: "cup", who: "Lightness",
    text: "A friend who doesn't need you for anything wants to go watch the barges come in. Just watch them.",
    when: lit(),
    left: { label: "Go watch the barges", fx: { hollow: -1, longing: -1, favor: -1 }, text: "Two hours of nothing useful. Your shoulders come down from around your ears. The market didn't get that part of you today." },
    right: { label: "You have work", fx: { favor: 1, hollow: 1 }, text: "You earn the afternoon. She sends you a drawing of a barge. It's a bad drawing. You keep it." },
  },

  {
    id: "conversion", tier: 0, art: "scroll", who: "The Conversion Principle",
    text: "Three standing commitments this week, and one of them pays nothing at all: no coin, no sleep, no friend, nothing learned. You can't even say what it's for.",
    when: lit((s) => s.day >= 2),
    left: { label: "Drop it", fx: { favor: 1, rest: true }, text: "An evening back. You spend half of it on paid work and half of it asleep. Neither half needed a speech." },
    right: { label: "Keep it, and say why", fx: { gnosis: 1, strain: 1 }, text: "Out loud, it turns out it's the one hour a week nobody bills. Fair enough. You keep it." },
  },

  // ---------------- the Ledger's line, the roads, the arcs ----------------
  {
    id: "boots", tier: 3, art: "coin", who: "The Tolerated Line", named: "named_clerk",
    text: "New boots. Good ones, the first in years. The almoner's clerk looks at your feet a beat too long.",
    when: lit((s) => s.favor >= 4),
    left: { label: "Scuff them in the gutter", fx: { strain: 1, untag: 1 }, text: "Ten minutes of ruining something nice. Back under the line, as far as anybody's feet can tell." },
    right: { label: "Wear them proud", fx: { strain: -1, mark: 1 }, text: "They're beautiful and they're yours. The clerk writes something beside your name." },
  },
  {
    id: "almscart", tier: 0, art: "bell", who: "The Alms-Cart",
    text: "The alms-cart runs to a schedule: same stops, same hour, every day. Reliable. Everybody knows where it stops.",
    when: lit(),
    weight: 0.6,
    left: { label: "Ride it", fx: { hollow: -1, mark: 1 }, text: "Off your feet the whole length of the quarter. At the third stop, the same man gets on as yesterday." },
    right: { label: "Walk", fx: { strain: 1, untag: 1 }, text: "Blisters and no schedule. Nobody can meet you at a stop you didn't take." },
  },
  {
    id: "cartomancer", tier: 0, art: "eye", who: "The Cartomancer", once: true,
    text: "A woman in the market turns three cards for a copper: the Star, Death, Temperance. “Survive. Let it change you. Come back.” She tells everyone the same.",
    when: lit((s) => s.favor >= 1),
    left: { label: "Pay the copper", fx: { favor: -1, gnosis: 1 }, text: "Everybody's road, in the same order. It's worth a copper to hear it out loud." },
    right: { label: "“Read mine. Just mine.”", fx: { strain: -1, longing: 1 }, text: "She does yours for free, a long look and a longer story about how you're special. You are. So was everyone else in the queue. It felt wonderful." },
  },
  {
    id: "ritual", tier: 0, art: "candle", who: "The Close",
    text: "Last night's working is still open: the candle burned down, the circle unbroken, the words of the close never said. The room still hums.",
    when: lit((s) => s.gnosis >= 2),
    left: { label: "Say the close", fx: { strain: -1, rest: true }, text: "“This working is ended.” The hum stops. The room is just a room again, which is what you need to sleep in." },
    right: { label: "Leave it open", fx: { gnosis: 1, longing: 1, strain: 1 }, text: "It's still working. You can feel it. You can also feel it in your teeth at the fourth hour." },
  },

  // ---------------- one more road for each Mask (drawn only while she's worn) ----------------
  {
    id: "nyx_geometry", tier: 0, art: "veil", who: "Nyx · Read the Geometry",
    text: "Behind the Veil the tithe-house is a machine: inputs, outputs, and one clerk who is the only moving part.",
    when: lit((s) => s.mask === "nyx"),
    weight: 2,
    left: {
      label: "Read the machine",
      roll: { stat: "freq" },
      hit: o("Three true things. The ledger shuts at the fifth bell, the clerk can't read cipher, and nobody checks the second drawer.", { untag: 2, gnosis: 1 }),
      mid: o("One true thing: the second drawer.", { untag: 1 }),
      miss: o("You see a pattern that isn't there, and you'd swear to it.", { apo: 1, strain: 1 }),
    },
    right: { label: "Eat something first", fx: { hollow: -1 }, text: "Bread, standing up. The machine can wait. Behind the Veil it's easy to forget you have a body, so you don't." },
  },
  {
    id: "eris_exit", tier: 0, art: "blade", who: "Eris · the Blade's Exit",
    text: "You've been the immovable object all week. The kids in the yard need a referee for their game, and they've picked you.",
    when: lit((s) => s.mask === "eris"),
    weight: 2,
    left: { label: "Referee, badly", fx: { longing: -1, strain: -1, favor: -1 }, text: "You call every foul wrong on purpose. They boo you. It's the best you've felt in days." },
    right: { label: "Keep the edge", fx: { favor: 1, longing: 1 }, text: "Back to work. The Blade doesn't play. That's the whole of her problem." },
  },
  {
    id: "lilith_ledger", tier: 0, art: "serpent", who: "Lilith · the Second Ledger",
    text: "The tithe-man holds out his hand. In his ledger it's a payment. In Lilith's it can be an offering you chose, which is another thing entirely.",
    when: lit((s) => s.mask === "lilith"),
    weight: 2,
    left: {
      label: "Make it your ceremony",
      roll: { stat: "freq" },
      hit: o("You pay him like a blessing. He gets flustered and undercounts. Your ledger, not his.", { gnosis: 2, favor: 1 }),
      mid: o("The working takes, and it opens you a little too wide.", { gnosis: 1, longing: 1 }),
      miss: o("He felt blessed at, and he reported it.", { mark: 1, strain: 1 }),
    },
    right: { label: "Just pay it", fx: { favor: -1, strain: -1 }, text: "Coin, hand, done. Not every exchange has to be a rite. That's its own relief." },
  },
  {
    id: "bare_ask", tier: 0, art: "door", who: "The Bare Face · Just Ask",
    text: "No working tonight, no frequency. You're hungry, and there's a back door with a light on.",
    when: lit((s) => s.mask === "bare" && s.hollow >= 1),
    weight: 2,
    left: {
      label: "Knock and ask",
      roll: { stat: "fortune" },
      hit: o("Simple and kind. The soup is hot and nobody needs your story.", { hollow: -1, longing: -1 }),
      mid: o("You get the soup, and a few questions with it.", { hollow: -1, strain: 1 }),
      miss: o("The door doesn't open. Being a person is a risk too.", { longing: 1, strain: 1 }),
    },
    right: { label: "Don't ask", fx: { untag: 1, longing: 1 }, text: "Nobody owes you soup. Nobody learns you were hungry, either." },
  },

  // ================= word gets around (2026-11-20) =================
  // A city that writes everything down also repeats it. A rumor about you goes from print to the well to a tavern song
  // (a three-card road), plus three cards about passing things on: a copyist, a tally-clerk who pays per name, and a
  // note from someone who made it through. Gated by heard(): the Vigil deals them from SPARK_DAY; Exodus
  // and legacy Endless never do, so Exodus's control hashes and sims are untouched. The always-on cards draw at 0.6, the arc's follow-ups
  // only when it's started, and no careful side charges Hollow (the scattered light's lesson: that was what cost Crowns).

  // ---------------- the rumor ----------------
  {
    id: "rumor1", tier: 1, art: "scroll", who: "The Broadsheet", once: true,
    text: "Page three of the parish broadsheet: a poisoner in the Warrens, tall, fair, works by the river. You are none of those things. It's still about you.",
    when: heard((s) => s.day >= 2),
    weight: 0.6,
    left: { label: "Let it run", fx: { untag: 1, longing: 1, set: { rumor: 1 } }, text: "A wrong description is the best cover there is. Half the quarter is looking for somebody tall. Nobody is looking for you, which is its own kind of lonely." },
    right: { label: "Write in a correction", fx: { gnosis: 1, mark: 1 }, text: "You send one line, unsigned: the poisoner is not tall. The editor prints it. So now the record has one true thing in it, and it came from you." },
  },
  {
    id: "rumor2", tier: 0, art: "cup", who: "The Retelling", once: true,
    text: "At the well a woman tells you the story back, with improvements. In her version the poisoner only ever poisons landlords. People are nodding.",
    when: heard((s) => s.flags.rumor === 1),
    weight: 4,
    left: { label: "Nod along", fx: { strain: -1, cage: 1, set: { rumor: 2 } }, text: "It's a better story than yours. You let them keep it, and it's nice, for an afternoon, to be somebody's hero by accident." },
    right: {
      label: "Tell it straight",
      roll: { stat: "wits" },
      hit: o("You tell it plain: no landlords, nobody's hero, just someone who got through. It goes over better than the legend. People trust a story with boring parts.", { gnosis: 1, longing: -1, unset: "rumor" }),
      mid: o("They believe you, mostly. One of them asks how you know so much.", { gnosis: 1, mark: 1, unset: "rumor" }),
      miss: o("Nobody wants the boring version. Somebody remembers the woman who tried to tell it.", { mark: 2, strain: 1, unset: "rumor" }),
    },
  },
  {
    id: "rumor3", tier: 0, art: "bell", who: "The Song", once: true,
    text: "By now it's a song. Four verses at the Lamplighter's, a chorus everybody knows, and the second verse is wrong about the landlords.",
    when: heard((s) => s.flags.rumor === 2),
    weight: 5,
    left: { label: "Teach them a better verse", fx: { gnosis: 1, apo: 1, unset: "rumor" }, text: "You don't sing it. You hum it to the fiddler once, at the bar, and by closing the whole room has it. The song is truer now, and louder." },
    right: { label: "Let it die out", fx: { strain: -1, longing: 1, unset: "rumor" }, text: "Songs about nobody don't last a season. In a month it'll be a tune with no words, and you'll be someone who doesn't sing along." },
  },

  // ---------------- passing it on ----------------
  {
    id: "copyist", tier: 0, art: "letter", who: "The Copyist",
    text: "The copyist on Tallow Row will copy your notes for the women in the next street, twelve pages for a hot meal. He's quick. He reads everything he copies.",
    when: heard((s) => s.day >= 2),
    weight: 0.6,
    left: { label: "Have them copied", fx: { gnosis: 1, favor: -1, mark: 1 }, text: "Twelve pages go out in four hands. What helped you is somebody else's now. The copyist knows your handwriting, too." },
    right: { label: "Keep them in your coat", fx: { strain: -1, longing: 1 }, text: "Some things only stay safe while they stay in one place. The pages stay warm against you. The women in the next street work it out without them." },
  },
  {
    id: "tally", tier: 2, art: "coin", who: "The Tally-Clerk", named: "named_clerk",
    text: "The Dominion pays a copper a name. A boy you've fed twice is standing at the tally-clerk's table, and he's just seen you.",
    when: heard(),
    weight: 0.6,
    left: { label: "Pay him more not to", fx: { favor: -2, mark: -1 }, text: "Two coppers in his hand, and a third for his sister. He leaves the table without saying anything. It's cheaper than being written down." },
    right: { label: "Trust him", fx: { mark: 1, longing: -1 }, text: "You don't buy him off. He gives the clerk a name, somebody's, maybe yours. Then he comes back for supper like nothing happened, which might be true." },
  },
  {
    id: "pass_on", tier: 0, art: "hand", who: "The Open Table", once: true,
    text: "A folded note, passed under the table: which stairs the patrols skip, which baker gives the end of the loaf. At the bottom, in a different hand: pass it on.",
    when: heard((s) => s.day >= 2),
    weight: 0.6,
    left: { label: "Add a line and pass it on", fx: { longing: -2, strain: 1 }, text: "You add the well with the honest bucket and leave it under someone else's plate. Somebody you'll never meet is going to eat tomorrow." },
    right: { label: "Keep it", fx: { favor: 1, strain: -1 }, text: "You fold it into your shoe. Every stair on it checks out. Whoever wrote it would want you to have it. Probably." },
  },
];

// An ending's hint is all the Endings gallery shows until you've found it.
export const ENDINGS = {
  named: { title: "Named", line: "They wrote down every route and every name you used, and then they came with the paperwork.", hint: "Too many eyes, for too long." },
  named_clerk: { title: "Struck From the Roll", line: "They never drew a blade. Your name simply wasn't on the list anymore.", hint: "A clerk with a reason to remember you." },
  named_hunt: { title: "Hunted", line: "Same stair, same hour, same hood. Somebody started setting a clock by you.", hint: "Be easy to follow." },
  named_zealot: { title: "Denounced", line: "You argued with a zealot in front of a crowd. You might've even won. Now a few hundred people know your face.", hint: "Win an argument with the wrong man." },
  named_scout: { title: "Reconnaissance", line: "One friendly question too many. The danger was what came after the conversation.", hint: "Answer a friendly question." },
  named_darvo: { title: "Reversed", line: "The intake form had no field for “she was right.”", hint: "Keep pressing a file that has turned on you." },
  billet: { title: "Never Lead Them Home", line: "They followed you to the billet. Now they know where you sleep.", hint: "Lead them home." },
  fracture: { title: "Fracture", line: "You ran out of room to carry it. That's a load limit, and everybody has one.", hint: "Carry more than you can." },
  fracture_reckoning: { title: "The Reckoning", line: "The Light was Rex Mundi's own radiance. It relieved you by re-tethering you to the prison.", hint: "Break while the gold drains out." },
  destitute: { title: "Destitute", line: "The tithe came due and there was nothing in the purse to pay it with.", hint: "An empty purse at the Bell." },
  collapse: { title: "The Body's Ledger", line: "You skipped sleep and meals for days and called it handling it. The body sent the whole bill at once.", hint: "Skip sleep until the body decides for you." },
  cage: { title: "The Cage", line: "It felt like relief. Then it felt like home. Then the door locked from the outside.", hint: "Accept every kindness." },
  rex: { title: "A Small Rex Mundi", line: "Terror was your armor, and now you rule a little geometry of your own. The Architect's oldest trap.", hint: "Let them see what you are, again and again." },
  flag: { title: "Under the Old Flag", line: "It gave you a family and an enemy in the same breath. It explained everything and fixed nothing.", hint: "Go home to the old yard, all the way." },
  corner: { title: "The Old Corner", line: "You only went back for the work. The wagon doesn't ask what you went back for.", hint: "Go back to the old corner for the work." },
  shadow: { title: "His Shadow", line: "You beat him a long time ago. You've walked his route every day since, and called it keeping watch.", hint: "Keep watching a man who's already gone." },
  ordinary: { title: "Ordinary Time", line: "A key, a lamp of your own, three people who'd answer at the fourth hour. Tomorrow has an address. Nobody writes songs about it, so you will.", hint: "Three people, a key, and a night's sleep.", win: true },
  crown: { title: "The Double Crown", line: "They never got you into the ledger, and you can see the walls for what they are. You survived long enough to become the author.", hint: "Become untaggable. Wake up.", win: true },
};

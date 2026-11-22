// FALSE LIGHT — the long road's data: three movements (THE STAR, DEATH, TEMPERANCE, §23), the adversaries that close
// them, relics, and the Unmaking of Rex Mundi. Data, plus pure readers of the run; engine.js runs it.
// None of this is ever drawn in an Endless run or a Vigil. These cards live outside CARDS, so the daily deck, its
// numerals and every Vigil play exactly as before (engine.test.mjs replays a golden trace to prove it).
//
// Canon this follows (THE_POISONER_OF_FALSE_LIGHT.md): the Dominion is "a system of clocks and archetypes, not a
// monster to be slain" (§1.2); Rex Mundi rules by persuasion and has no body (§1.1); the way out "is not force and
// not obedience… It ends in return" (§2.1); "You orient toward the light. You do not become it" (§2.2).
//
// A fight card is an ordinary card with enc (whose fight) and phase (which of its phases can deal it). Each side
// carries a verb. The adversary's intent on the card lands unless the side you take answers it; the engine only
// picks intents that exactly one side of the card answers, so every fight card is block or press.
// fx keys added here: clock, road ({ key: n }), resolve, finish, relic, free (one of the Named), ask, inform,
// dossier, seal, classify, pattern, choose (the road out of the Warrens), camp, decline, forceEnd, halve, loseBond,
// gilt, hollowTo, bareEscape. build(s), when a card has one, returns the card as this run sees it.

import { arcOn } from "./arcana.js";

const ao = (text, fx) => ({ text, fx });
const held = (s, k) => s.bonds.includes(k);
// Exodus-only dials. Keep the regular game and the Vigil's dated seeds unchanged.
export const TUNING = { festivalStart: 3, bareFightWeight: 2, hierarchStart: 2, sentinelStart: 2 };
// Edicts (2026-10-17): the Dominion's answer to a heretic who got out. Opt-in difficulty, one at a time: a Way Out
// walked at Edict n unseals Edict n+1, and every Edict below the one chosen stays in force. Each one turns a dial the
// road already has, and each is said where it bites. No Edict ever helps.
export const EDICTS = [
  null,
  { name: "The Patient Office", text: "The Inquisition waits for the fourth night, or a Dossier of 5: longer in the Warrens." },
  { name: "Open Files", text: "Every adversary's own clock starts 1 higher." },
  { name: "Confiscation", text: "You carry one relic, not two." },
  { name: "The Tithe", text: "You start with 1 less Favor." },
  { name: "Short Nights", text: "A rested night clears 1 less Strain." },
  { name: "The Long Way Round", text: "The second movement's adversary waits for six cards on the road, not four." },
  { name: "No Sanctuary", text: "People roads start empty, whoever you've freed." },
  { name: "The Gilded Festival", text: "The Festival starts 1 higher." },
  { name: "Narrow Gates", text: "The Return and holding the gate ask the Pull at 0; the Open Gate, at 2 or less." },
  { name: "Every Door Watched", text: "Walking out alone is certain only at Untaggable 11." },
];
export const MAX_EDICT = EDICTS.length - 1;
export const edict = (s, n) => !!(s.asc && s.asc.edict >= n);
// The Pull a Way Out asks for, under Narrow Gates one lower; with the World read (arcana.js), one higher upright,
// one lower reversed. Never below 0.
const worldOn = (s) => (s.arc ? arcOn(s, "world") : null);
export const pullAt = (s, base) => Math.max(0, base - (edict(s, 9) ? 1 : 0) + (worldOn(s) === "up" ? 1 : worldOn(s) === "rev" ? -1 : 0));
export const relicCap = (s) => (edict(s, 3) ? 1 : 2);
// The Untaggable that makes walking out alone certain, under Every Door Watched two higher.
export const bareAt = (s) => (edict(s, 10) ? 11 : 9) - (worldOn(s) === "up" ? 1 : 0);
// Someone beside you: a Bond held, one of the Named you got out, or (once the Ward-Keeper's Lamp is transmuted) a
// Bond you've already spent.
export const witness = (s) => s.bonds.length > 0 || s.asc.freed >= 1 || (s.asc.lampWitness && (s.spent || []).length > 0);

// The verbs a side can carry, as the choice says them.
export const VERBS = {
  evade: "Evade", confront: "Confront", expose: "Expose", unweave: "Unweave", ally: "Ally", negotiate: "Negotiate",
  endure: "Endure", flee: "Disengage",
};
// The Named: heretics the Geometry has already finished with ("Named", Mark 6, §6.1), named from canon's own pool
// (Appendix D.3). Three are seeded into each run from its seed, each with the ending that put them in the margin.
export const NAMES = ["Maren", "Theodric", "Ysabel", "Clemens", "Solanis", "Petra", "Laud", "Vesper"];
// Lineage (2026-10-17): the heretic walking this Exodus has a name, from the seed, in the register canon gives
// Terra Tenebrae's people (Latin, Occitan, ecclesiastical; Appendix D.3). One who fell is among the Named on the next
// road, and can be got out. Names only: nothing here is power.
export const HEIRS = ["Aude", "Raimon", "Sibylla", "Guillelma", "Bernart", "Fabrisse", "Arnaut", "Cecilia", "Odo", "Ermessen", "Bruna", "Jordana"];
export const NAMED_BY = ["named_clerk", "named_darvo", "named_hunt", "named_scout", "named_zealot", "cage", "catalogued", "gilded"];

// What an adversary does to you this card unless you answer it. says is the short line on the card.
export const INTENTS = {
  command: { name: "The Command", says: "the Muster +1", fx: { clock: 1 }, by: ["endure", "expose"] },
  formation: { name: "Close Ranks", says: "Strain +1, Shade at disadvantage next", fx: { strain: 1, pattern: "shade" }, by: ["evade", "ally"] },
  conscript: { name: "The Levy", says: "the Muster +2", fx: { clock: 2 }, by: ["negotiate", "ally"] },
  doctrine: { name: "Correct Doctrine", says: "Steel −1 this fight", fx: { classify: "steel" }, by: ["unweave", "expose"] },
  align: { name: "Alignment", says: "the Grid +1", fx: { clock: 1 }, by: ["evade", "unweave"] },
  measure: { name: "The Measure", says: "Wits at disadvantage next", fx: { pattern: "wits" }, by: ["expose", "ally"] },
  aperture: { name: "Narrow the Aperture", says: "the Grid +2", fx: { clock: 2 }, by: ["negotiate", "endure"] },
  // the Inquisition (§1.2: "rather catalog you than strike your name")
  naming: { name: "Naming", says: "the File +1", fx: { clock: 1 }, by: ["evade", "expose"] },
  naming2: { name: "Naming", says: "the File +2", fx: { clock: 2 }, by: ["evade", "expose"] },
  pattern: { name: "Your Route, On File", says: "Mark +1, Shade at disadvantage next", fx: { mark: 1, pattern: "shade" }, by: ["confront", "ally"] },
  fee: { name: "Processing", says: "Favor −2", fx: { favor: -2 }, by: ["negotiate", "evade"] },
  seal: { name: "A Seal", says: "next card: answering costs +2 Strain", fx: { seal: true }, by: ["unweave", "confront"] },
  classify: { name: "Class IV", says: "Strain +1, Frequency −1 this fight", fx: { strain: 1, classify: "freq" }, by: ["expose", "ally"] },
  // the False Shepherd: his intents are offers, and unanswered they help, today. "it closes" is the Cage, unseen.
  handle: { name: "Let Me Handle It", says: "Mark −1, Strain −1, it closes +2", fx: { mark: -1, strain: -1, cage: 2 }, by: ["negotiate", "confront"] },
  kindness: { name: "Kindness", says: "Strain −1, Longing +1, it closes +1", fx: { strain: -1, longing: 1, cage: 1 }, by: ["expose", "ally"] },
  sh_isolation: { name: "Isolation", says: "Longing +1, it closes +1", fx: { longing: 1, cage: 1 }, by: ["ally", "confront"] },
  urgency: { name: "Urgency", says: "it closes +1, Wits at disadvantage next", fx: { cage: 1, pattern: "wits" }, by: ["endure", "expose"] },
  // the Ledger (§18: the floor under you is also a leash)
  circle: { name: "A Clerk Circles a Number", says: "the Ledger +1", fx: { clock: 1 }, by: ["evade", "negotiate"] },
  tithe: { name: "The Tithe", says: "Favor −2", fx: { favor: -2 }, by: ["negotiate", "endure"] },
  questions: { name: "Questions at the Almshouse", says: "Strain +1, Wits at disadvantage next", fx: { strain: 1, pattern: "wits" }, by: ["endure", "ally"] },
  boots: { name: "New Boots", says: "the Ledger +2", fx: { clock: 2 }, by: ["evade", "ally"], when: (s) => s.favor >= 4, weight: 2 },
  // Rex Mundi, in your hand: the Grammar speaks the Eight Chains (§14), twice as often the ones this run gave in to
  isolation: { name: "Isolation", says: "Longing +1, the Grammar +1", fx: { longing: 1, clock: 1 }, by: ["ally"], chain: "isolation" },
  monopoly: { name: "One Source of Truth", says: "the Grammar +1, Wits at disadvantage next", fx: { clock: 1, pattern: "wits" }, by: ["expose", "unweave"], chain: "monopoly" },
  debility: { name: "Induced Debility", says: "Hollow +1", fx: { hollow: 1 }, by: ["endure", "ally"], chain: "debility" },
  threats: { name: "A Threat", says: "Strain +2", fx: { strain: 2 }, by: ["confront"], chain: "threats" },
  indulgence: { name: "An Indulgence", says: "Strain −1, Longing +1, Grammar +1", fx: { strain: -1, longing: 1, clock: 1 }, by: ["expose"], chain: "indulgence" },
  omnipotence: { name: "We Know Your Route", says: "Mark +1, the Grammar +1", fx: { mark: 1, clock: 1 }, by: ["evade", "expose"], chain: "omnipotence" },
  degradation: { name: "Degradation", says: "Strain +1, Frequency −1 this fight", fx: { strain: 1, classify: "freq" }, by: ["confront", "ally"], chain: "degradation" },
  trivial: { name: "A Trivial Demand", says: "the Grammar +2", fx: { clock: 2 }, by: ["confront"], chain: "trivial" },
  // the festival of the false sun: every intent is relief. relief: what it says to one keeping the Fast (occult.js),
  // for whom only its clock lands.
  dawn: { name: "False Dawn", says: "Strain −2, Hollow −1, Festival +1", relief: "the Festival +1", fx: { strain: -2, hollow: -1, clock: 1 }, by: ["confront", "expose"] },
  gold: { name: "Gold", says: "Favor +2, the Festival +1", relief: "the Festival +1", fx: { favor: 2, clock: 1 }, by: ["negotiate", "endure"] },
  warmth: { name: "Warmth", says: "Longing −1, the Festival +2", relief: "the Festival +2", fx: { longing: -1, clock: 2 }, by: ["ally", "expose"] },
  glare: { name: "Glare", says: "the Festival +1, Steel at disadvantage next", fx: { clock: 1, pattern: "steel" }, by: ["unweave", "endure"] },
};
// Giving in to a Chain, for the Grammar: card id → side → the Chain it was.
export const COMPLY = {
  trivial: { right: "trivial" }, degradation: { right: "degradation" }, isolation: { right: "isolation" }, indulgence: { right: "indulgence" },
  knowchains: { right: "monopoly" }, devil: { right: "threats" }, extortion: { left: "threats" }, extortion2: { left: "threats" },
  shepherd2: { right: "monopoly" }, shepherd3: { right: "isolation" }, recruiter: { right: "debility" },
};
// Accepting sides the Oldest Trap can quote back to you, in your own handwriting (card id → side).
export const ECHO = {
  menace: "right", zealot: "left", certainty: "right", follower: "right", darvo: "left", campaign: "right", recruiter: "right", shepherd2: "right",
};

// What a road pays when it wins, by its kind, so the road you take is the Way Out you're building toward:
// evade → Untaggable (the door they can't close), know → Gnosis (the Return), people → one of the Named (the gate).
export const PAY = {
  evade: { untag: 2, mark: -1 },
  know: { gnosis: 2, longing: 1 },
  people: { free: 1, mark: 1 },
};

// The adversaries. clock: the threat. key reads a meter the run already has (the Cage, Apotheosis); hidden says
// "it closes" until you've seen it; ends gives the ending by phase; full forces a card instead of an ending.
// roads: three ways to win, one of each kind (tag is the road's name in the panel); the first filled asks whether to
// stop there. phases turn on when(e, s); the last phase's open card is the fight's last. cap: by this card the last
// phase is forced. counter: how it answers a run whose rolls leaned on one Mask's +1 (the Bare Face never has one,
// so she's never countered). danger and counterplay: its lines in the Adversaries sheet (§13: detection, danger,
// counter, impact).
export const ENCOUNTERS = {
  inquisition: {
    name: "The Inquisition", short: "Inquisition", act: 1,
    intro: "Not a man: an organ. It documents, catalogs, and burns. It would rather catalogue you than strike your name, and rather strike your name than draw a blade. The blade is the last step, and it's patient.",
    hint: "Comes for you at the end of the first movement.",
    danger: "The File, 6, fed by your Mark and every card that named you. Full while it catalogues: Catalogued. Full at the roll: Struck From the Roll.",
    clock: { label: "The File", max: 6, ends: ["catalogued", "named_clerk", "named_clerk"] },
    start: (s) => Math.min(3, s.asc.dossier),
    roads: {
      file: { label: "Lose the file", tag: "File", need: 3, kind: "evade" },
      record: { label: "Expose the record", tag: "Record", need: 3, kind: "know" },
      light: { label: "Eyes and light", tag: "Eyes", need: 3, kind: "people" },
    },
    phases: [
      { name: "Catalog", open: "inq_open", intents: ["naming", "pattern", "fee"] },
      { name: "The Roll", open: "inq_roll", when: (e) => e.clock >= 3 || e.turn >= 4, intents: ["naming2", "seal", "classify"] },
      { name: "The Blade", open: "inq_blade", when: (e) => e.clock >= 5 || e.turn >= 6 },
    ],
    cap: 7,
    // Untaggable 9+: there's no category for you, and the file can't be closed. It ends there, as a win.
    unfiled: (s) => s.untag >= 9,
    counter: {
      nyx: { text: "It has read how you move. Lanterns in every corridor: Shade −1 here.", mods: { shade: -1 } },
      eris: { text: "It has read how you fight. Watchmen at every door: Steel −1 here.", mods: { steel: -1 } },
      lilith: { text: "It has read what you say. A censor at the clerk's elbow: Frequency −1 here.", mods: { freq: -1 } },
      mixed: { text: "It couldn't settle on what you are. The File starts 1 lighter.", clock: -1 },
    },
    outcomes: {
      file: { title: "Lost in the Files", text: "Your file went into the bottom drawer, which is where files go to die." },
      record: { title: "The Record, Read Aloud", text: "The clerk's fabrications went into the register, in her own hand. The record didn't change. Everyone who heard it did." },
      light: { title: "Eyes and Light", text: "Too many honest eyes to disappear you quietly. The notice came down, and somebody the roll forgot walked out with you." },
      unfiled: { title: "Unclassifiable", text: "It reached the end of its categories and you were still standing there. The file stays open. Nobody can close it.", fx: { untag: 1, gnosis: 1 } },
      fled: { title: "Disengaged", text: "Never escalate inside a system that has already reversed you. You kept the record and walked." },
      driven: { title: "Driven Out", text: "Out by the dye-yard gate with what you could carry. You're in their margins now." },
    },
  },
  shepherd: {
    name: "The False Shepherd", short: "Shepherd", act: 2, road: "chapter",
    intro: "The softest robe in the room. He doesn't attack your body. He attacks your dependencies, by helping with them. His clock is your Cage, and it closes quietly until you see it.",
    hint: "Waits at the end of the Chapter House road.",
    danger: "The Cage, 8, unseen until you Discern it. Full: The Cage.",
    clock: { label: "The Cage", max: 8, key: "cage", hidden: true },
    start: (s) => s.cage,
    roads: {
      slow: { label: "I move slow", tag: "Slow", need: 3, kind: "evade" },
      discern: { label: "Discern", tag: "Discern", need: 3, kind: "know" },
      distribute: { label: "Distribute", tag: "Spread", need: 3, kind: "people" },
    },
    phases: [
      { name: "The Welcome", open: "sh_open", intents: ["handle", "kindness", "sh_isolation"] },
      { name: "The Better Room", open: "sh_house", when: (e, s) => s.cage >= 5 || e.turn >= 4, intents: ["handle", "kindness", "urgency", "sh_isolation"] },
      { name: "The Locked Door", open: "sh_door", when: (e, s) => s.cage >= 7 || e.turn >= 6 },
    ],
    cap: 7,
    counter: {
      nyx: { text: "He knows you vanish under pressure, and offers to be the place you vanish to: Shade −1 here.", mods: { shade: -1 } },
      eris: { text: "He knows you cut people off, and makes himself the one you haven't cut: Steel −1 here.", mods: { steel: -1 } },
      lilith: { text: "He knows what you're hungry for, and has it in the next room: Frequency −1 here.", mods: { freq: -1 } },
      mixed: { text: "He couldn't find the one lever. The Cage starts 1 lighter.", cage: -1 },
    },
    outcomes: {
      slow: { title: "He Hates Slow", text: "You moved slow, and he reacted badly to slow. It was acquisition all along.", fx: { cage: -2 } },
      discern: { title: "Managed, Not Known", text: "You saw the whole shape: he wanted you managed, not known.", fx: { cage: -2 } },
      distribute: { title: "No Single Point", text: "Your days run through four people now, none of them him. Someone he was keeping walked out with you.", fx: { cage: -2 } },
      fled: { title: "Out the Kitchen Window", text: "Your things in a pillowcase, a long drop and a short street. He'll say he was only trying to help.", fx: { cage: -1 } },
      driven: { title: "Turned Out", text: "He's very sorry it didn't work out. Your things are on the step. So's the bill.", fx: { cage: -1 } },
    },
  },
  ledger: {
    name: "The Ledger", short: "Ledger", act: 2, road: "tithe",
    intro: "Not a person. A procedure with a lot of people in it. While it runs, the Tolerated Line holds: every Favor you gain is also the Ledger +1. Doing well is evidence.",
    hint: "Waits at the end of the Tithe-House road.",
    danger: "The Ledger, 8. While it runs, every Favor you gain moves it +1. Full: the Audit, Wits at disadvantage, whose miss is Struck From the Roll.",
    clock: { label: "The Ledger", max: 8, full: "led_audit" },
    rule: "tolerated",
    start: (s) => Math.min(4, 2 + (s.favor >= 4 ? 1 : 0) + (s.flags.extortPaid ? 1 : 0)),
    roads: {
      boring: { label: "Weaponized boring", tag: "Boring", need: 3, kind: "evade" },
      quiet: { label: "The Quiet Record", tag: "Record", need: 3, kind: "know" },
      clerk: { label: "A sympathetic clerk", tag: "Clerk", need: 3, kind: "people" },
    },
    phases: [
      { name: "The Tolerated Line", open: "led_open", intents: ["circle", "tithe", "boots"] },
      { name: "The Almshouse", open: "led_almshouse", when: (e) => e.clock >= 4 || e.turn >= 4, intents: ["circle", "questions", "tithe", "boots"] },
      { name: "The Last Count", open: "led_final", when: (e) => e.clock >= 6 || e.turn >= 6 },
    ],
    cap: 7,
    counter: {
      nyx: { text: "Your file is suspiciously thin, and thin files get read twice: Shade −1 here.", mods: { shade: -1 } },
      eris: { text: "Your file says 'difficult', so they've sent the large clerk: Steel −1 here.", mods: { steel: -1 } },
      lilith: { text: "Your file says 'irregular sums', and they want your second ledger: Frequency −1 here.", mods: { freq: -1 } },
      mixed: { text: "Your file contradicts itself. The Ledger starts 1 lighter.", clock: -1 },
    },
    outcomes: {
      boring: { title: "The Dullest File in the Drawer", text: "Approved, and forgotten before the ink was dry." },
      quiet: { title: "Two Ledgers", text: "Theirs balances. Yours is true, and when theirs didn't hold, yours did." },
      clerk: { title: "A Clerk With a Conscience", text: "She stamped it, slipped you the date of the next count, and told you about a family the roll forgot." },
      audited: { title: "Audited, and Still Standing", text: "They went through everything. Your registration held. You'll be dreaming about receipts." },
      fled: { title: "Off the Roll, On Your Feet", text: "You walked out before the stamp came down. No pittance. No leash." },
      driven: { title: "Suspended", text: "Suspended. You're still on the roll, the way a hanged coat is still on the hook." },
    },
  },
  hierarch: {
    name: "The Hierarch · Preliator", short: "Hierarch", act: 2, road: "procession",
    intro: "The command travels down the ranks. No soldier wrote it. Every soldier says it was already written. The Hierarch is the arrangement that makes nobody responsible and everybody obey.",
    hint: "At the end of the Processional Way.",
    danger: "The Muster, 8. Orders, levies and closed ranks fill it. Full: Hunted. Read the command, break its pattern, or give the ranks someone to answer to.",
    clock: { label: "The Muster", max: 8, end: "named_hunt" },
    start: () => TUNING.hierarchStart,
    roads: {
      flank: { label: "Leave the formation", tag: "Flank", need: 3, kind: "evade" },
      mandate: { label: "Read the mandate", tag: "Mandate", need: 3, kind: "know" },
      ranks: { label: "Names in the ranks", tag: "Ranks", need: 3, kind: "people" },
    },
    phases: [
      { name: "The Muster", open: "hi_open", intents: ["command", "formation", "conscript"] },
      { name: "The Command", open: "hi_command", when: (e) => e.clock >= 4 || e.turn >= 4, intents: ["command", "formation", "conscript", "doctrine", "seal"] },
      { name: "Break Ranks", open: "hi_last", when: (e) => e.clock >= 6 || e.turn >= 6 },
    ], cap: 7,
    counter: {
      nyx: { text: "The formation has learned your gaps. Shade −1 here.", mods: { shade: -1 } },
      eris: { text: "A shield line waits for the Blade. Steel −1 here.", mods: { steel: -1 } },
      lilith: { text: "Your words have been made into a command. Frequency −1 here.", mods: { freq: -1 } },
      mixed: { text: "The ranks disagree about who to follow. The Muster starts 1 lighter.", clock: -1 },
    },
    outcomes: {
      flank: { title: "An Empty Place in the Formation", text: "The order reaches the place where you were. There is nobody there to obey it." },
      mandate: { title: "No Hand Beneath the Order", text: "Read aloud, the command names no author. The ranks hear the gap." },
      ranks: { title: "People Before Ranks", text: "Somebody says her name instead of her rank. Somebody else answers. One of the Named leaves between them." },
      fled: { title: "Outside the March", text: "You let the procession pass. Its command keeps travelling. You don't travel with it." },
      driven: { title: "Beyond the Shields", text: "Out by the last shield, with the command still ringing in your ears." },
    },
  },
  sentinel: {
    name: "The Geometry Sentinel", short: "Sentinel", act: 2, road: "aperture",
    intro: "No watchman. An aperture, a measure, a seal. The gate keeps changing its dimensions until the person trying to pass becomes the error.",
    hint: "At the end of the Measured Gate road.",
    danger: "The Grid, 8. Alignment and narrowing fill it. Seals price the answering choice; measures tilt a stat. Full: Catalogued. The gate's rules are always said before they land.",
    clock: { label: "The Grid", max: 8, end: "catalogued" },
    start: () => TUNING.sentinelStart,
    roads: {
      gap: { label: "Pass the gap", tag: "Gap", need: 3, kind: "evade" },
      proof: { label: "Show the contradiction", tag: "Proof", need: 3, kind: "know" },
      passage: { label: "Hold the passage", tag: "Passage", need: 3, kind: "people" },
    },
    phases: [
      { name: "The Measure", open: "gs_open", intents: ["align", "measure", "aperture"] },
      { name: "The Seal", open: "gs_seal", when: (e) => e.clock >= 4 || e.turn >= 4, intents: ["align", "measure", "aperture", "seal"] },
      { name: "The Impossible Gate", open: "gs_last", when: (e) => e.clock >= 6 || e.turn >= 6 },
    ], cap: 7,
    counter: {
      nyx: { text: "The gap has been measured to fit your Veil. Shade −1 here.", mods: { shade: -1 } },
      eris: { text: "The edge is part of the calculation. Steel −1 here.", mods: { steel: -1 } },
      lilith: { text: "The gate has indexed your rites. Frequency −1 here.", mods: { freq: -1 } },
      mixed: { text: "The measurements don't agree. The Grid starts 1 lighter.", clock: -1 },
    },
    outcomes: {
      gap: { title: "Between the Measurements", text: "You passed through a space the gate had rounded away." },
      proof: { title: "The Gate Cannot Prove Itself", text: "Its two rules cannot both hold. For one moment, neither does." },
      passage: { title: "An Aperture Held Open", text: "A person holds the space for another person. The gate can measure neither act alone." },
      fled: { title: "Outside the Diagram", text: "You left the route they had drawn. The measure has no answer for outside." },
      driven: { title: "Returned to the Margin", text: "The gate rejected your dimensions. You kept your body." },
    },
  },
  grammar: {
    name: "Rex Mundi · The Grammar", short: "The Grammar", act: 3,
    intro: "He never shows up. He's in the grammar: every form and queue and rule of the festival is written in his syntax, in your handwriting. He didn't build one wall. He built a grammar, and it reads your run back to you.",
    hint: "At the festival of the false sun, in the third movement.",
    danger: "The Grammar, 8, already 2 in, and higher for every Chain you gave in to. It speaks the Chains you gave in to twice as often. Full: Fluent.",
    clock: { label: "The Grammar", max: 8, end: "fluent" },
    start: (s) => 2 + Math.min(3, Object.values(s.asc.chains).reduce((a, b) => a + b, 0)),
    roads: {
      cut: { label: "Cut the chain", tag: "Cut", need: 3, kind: "evade" },
      know: { label: "Know the chains", tag: "Know", need: 3, kind: "know" },
      name: { label: "Reclaim the names", tag: "Names", need: 3, kind: "people" },
    },
    phases: [
      { name: "The Grammar", open: "rg_open", intents: ["isolation", "monopoly", "debility", "threats", "indulgence", "omnipotence", "degradation", "trivial"] },
      { name: "The Full Stop", open: "rg_last", when: (e) => e.clock >= 7 || e.turn >= 4 },
    ],
    cap: 5,
    counter: {
      nyx: { text: "He reads the Veil back to you: every place you were nobody. Shade −1 here.", mods: { shade: -1 } },
      eris: { text: "He reads the Blade back to you: every door you cut. Steel −1 here.", mods: { steel: -1 } },
      lilith: { text: "He reads the Eye back to you: everything you wanted. Frequency −1 here.", mods: { freq: -1 } },
      mixed: { text: "He can't find one sentence that holds all of you. The Grammar starts 1 lighter.", clock: -1 },
    },
    outcomes: {
      cut: { title: "Cut", text: "The chain you could reach, cut clean. It was holding a festival together. It isn't now.", fx: { force: true } },
      know: { title: "Named, It Stops Being Weather", text: "Every chain he used, named in your own words. Named, it's architecture, and architecture can be read." },
      name: { title: "The Names Reclaimed", text: "Your own name, the one from before anybody filed you, said out loud in the middle of his sentence. Somebody in the margin heard it and said theirs." },
      fled: { title: "Not in His Words", text: "You stopped arguing in his grammar and walked out of the sentence. The festival will be louder for it." },
      driven: { title: "Corrected", text: "He corrected your grammar. You'll hear the correction for a while." },
    },
  },
  festival: {
    name: "Rex Mundi · The Festival", short: "The Festival", act: 3,
    intro: "A festival of the false sun: banners, a procession, the counterfeit sun on every lintel. It's his own radiance, the source of every Communion you've taken, and it starts from every one of them.",
    hint: "After the Grammar.",
    danger: "The Festival, 6, starts at 3, and higher for your tolerance and the gilt you owe. Stepping into its light is relief now and the clock +2. Full: Gilded.",
    clock: { label: "The Festival", max: 6, end: "gilded" },
    // 3, not 2: the climax is the hardest fight (2026-10-14 balance, after the review made the exits and stops safe).
    start: (s) => TUNING.festivalStart + (edict(s, 8) ? 1 : 0) + Math.min(3, s.tolerance + Math.floor((s.gilt || 0) / 2)) + (s.asc.fled.includes("grammar") ? 2 : 0),
    roads: {
      hold: { label: "Hold", tag: "Hold", need: 3, kind: "evade" },
      ceremony: { label: "Transmute the festival", tag: "Turn", need: 3, kind: "know" },
      plain: { label: "Tell it plainly", tag: "Plainly", need: 3, kind: "people" },
    },
    phases: [
      { name: "The Festival", open: "rf_open", intents: ["dawn", "gold", "warmth", "glare"] },
      { name: "Noon", open: "rf_noon", when: (e) => e.clock >= 5 || e.turn >= 4 },
    ],
    cap: 5,
    counter: {
      nyx: { text: "The light finds every shadow you've used. Shade −1 here.", mods: { shade: -1 } },
      eris: { text: "The light makes your edge look holy. Steel −1 here.", mods: { steel: -1 } },
      lilith: { text: "The light is everything you've ever wanted, at once. Frequency −1 here.", mods: { freq: -1 } },
      mixed: { text: "The light can't find one shape that's yours. The Festival starts 1 lower.", clock: -1 },
    },
    outcomes: {
      hold: { title: "Held", text: "You held, all the way through the procession. You know exactly what it would have fixed. You always will." },
      ceremony: { title: "Your Ceremony", text: "Banners, procession, the sun on every lintel: you reworked the festival's own material into a ceremony of yours. It's still their material. It isn't saying their words." },
      plain: { title: "Told Plainly", text: "You said what it is in plain words, to the people in the procession. Somebody stepped out of the gold, blinking." },
      fled: { title: "Out of the Procession", text: "You stepped out of the light and stood in a doorway until it passed." },
      driven: { title: "Swept Along", text: "The procession carried you three streets before you got loose. Some of its light came with you.", fx: { apo: 1 } },
    },
  },
  // The Oldest Trap (the menace card's own name; §2.2's failure-mode test): four rungs, no roads, no Disengage. Its
  // clock is the Pull, your own Apotheosis. At 6 you're A Small Rex Mundi.
  trap: {
    name: "Rex Mundi · The Oldest Trap", short: "The Oldest Trap", act: 3,
    intro: "Convince a rebel that she's now the highest authority: that's his oldest trap, and all he has left. Every offer here really helps, and pulls. Refusing costs you something real. At a Pull of 6 you've become a small Rex Mundi.",
    hint: "After the Festival.",
    danger: "The Pull (your Apotheosis), 6. Full: A Small Rex Mundi.",
    clock: { label: "The Pull", max: 6, key: "apo" },
    start: (s) => s.apo,
    roads: {},
    phases: [{ name: "The Oldest Trap" }],
    cap: 4,
    counter: {},
    outcomes: {},
  },
};
// The Oldest Trap's second rung: the first temptation the run's history calls for (§2.2's failure-mode test).
export function temptation(s) {
  const a = s.asc;
  if (a.hist.light >= 2) return "tr_exempt";
  if (s.bonds.length && a.escalated >= 1) return "tr_enemy";
  if (s.favor >= 4) return "tr_contempt";
  return "tr_certain";
}

// Acts. arrive(s) is checked before each draw; when it's true the act's adversary is dealt. The Inquisition comes at
// a dawn (night 3, or sooner for a fat file); the Act II adversary after four cards on its road; Rex Mundi as soon as
// the chapel's night is over. Act II's adversary depends on the road out of the Warrens.
export const ROADS = {
  procession: { name: "The Processional Way", enc: "hierarch", boost: { trivial: 1, degradation: 1, kept: 3, table_bread: 3, rooms_door: 2, cutchain: 2 } },
  aperture: { name: "The Measured Gate", enc: "sentinel", boost: { rota: 3, route: 3, cutchain: 2, knowchains: 2 } },
  chapter: { name: "The Chapter House", enc: "shepherd",
    boost: { shepherd1: 4, shepherd2: 3, shepherd3: 3, isolation: 3, indulgence: 3, recruiter: 3, kept: 2, rooms_door: 2, table_bread: 2 } },
  tithe: { name: "The Tithe-Houses", enc: "ledger",
    boost: { tithe: 4, clerk: 3, commission: 2, kept: 2, devil: 3, extortion: 2, degradation: 3, trivial: 3 } },
};
// Exodus opens up as you walk it (2026-10-17). A first Exodus has the original two roads out of the Warrens and four
// relics; each of these is unsealed for every run after the one that opened it. Sideways, never power: a sealed thing
// is content you haven't reached, not a bonus you haven't earned. opens(s) is read after every card of a run.
export const UNLOCKS = {
  procession: { kind: "road", hint: "Come through a fight in the second movement.", opens: (s) => s.asc.met.some((m) => ENCOUNTERS[m.id] && ENCOUNTERS[m.id].act === 2) },
  aperture: { kind: "road", hint: "Reach the third movement.", opens: (s) => s.asc.act >= 3 },
  lamp: { kind: "relic", hint: "Leave by a Way Out with someone beside you.", opens: (s) => !!(s.over && ASC_ENDINGS[s.over] && ASC_ENDINGS[s.over].win && witness(s)) },
  crown: { kind: "relic", hint: "Reach the Oldest Trap.", opens: (s) => !!(s.asc.enc && s.asc.enc.id === "trap") },
};
export const ORDER_ROADS = ["procession", "aperture"];
const ORDER_SIDE = {
  procession: "The ranks close ahead of you. Somewhere in them, a person.",
  aperture: "The aperture adjusts. It has already decided your dimensions.",
};

export const ACTS = {
  1: { name: "I · The Star", arc: "Survival", enc: "inquisition", dawn: true, arrive: (s) => (edict(s, 1) ? s.day >= 4 || s.asc.dossier >= 5 : s.day >= 3 || s.asc.dossier >= 4) },
  2: { name: "II · Death", arc: "Integration", arrive: (s) => s.asc.actCards >= (edict(s, 6) ? 6 : 4) },
  3: { name: "III · Temperance", arc: "Return", enc: "grammar", arrive: () => true },
};

// Relics: confiscated things, taken back (§9.3, "repurpose a confiscated relic"). You carry two. A working spends one
// of its uses, and only a chapel's Prepare readies them again. A transmutation destroys the relic for good, toward
// freedom (§10.5: "a relic transmuted toward freedom" fills GNOSIS), so every transmutation also gives Gnosis +1.
// pull: carrying it shows the Pull (it trades in Apotheosis).
export const RELICS = {
  glass: { name: "The Confessor's Glass", art: "relic_glass", uses: 2, works: "this card's rolls at advantage", price: "Longing +1",
    transmute: "Longing −2", found: "A confessor's hand-glass, from a chapel they closed. It shows the room a little truer than the room is." },
  key: { name: "The Ophite Key", art: "relic_key", uses: 1, works: "this card's intent counts as answered, or a seal opens", price: "Strain +1",
    transmute: "Untaggable +2", found: "A key cut in the serpent's shape. It doesn't fit their locks. It fits the gaps between them." },
  halo: { name: "The Broken Halo", art: "relic_halo", uses: 1, works: "the adversary's clock −2 (outside a fight, Mark −2)", price: "the Pull +1", pull: true,
    transmute: "the Pull −2", found: "A saint's halo, snapped, tagged as evidence of something. It still remembers being a crown." },
  crown: { name: "The Severed Crown", art: "relic_crown", uses: 1, works: "this card's rolls can't miss (6− counts as 7–9)", price: "the Pull +2", pull: true,
    transmute: "the Pull −1, Mark −1", found: "A crown cut clean through, off a festival float. Wearing it, nothing goes wrong. That's the danger." },
  lamp: { name: "The Ward-Keeper's Lamp", art: "relic_lamp", uses: 1, works: "shows the Cage; the Cage −2, Longing −1", price: "Favor −1",
    transmute: "a spent Bond still stands beside you, for the rest of the run", found: "The lamp from a ward-keeper's window, the one that meant the door was open. It went into evidence when the door stopped opening." },
  purse: { name: "The Almoner's Purse", art: "relic_purse", uses: 1, works: "Favor +3", price: "gilt +3: the Festival starts higher while you owe it, and a Reckoning collects it",
    transmute: "all gilt cleared", found: "An almoner's purse, heavy, tagged as evidence. Somebody's always owed what's in it." },
};

// ---------- the cards ----------
// The next of the Named still in the margin and not yet met on the road (the a_named card's person).
export const nextNamed = (s) => s.asc.named.find((x) => x.st !== "free" && !x.asked) || null;
const freedNames = (s) => s.asc.named.filter((x) => x.st === "free").map((x) => x.n);
// Two relics, picked from the seed and a salt, among the ones you don't carry.
export function relicPair(s, salt) {
  const left = Object.keys(RELICS).filter((r) => !s.asc.relics.includes(r) && !(s.asc.locked || []).includes(r));
  const h = hashStr(`${s.seedLabel}:${salt}`);
  const a = left.splice(h % left.length, 1)[0];
  const b = left.length ? left[(h >>> 8) % left.length] : a;
  return [a, b];
}
// FNV-1a, as engine.js hashes seeds (repeated here so this file stays data with no imports).
const hashStr = (str) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) (h ^= str.charCodeAt(i)), (h = Math.imul(h, 16777619) >>> 0);
  return h >>> 0;
};
const short = (k) => RELICS[k].name.replace(/^The /, "");
// The ending that put each of the Named in the margin, by its gallery title.
const ENDING_NAME = {
  named_clerk: "Struck From the Roll", named_darvo: "Reversed", named_hunt: "Hunted", named_scout: "Reconnaissance",
  named_zealot: "Denounced", cage: "The Cage", catalogued: "Catalogued", gilded: "Gilded",
};

// The Chair: leaving it empty ends on the best Way Out the run has earned; the card says which before you choose.
// Nothing earned, and it's the bare walk away (bareEscape: certain at Untaggable 9, otherwise a Shade roll).
export function chairEnding(s) {
  if (s.gnosis >= 9 && s.apo <= pullAt(s, 1) && witness(s)) return "the_return";
  if (s.asc.freed >= 2 && s.apo <= pullAt(s, 3)) return "open_gate";
  return null;
}
// Walking away with nobody, from the Gate or the Chair: certain at Untaggable 9+ (where they can't classify you at
// all), otherwise a Shade roll whose miss means they were waiting.
const bareEscape = (s, label) =>
  s.untag >= bareAt(s)
    ? { label, verb: "flee", fx: { end: "exodus" }, text: "Out, and nobody follows. Untaggable: they can't hold what they can't file." }
    : {
        label, verb: "flee",
        roll: { stat: "shade" },
        hit: ao("Out, and nobody follows.", { end: "exodus" }),
        mid: ao("Out, with somebody's eyes on your back for a mile. Then not.", { end: "exodus" }),
        miss: ao("They were waiting at the gate.", { end: "catalogued" }),
      };

// The last card of a fight: stand on the road you've built. 2d6 flat, plus that road's pips. A hit wins by that road;
// 7–9 wins it at a cost; a miss drives you out. Standing on nothing, a hit or 7–9 only gets you clear. A miss is
// never an ending.
export function standOn(s, label) {
  const e = s.asc.enc;
  const best = encBestRoad(s);
  const def = e && ENCOUNTERS[e.id];
  if (!best)
    return {
      label: "Stand on nothing", verb: "confront",
      roll: { stat: "fortune" },
      hit: ao("You get clear. Nothing won, nothing lost.", { resolve: "fled", favor: 1 }), // the Favor a Disengage spends, kept
      mid: ao("You get clear, just.", { resolve: "fled" }),
      miss: ao("You're driven out.", { resolve: "driven" }),
    };
  return {
    label: `${label}: ${def.roads[best].label}`,
    verb: "confront",
    roll: { stat: "fortune", mod: e.roads[best] },
    hit: ao("It holds.", { resolve: "best", spoils: true }),
    mid: ao("It holds, and it costs.", { resolve: "best", strain: 1 }),
    miss: ao("It doesn't hold. You're driven out.", { resolve: "driven" }),
  };
}

// The road with the most progress in the fight (ties: the first listed). null when nothing's built.
export function encBestRoad(s) {
  const e = s.asc && s.asc.enc;
  if (!e) return null;
  let best = null;
  for (const [k, v] of Object.entries(e.roads)) if (v > 0 && (!best || v > e.roads[best])) best = k;
  return best;
}

// One offer per relationship. It resolves an existing road and spends the existing emergency catch.
const BOND_ARCS = {
  inquisition: {
    bond: "sister", road: "light", who: "The Sister",
    text: "The clerk wants a quiet witness. The Sister has a copy of your statement. She can read it aloud, but she won't be able to hide you after.",
    label: "Ask her to read it", catch: "Mark",
    slip: "She signs her own name to the copy. Your Mark catch is spent.",
    after: "The Sister's name is on the other copy now.",
  },
  hierarch: {
    bond: "sponsor", road: "mandate", who: "The Sponsor",
    text: "The Sponsor kept the order you brought her. She'll read it back in public. If she does, she can't be your call after lights-out.",
    label: "Ask her to read it back", catch: "Strain",
    slip: "She reads what it says. Nobody can call it your order now. Your Strain catch is spent.",
    after: "The order went back up the ranks with a question attached.",
  },
  shepherd: {
    bond: "table", road: "distribute", who: "The Open Table",
    text: "The Table can move a bed outside his house. It was the one they'd kept for you. They ask before they carry it out.",
    label: "Offer the bed", catch: "nightfall",
    slip: "The bed goes out the back door, then somebody follows it. Your nightfall catch is spent.",
    after: "There's an empty place at the door where the Table kept your bed.",
  },
  ledger: {
    bond: "table", road: "clerk", who: "The Open Table",
    text: "The clerk needs an address for someone the Ledger still counts. The Table can give them your place. They wait for your answer.",
    label: "Give up your place", catch: "nightfall",
    slip: "The clerk crosses out the debt. The Table keeps the place open for its new guest. Your nightfall catch is spent.",
    after: "The Table has somebody else at your place tonight.",
  },
};
export function bondOffer(s) {
  const e = s.asc?.enc;
  if (!(s.asc?.syn?.v >= 2) || !e || e.done || e.auditing || e.isolated || s.asc.occ?.rites.includes("name")) return null;
  const offer = Object.hasOwn(BOND_ARCS, e.id) && BOND_ARCS[e.id];
  if (!offer || !s.bonds.includes(offer.bond) || s.flags[`seen_bond_${offer.bond}`]) return null;
  return e.roads[offer.road] === e.need[offer.road] - 1 ? offer : null;
}

const keepHelp = { label: "Keep your help", fx: {}, text: "They leave the offer there. The choice is still yours." };
export const BOND_CARD = {
  id: "d_bond", forcedOnly: true, noIntent: true, fixed: true, tier: 0, art: "candle",
  who: "An offer of help", text: "The offer has passed. The fight goes on.",
  left: { label: "Continue", fx: {} }, right: { label: "Keep going", fx: {} },
  build(s) {
    const offer = bondOffer(s);
    if (!offer) return this;
    return {
      ...this, enc: s.asc.enc.id, who: offer.who, text: offer.text,
      left: { label: offer.label, tag: `Spend ${offer.catch} catch`, fx: {} },
      right: keepHelp,
    };
  },
};

export const ASC_CARDS = [
  {
    "id": "hi_open",
    "enc": "hierarch",
    "phase": [
      0
    ],
    "forcedOnly": true,
    "noIntent": true,
    "fixed": true,
    "tier": 1,
    "art": "chain",
    "who": "The Muster",
    "text": "Eight orders travel down the line. Every soldier says she is only passing them on.",
    "left": {
      "label": "Read the arrangement",
      "verb": "expose",
      "fx": {
        "road": {
          "mandate": 1
        }
      },
      "text": "Read the arrangement."
    },
    "right": {
      "label": "Step outside its line",
      "verb": "evade",
      "fx": {
        "road": {
          "flank": 1
        }
      },
      "text": "Step outside its line."
    }
  },
  {
    "id": "hi_command",
    "enc": "hierarch",
    "phase": [
      1
    ],
    "forcedOnly": true,
    "noIntent": true,
    "fixed": true,
    "tier": 1,
    "art": "scroll",
    "who": "The Seal",
    "text": "The command has no author. Its seal does.",
    "left": {
      "label": "Name the contradiction",
      "verb": "unweave",
      "fx": {
        "road": {
          "mandate": 1
        },
        "strain": 1
      },
      "text": "Name the contradiction."
    },
    "right": {
      "label": "Keep a space for someone",
      "verb": "ally",
      "fx": {
        "road": {
          "ranks": 1
        },
        "mark": 1
      },
      "text": "Keep a space for someone."
    }
  },
  {
    "id": "hi_last",
    "enc": "hierarch",
    "phase": [
      2
    ],
    "forcedOnly": true,
    "noIntent": true,
    "fixed": true,
    "tier": 1,
    "art": "door",
    "who": "The Last Opening",
    "text": "The ranks are closing. Stand on what you built, or leave before they close.",
    "left": {
      "label": "Disengage",
      "verb": "flee",
      "fx": {
        "resolve": "fled"
      },
      "text": "Disengage."
    },
    build(s) { return { ...this, right: standOn(s, "Stand on what you built") }; },
    "right": {
      "label": "Stand on what you built",
      "verb": "confront",
      "fx": {},
      "text": "Stand on what you built."
    },
    "final": true
  },
  {
    "id": "hi_gap",
    "enc": "hierarch",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "veil",
    "who": "The Unmeasured Space",
    "text": "The rear rank watches the front. Nobody watches the alley behind it.",
    "left": {
      "label": "Take the gap",
      "verb": "evade",
      "roll": {
        "stat": "shade"
      },
      "hit": {
        "text": "Through before the line closes.",
        "fx": {
          "road": {
            "flank": 2
          }
        }
      },
      "mid": {
        "text": "It works, more slowly than you needed.",
        "fx": {
          "road": {
            "flank": 1
          }
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Make them state the rule",
      "verb": "expose",
      "fx": {
        "road": {
          "mandate": 1
        },
        "strain": 1
      },
      "text": "Make them state the rule."
    }
  },
  {
    "id": "hi_witness",
    "enc": "hierarch",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "hand",
    "who": "A Person in the Line",
    "text": "A soldier recognizes someone on the roll. Her shield drops an inch.",
    "left": {
      "label": "Answer her",
      "verb": "ally",
      "roll": {
        "stat": "fortune"
      },
      "hit": {
        "text": "She walks beside you.",
        "fx": {
          "road": {
            "ranks": 2
          }
        }
      },
      "mid": {
        "text": "It works, more slowly than you needed.",
        "fx": {
          "road": {
            "ranks": 1
          }
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Keep your place",
      "verb": "endure",
      "fx": {
        "road": {
          "flank": 1
        }
      },
      "text": "Keep your place."
    }
  },
  {
    "id": "hi_terms",
    "enc": "hierarch",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "scroll",
    "who": "The Terms",
    "text": "The order has three seals and no signature. Ask which seal carries responsibility.",
    "left": {
      "label": "Read it aloud",
      "verb": "unweave",
      "roll": {
        "stat": "wits"
      },
      "hit": {
        "text": "The contradiction is audible.",
        "fx": {
          "road": {
            "mandate": 2
          }
        }
      },
      "mid": {
        "text": "It works, more slowly than you needed.",
        "fx": {
          "road": {
            "mandate": 1
          }
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Offer a smaller demand",
      "verb": "negotiate",
      "fx": {
        "clock": -1,
        "favor": -1
      },
      "text": "Offer a smaller demand."
    }
  },
  {
    "id": "hi_edge",
    "enc": "hierarch",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "blade",
    "who": "The Edge of Order",
    "text": "The shield line expects a charge. Its edges are held by people with tired wrists.",
    "left": {
      "label": "Turn it aside",
      "verb": "confront",
      "roll": {
        "stat": "steel"
      },
      "hit": {
        "text": "Its force opens your way.",
        "fx": {
          "road": {
            "flank": 2
          }
        }
      },
      "mid": {
        "text": "It works, more slowly than you needed.",
        "fx": {
          "road": {
            "flank": 1
          }
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Wait through the count",
      "verb": "endure",
      "fx": {
        "road": {
          "mandate": 1
        },
        "hollow": 1
      },
      "text": "Wait through the count."
    }
  },
  {
    "id": "hi_nyx",
    "enc": "hierarch",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "veil",
    "who": "Nyx · An Unwritten Exit",
    "text": "They count uniforms, shadows, ranks. The Veil borrows the space between the counts.",
    "left": {
      "label": "Leave no shape",
      "verb": "evade",
      "roll": {
        "stat": "shade"
      },
      "hit": {
        "text": "The count loses you.",
        "fx": {
          "road": {
            "flank": 2
          }
        }
      },
      "mid": {
        "text": "It works, more slowly than you needed.",
        "fx": {
          "road": {
            "flank": 1
          }
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Show the missing place",
      "verb": "expose",
      "fx": {
        "road": {
          "mandate": 1
        }
      },
      "text": "Show the missing place."
    },
    "weight": 4,
    when: (s) => s.mask === "nyx"
  },
  {
    "id": "hi_eris",
    "enc": "hierarch",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "blade",
    "who": "Eris · A Clean Severance",
    "text": "An order and the hand enforcing it. The Blade can separate them. Once.",
    "left": {
      "label": "Cut once",
      "verb": "confront",
      "roll": {
        "stat": "steel"
      },
      "hit": {
        "text": "The arrangement opens.",
        "fx": {
          "road": {
            "flank": 2
          }
        }
      },
      "mid": {
        "text": "It works, more slowly than you needed.",
        "fx": {
          "road": {
            "flank": 1
          }
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Give the edge away",
      "verb": "ally",
      "fx": {
        "road": {
          "ranks": 1
        },
        "clock": -1
      },
      "text": "Give the edge away."
    },
    "weight": 4,
    when: (s) => s.mask === "eris"
  },
  {
    "id": "hi_lilith",
    "enc": "hierarch",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "serpent",
    "who": "Lilith · The Rule Reworked",
    "text": "The ranks repeat eight commands. Lilith hears a ceremony that can answer itself.",
    "left": {
      "label": "Rework the terms",
      "verb": "unweave",
      "roll": {
        "stat": "freq"
      },
      "hit": {
        "text": "Their rule speaks your words.",
        "fx": {
          "road": {
            "mandate": 2
          }
        }
      },
      "mid": {
        "text": "It works, more slowly than you needed.",
        "fx": {
          "road": {
            "mandate": 1
          }
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Ask what she wants",
      "verb": "negotiate",
      "fx": {
        "road": {
          "ranks": 1
        },
        "longing": 1
      },
      "text": "Ask what she wants."
    },
    "weight": 4,
    when: (s) => s.mask === "lilith"
  },
  {
    "id": "hi_bare",
    "enc": "hierarch",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "door",
    "who": "The Bare Face · A Person",
    "text": "A woman behind a shield is thirsty. You have no rank to give her. You can ask her name.",
    "left": {
      "label": "Ask her name",
      "verb": "ally",
      "roll": {
        "stat": "fortune"
      },
      "hit": {
        "text": "A person answers.",
        "fx": {
          "road": {
            "ranks": 2
          }
        }
      },
      "mid": {
        "text": "It works, more slowly than you needed.",
        "fx": {
          "road": {
            "ranks": 1
          }
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Say what you need",
      "verb": "negotiate",
      "fx": {
        "road": {
          "flank": 1
        },
        "strain": 1
      },
      "text": "Say what you need."
    },
    "weight": TUNING.bareFightWeight,
    when: (s) => s.mask === "bare"
  },
  {
    "id": "gs_open",
    "enc": "sentinel",
    "phase": [
      0
    ],
    "forcedOnly": true,
    "noIntent": true,
    "fixed": true,
    "tier": 1,
    "art": "door",
    "who": "The Grid",
    "text": "The aperture admits a shadow and rejects the body casting it.",
    "left": {
      "label": "Read the arrangement",
      "verb": "expose",
      "fx": {
        "road": {
          "proof": 1
        }
      },
      "text": "Read the arrangement."
    },
    "right": {
      "label": "Step outside its line",
      "verb": "evade",
      "fx": {
        "road": {
          "gap": 1
        }
      },
      "text": "Step outside its line."
    }
  },
  {
    "id": "gs_seal",
    "enc": "sentinel",
    "phase": [
      1
    ],
    "forcedOnly": true,
    "noIntent": true,
    "fixed": true,
    "tier": 1,
    "art": "scroll",
    "who": "The Seal",
    "text": "A second rule is engraved over the first. They contradict each other.",
    "left": {
      "label": "Name the contradiction",
      "verb": "unweave",
      "fx": {
        "road": {
          "proof": 1
        },
        "strain": 1
      },
      "text": "Name the contradiction."
    },
    "right": {
      "label": "Keep a space for someone",
      "verb": "ally",
      "fx": {
        "road": {
          "passage": 1
        },
        "mark": 1
      },
      "text": "Keep a space for someone."
    }
  },
  {
    "id": "gs_last",
    "enc": "sentinel",
    "phase": [
      2
    ],
    "forcedOnly": true,
    "noIntent": true,
    "fixed": true,
    "tier": 1,
    "art": "door",
    "who": "The Last Opening",
    "text": "The gate is almost shut. Stand on what you built, or step outside the diagram.",
    "left": {
      "label": "Disengage",
      "verb": "flee",
      "fx": {
        "resolve": "fled"
      },
      "text": "Disengage."
    },
    build(s) { return { ...this, right: standOn(s, "Stand on what you built") }; },
    "right": {
      "label": "Stand on what you built",
      "verb": "confront",
      "fx": {},
      "text": "Stand on what you built."
    },
    "final": true
  },
  {
    "id": "gs_gap",
    "enc": "sentinel",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "veil",
    "who": "The Unmeasured Space",
    "text": "The gate measures bodies at the lintel. Its count omits the space below the hinge.",
    "left": {
      "label": "Take the gap",
      "verb": "evade",
      "roll": {
        "stat": "shade"
      },
      "hit": {
        "text": "Through before the line closes.",
        "fx": {
          "road": {
            "gap": 2
          }
        }
      },
      "mid": {
        "text": "It works, with eyes on you.",
        "fx": {
          "road": {
            "gap": 1
          },
          "mark": 1
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Make them state the rule",
      "verb": "expose",
      "fx": {
        "road": {
          "proof": 1
        },
        "strain": 1
      },
      "text": "Make them state the rule."
    }
  },
  {
    "id": "gs_witness",
    "enc": "sentinel",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "hand",
    "who": "A Person in the Line",
    "text": "A traveller is half through the aperture. The gate narrows because another person approached.",
    "left": {
      "label": "Answer her",
      "verb": "ally",
      "roll": {
        "stat": "fortune"
      },
      "hit": {
        "text": "She walks beside you.",
        "fx": {
          "road": {
            "passage": 2
          }
        }
      },
      "mid": {
        "text": "It works, with eyes on you.",
        "fx": {
          "road": {
            "passage": 1
          },
          "mark": 1
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Keep your place",
      "verb": "endure",
      "fx": {
        "road": {
          "gap": 1
        }
      },
      "text": "Keep your place."
    }
  },
  {
    "id": "gs_terms",
    "enc": "sentinel",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "scroll",
    "who": "The Terms",
    "text": "Its first rule admits witnesses. Its second permits only one body at a time.",
    "left": {
      "label": "Read it aloud",
      "verb": "unweave",
      "roll": {
        "stat": "wits"
      },
      "hit": {
        "text": "The contradiction is audible.",
        "fx": {
          "road": {
            "proof": 2
          }
        }
      },
      "mid": {
        "text": "It works, with eyes on you.",
        "fx": {
          "road": {
            "proof": 1
          },
          "mark": 1
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Offer a smaller demand",
      "verb": "negotiate",
      "fx": {
        "clock": -1,
        "favor": -1
      },
      "text": "Offer a smaller demand."
    }
  },
  {
    "id": "gs_edge",
    "enc": "sentinel",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "blade",
    "who": "The Edge of Order",
    "text": "The aperture closes around an iron edge. One point takes the whole calculation.",
    "left": {
      "label": "Turn it aside",
      "verb": "confront",
      "roll": {
        "stat": "steel"
      },
      "hit": {
        "text": "Its force opens your way.",
        "fx": {
          "road": {
            "gap": 2
          }
        }
      },
      "mid": {
        "text": "It works, with eyes on you.",
        "fx": {
          "road": {
            "gap": 1
          },
          "mark": 1
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Wait through the count",
      "verb": "endure",
      "fx": {
        "road": {
          "proof": 1
        },
        "hollow": 1
      },
      "text": "Wait through the count."
    }
  },
  {
    "id": "gs_nyx",
    "enc": "sentinel",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "veil",
    "who": "Nyx · An Unwritten Exit",
    "text": "The Sentinel sees edges, not absences. Nyx leaves an absence with the correct dimensions.",
    "left": {
      "label": "Leave no shape",
      "verb": "evade",
      "roll": {
        "stat": "shade"
      },
      "hit": {
        "text": "The count loses you.",
        "fx": {
          "road": {
            "gap": 2
          }
        }
      },
      "mid": {
        "text": "It works, with eyes on you.",
        "fx": {
          "road": {
            "gap": 1
          },
          "mark": 1
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Show the missing place",
      "verb": "expose",
      "fx": {
        "road": {
          "proof": 1
        }
      },
      "text": "Show the missing place."
    },
    "weight": 4,
    when: (s) => s.mask === "nyx"
  },
  {
    "id": "gs_eris",
    "enc": "sentinel",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "blade",
    "who": "Eris · A Clean Severance",
    "text": "The gate anticipates force against its centre. The Blade touches the hinge.",
    "left": {
      "label": "Cut once",
      "verb": "confront",
      "roll": {
        "stat": "steel"
      },
      "hit": {
        "text": "The arrangement opens.",
        "fx": {
          "road": {
            "gap": 2
          }
        }
      },
      "mid": {
        "text": "It works, with eyes on you.",
        "fx": {
          "road": {
            "gap": 1
          },
          "mark": 1
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Give the edge away",
      "verb": "ally",
      "fx": {
        "road": {
          "passage": 1
        },
        "clock": -1
      },
      "text": "Give the edge away."
    },
    "weight": 4,
    when: (s) => s.mask === "eris"
  },
  {
    "id": "gs_lilith",
    "enc": "sentinel",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "serpent",
    "who": "Lilith · The Rule Reworked",
    "text": "A seal is an instruction held in matter. Lilith changes what the matter can say.",
    "left": {
      "label": "Rework the terms",
      "verb": "unweave",
      "roll": {
        "stat": "freq"
      },
      "hit": {
        "text": "Their rule speaks your words.",
        "fx": {
          "road": {
            "proof": 2
          }
        }
      },
      "mid": {
        "text": "It works, with eyes on you.",
        "fx": {
          "road": {
            "proof": 1
          },
          "mark": 1
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Ask what she wants",
      "verb": "negotiate",
      "fx": {
        "road": {
          "passage": 1
        },
        "longing": 1
      },
      "text": "Ask what she wants."
    },
    "weight": 4,
    when: (s) => s.mask === "lilith"
  },
  {
    "id": "gs_bare",
    "enc": "sentinel",
    "phase": [
      0,
      1
    ],
    "tier": 0,
    "art": "door",
    "who": "The Bare Face · A Person",
    "text": "Another woman has been measured for an hour. The gate has no word for tired. You can ask her name.",
    "left": {
      "label": "Ask her name",
      "verb": "ally",
      "roll": {
        "stat": "fortune"
      },
      "hit": {
        "text": "A person answers.",
        "fx": {
          "road": {
            "passage": 2
          }
        }
      },
      "mid": {
        "text": "It works, with eyes on you.",
        "fx": {
          "road": {
            "passage": 1
          },
          "mark": 1
        }
      },
      "miss": {
        "text": "The arrangement holds.",
        "fx": {
          "clock": 1
        }
      }
    },
    "right": {
      "label": "Say what you need",
      "verb": "negotiate",
      "fx": {
        "road": {
          "gap": 1
        },
        "strain": 1
      },
      "text": "Say what you need."
    },
    "weight": TUNING.bareFightWeight,
    when: (s) => s.mask === "bare"
  },
  // ================= interludes =================
  {
    id: "a_prologue", forcedOnly: true, tier: 0, art: "key", who: "Exodus", fixed: true,
    text: "Survival. Integration. Return. Beyond them, a door the Dominion can't close. Start with one thing they confiscated.",
    build(s) {
      const [x, y] = relicPair(s, "prologue");
      const take = (k) => ({ label: `Take the ${short(k)}`, fx: { relic: k }, text: `${RELICS[k].found} ${RELICS[k].name}: ${RELICS[k].works}, for ${RELICS[k].price}.` });
      // Who walks it, and who walked it last.
      const a = s.asc;
      const p = a.prev;
      const text = !p ? this.text
        : p.won ? `${p.n} got out. The door's still there, and the road to it. Start with one thing they confiscated.`
        : `${p.n} walked this before you, and didn't get out. They're in the margin now. Start with one thing they confiscated.`;
      return { ...this, who: a.self ? `Exodus · ${a.self}` : this.who, text, left: take(x), right: take(y) };
    },
    left: { label: "Take it", fx: {} },
    right: { label: "Take it", fx: {} },
  },
  // A chapel's night between acts. Rest; or Prepare: ready your relics, and take what the fight left you, if you won it.
  {
    id: "a_camp", forcedOnly: true, tier: 0, art: "candle", who: "A Tolerant Chapel", fixed: true,
    text: "A chapel that keeps its own counsel. One night here before the road goes on.",
    build(s) {
      const a = s.asc;
      const k = a.spoils && a.offer.length ? a.offer[0] : null;
      // Never the relic in the occult expansion's vessel (occult.js), which a full slot can't give up.
      const full = k && a.relics.length >= relicCap(s) ? a.relics.find((r) => !(a.occ && a.occ.vessel && a.occ.vessel.k === r)) || null : null;
      let text = a.act === 1 ? "A chapel that keeps its own counsel. One night here before the road goes on. You can feel a chair somewhere, from here." : this.text;
      const last = a.met.at(-1)?.id;
      if (a.syn?.v >= 2 && Object.hasOwn(BOND_ARCS, last) && s.flags[`resolved_bond_${last}`]) text += ` ${BOND_ARCS[last].after}`;
      return {
        ...this,
        text,
        right: k
          ? { label: `Prepare, and take the ${short(k)}${full ? ` (leaves the ${short(full)})` : ""}`, fx: { camp: true, refill: true, relic: k }, text: `Everything you carry, checked and ready. ${RELICS[k].found}` }
          : { label: "Prepare", fx: { camp: true, refill: true }, text: "Everything you carry, checked and ready for whatever's next." },
      };
    },
    left: { label: "Rest", fx: { camp: true, strain: -2, hollow: -1, rest: true }, text: "Behind a door that locks from the inside. You sleep the whole night, which you'd forgotten was possible." },
    right: { label: "Prepare", fx: { camp: true, refill: true }, text: "" },
  },
  // The road out of the Warrens is the Shepherd's own invitation (shepherd3). Going with him is the Chapter House.
  {
    id: "a_cross", forcedOnly: true, tier: 0, art: "candle", who: "A Kind Almoner", fixed: true,
    text: "“Move your things to the chapter house. It's safer. Only, tell no one. They wouldn't understand.”",
    build(s) {
      return { ...this, right: { label: "Go with him", fx: { choose: "chapter", hollow: -1, strain: -1, cage: Math.max(0, Math.min(2, 5 - s.cage)) }, text: "A warm room, and bread, and nobody asking anything. It's such a relief." } };
    },
    left: { label: "“I move slow. I don't do pressure.”", fx: { choose: "tithe" }, text: "His face does something small and fast. You take the long way round, past the tithe-houses, where the tolerated line runs." },
    right: { label: "Go with him", fx: {} },
  },
  // A road still sealed (UNLOCKS) isn't on the map yet: with one of the two ways through order open, the right side
  // takes it straight; with neither, the Warrens open on the almoner's crossroads (engine.js resolveEnc).
  {
    id: "a_routes", forcedOnly: true, fixed: true, tier: 0, art: "door", who: "Roads of the Dominion",
    text: "Bread and accounts behind you. Ahead, the processional way and the measured gate. Every road has someone keeping count.",
    build(s) {
      const open = ORDER_ROADS.filter((r) => !(s.asc.locked || []).includes(r));
      if (open.length !== 1) return this;
      const [r] = open;
      const side = ORDER_SIDE[r];
      return { ...this, text: `Bread and accounts behind you. Ahead, ${ROADS[r].name.replace(/^The /, "the ")}. Another way is sealed for now. Every road has someone keeping count.`, right: { label: ROADS[r].name, fx: { choose: r }, text: side } };
    },
    left: { label: "Bread or accounts", fx: { then: "a_cross" }, text: "The almoner is waiting at the old crossroads." },
    right: { label: "March or measured gate", fx: { then: "a_order" }, text: "You leave the almoner's invitation unanswered." },
  },
  {
    id: "a_order", forcedOnly: true, fixed: true, tier: 0, art: "chain", who: "Two Ways Through Order",
    // (left and right below are ORDER_SIDE's lines)
    text: "Soldiers fill one street. A gate measures everyone in the other. Neither road is safe. Both have a way through.",
    left: { label: "The Processional Way", fx: { choose: "procession" }, text: "The ranks close ahead of you. Somewhere in them, a person." },
    right: { label: "The Measured Gate", fx: { choose: "aperture" }, text: "The aperture adjusts. It has already decided your dimensions." },
  },
  // When a road fills, it asks whether you're done (DEFINE THE STOP, §11; Escalation After Resolution, §14.5).
  {
    id: "a_stop", forcedOnly: true, tier: 0, art: "key", who: "The Stop", fixed: true, stop: true,
    text: "It worked. That's the stop you named. You could keep going.",
    // The header names the outcome; its text is the overlay that follows either choice, so the prompt stays short.
    build(s) {
      const e = s.asc.enc;
      const def = e && ENCOUNTERS[e.id];
      const out = def && e.done && def.outcomes[e.done];
      const card = { ...this, who: out ? out.title : this.who };
      // A people road pays Mark +1 for the exposure. Stopping there, the ones you got out cover your going: stopping is
      // always survivable if you were alive when the road filled. Finishing still pays it twice.
      if (def && def.roads[e.done] && def.roads[e.done].kind === "people")
        card.left = { ...this.left, fx: { ...this.left.fx, mark: -1 }, text: "It ended on your terms. The ones you got out cover your going." };
      return card;
    },
    left: { label: "Stop. It worked.", verb: "endure", fx: { finish: false, strain: -1, favor: 1 }, text: "It ended on your terms. You keep what you didn't spend." },
    right: { label: "Finish it", verb: "confront", fx: { finish: true, strain: 1, mark: 1, apo: 1 }, text: "All the way, and twice what you came for. It feels very good. The escalation is feeding you now, not protecting you." },
  },
  // Act III, the force rung: only after the Grammar was cut.
  {
    id: "a_force", forcedOnly: true, noIntent: true, fixed: true, tier: 1, art: "blade", who: "The Festival, By Force",
    text: "The Grammar's cut. The festival's still on, and you know where every lamp is. With someone beside you and the Pull at 2 or less, stopped stays stopped.",
    // Alone, or pulled, force reproduces the throne: the card says so, and what a hit means.
    build(s) {
      if (witness(s) && s.apo <= 2) return this;
      return {
        ...this,
        text: `The Grammar's cut, and you know where every lamp is. ${witness(s) ? "With the Pull this high" : "Alone"}, whoever stops the festival is the one they seat: a hit is By Decree.`,
        left: { ...this.left, hit: ao("The procession breaks up in the rain, and turns to see who stopped it. There's a chair for that.", { forceEnd: true }) },
      };
    },
    left: {
      label: "Stop it by force", verb: "confront",
      roll: { stat: "steel" },
      hit: ao("The procession breaks up in the rain.", { forceEnd: true }),
      mid: ao("It stops, and starts again two streets over. You'll carry that.", { strain: 2 }),
      miss: ao("It doesn't stop. You're the one everyone's looking at now.", { apo: 2 }),
    },
    right: { label: "Not like that", verb: "endure", fx: { apo: -1 }, text: "Severance, not annihilation. You put it down, which is the harder skill." },
  },
  // The Oldest Trap's third rung: the gate, for the length of one Bell.
  {
    id: "a_gate", enc: "trap", phase: [0], forcedOnly: true, noIntent: true, fixed: true, tier: 0, art: "door", who: "The Bell",
    text: "The Bell's ringing and the gate is open, for once. Past it, a road with no Bell on it.",
    build(s) {
      // The Named follow you through only if you haven't started giving orders: the Pull at 1 or less, the Return's
      // own limit. Above it the gate is a walk, like the chair's.
      const n = s.apo <= pullAt(s, 1) ? freedNames(s) : [];
      const text = !n.length && freedNames(s).length ? `The Bell's ringing and the gate is open. They won't follow someone who's started giving orders: with the Pull past ${pullAt(s, 1)}, it's only you through it.` : this.text;
      const left = n.length
        ? { label: "Hold it for them", verb: "ally", fx: { end: "saved_savior" }, text: `${n.join(" and ")} go${n.length === 1 ? "es" : ""} through. The gate shuts with you on this side.` }
        : bareEscape(s, "Go through");
      return { ...this, text, left, right: { label: "To the chair", verb: "endure", fx: { strain: s.mask === "bare" ? 0 : 1 }, text: "There's one more thing in the square. You go and look at it." } };
    },
    left: { label: "Go through", verb: "flee", fx: {} },
    right: { label: "To the chair", verb: "endure", fx: {} },
  },
  // The last rung. Leaving it empty ends on the best Way Out you've earned, named on the side before you choose.
  {
    id: "a_chair", enc: "trap", phase: [0], forcedOnly: true, noIntent: true, fixed: true, final: true, tier: 1, art: "crown", who: "The Chair",
    text: "Nobody in it. There never was. Only a chair, built to fit whoever's tired enough.",
    build(s) {
      const end = chairEnding(s);
      return {
        ...this,
        right: end
          ? { label: "Leave it empty", verb: "endure", fx: { end }, text: "You leave it there, empty, and go home before the Bell." }
          : bareEscape(s, "Walk away from it"),
      };
    },
    left: { label: "Sit, and open every gate by decree", verb: "confront", fx: { end: "decree" }, text: "It fits. It was built to." },
    right: { label: "Leave it empty", verb: "endure", fx: {} },
  },
  // Taking a win on the long road is a choice: the door, or the road on. Declining costs nothing and pays nothing.
  {
    id: "a_crown", forcedOnly: true, tier: 0, art: "crown", who: "The Double Crown · an early way out", fixed: true,
    text: "Untaggable and awake. The Dominion can't hold you, and you can see the walls. You could stop here, and it would count.",
    left: { label: "Take it", fx: { end: "crown" }, text: "You survived long enough to become the author." },
    right: { label: "Not yet", fx: { decline: "crown" }, text: "The road goes on, and so do you." },
  },
  {
    id: "a_ordinary", forcedOnly: true, tier: 0, art: "house", who: "Ordinary Time · an early way out", fixed: true,
    text: "A key, a lamp of your own, three people who'd answer at the fourth hour. Tomorrow has an address. You could stop here.",
    left: { label: "Take the key", fx: { end: "ordinary" }, text: "Nobody writes songs about it." },
    right: { label: "Keep walking", fx: { decline: "ordinary" }, text: "The room keeps." },
  },

  // ================= the long road's own cards =================
  // One of the Named, met once each: the margin with a face.
  {
    id: "a_named", act: [1, 2], tier: 1, art: "hood", who: "The Named", weight: 3,
    when: (s) => !!nextNamed(s),
    text: "Asleep in the dye-yard under a tarp. The roll forgot them. The patrol comes through at the Bell.",
    build(s) {
      const n = nextNamed(s);
      if (!n) return this;
      const by = n.by || ENDING_NAME[n.end] || "Struck Off";
      return {
        ...this,
        who: `${n.n} · ${by}`,
        text: `${n.n}, asleep in the dye-yard under a tarp. ${n.heir ? "They walked this road before you." : n.informed ? "You gave them that name." : "The roll forgot them."} The patrol comes through at the Bell.`,
        left: {
          label: "Walk them past the patrol",
          roll: { stat: "shade" },
          hit: ao("Past the patrol, past the gate, gone.", { freeName: n.n, ask: n.n }),
          mid: ao("Through, and the patrol got a look at you.", { freeName: n.n, ask: n.n, mark: 1 }),
          miss: ao("They stop you both. Your friend runs. You don't, quite fast enough.", { ask: n.n, mark: 2, strain: 1 }),
        },
        right: { label: "Not tonight", fx: { ask: n.n, untag: 1, longing: 1 }, text: "You'll think about it at the fourth hour." },
      };
    },
    left: { label: "Walk them past the patrol", fx: {} },
    right: { label: "Not tonight", fx: {} },
  },
  {
    id: "a_dossier", act: [1], tier: 1, art: "scroll", who: "The Inquisitor's Clerk", weight: 2, once: true,
    text: "The clerk is copying out a fresh file in a nicer hand than usual. It's for somebody senior. It's yours.",
    left: {
      label: "Read it upside down",
      roll: { stat: "wits" },
      hit: ao("You read the whole thing. Now you know what they know, and what they only think they know.", { gnosis: 1 }),
      mid: ao("Half of it. Enough to be frightened by the right half.", { strain: 1 }),
      miss: ao("She sees you reading. That goes in the file too.", { mark: 1, dossier: 1 }),
    },
    right: { label: "Give her nothing to add", fx: { strain: 1, untag: 1 }, text: "You're the dullest person in the queue. It's exhausting to be that dull on purpose." },
  },
  {
    id: "a_shelf", act: [1, 2], tier: 0, art: "key", who: "A Loose Floorboard", weight: 1, once: true,
    when: (s) => s.asc.relics.length < relicCap(s),
    text: "Under the almshouse floorboards, wrapped in oilcloth: something a woman hid before they took her.",
    build(s) {
      const [k] = relicPair(s, "shelf");
      return { ...this, left: { label: `Take the ${short(k)}`, fx: { relic: k, strain: 1 }, text: RELICS[k].found } };
    },
    left: { label: "Take it", fx: {} },
    right: { label: "Leave it for her", fx: { gnosis: 1 }, text: "It's hers. You put the boards back. That's the whole rite." },
  },
  // Aftermath: what the way you won the first fight leaves on the road (Act II only, once each).
  {
    id: "a_after_evade", act: [2], tier: 1, art: "scroll", who: "A Misfiled Stranger", weight: 4, once: true,
    when: (s) => s.asc.after === "evade",
    text: "Somebody else's file came back with your name in it. They're in the dye-yard, wondering why the patrol keeps asking for you.",
    left: { label: "Walk them to the gate", fx: { free: 1, mark: 1 }, text: "You explain on the way. They laugh, once, at the gate." },
    right: { label: "Let the confusion stand", fx: { untag: 1, longing: 1 }, text: "Two of you is harder to find than one. It isn't fair to them." },
  },
  {
    id: "a_after_know", act: [2], tier: 0, art: "scroll", who: "The Page, Copied", weight: 4, once: true,
    when: (s) => s.asc.after === "know",
    text: "You still have the page you memorised. Written out, it's evidence. Kept in your head, it's just knowing.",
    left: { label: "Copy it out for the queue", fx: { gnosis: 1, mark: 1 }, text: "By morning it's on three doors. By noon, nobody knows who started it." },
    right: { label: "Keep it in your head", fx: { strain: -1 }, text: "Some things are safer known than shown. This one, anyway." },
  },
  {
    id: "a_after_people", act: [2], tier: 0, art: "lantern", who: "The Steps Remember", weight: 4, once: true,
    when: (s) => s.asc.after === "people",
    text: "The people from the watch-house steps nod to you in the street now. One of them asks if you'll stand with her, next time.",
    left: { label: "“Next time.”", fx: { untag: 1, strain: 1 }, text: "You go. Nothing happens. That was the point, and it worked." },
    right: { label: "Keep your distance", fx: { longing: 1, strain: -1 }, text: "She understands. That's almost worse." },
  },
  {
    id: "a_after_fled", act: [2], tier: 0, art: "scroll", who: "Keep the Record", weight: 4, once: true,
    when: (s) => s.asc.after === "fled",
    text: "You walked, and the record's still in your boot. Never escalate inside a system that's reversed you. Never throw the record away, either.",
    left: { label: "Give a copy to someone you trust", fx: { gnosis: 1, longing: -1 }, text: "Two people know now. That's a different shape from one." },
    right: { label: "Keep it close", fx: { strain: -1 }, text: "It's lighter than it looks, carried right." },
  },
  {
    id: "a_chapter_bread", act: [2], road: "chapter", tier: 0, art: "candle", who: "The Chapter House", weight: 3,
    text: "Breakfast is free here. So is lunch. So is the room. Nobody's asked for anything, which is the loudest thing in the building.",
    left: { label: "Pay for your bread", fx: { favor: -1, cage: -1 }, text: "They look hurt. You pay anyway. Debts are how a door gets a lock." },
    right: { label: "Eat", fx: { hollow: -1, cage: 1 }, text: "It's very good bread." },
  },
  {
    id: "a_chapter_friend", act: [2], road: "chapter", tier: 1, art: "letter", who: "A Letter From Before", weight: 2,
    text: "A friend writes: she hasn't heard from you since you moved to the chapter house. Is everything all right?",
    left: { label: "Write back, honestly", fx: { cage: -1, longing: -1, strain: 1 }, text: "It takes three drafts to say it plainly. She answers the same day." },
    right: { label: "Everything's fine", fx: { cage: 1 }, text: "Everything is. That's what the almoner says, too." },
  },
  {
    id: "a_tithe_line", act: [2], road: "tithe", tier: 1, art: "coin", who: "The Tolerated Line", weight: 3,
    text: "The clerks have redrawn the tolerated line. You're over it by the price of a pair of boots.",
    left: { label: "Spend it down", fx: { favor: -2, strain: -1 }, text: "Boots. Good ones. Under the line again, with dry feet." },
    right: { label: "Keep it, quietly", fx: { favor: 1, mark: 1 }, text: "A clerk circles your name in pencil. Pencil, for now." },
  },
  {
    id: "a_tithe_queue", act: [2], road: "tithe", tier: 1, art: "bell", who: "The Tithe-Queue", weight: 2,
    text: "Four hours in the tithe-queue, to be told to come back tomorrow with a form they've run out of.",
    left: { label: "Come back tomorrow", fx: { strain: 1, untag: 1 }, text: "Compliance is invisible, and invisible is the point." },
    right: { label: "Copy out the form for everyone", fx: { gnosis: 1, mark: 1 }, text: "By hand, for the whole queue. The queue loves you. A clerk writes that down." },
  },

  // ================= the Inquisition =================
  {
    id: "inq_open", enc: "inquisition", phase: [0], forcedOnly: true, noIntent: true, fixed: true, tier: 1, art: "scroll", who: "The Inquisitor's Clerk",
    text: "A summons, stamped “for the Inquisitor”. Nobody's ever seen him. The clerk does the seeing. She has a fresh file, and questions about the gaps.",
    left: {
      label: "Arrive early, rehearsed", verb: "negotiate",
      roll: { stat: "wits" },
      hit: ao("You know their forms better than she does. One of them is already wrong in your favor.", { road: { file: 1 } }),
      mid: ao("Rehearsed is still nervous. She notices which answers you'd practised.", { strain: 1 }),
      miss: ao("You answered a question she hadn't asked yet.", { clock: 1 }),
    },
    right: { label: "Bring the Quiet Record", verb: "expose", fx: { road: { record: 1 }, mark: 1 }, text: "Dates, times, who said what. She doesn't like that you keep one, and writes down that you do." },
  },
  {
    id: "inq_question", enc: "inquisition", phase: [0, 1], tier: 1, art: "eye", who: "The Inquisition's Scout",
    text: "“Where do you sleep? Do you work alone? Who else knows you're here?” Asked politely, with a pen.",
    left: {
      label: "Weaponized boring", verb: "evade",
      roll: { stat: "shade" },
      hit: ao("Processed and forgotten, by the man whose job is not forgetting.", { road: { file: 1 } }),
      mid: ao("He writes down one thing. You don't see which.", { strain: 1 }),
      miss: ao("Too bland. He notices the performance.", { clock: 1, mark: 1 }),
    },
    right: {
      label: "Answer where the queue can hear", verb: "confront",
      roll: { stat: "steel" },
      hit: ao("Loud enough for the whole queue. The queue starts listening.", { road: { light: 1 } }),
      mid: ao("The queue hears. So does he: you're the difficult one now.", { road: { light: 1 }, mark: 1 }),
      miss: ao("Nobody in the queue looks up.", { clock: 1, mark: 1 }),
    },
  },
  {
    id: "inq_file", enc: "inquisition", phase: [0, 1], tier: 1, art: "scroll", who: "The Inquisitor's Clerk",
    text: "She turns your file so you can read it upside down. Half of it is about somebody else.",
    left: {
      label: "Point out whose half it is", verb: "expose",
      roll: { stat: "wits" },
      hit: ao("You show her the other woman's dates. She goes pale. That's in the register now.", { road: { record: 2 } }),
      mid: ao("She takes the correction, and a note that you made one.", { road: { record: 1 }, mark: 1 }),
      miss: ao("Now there are two files on you, and one is wrong in a new way.", { clock: 1 }),
    },
    right: { label: "Let the error stand", verb: "evade", fx: { road: { file: 1 }, strain: 1 }, text: "A wrong file is half a lost one. It costs you something to sit still while they get you wrong." },
  },
  {
    id: "inq_almoner", enc: "inquisition", phase: [0, 1], tier: 1, art: "candle", who: "The Almoner",
    text: "The almoner who knows your face is asked to identify you. She looks at you for a long time.",
    left: {
      label: "Look like nobody", verb: "evade",
      roll: { stat: "shade" },
      hit: ao("She looks at you and sees the queue. “I couldn't say.”", { road: { file: 1 } }),
      mid: ao("“Maybe.” Maybe is a word they write down.", { mark: 1 }),
      miss: ao("“That's her.” She looks sorry about it.", { clock: 1 }),
    },
    right: { label: "Thank her, by name, out loud", verb: "ally", fx: { road: { light: 1 }, mark: 1 }, text: "She'll remember you thanked her. So will the clerk. Being seen cuts both ways." },
  },
  {
    id: "inq_fee", enc: "inquisition", phase: [0], tier: 0, art: "coin", who: "The Fee Window",
    text: "There is a fee for being processed. There is always a fee.",
    left: { label: "Pay it, exactly", verb: "negotiate", fx: { favor: -1, road: { file: 1 } }, text: "The exact coin, receipt requested. A paid fee is the most boring thing in the building." },
    right: { label: "Ask for the fee schedule", verb: "expose", fx: { road: { record: 1 }, mark: 1 }, text: "There isn't one. There's never been one. Somebody writes that down. Somebody writes you down." },
  },
  {
    id: "inq_crowd", enc: "inquisition", phase: [0, 1], tier: 1, art: "lantern", who: "The Watch-House Steps",
    text: "A crowd on the watch-house steps, waiting for a notice to go up. The lamps are lit.",
    left: { label: "Wait with them, in the light", verb: "ally", fx: { road: { light: 1 }, strain: 1 }, text: "Many honest eyes. It's tiring being looked at, and nobody can take you quietly while they're looking." },
    right: {
      label: "Slip away while they read", verb: "evade",
      roll: { stat: "shade" },
      hit: ao("Gone between the lamps. Your description goes in the drawer with nothing to match it.", { road: { file: 1 } }),
      mid: ao("Gone, mostly. A watchman remembers a coat.", { mark: 1 }),
      miss: ao("Slipping away in front of a crowd is the opposite of slipping away.", { clock: 1, mark: 1 }),
    },
  },
  {
    id: "inq_recess", enc: "inquisition", phase: [0, 1], tier: 0, art: "bell", who: "Come Back Tomorrow",
    weight: (s) => (s.restedToday ? 0 : s.hollow >= 2 || s.strain >= 4 ? 2 : 1),
    text: "“Come back tomorrow.” Nobody says you can go home. Nobody says you can't.",
    left: { label: "Go home and sleep", verb: "endure", fx: { rest: true, strain: -1 }, text: "Your own door, barred. In the morning the file is exactly as thick as it was, which is a mercy." },
    right: { label: "Work all night on your answers", verb: "expose", fx: { road: { record: 1 }, hollow: 1 }, text: "By dawn you have your own record, cross-referenced, and a headache that could stop a clock." },
  },
  {
    id: "inq_roll", enc: "inquisition", phase: [1], forcedOnly: true, noIntent: true, fixed: true, tier: 1, art: "scroll", who: "The Alms Roll",
    text: "Your name on the alms roll has a pencil line through it. Not ink. Not yet.",
    left: { label: "Find out who holds the pencil", verb: "expose", fx: { road: { record: 1 }, strain: 1 }, text: "A junior clerk, following a note in a senior hand. The note's in the file now. So is your asking." },
    right: { label: "Stand in the queue every day", verb: "evade", fx: { road: { file: 1 }, hollow: 1 }, text: "Every morning, the same place, nothing to notice. They don't strike a name that's always there." },
  },
  {
    id: "inq_reversal", enc: "inquisition", phase: [1], tier: 1, art: "scroll", who: "The Reversal",
    text: "You reported someone once. Now there's a file, and it's on you. The wording went from what happened to you to what you did.",
    left: { label: "Keep the record, say nothing", verb: "endure", fx: { road: { record: 1 }, strain: 1 }, text: "Never escalate inside a system that has already reversed you. Your record stays yours." },
    right: {
      label: "Press further", verb: "confront",
      roll: { stat: "steel", mod: -1 },
      hit: ao("A second clerk reads it straight and corrects the file, in pencil.", { road: { light: 1 }, apo: 1 }),
      mid: ao("They staple your appeal to the file. It's a thicker file now.", { clock: 1, apo: 1 }),
      miss: ao("You are now generating evidence against yourself.", { clock: 2, apo: 1 }),
    },
  },
  {
    id: "inq_brand", enc: "inquisition", phase: [1], tier: 1, art: "scroll", who: "The Register",
    text: "The new register lists you as “tolerated deviant, class IV”. A clerk slides it over for your mark and waits to see if you'll flinch.",
    left: {
      label: "Refuse the classification", verb: "expose",
      roll: { stat: "freq" },
      hit: ao("A name reclaimed, into the register, in your words.", { road: { record: 1 }, gnosis: 1 }),
      mid: ao("She writes it anyway. You said it out loud. That counts.", { road: { record: 1 }, strain: 1 }),
      miss: ao("She adds: uncooperative.", { clock: 1, mark: 1 }),
    },
    right: { label: "Flinch on purpose", verb: "evade", fx: { road: { file: 1 }, strain: 1 }, text: "Let them think they read you right. Somebody who's sure stops looking." },
  },
  {
    id: "inq_book", enc: "inquisition", phase: [1], tier: 1, art: "scroll", who: "The Clerk's Second Book",
    text: "The clerk keeps a second book, and leaves it on the desk while she fetches tea.",
    left: {
      label: "Read it", verb: "unweave",
      roll: { stat: "freq" },
      hit: ao("It's the real one: who paid, who was paid, who was never asked anything. You memorise a page.", { road: { record: 2 } }),
      mid: ao("A page, and she's back. She knows. She doesn't say.", { road: { record: 1 }, mark: 1 }),
      miss: ao("She comes back early.", { clock: 2 }),
    },
    right: { label: "Move it two inches", verb: "evade", fx: { road: { file: 1 } }, text: "Two inches, onto the wrong pile. Tomorrow it gets filed under somebody else's year." },
  },
  // The informer's offer: their witness catalogs. Giving a name puts someone new in the margin.
  {
    id: "inq_informer", enc: "inquisition", phase: [1], tier: 1, art: "hand", who: "The Inquisitor's Clerk", once: true,
    text: "“Give us a name. Anyone's. We'll lose yours.”",
    left: { label: "Give them a name", verb: "negotiate", fx: { clock: -2, apo: 1, inform: true }, text: "You say a name. It's easy. Somebody's in the margin now who wasn't this morning." },
    right: { label: "No names", verb: "confront", fx: { clock: 1, strain: 1 }, text: "Their witness catalogs. Yours doesn't. You give them nothing, and it costs." },
  },
  // A Bond held is present, never spent: the Sister walks you there, as she walks you home past the dye-yards.
  {
    id: "inq_sister", enc: "inquisition", phase: [0, 1], tier: 0, art: "rose", who: "A Sister", weight: 3,
    when: (s) => held(s, "sister"),
    text: "She walks you to the watch-house without being asked, and waits across the street, where she can see the door.",
    left: { label: "Let her be seen waiting", verb: "ally", fx: { road: { light: 1 } }, text: "Somebody knows your route, on purpose. The clerk looks out of the window twice." },
    right: { label: "Send her home", verb: "endure", fx: { longing: 1 }, text: "She's safer at home. You're lonelier on the steps." },
  },
  {
    id: "inq_nyx", enc: "inquisition", phase: [0, 1], tier: 0, art: "veil", who: "Nyx · Machine-Sight", weight: 4,
    when: (s) => s.mask === "nyx",
    text: "Through the Veil the filing system is a machine, and every machine has a blind spot. This one's is the bottom drawer.",
    left: {
      label: "Step into the blind spot", verb: "evade",
      roll: { stat: "shade" },
      hit: ao("Your file goes into the bottom drawer, where files go to die.", { road: { file: 2 } }),
      mid: ao("Halfway into the drawer. The Veil takes its fee.", { road: { file: 1 }, strain: 1 }),
      miss: ao("The drawer sticks. The noise is very loud.", { clock: 1 }),
    },
    right: { label: "Cross-file it everywhere", verb: "unweave", fx: { road: { file: 1 }, mark: 1 }, text: "Your name in eleven files, each a little wrong. One of you is easy to find. Eleven is a research project." },
  },
  {
    id: "inq_eris", enc: "inquisition", phase: [0, 1], tier: 1, art: "blade", who: "Eris · the Velvet Guillotine", weight: 4,
    when: (s) => s.mask === "eris",
    text: "The only summons that names you is in a satchel on the clerk's chair. The clerk is down the corridor.",
    left: {
      label: "Sever their access", verb: "confront",
      roll: { stat: "steel" },
      hit: ao("Soft surface, hard boundary. The summons is ash and nobody touched anybody. The File −2.", { clock: -2 }),
      mid: ao("It holds. They talk. The File −1.", { clock: -1, mark: 1 }),
      miss: ao("The clerk comes back for her satchel.", { clock: 1, mark: 2 }),
    },
    right: { label: "State your terms, once", verb: "negotiate", fx: { road: { light: 1 }, strain: 1 }, text: "What you'll answer and what you won't, in front of the queue. Then you stop talking." },
  },
  {
    id: "inq_lilith", enc: "inquisition", phase: [0, 1], tier: 0, art: "serpent", who: "Lilith · the Eye", weight: 4,
    when: (s) => s.mask === "lilith",
    text: "The Eye of Lilith is cut into the brass of the clerk's inkwell. Nobody here knows what it is. It's been watching them for years.",
    left: {
      label: "Read their register back, transmuted", verb: "expose",
      roll: { stat: "freq" },
      hit: ao("You read their register back as liturgy. They hear what their words sound like. So does the queue.", { road: { record: 2 } }),
      mid: ao("It lands, and opens you. You want them to understand. Badly.", { road: { record: 1 }, longing: 1 }),
      miss: ao("The heresy draws the wrong witness.", { clock: 1, longing: 1 }),
    },
    right: { label: "Close the Eye", verb: "endure", fx: { strain: -1 }, text: "This working is ended. You breathe." },
  },
  {
    id: "inq_bare", enc: "inquisition", phase: [0, 1], tier: 0, art: "door", who: "The Bare Face · Just Me", weight: TUNING.bareFightWeight,
    when: (s) => s.mask === "bare",
    text: "No Mask. Just a person answering questions. Nobody here is trained for that.",
    left: {
      label: "Answer as yourself", verb: "ally",
      roll: { stat: "fortune" },
      hit: ao("Simple and true. The queue leans in. People believe a tired woman telling the truth.", { road: { light: 2 } }),
      mid: ao("True, and it costs. You'll feel this one tonight.", { road: { light: 1 }, strain: 1 }),
      miss: ao("They use the thing you showed them.", { clock: 1, longing: 1 }),
    },
    right: { label: "Ask the clerk about her week", verb: "negotiate", fx: { clock: -1, strain: 1 }, text: "She answers, before she can stop herself. There's no form for that. She loses her place in yours." },
  },
  {
    id: "inq_blade", enc: "inquisition", phase: [2], forcedOnly: true, noIntent: true, fixed: true, final: true, tier: 1, art: "blade", who: "The Blade",
    text: "The blade is the last step, and they're patient. The chair behind the clerk's desk is empty. It always is. The stamp does the work.",
    build(s) {
      return { ...this, right: standOn(s, "Stand on it") };
    },
    left: { label: "Disengage", verb: "flee", fx: { resolve: "fled" }, text: "You keep the record and walk." },
    right: { label: "Stand on it", verb: "confront", fx: {} },
  },

  // ================= the False Shepherd =================
  {
    id: "sh_open", enc: "shepherd", phase: [0], forcedOnly: true, noIntent: true, fixed: true, tier: 1, art: "candle", who: "The False Shepherd",
    text: "The kind almoner meets you at the chapter house door with your name already on a room. He doesn't attack. He helps. That's the attack.",
    left: {
      label: "Discern: true, or merely effective?", verb: "expose",
      roll: { stat: "wits" },
      hit: ao("He wants you managed, not known. You can see the whole house now.", { road: { discern: 1 }, reveal: true }),
      mid: ao("A warning, not the shape. Something behind his smile does sums.", { reveal: true }),
      miss: ao("The false light answers in Wisdom's voice. He's lovely, it says.", { cage: 1, longing: 1 }),
    },
    right: { label: "“I like you. I move slow.”", verb: "endure", fx: { road: { slow: 1 }, reveal: true, strain: 1 }, text: "His face does something small and fast. Then it's kind again. You saw it." },
  },
  {
    id: "sh_schedule", enc: "shepherd", phase: [0, 1], tier: 1, art: "candle", who: "The False Shepherd",
    text: "He's taken the liberty of arranging your week. Your patrons, your meals, your Sabbaths. It's a very good week.",
    left: {
      label: "Keep your own book", verb: "confront",
      roll: { stat: "steel" },
      hit: ao("Your week, your hand. He says of course, of course.", { road: { slow: 1 } }),
      mid: ao("Yours, mostly. He's kept the Sabbath.", { road: { slow: 1 }, strain: 1 }),
      miss: ao("You look ungrateful, even to yourself.", { cage: 1, strain: 1 }),
    },
    right: { label: "Split it four ways", verb: "ally", fx: { road: { distribute: 1 }, strain: 1 }, text: "Your meals at one table, your nights your own, your patrons through your own book, and nothing through him." },
  },
  {
    id: "sh_secret", enc: "shepherd", phase: [0, 1], tier: 1, art: "candle", who: "The False Shepherd",
    text: "“Don't tell the others about our arrangement. They wouldn't understand.”",
    left: { label: "Tell the others", verb: "ally", fx: { road: { distribute: 1 }, cage: -1, mark: 1 }, text: "Speed, secrecy, dependency. You say all three words out loud to people who aren't him." },
    right: {
      label: "Name the Chain", verb: "expose",
      roll: { stat: "freq" },
      hit: ao("Isolation, then one source of truth. Named, it stops being weather.", { road: { discern: 2 } }),
      mid: ao("Isolation. You see one link of it.", { road: { discern: 1 } }),
      miss: ao("You name the wrong Chain. The right one tightens.", { cage: 1 }),
    },
  },
  {
    id: "sh_purse", enc: "shepherd", phase: [0, 1], tier: 0, art: "coin", who: "The False Shepherd",
    text: "A purse on your pillow. No note. You know whose it is.",
    left: { label: "Give it back, in public", verb: "confront", fx: { road: { slow: 1 }, favor: -1 }, text: "In the refectory, at lunch, with thanks. He smiles, and that smile costs him." },
    right: { label: "“What do you want for this?”", verb: "expose", fx: { road: { discern: 1 } }, text: "“Nothing.” The most expensive word in the room. You know the price now." },
  },
  {
    id: "sh_house", enc: "shepherd", phase: [1], forcedOnly: true, noIntent: true, fixed: true, tier: 1, art: "house", who: "The Better Room",
    text: "Your things have been moved to a better room upstairs. It's warmer. The door locks from the outside, which he says is for your safety.",
    left: { label: "Carry your things back down", verb: "confront", fx: { road: { slow: 1 }, strain: 1 }, text: "One armful at a time, while he watches. It takes all evening. It's the best evening you've had here." },
    right: { label: "Keep the key in your boot", verb: "evade", fx: { road: { distribute: 1 }, cage: 1 }, text: "You sleep upstairs, with the key in your boot. Better than nothing. Not much better." },
  },
  // Bonds held, present: the Sponsor ("Call before. Not after.") and the Open Table (bread and a bed).
  {
    id: "sh_sponsor", enc: "shepherd", phase: [0, 1], tier: 0, art: "lantern", who: "An Old-Timer", weight: 3,
    when: (s) => held(s, "sponsor"),
    text: "The number on your wrist has faded, but you know it. Call before, not after.",
    left: { label: "Call before", verb: "ally", fx: { road: { distribute: 1 }, longing: -1 }, text: "She picks up on the second ring. “Tell me about this almoner.” You do. It sounds different out loud." },
    right: { label: "Don't bother her", verb: "endure", fx: { cage: 1, longing: 1 }, text: "She'd have answered." },
  },
  {
    id: "sh_table", enc: "shepherd", phase: [0, 1], tier: 0, art: "cup", who: "The Open Table", weight: 3,
    when: (s) => held(s, "table"),
    text: "The Open Table is serving on the other side of the square. Bread and a bed, no questions, no arrangement.",
    left: { label: "Eat there tonight", verb: "ally", fx: { road: { distribute: 1 }, hollow: -1 }, text: "A bench, a bowl, and nobody keeping count." },
    right: { label: "He'd be hurt", verb: "endure", fx: { cage: 1 }, text: "He would. That's the lever." },
  },
  {
    id: "sh_nyx", enc: "shepherd", phase: [0, 1], tier: 0, art: "veil", who: "Nyx · the Unlit Stair", weight: 4, when: (s) => s.mask === "nyx",
    text: "Through the Veil the chapter house is a diagram: every door routes through his office.",
    left: { label: "Find the door that doesn't", verb: "evade", roll: { stat: "shade" },
      hit: ao("The servants' stair. It goes everywhere and he's never used it.", { road: { slow: 2 } }),
      mid: ao("The servants' stair, with a servant on it who'll mention it.", { road: { slow: 1 }, mark: 1 }),
      miss: ao("Every door. Even that one.", { cage: 1 }) },
    right: { label: "Map it for the others", verb: "ally", fx: { road: { distribute: 1 }, strain: 1 }, text: "You draw it on the back of a hymn sheet and leave it in the pews." },
  },
  {
    id: "sh_eris", enc: "shepherd", phase: [0, 1], tier: 1, art: "blade", who: "Eris · the Ones Cast Out", weight: 4, when: (s) => s.mask === "eris",
    text: "He's lined up three people who say you can't manage without him. The Blade could sever all three.",
    left: { label: "Sever them, cleanly", verb: "confront", roll: { stat: "steel" },
      hit: ao("Soft surface, hard boundary, three times. He's alone in the room with you.", { road: { slow: 2 } }),
      mid: ao("Two of them. The third tells everybody you're unstable.", { road: { slow: 1 }, mark: 1 }),
      miss: ao("You cut the wrong one. She was trying to warn you.", { cage: 1, longing: 1 }) },
    right: { label: "Follow someone else's lead", verb: "ally", fx: { road: { distribute: 1 }, strain: -1 }, text: "A non-dominant act, the Blade's exit. Somebody else decides lunch, and it's fine." },
  },
  {
    id: "sh_lilith", enc: "shepherd", phase: [0, 1], tier: 0, art: "serpent", who: "Lilith · the First Refusal", weight: 4, when: (s) => s.mask === "lilith",
    text: "He offers you everything you've ever wanted, in a voice you've wanted it in. The Eye sees the hook in it.",
    left: { label: "Refuse the way she did", verb: "confront", roll: { stat: "freq" },
      hit: ao("The first who left and didn't apologise. You leave the room. You don't apologise.", { road: { slow: 2 } }),
      mid: ao("You leave the room. You apologise on the stairs.", { road: { slow: 1 }, longing: 1 }),
      miss: ao("You stay for one more sentence. It was a long sentence.", { cage: 1, longing: 1 }) },
    right: { label: "Turn the hook into a map", verb: "unweave", fx: { road: { discern: 1 }, longing: 1 }, text: "You take what he offered and make it a map of what he wants. It cost you wanting it." },
  },
  {
    id: "sh_bare", enc: "shepherd", phase: [0, 1], tier: 0, art: "door", who: "The Bare Face · On Your Terms", weight: TUNING.bareFightWeight, when: (s) => s.mask === "bare",
    text: "No performance. A tired person at a kitchen table, being offered a lot of help.",
    left: { label: "Let one friend truly see you", verb: "ally", fx: { road: { distribute: 1 }, longing: -1, strain: 1 }, text: "The act of witness. It costs being seen. He can't counterfeit it: he needs you managed, not known." },
    right: { label: "Eat, sleep, decide tomorrow", verb: "endure", fx: { hollow: -1, road: { slow: 1 } }, text: "No escalation in depletion. You'll decide rested, which he was hoping you wouldn't." },
  },
  {
    id: "sh_door", enc: "shepherd", phase: [2], forcedOnly: true, noIntent: true, fixed: true, final: true, tier: 1, art: "door", who: "The Locked Door",
    text: "The door's locked from the outside. His study chair is warm and empty; he's in the hall, being gentle about it.",
    build(s) {
      return { ...this, right: standOn(s, "Walk out on it") };
    },
    left: { label: "Disengage", verb: "flee", fx: { resolve: "fled" }, text: "Out the kitchen window. A long drop and a short street, and then you're nobody's." },
    right: { label: "The door", verb: "confront", fx: {} },
  },

  // ================= the Ledger =================
  {
    id: "led_open", enc: "ledger", phase: [0], forcedOnly: true, noIntent: true, fixed: true, tier: 1, art: "coin", who: "The Ledger",
    text: "The tithe-house has opened a page with your name at the top: every coin in and out, and the tolerated line drawn in red across all of it.",
    left: { label: "Bring every receipt", verb: "negotiate", fx: { road: { quiet: 1 }, strain: 1 }, text: "A shoebox of receipts, in order. The clerk looks tired already. Good." },
    right: { label: "Bring a friend who knows the forms", verb: "ally", fx: { road: { clerk: 1 }, mark: 1 }, text: "She's been through this before. She knows which questions are optional, which is most of them." },
  },
  {
    id: "led_number", enc: "ledger", phase: [0, 1], tier: 1, art: "coin", who: "The Circled Number",
    text: "A clerk has circled one number on your page. Just the one. She's waiting for you to explain it.",
    left: {
      label: "Explain it boringly", verb: "evade",
      roll: { stat: "shade" },
      hit: ao("Irregular, already declining, nothing to see. She stops listening halfway. Perfect.", { road: { boring: 1 } }),
      mid: ao("Mostly boring. She circles a second number.", { strain: 1 }),
      miss: ao("Too smooth. She wants every receipt for it.", { clock: 1 }),
    },
    right: { label: "Keep the second ledger shut", verb: "unweave", fx: { road: { quiet: 1 }, mark: 1 }, text: "They see one ledger. It balances. The other one's in your boot." },
  },
  {
    id: "led_stamp", enc: "ledger", phase: [0, 1], tier: 0, art: "scroll", who: "Form and Stamp",
    text: "The form you need requires a stamp from the office that issues the form you need.",
    left: { label: "Find the clerk who knows the loop", verb: "ally", fx: { road: { clerk: 1 }, strain: 1 }, text: "There's always one. She's on her break. She's been waiting years for somebody to ask." },
    right: {
      label: "Work the Geometry", verb: "negotiate",
      roll: { stat: "wits" },
      hit: ao("You find the stamp in a drawer in a different office. That's the trick.", { road: { boring: 2 } }),
      mid: ao("Slowly, partially. Provisionally stamped.", { road: { boring: 1 }, strain: 1 }),
      miss: ao("Denied, flagged, and told to come back.", { clock: 1, strain: 1 }),
    },
  },
  {
    id: "led_almshouse", enc: "ledger", phase: [1], forcedOnly: true, noIntent: true, fixed: true, tier: 1, art: "eye", who: "Questions at the Almshouse",
    text: "The clerks come to the almshouse to ask who sleeps where, who eats what, and whose coat that is.",
    left: { label: "Answer only what's asked", verb: "evade", fx: { road: { boring: 1 }, strain: 1 }, text: "Rote only, with institutions. It's like holding a plank. You hold it." },
    right: { label: "Ask for someone to sit with you", verb: "ally", fx: { road: { clerk: 1 }, mark: 1 }, text: "Nobody's ever asked. They have to find a second chair." },
  },
  {
    id: "led_report", enc: "ledger", phase: [1], tier: 2, art: "letter", who: "A Report",
    text: "Somebody reported a change in your circumstances. New boots, apparently.",
    left: { label: "It was the boots", verb: "negotiate", fx: { road: { quiet: 1 }, favor: -1 }, text: "The receipt for the boots. The boots are evidence of compliance now." },
    right: {
      label: "Find out who reported it", verb: "confront",
      roll: { stat: "steel" },
      hit: ao("You find her. She was told to. She tells the clerk she was told to.", { road: { clerk: 2 } }),
      mid: ao("You find her. She won't say who told her.", { road: { clerk: 1 }, mark: 1 }),
      miss: ao("Now you're the one who harassed a reporter.", { clock: 2 }),
    },
  },
  // The Tolerated Line's own temptation: coin now, and the Ledger moves by every coin.
  {
    id: "led_shift", enc: "ledger", phase: [0, 1], tier: 1, art: "coin", who: "A Paid Errand", weight: 2,
    text: "A guild needs a runner for two days, paid in coin. Every coin you take, the Ledger takes down.",
    left: { label: "Run the errand", verb: "endure", fx: { favor: 2 }, text: "Coin in your pocket, and a new line in their book in a hand you'll never see." },
    right: { label: "Turn it down, in writing", verb: "unweave", fx: { road: { quiet: 1 }, strain: 1 }, text: "Your reason, in their own terms, to the clerk. It goes in the file. So does what you didn't take." },
  },
  {
    id: "led_table", enc: "ledger", phase: [0, 1], tier: 0, art: "cup", who: "The Open Table", weight: 3,
    when: (s) => held(s, "table"),
    text: "The Open Table feeds anyone who sits down. The Ledger has no column for free bread.",
    left: { label: "Eat, and say so on the form", verb: "ally", fx: { road: { clerk: 1 }, hollow: -1 }, text: "“Charity, irregular, no sum.” The clerk doesn't know where to put it. She leaves it out." },
    right: { label: "Skip it, to look busy", verb: "endure", fx: { hollow: 1, road: { boring: 1 } }, text: "Hungry is very boring. That's the one good thing about it." },
  },
  {
    id: "led_nyx", enc: "ledger", phase: [0, 1], tier: 0, art: "veil", who: "Nyx · the Revenant Road", weight: 4, when: (s) => s.mask === "nyx",
    text: "Through the Veil the tithe-house is a machine for noticing changes. The trick is to change in a way it can't see.",
    left: { label: "Change invisibly", verb: "evade", roll: { stat: "shade" },
      hit: ao("Everything moves; nothing registers. On paper you're exactly as poor as you were.", { road: { boring: 2 } }),
      mid: ao("Nearly. One number twitches.", { road: { boring: 1 }, mark: 1 }),
      miss: ao("The machine notices that nothing changed. That's a change.", { clock: 1 }) },
    right: { label: "Read the counter's own targets", verb: "unweave", fx: { road: { quiet: 1 }, strain: 1 }, text: "You're one of twelve he has to fail. You make yourself the thirteenth." },
  },
  {
    id: "led_eris", enc: "ledger", phase: [0, 1], tier: 1, art: "blade", who: "Eris · the Golden Apple", weight: 4, when: (s) => s.mask === "eris",
    text: "Two clerks, one promotion, and your page is on both their desks.",
    left: { label: "Roll the apple between them", verb: "confront", roll: { stat: "steel" },
      hit: ao("They spend the afternoon counting each other. The Ledger −2.", { clock: -2 }),
      mid: ao("The Ledger −1. One of them knows exactly what you did.", { clock: -1, mark: 1 }),
      miss: ao("They unite. Against you.", { clock: 2 }) },
    right: { label: "Ask for the senior clerk", verb: "negotiate", fx: { road: { clerk: 1 }, strain: 1 }, text: "Upward, politely, firmly. She's harder to impress and easier to bore." },
  },
  {
    id: "led_lilith", enc: "ledger", phase: [0, 1], tier: 0, art: "serpent", who: "Lilith · Transmutation", weight: 4, when: (s) => s.mask === "lilith",
    text: "The second ledger, the true one, is a working in itself. Every line of it could be read as liturgy.",
    left: { label: "Reframe it as ceremony", verb: "unweave", roll: { stat: "freq" },
      hit: ao("Tithe, offering, gift: you translate every line, and they accept your terms.", { road: { quiet: 2 } }),
      mid: ao("The spiritual part lands. The arithmetic doesn't.", { road: { quiet: 1 }, longing: 1 }),
      miss: ao("Irregular sums, and now irregular theology.", { clock: 1, mark: 1 }) },
    right: { label: "Close the book", verb: "endure", fx: { strain: -1 }, text: "This working is ended. The arithmetic can wait." },
  },
  {
    id: "led_bare", enc: "ledger", phase: [0, 1], tier: 0, art: "door", who: "The Bare Face · Tuesday", weight: TUNING.bareFightWeight, when: (s) => s.mask === "bare",
    text: "No Mask. A person who eats, sleeps and fills in the form. The Ledger's never met one of those.",
    left: { label: "Fill it in plainly", verb: "negotiate", fx: { road: { boring: 1 }, hollow: -1 }, text: "Every box, in pencil first. Tuesday survivability." },
    right: { label: "Ask the clerk how she is", verb: "ally", roll: { stat: "fortune" },
      hit: ao("Terrible, thanks. She tells you about it. She stamps you on the way out.", { road: { clerk: 2 } }),
      mid: ao("Fine, she says, in a voice that isn't. She remembers you were kind.", { road: { clerk: 1 }, strain: 1 }),
      miss: ao("She's not allowed to say.", { strain: 1 }) },
  },
  {
    id: "led_final", enc: "ledger", phase: [2], forcedOnly: true, noIntent: true, fixed: true, final: true, tier: 1, art: "coin", who: "The Last Count",
    text: "The count is done. The clerk holds the stamp an inch above your page. The senior clerk's chair is empty. It always is.",
    build(s) {
      return { ...this, right: standOn(s, "Stand on your file") };
    },
    left: { label: "Disengage", verb: "flee", fx: { resolve: "fled" }, text: "Out before the stamp. Off the roll, on your feet." },
    right: { label: "Stand on your file", verb: "negotiate", fx: {} },
  },
  // The Ledger full: the Audit (§18), Wits at Desperate. Struck From the Roll on a miss.
  {
    id: "led_audit", enc: "ledger", phase: [0, 1, 2], forcedOnly: true, noIntent: true, fixed: true, final: true, tier: 1, art: "coin", who: "The Audit",
    text: "The Ledger is full. Your registration is under audit, every line of it, at once. There's no road left but through.",
    left: {
      label: "Answer everything", verb: "negotiate",
      roll: { stat: "wits", dis: true },
      hit: ao("Your registration survives and your papers are clean. That's all you get, and it's a lot.", { resolve: "audited" }),
      mid: ao("Reduced. The tithe-house takes its half. You're still on the roll, barely.", { resolve: "audited", strain: 3, halve: true }),
      miss: ao("Struck.", { end: "named_clerk" }),
    },
    right: { label: "Disengage", verb: "flee", fx: { resolve: "fled" }, text: "You walk out before they finish. Off the roll, on your feet. They'll finish without you." },
  },

  // ================= Rex Mundi · the Grammar =================
  {
    id: "rg_open", enc: "grammar", phase: [0], forcedOnly: true, noIntent: true, fixed: true, tier: 1, art: "scroll", who: "Rex Mundi, in Your Hand",
    text: "Every notice at the festival is in the same hand. Yours. He never shows up. He writes in your handwriting, and it reads your whole run back to you.",
    left: {
      label: "Read it like a stranger would", verb: "expose",
      roll: { stat: "freq" },
      hit: ao("It's not scripture. It's grammar. Grammar can be parsed.", { road: { know: 1 }, gnosis: 1 }),
      mid: ao("You read it. It's very persuasive. You notice that it is.", { strain: 1 }),
      miss: ao("You read it and agree with it.", { clock: 1, longing: 1 }),
    },
    right: { label: "Write one line of your own", verb: "unweave", fx: { road: { name: 1 }, strain: 1 }, text: "In your own hand, under his. They look nothing alike, side by side." },
  },
  {
    id: "rg_margin", enc: "grammar", phase: [0], tier: 1, art: "scroll", who: "The Margin",
    text: "In the margin of every notice: the Named, struck through, one per line. Some of them you know.",
    left: { label: "Read their names out loud", verb: "ally", fx: { road: { name: 1 }, mark: 1 }, text: "Each name said aloud is a name heard by somebody. The margin gets restless." },
    right: {
      label: "Strike out his strike-throughs", verb: "unweave",
      roll: { stat: "shade" },
      hit: ao("Line by line, so carefully nobody notices for a week.", { road: { cut: 2 } }),
      mid: ao("A few lines. Your thumb's black now. That's evidence.", { road: { cut: 1 }, mark: 1 }),
      miss: ao("He sees the smudge and writes it down. In your hand.", { clock: 1 }),
    },
  },
  {
    id: "rg_category", enc: "grammar", phase: [0], tier: 1, art: "crown", who: "Rex Mundi, in Your Hand",
    text: "“You're not a tolerated deviant. You never were. You're exceptional.” A better category. It fits.",
    left: {
      label: "Refuse that one too", verb: "confront",
      roll: { stat: "steel" },
      hit: ao("A better box is a box. You say so, and the chain holding it gives.", { road: { cut: 2 } }),
      mid: ao("You refuse it, eventually. It took a while.", { road: { cut: 1 }, strain: 1 }),
      miss: ao("You refuse it in a way that's exceptional. That was the box.", { apo: 1, clock: 1 }),
    },
    right: { label: "The Two-Column Test", verb: "expose", fx: { road: { know: 1 }, strain: 1, apo: -1 }, text: "Column A: what you've done. Column B: what he says it means. Doubting yourself on purpose is slow, and it's the door." },
  },
  {
    id: "rg_cadence", enc: "grammar", phase: [0], tier: 1, art: "eye", who: "Rex Mundi, in Your Hand",
    text: "The voice in the notices uses your own cadence now, the one you save for the Impatient. Firm, kind, final. It's very good.",
    left: { label: "Listen", verb: "endure", fx: { longing: 1, strain: -1 }, text: "It's restful, being spoken to in your own voice. That's the most dangerous sentence in his grammar." },
    right: {
      label: "Ask what it wants", verb: "expose",
      roll: { stat: "wits" },
      hit: ao("“Nothing.” You know what nothing costs. Discernment holds.", { road: { know: 1 }, gnosis: 1 }),
      mid: ao("It tells you what you want to hear. You notice that it did.", { road: { know: 1 }, longing: 1 }),
      miss: ao("It tells you what you want to hear.", { clock: 1, longing: 1 }),
    },
  },
  {
    id: "rg_queue", enc: "grammar", phase: [0], tier: 0, art: "bell", who: "The Festival Queue",
    text: "A queue for the festival bread, in four lines, with rules about which line is yours. Everyone's following them.",
    left: { label: "Follow them", verb: "endure", fx: { clock: 1, hollow: -1 }, text: "Compliance is invisible. So is the bread being good. You eat." },
    right: { label: "Stand in the wrong line", verb: "confront", fx: { road: { cut: 1 }, mark: 1 }, text: "Nothing happens, and then three people join you. The rule was only ever everyone's agreement." },
  },
  {
    id: "rg_named", enc: "grammar", phase: [0], tier: 0, art: "hood", who: "The Named", weight: 3,
    when: (s) => s.asc.freed >= 1,
    text: "The ones you got out came back for the festival. They know his grammar: they've been in its margin.",
    build(s) {
      const n = s.asc.named.slice(0, s.asc.freed).map((x) => x.n);
      return n.length ? { ...this, text: `${n.join(" and ")} came back for the festival. They know his grammar: they've been in its margin.` } : this;
    },
    left: { label: "Let them speak first", verb: "ally", fx: { road: { name: 1 }, gnosis: 1 }, text: "They read their own names out, in their own voices, over his." },
    right: { label: "Send them away, it's dangerous", verb: "endure", fx: { strain: 1 }, text: "It is. You're alone with the notices again." },
  },
  {
    id: "rg_nyx", enc: "grammar", phase: [0], tier: 0, art: "veil", who: "Nyx · Machine-Sight", weight: 4, when: (s) => s.mask === "nyx",
    text: "Through the Veil the grammar is a machine like the others. It has a blind spot: it can't parse what it hasn't written yet.",
    left: { label: "Live in the next sentence", verb: "evade", roll: { stat: "shade" },
      hit: ao("You step into the sentence he hasn't written. He reaches for you and finds paper.", { road: { cut: 2 } }),
      mid: ao("Half there. Dissolution: you can feel yourself thinning.", { road: { cut: 1 }, strain: 1 }),
      miss: ao("He writes the next sentence quickly, with you in it.", { clock: 1 }) },
    right: { label: "Diagram it", verb: "expose", fx: { road: { know: 1 }, strain: 1 }, text: "Subject, verb, object. The object was always you. On paper it's just a sentence." },
  },
  {
    id: "rg_eris", enc: "grammar", phase: [0], tier: 1, art: "blade", who: "Eris · the Velvet Guillotine", weight: 4, when: (s) => s.mask === "eris",
    text: "The grammar is held together by one chain you can actually reach. The Blade knows chains.",
    left: { label: "Sever it, cleanly", verb: "confront", roll: { stat: "steel" },
      hit: ao("Clean. The sentence it held falls apart in his hand.", { road: { cut: 2 } }),
      mid: ao("It gives. People talk about how it was done.", { road: { cut: 1 }, mark: 1 }),
      miss: ao("The Blade skids off something older than knives.", { clock: 1, mark: 1 }) },
    right: { label: "Lower the Blade", verb: "endure", fx: { apo: -1, strain: 1 }, text: "Severance, not annihilation. You put it away, which is the harder skill." },
  },
  {
    id: "rg_lilith", enc: "grammar", phase: [0], tier: 0, art: "serpent", who: "Lilith · the Eye", weight: 4, when: (s) => s.mask === "lilith",
    text: "The Eye of Lilith is in his alphabet. Every notice is written partly in her letters, and he's never noticed.",
    left: { label: "Read it in her letters", verb: "unweave", roll: { stat: "freq" },
      hit: ao("Read her way, every notice is a list of people who refused. You're in good company.", { road: { know: 2 } }),
      mid: ao("Half her way. It opens you right up.", { road: { know: 1 }, longing: 1 }),
      miss: ao("You read too far. You want to stay in the notices, reading.", { clock: 1, longing: 1 }) },
    right: { label: "Close the working", verb: "endure", fx: { strain: -1 }, text: "This working is ended. The letters stay where they are, waiting." },
  },
  {
    id: "rg_bare", enc: "grammar", phase: [0], tier: 0, art: "door", who: "The Bare Face", weight: TUNING.bareFightWeight, when: (s) => s.mask === "bare",
    text: "No Mask. His grammar has an entry for every Mask you've worn. It doesn't have one for this.",
    left: { label: "Say your own name", verb: "ally", fx: { road: { name: 1 }, gnosis: 1, strain: 1 }, text: "The one you were given before anyone filed you. It isn't in his grammar. It never was." },
    right: { label: "Follow the rule, once", verb: "endure", fx: { clock: 1, strain: -1 }, text: "Just this once. Ordinary people do. It's very restful." },
  },
  {
    id: "rg_last", enc: "grammar", phase: [1], forcedOnly: true, noIntent: true, fixed: true, final: true, tier: 1, art: "scroll", who: "The Full Stop",
    text: "The end of his sentence, with you in it. At the bottom of every notice, a line for a signature, and nobody's name on it.",
    build(s) {
      return { ...this, right: standOn(s, "Break the sentence") };
    },
    left: { label: "Disengage", verb: "flee", fx: { resolve: "fled" }, text: "You stop arguing in his words, and walk out of the sentence." },
    right: { label: "Break the sentence", verb: "confront", fx: {} },
  },

  // ================= Rex Mundi · the Festival =================
  // In the festival, stepping into the light is relief now and the Festival's clock: no hidden Reckoning later.
  {
    id: "rf_open", enc: "festival", phase: [0], forcedOnly: true, noIntent: true, fixed: true, tier: 0, art: "sun", who: "The Festival of the False Sun",
    text: "The procession comes round the corner, and with it the light: better than daylight, everything the Light ever promised, and no Reckoning in sight.",
    left: {
      label: "Hold", verb: "confront",
      roll: { stat: "steel", light: true },
      hit: ao("You hold. You know exactly what it would fix. You always will.", { road: { hold: 1 }, gnosis: 1 }),
      mid: ao("You hold. Your body negotiates the whole time.", { road: { hold: 1 }, strain: 1 }),
      miss: ao("It waited for the moment you were most empty.", { strain: -2, hollowTo: 1, clock: 2 }),
    },
    right: { label: "Step into it", verb: "endure", fx: { strain: -2, hollowTo: 1, clock: 2 }, text: "Gold. Everything's gold. Somewhere, a bill is being written in your hand." },
  },
  {
    id: "rf_mirror", enc: "festival", phase: [0], tier: 0, art: "eye", who: "The Festival of the False Sun",
    text: "In the light you can see yourself: gold, finished, forgiven. It's a beautiful picture. It's a picture.",
    left: {
      label: "Say it plainly: it's a mirror", verb: "expose",
      roll: { stat: "wits" },
      hit: ao("You say it, plainly, to everyone in the light. A few of them look away from their own reflections.", { road: { plain: 2 } }),
      mid: ao("You say it. It's hard to say. Some of them hear.", { road: { plain: 1 }, strain: 1 }),
      miss: ao("You say it, and you're still looking.", { clock: 1, longing: 1 }),
    },
    right: { label: "Look a little longer", verb: "endure", fx: { strain: -1, clock: 1 }, text: "It's restful, being finished." },
  },
  {
    id: "rf_procession", enc: "festival", phase: [0], tier: 1, art: "sun", who: "The Procession",
    text: "Everyone in the procession looks so happy. Some of them are people from the tithe-queue.",
    left: { label: "Tell them what it costs", verb: "ally", fx: { road: { plain: 1 }, strain: 1 }, text: "One of them listens. She steps out of the gold, blinking, and stands behind you." },
    right: { label: "Join them for a while", verb: "endure", fx: { longing: -1, clock: 2 }, text: "For a while is how long it always is." },
  },
  {
    id: "rf_banners", enc: "festival", phase: [0], tier: 0, art: "serpent", who: "The Banners",
    text: "The festival's banners, its sun-glyphs, its float: Dominion material, all of it, and all of it reworkable.",
    left: {
      label: "Rework a banner", verb: "unweave",
      roll: { stat: "freq" },
      hit: ao("One stitch, and the sun on it is just a circle. The float goes by under it. Nobody notices but you.", { road: { ceremony: 2 } }),
      mid: ao("It works, and you can't stop seeing the other banners.", { road: { ceremony: 1 }, longing: 1 }),
      miss: ao("A deacon sees what you did to his banner.", { clock: 1, mark: 1 }),
    },
    right: { label: "Leave it hanging", verb: "evade", fx: { road: { hold: 1 }, strain: 1 }, text: "It's their festival. You don't have to fix it. You have to get through it." },
  },
  {
    id: "rf_bill", enc: "festival", phase: [0], tier: 1, art: "coin", who: "The Bill", weight: 3,
    when: (s) => s.tolerance >= 1 || s.gilt > 0,
    text: "The bill for every Communion you've taken, itemised, with interest. He'll forgive all of it. Just stay.",
    left: { label: "Pay what you can", verb: "negotiate", fx: { favor: -2, road: { hold: 1 } }, text: "Not all of it. Enough that it's yours, not his." },
    right: {
      label: "Read the small print", verb: "expose",
      roll: { stat: "wits" },
      hit: ao("Forgiveness, the small print says, is an advance on the next bill.", { road: { plain: 2 } }),
      mid: ao("You find the catch. You'd still like to be forgiven.", { road: { plain: 1 }, longing: 1 }),
      miss: ao("The small print is very small.", { clock: 1 }),
    },
  },
  {
    id: "rf_token", enc: "festival", phase: [0], tier: 0, art: "lantern", who: "The White Token", weight: 4,
    when: (s) => !!s.flags.token,
    text: "Something in your boot weighs nothing, and has never weighed more.",
    left: { label: "Hold it, and hold", verb: "confront", fx: { road: { hold: 1 }, strain: 1 }, text: "You've started over before. You start over now, in the middle of the festival." },
    right: { label: "Call before, not after", verb: "ally", fx: { road: { plain: 1 }, strain: -1 }, text: "Somebody picks up, even tonight. Especially tonight." },
  },
  {
    id: "rf_nyx", enc: "festival", phase: [0], tier: 0, art: "veil", who: "Nyx · the Revenant Road", weight: 4, when: (s) => s.mask === "nyx",
    text: "Light makes shadows. Even his. Especially his.",
    left: { label: "Stand in his shadow", verb: "evade", roll: { stat: "shade" },
      hit: ao("In the one place the false sun can't reach: right behind it.", { road: { hold: 2 } }),
      mid: ao("Mostly in shadow. Your hands are gold.", { road: { hold: 1 }, strain: 1 }),
      miss: ao("There's no shadow. There never was.", { clock: 1, strain: -1 }) },
    right: { label: "Feel the floor", verb: "endure", fx: { road: { hold: 1 }, strain: 1 }, text: "Grounded, bodily. The floor is real. The light isn't." },
  },
  {
    id: "rf_eris", enc: "festival", phase: [0], tier: 1, art: "blade", who: "Eris · the Blade", weight: 4, when: (s) => s.mask === "eris",
    text: "In this light the Blade looks holy. You could do anything with it. That's how the light recruits.",
    left: { label: "Put the Blade down", verb: "endure", fx: { road: { hold: 1 }, apo: -1, strain: 1 }, text: "The holiest-looking thing you own, on the ground, by choice." },
    right: { label: "Cut the light", verb: "confront", roll: { stat: "steel", light: true },
      hit: ao("It parts. Behind it: a wall, plaster, a crack. Just a square.", { road: { plain: 2 } }),
      mid: ao("It parts and closes. You feel enormous for a moment.", { road: { plain: 1 }, apo: 1 }),
      miss: ao("You cut, and it pours in.", { strain: -2, hollowTo: 1, clock: 2 }) },
  },
  {
    id: "rf_lilith", enc: "festival", phase: [0], tier: 0, art: "serpent", who: "Lilith · Transmutation", weight: 5, when: (s) => s.mask === "lilith",
    text: "The procession is a rite, and rites can be reframed. Not his light: his material. The Eye knows how.",
    left: { label: "Make it your ceremony", verb: "unweave", roll: { stat: "freq" },
      hit: ao("The procession goes on, and it's saying something else now. You feel it in your teeth.", { road: { ceremony: 2 }, longing: 1 }),
      mid: ao("Some of it turns. Some of it turns you.", { road: { ceremony: 1 }, longing: 1 }),
      miss: ao("The working breaks containment. Gold, everywhere, in you.", { strain: -2, hollowTo: 1, clock: 2 }) },
    right: { label: "Name what it is", verb: "expose", fx: { road: { plain: 1 }, longing: 1 }, text: "Prosay. Counterfeit. Somebody else's. Said in the serpent's grammar, it can't pretend." },
  },
  {
    id: "rf_bare", enc: "festival", phase: [0], tier: 0, art: "cup", who: "The Bare Face", weight: TUNING.bareFightWeight, when: (s) => s.mask === "bare",
    text: "No Mask, in the light. You're hungry, and tired, and a little cold. All true. None of it his.",
    left: { label: "Eat something real", verb: "endure", fx: { road: { hold: 1 }, hollow: -1 }, text: "Bread from your pocket. Stale, and yours. The light can't compete with stale and yours." },
    right: { label: "Hold someone's hand", verb: "ally", fx: { road: { plain: 1 }, strain: 1 }, text: "Theirs is cold too. Good. Real things are cold sometimes." },
  },
  {
    id: "rf_noon", enc: "festival", phase: [1], forcedOnly: true, noIntent: true, fixed: true, final: true, tier: 0, art: "sun", who: "Noon",
    text: "Noon: the counterfeit sun at the top of the sky, and nowhere left to stand in shade. Whatever you built, stand on it now.",
    build(s) {
      return { ...this, right: standOn(s, "Stand on it") };
    },
    left: { label: "Disengage", verb: "flee", fx: { resolve: "fled" }, text: "You step out of the procession and stand in a doorway until it passes." },
    right: { label: "Stand on it", verb: "confront", fx: {} },
  },

  // ================= the Oldest Trap: §2.2's failure-mode test. Grandiosity, then one temptation, the Gate, the Chair =====
  // Each offer really solves something on the board, and pulls. Refusing pays in the Compass's own currency:
  // orientation (Strain, free bare-faced), witness, the Two-Column Test.
  {
    id: "tr_grand", enc: "trap", phase: [0], forcedOnly: true, noIntent: true, fixed: true, tier: 1, art: "crown", who: "Rex Mundi, in Your Hand",
    text: "“You did this. Nobody else could have.” It's in your handwriting. It's nearly true.",
    build(s) {
      const echo = s.asc.echo ? ` Underneath, in the same hand: “${s.asc.echo}”.` : "";
      // Another's will, named as yours at the Law of the Star (occult.js), is written there too.
      const claimed = s.asc.occ && s.asc.occ.claimed ? " And under that: “Their will was mine to name.”" : "";
      return {
        ...this,
        text: this.text + echo + claimed,
        right: witness(s)
          ? { label: "Name who helped", verb: "ally", fx: { apo: -1, gnosis: 1 }, text: "You name them, every one. It's a long list. That's the point." }
          : { label: "Name who helped", verb: "ally", fx: { longing: 1 }, text: "You try. Nobody comes to mind. That hurts more than it should." },
      };
    },
    left: { label: "“I did.”", verb: "confront", fx: { strain: -2, apo: 1 }, text: "It's true enough to feel wonderful." },
    right: { label: "Name who helped", verb: "ally", fx: {} },
  },
  {
    id: "tr_exempt", enc: "trap", phase: [0], forcedOnly: true, noIntent: true, fixed: true, tier: 1, art: "crown", who: "The Oldest Trap · Exemption",
    text: "“Rules are for the registered. Not for you, not after all this.”",
    build(s) {
      return { ...this, right: { label: "Same rules", verb: "endure", fx: { strain: s.mask === "bare" ? 0 : 1, apo: -1 }, text: "Same Bell, same queue, same evidence. It's lighter bare-faced: there's nothing to keep up." } };
    },
    left: { label: "“Not me.”", verb: "confront", fx: { strain: -2, hollow: -1, apo: 2 }, text: "It feels like stepping out of a coat made of lead." },
    right: { label: "Same rules", verb: "endure", fx: {} },
  },
  {
    id: "tr_enemy", enc: "trap", phase: [0], forcedOnly: true, noIntent: true, fixed: true, tier: 1, art: "hood", who: "The Oldest Trap · A Hidden Enemy",
    text: "“Someone close has been reporting on you. You know who.” You don't. It says you do.",
    build(s) {
      return { ...this, right: { label: "Two columns", verb: "expose", fx: { strain: s.mask === "bare" ? 0 : 1, gnosis: 1 }, text: "Did it happen? Is there evidence it was meant? Is there evidence it's connected? You ask all three." } };
    },
    left: {
      label: "Act on it", verb: "confront",
      roll: { stat: "fortune" },
      hit: ao("You were right, this time. It changes nothing you can see.", { mark: -2, apo: 1 }),
      mid: ao("Inconclusive. You were cold to someone who didn't deserve it.", { apo: 1 }),
      miss: ao("You were wrong, and they heard you say it.", { apo: 2, loseBond: true }),
    },
    right: { label: "Two columns", verb: "expose", fx: {} },
  },
  {
    id: "tr_contempt", enc: "trap", phase: [0], forcedOnly: true, noIntent: true, fixed: true, tier: 1, art: "bell", who: "The Oldest Trap · Contempt",
    text: "“Look at the tithe-queue. They chose this. You're not like them.”",
    left: { label: "They chose it", verb: "confront", fx: { favor: 2, apo: 1 }, text: "Contempt is very cheap, and it pays at once." },
    right: { label: "Stand in the queue", verb: "ally", fx: { favor: -1, apo: -1 }, text: "You stand in it. It's long. You know half of them." },
  },
  {
    id: "tr_certain", enc: "trap", phase: [0], forcedOnly: true, noIntent: true, fixed: true, tier: 1, art: "eye", who: "The Oldest Trap · Certainty",
    text: "“They were always against you. All of them. It fits.” It does fit. It arrived very fast.",
    build(s) {
      return { ...this, right: { label: "The Two-Column Test", verb: "expose", fx: { strain: s.mask === "bare" ? 0 : 1, gnosis: 1 }, text: "Column A: what happened. Column B: what fits. One ordinary explanation, before you act. It's slow." } };
    },
    left: { label: "It fits", verb: "confront", fx: { mark: -1, strain: -1, apo: 1 }, text: "Everything makes sense at once. It's such a relief." },
    right: { label: "The Two-Column Test", verb: "expose", fx: {} },
  },
];

// The Ways Out, and the losses the long road adds. Every older ending keeps its id.
export const ASC_ENDINGS = {
  catalogued: { title: "Catalogued", line: "No blade, no roll. A card in a drawer with your description on it, cross-referenced to everyone you ever stood beside.", hint: "Let the Inquisition finish its catalogue.", family: "unmaking" },
  fluent: { title: "Fluent", line: "You learned his grammar until you thought in it. Every plan you made after that came with a cell.", hint: "Let the Grammar finish its sentence.", family: "unmaking" },
  gilded: { title: "Gilded", line: "Everything was gold, forever. Forever was shorter than it sounded.", hint: "Stay in the festival's light until it's full.", family: "unmaking" },
  decree: { title: "By Decree", line: "You won. That's the problem. You opened every gate by decree, and somebody had to decide who'd keep them. The chair fit. It was built to.", hint: "Sit down.", family: "unmaking", kept: true },
  exodus: { title: "A Door They Can't Close", line: "A road with no Bell on it. Nobody followed you, and nobody came with you. It still counts.", hint: "Walk out.", win: true, family: "unmaking" },
  flicker: { title: "The Sun Flickers", line: "You broke one of his rules, in one street, for one festival. It was cancelled. Nobody knows who to thank, which is how you know it worked.", hint: "Cut the Grammar's chain, then stop the festival by force, with someone beside you and the Pull low.", win: true, family: "unmaking" },
  saved_savior: { title: "Saved Savior", line: "You got them through, and the gate shut with you on this side. Still needing deliverance. Delivering anyway.", hint: "Hold the gate for someone.", win: true, family: "unmaking" },
  open_gate: { title: "The Open Gate", line: "The Bell rang and the gate stayed open. People you'd only known as names in a margin walked out under their own.", hint: "Free two of the Named, keep the Pull low, and leave the chair empty.", win: true, family: "unmaking" },
  the_return: { title: "The Return", line: "The chair stays empty and the forms stay unsigned. The Bell still rings. You're home before it, by a light that never sent a bill.", hint: "Leave the chair empty: awake, unpulled, and not alone.", win: true, family: "unmaking" },
};

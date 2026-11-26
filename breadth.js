// FALSE LIGHT — the Breadth Pass (2026-11-26): the city beneath the record. Places, the people who live in them, and
// the things they remember. Data, plus pure readers of the run; engine.js runs it.
//
// Exodus only, and only on a run begun under rules 4 (s.asc.syn.v >= 4, a "-d4" dare). A run on rules 1-3, the
// Vigil and Endless never see any of it, so their seeds, saves and links play exactly as before.
//
// Canon this follows (the public edition): the Warrens are "tithe-alleys, processional ways, market hubs, almshouses,
// the geometry of courtyards" (§1.4); the Geometry is strongest "wherever rules are kept and logs are made" (§1.1);
// the Eye "appears where it should not: embedded in the Dominion's architecture" (§1.3); the Inquisition would
// "rather catalog you than strike your name" (§1.2). The people here are the game's own fiction, never anyone real.
//
// A card here is an ordinary road card (the shape in cards.js), plus place (a family below) and, for a person's
// card, npc. Its one fx key is brd: { owe: key } starts a thread (the draw it began on is remembered), { clear: key }
// ends it, { npc: { id: n } } moves how that person stands with you (a small hidden number, never shown as a meter).
// A thread's next card waits for brdDue: enough cards since (a fight's included), so the city remembers rather than
// replies; then it takes the next road draw (brdCall).
// A thread's answer can find you in any movement, the festival's included: the city catches up. A thread whose answer
// couldn't come in the movement the road has reached would be let go (engine.js enterAct); none is, today.

const brdO = (text, fx) => ({ text, fx });

// Rules 4 and the state it carries. Nothing below runs without it.
export const brdOn = (s) => !!(s.asc && s.asc.syn && s.asc.syn.v >= 4 && s.asc.brd);
export const freshBrd = () => ({ v: 1, t: {}, npc: {} });
const BRD_NONE = Object.freeze({ t: Object.freeze({}), npc: Object.freeze({}) });
const brdB = (s) => (s.asc && s.asc.brd) || BRD_NONE;
// A thread begun, and enough cards since for it to come back.
export const brdHas = (s, k) => Object.hasOwn(brdB(s).t, k);
export const brdDue = (s, k, n) => brdHas(s, k) && (s.draws | 0) - brdB(s).t[k] >= n;
// How a person stands with you: 0 a stranger, up to 3, down to −2.
export const brdRel = (s, id) => brdB(s).npc[id] | 0;

const brdSeen = (s, id) => !!s.flags["seen_" + id];

// ---------- the Atlas ----------
// Each family of places: the movements it belongs to, and the Act II road that runs through it (its cards come up
// twice as often there). canon: where the public edition names it; derived: built from what it says; proposed: ours.
export const BRD_PLACES = {
  courts: { name: "The Back Courts", acts: [1, 2], road: "chapter", canon: "§1.4", line: "Courtyards the size of a held breath. Everyone hears everything; nobody says so." },
  tithe: { name: "The Tithe Roads", acts: [1, 2], road: "tithe", canon: "§1.1, §1.4", line: "The carts come in full and go out lighter. Every milestone has a clerk, and every clerk has a reason." },
  market: { name: "The Unrecorded Market", acts: [1, 2], road: "tithe", canon: "derived (§1.4, §15.1)", line: "A market that moves every night and keeps no books. Everything is for sale except a receipt." },
  chapel: { name: "The Shut Chapel", acts: [1, 2, 3], road: "chapter", canon: "derived (§15.1)", line: "A chapel the Dominion closed and forgot to burn. The doors are sealed. The windows aren't." },
  archive: { name: "The Archive Stair", acts: [1, 2], road: "aperture", canon: "derived (§1.2)", line: "Seven floors of paper, every one of them about somebody. The stair is public. The doors are not." },
  // T2 (2026-11-26)
  district: { name: "The Processional District", acts: [1, 2], road: "procession", canon: "derived (§1.4, §16)", line: "Wide stones for walking in step. Every doorway has a clerk, and every clerk a smile." },
  shrine: { name: "The Sun-Houses", acts: [1, 2], road: "procession", canon: "derived (§1.2, the false sun's aesthetics)", line: "A hooked wheel over every lintel. Come in for the warmth. Leave with a pew number." },
  assembly: { name: "The Hidden Assemblies", acts: [1, 2], road: "chapter", canon: "derived (§15.1, a tolerant chapel or beguinage)", line: "A room above a room. The door is a knock, and the knock changes." },
  refuge: { name: "The Day-Houses", acts: [1, 2], road: "tithe", canon: "§15.1 (a day-house of the registered poor)", line: "Meals, water and quiet for the registered poor. A ledger by the door counts the meals, and the quiet." },
  library: { name: "The Closed Stacks", acts: [1, 2], road: "aperture", canon: "derived (§1.2; the forbidden library, §14)", line: "Books the Dominion keeps and won't lend. The reading rooms admit those with a reason." },
};
// A place's card, weighted for where the run is: half again as often as an ordinary card (the city is most of what the
// road walks through), and twice that on its own Act II road.
// When the body is spent (Hollow 2 or more) the places draw at one in four: a night's rest isn't crowded out by
// the city. Without this, rules 4 rested 27.2% of nights against 30.4% and Collapse rose 53 → 81 in 600 careful
// runs; with it, 28.5% and 65 (BREADTH_PASS.md, 2026-11-26).
// A card that gives rest (`rests`) is exempt: it's the one place card a spent body should find.
export const brdWeight = (s, c) => (c.place ? (s.asc.act === 2 && BRD_PLACES[c.place].road === s.asc.road ? 3 : 1.5) * (s.hollow >= 2 && !c.rests ? 0.25 : 1) : 1);

// ---------- the people ----------
// Recurring, and each with a way of dealing with you. None of them is a meter: what they remember shows only in
// what they do next. Some of them only live here.
export const BRD_PEOPLE = {
  uc: { name: "Uc the Stitcher", place: "courts", line: "Sews what the almshouse won't, and asks nothing, which is a price of its own." },
  anselm: { name: "Clerk Anselm", place: "tithe", line: "A tithe clerk who believes in the count. Sincerely. That's what makes him dangerous, and decent." },
  tibors: { name: "Tibors", place: "tithe", line: "The toll-keeper's boy. Counts carts wrong on purpose." },
  peyre: { name: "Peyre, Who Holds Promises", place: "market", line: "Buys and sells who owes whom. Never says which." },
  mirande: { name: "Mirande, Who Reads Sleep", place: "chapel", line: "Reads dreams for a dream. Never explains all of one." },
  orable: { name: "Orable of the Ninth Shelf", place: "archive", line: "An archivist who misfiles on purpose." },
  // T2 (2026-11-26)
  hesper: { name: "Hesper, Procession Marshal", place: "district", line: "Chalks the route. Short temper, long memory, and a soft spot she'd deny under oath." },
  calix: { name: "Brother Calix, Lamp-Keeper", place: "shrine", line: "Trims the lamps of the false sun and has started asking what the light is for." },
  wren: { name: "Wren, Who Keeps the Door", place: "assembly", line: "Sits by a door, knitting nothing, deciding who is safe." },
  dessa: { name: "Almoner Dessa", place: "refuge", line: "Runs a day-house on a fund she won't explain. Writes down nothing." },
  ferrant: { name: "Ferrant the Binder", place: "library", line: "Mends the books the Dominion calls sick. Takes payment in news." },
  odo: { name: "Odo, Night-Cart", place: "tithe", line: "Drives a tarped cart after the bell. Has never once said where it goes." },
};

// The threads: a key a card begins, the cards that answer it, in order. The test walks each one to its end.
export const BRD_THREADS = {
  uc_girl: { name: "The girl downstairs", cards: ["n_uc1", "n_uc2"] },
  anselm: { name: "An honest count", cards: ["n_an1", "n_an2"] },
  cart: { name: "The broken cart", cards: ["tr_cart", "tr_cart2"] },
  peyre: { name: "A promise held", cards: ["n_pe1", "n_pe2"] },
  peyre_letter: { name: "The sealed letter", cards: ["n_pe2", "n_pe3"] },
  mirande: { name: "An unfinished dream", cards: ["n_mi1", "n_mi2"] },
  orable: { name: "The ninth shelf", cards: ["n_or1", "n_or2"] },
  orable_safe: { name: "What Orable kept", cards: ["n_or2", "n_or3"] },
  // T2 (2026-11-26)
  marshal: { name: "The marshal's price", cards: ["n_he1", "n_he2"] },
  lamp: { name: "The dark aisle", cards: ["n_ca1", "n_ca2"] },
  knock: { name: "A knock, at last", cards: ["n_wr1", "n_wr2"] },
  ration: { name: "The short ration", cards: ["n_de1", "n_de2"] },
  binding: { name: "What the binder bound", cards: ["n_fe1", "n_fe2"] },
  binding_page: { name: "The struck name", cards: ["n_fe2", "n_fe3"] },
  night_cart: { name: "The cart at the toll", cards: ["n_od1", "n_od2"] },
  // T4b (2026-11-26): the adversaries, each a hostile thread the sighting begins
  adv_collector: { name: "The Collector's file", cards: ["ad_col1", "ad_col2", "ad_col3"] },
  adv_probe: { name: "The one who already knew", cards: ["ad_pro1", "ad_pro2", "ad_pro3"] },
  adv_entangler: { name: "The long letters", cards: ["ad_ent1", "ad_ent2", "ad_ent3"] },
  adv_fevered: { name: "The purge-drunk", cards: ["ad_fev1", "ad_fev2", "ad_fev3"] },
  adv_hunt: { name: "The patrol, passing", cards: ["ad_hun1", "ad_hun2", "ad_hun3"] },
  adv_zealot: { name: "The preacher at the pump", cards: ["ad_zea1", "ad_zea2", "ad_zea3"] },
  adv_master: { name: "Everything handled", cards: ["ad_mas1", "ad_mas2", "ad_mas3"] },
};

// Which thread each answer ends.
export const BRD_ANSWERS = Object.fromEntries(Object.entries(BRD_THREADS).flatMap(([k, th]) => th.cards.slice(1).map((id) => [id, k])));
// Once a thread is due, its answer takes the next road draw (engine.js draw): of those in the pool, which is to say
// due and dealable, the one that has waited longest; on a tie, the first in the data. A fight between keeps it waiting.
export function brdCall(s, pool) {
  let best = null;
  let most = -1;
  for (const c of pool) {
    const k = BRD_ANSWERS[c.id];
    if (!k || !brdHas(s, k)) continue;
    const age = (s.draws | 0) - brdB(s).t[k];
    if (age > most) (most = age), (best = c.id);
  }
  return best;
}

// ---------- the institutions ----------
// Each is two minds inside one institution, neither good: a card where you take a side sets that side's flag, a named,
// bounded fact of the run (never a meter, never shown), and later cards of the same family read it. A faction card has
// a place (its family) and a faction. Canon: the Dominion's own offices are "rule-keepers" (§1.1) and the Inquisition
// "would rather catalog you than strike your name" (§1.2); the rest are derived from the Warrens' trades (§1.4, §15).
export const BRD_FACTIONS = {
  inquiry: { name: "The Inquisition's Two Minds", place: "archive", canon: "§1.2", flags: ["f_keep", "f_purge"], line: "One half would rather keep you on file. The other would rather the file burned. Both think it's mercy." },
  seals: { name: "The Office of Seals", place: "district", canon: "derived (§1.1)", flags: ["f_true", "f_ladder"], line: "Clerks who stamp what's true, clerks who stamp what's useful, and the long stair between." },
  seekers: { name: "The Readers' Circles", place: "library", canon: "derived (§14)", flags: ["f_open", "f_close"], line: "Independent seekers who disagree about whether a thing found should be shared." },
  brokers: { name: "The Guild and the Ring", place: "market", canon: "derived (§1.4)", flags: ["f_guild", "f_ring"], line: "Honest weights, slow and dear. Short weights, quick and cheap. The poor use both." },
  networks: { name: "The Cellar and the Street", place: "refuge", canon: "derived (§15.1)", flags: ["f_cellar", "f_street"], line: "Refuge networks split on whether to be hidden or to be seen." },
};

// ---------- the adversaries ----------
// Seven of the public edition's threat archetypes (§13), met as short hostile chains and never as fights: a sighting, then
// what comes of how you answered it. Each has one bounded flag, set only by engaging. A card of one names it in `adversary`.
export const BRD_ADVERSARIES = {
  collector: { name: "The Collector", canon: "§13, Tier 1", place: "market", flag: "a_collector", thread: "adv_collector", line: "Wants your attention and your answers, never a contract. Farms you." },
  probe: { name: "The Past-Life Probe", canon: "§13, Tier 1", place: "library", flag: "a_probe", thread: "adv_probe", line: "Knows too much too soon, and presents as the answer to every weak point." },
  entangler: { name: "The Entangler", canon: "§13, Tier 1", place: "courts", flag: "a_entangler", thread: "adv_entangler", line: "Intimacy before the first meeting. By the time you're in the room, you've invested." },
  fevered: { name: "The Fevered", canon: "§13, Tier 2", place: "tithe", flag: "a_fevered", thread: "adv_fevered", line: "The purge-drunk, the fervor-sick. Unpredictable, and the Watch hears them first." },
  hunt: { name: "The Hunting Party", canon: "§13, Tier 3", place: "district", flag: "a_hunt", thread: "adv_hunt", line: "A patrol that circles, loops and herds. The pass you notice is the second." },
  zealot: { name: "The Zealot", canon: "§13, Tier 3", place: "shrine", flag: "a_zealot", thread: "adv_zealot", line: "A preacher of the false sun. Rarely physical; generates Mark." },
  master: { name: "The Master-Seeker", canon: "§13, Tier 2", place: "chapel", flag: "a_master", thread: "adv_master", line: "Sets your terms for you and wants you in a place of their own." },
};

// ---------- the cards ----------
export const BRD_CARDS = [
  // ===== The Back Courts =====
  {
    id: "c_wash", place: "courts", act: [1, 2], tier: 0, art: "veil", who: "The Wash-Line",
    text: "Laundry across the court. Among the shifts, a Watch sash: your neighbor washes for the watch-house. She sees you see it.",
    left: { label: "Nod, say nothing", fx: { longing: 1, untag: 1 }, text: "A nod is a contract here. She'll forget your door on the next sweep." },
    right: { label: "Ask what they pay", fx: { favor: 1, mark: 1 }, text: "Better than you'd think. She puts in a word for you as a second pair of hands. A word is a record." },
  },
  {
    id: "c_quarrel", place: "courts", act: [1, 2], tier: 0, art: "bell", who: "Two Doors Shouting",
    text: "Two neighbors shouting across the court, loud enough to bring the Watch. Everyone's shutter is open a crack.",
    left: {
      label: "Step between them", roll: { stat: "wits" },
      hit: brdO("You find the actual grievance: a borrowed pot. It's always a borrowed pot. The Watch finds nothing to write.", { favor: 1, strain: -1 }),
      mid: brdO("They stop shouting at each other and start shouting at you. It passes.", { strain: 1 }),
      miss: brdO("The Watch arrives and takes three names. Yours is one.", { mark: 1, strain: 1 }),
    },
    right: { label: "Close your shutter", fx: { longing: 1, strain: -1 }, text: "It stops when the Watch arrives. Nobody looks at anybody on the stair for a week." },
  },
  {
    id: "c_supper", place: "courts", act: [1, 2], tier: 0, art: "cup", who: "Court Supper",
    text: "Supper in the court: everyone brings one thing. You have nothing to bring but a story.",
    left: { label: "Tell the story", fx: { longing: -1, mark: 1 }, text: "You tell the one about the clerk and the goose. By morning it's the Warrens' story, and they know whose." },
    right: { label: "Eat, and slip off", fx: { hollow: -1, longing: 1 }, text: "Full, and alone on the stair by the second bell. Both are true." },
  },
  {
    id: "c_rent", place: "courts", act: [1, 2], tier: 1, art: "coin", who: "The Landlord's Rule",
    text: "The landlord has a new rule: anyone the Watch has visited pays double. The Watch has visited you.",
    when: (s) => s.mark >= 3,
    left: { label: "Pay it", fx: { favor: -2, strain: -1 }, text: "He counts it twice and smiles once. The room is still yours." },
    right: { label: "Move rooms", fx: { strain: 1, hollow: 1, untag: 1 }, text: "A worse room, two courts over, where nobody knows what the Watch knows." },
  },
  {
    id: "c_chalk", place: "courts", act: [1, 2], tier: 2, art: "stone", who: "Chalk on the Flagstones", once: true, weight: 0.7,
    text: "Chalk lines on the court's flagstones, redrawn every night by no one you've seen. The Geometry, measuring. Or someone measuring it back.",
    left: { label: "Scuff them out", fx: { untag: 1, strain: 1 }, text: "By morning they're back, a hand's width further from your door." },
    right: { label: "Learn the pattern", fx: { gnosis: 2, cage: 1 }, text: "It's a map of who goes where, and when. You're on it. You learn to read yourself." },
  },
  {
    id: "n_uc1", place: "courts", npc: "uc", act: [1, 2], tier: 0, art: "hand", who: "Uc the Stitcher", once: true, weight: 1.5,
    text: "A man with a needle in his lapel and no sign on his door. He sews what the almshouse won't, and asks nothing.",
    left: { label: "Let him look at you", fx: { favor: -1, hollow: -1, strain: -1, brd: { npc: { uc: 1 } } }, text: "He works fast and talks about the weather. You leave lighter by a coin and a week." },
    right: { label: "Bring him the girl", fx: { strain: 1, longing: -1, brd: { owe: "uc_girl", npc: { uc: 1 } } }, text: "The girl downstairs has a fever nobody's paying for. You carry her up two flights. He doesn't ask whose she is." },
  },
  {
    id: "n_uc2", place: "courts", npc: "uc", act: [1, 2, 3], tier: 0, art: "candle", who: "The Girl Downstairs", once: true,
    when: (s) => brdDue(s, "uc_girl", 4),
    text: "The girl you carried to Uc is on her feet. She's been watching your door, because nobody else was.",
    left: { label: "Teach her the Bell", fx: { strain: 1, untag: 1, brd: { clear: "uc_girl", npc: { uc: 1 } } }, text: "She learns the curfew the way you did, only faster. Two people know your hours now. That's a ward, and a risk." },
    right: { label: "Tell her to forget you", fx: { longing: 1, mark: -1, brd: { clear: "uc_girl", npc: { uc: -2 } } }, text: "She nods like a grown-up. That's worse than if she'd cried. Uc hears of it by supper." },
  },
  {
    id: "n_uc3", place: "courts", npc: "uc", act: [2], tier: 0, art: "house", who: "Uc's Back Room", once: true, weight: 3,
    when: (s) => brdRel(s, "uc") >= 2,
    text: "Uc has a back room he never mentions, full of people he didn't sew. He asks if you'd keep one of them a night.",
    left: { label: "Keep her a night", fx: { favor: -1, strain: 1, bond: "table" }, text: "Morning, a knock: the Open Table, come for their guest. They take your measure, too, and set a place." },
    right: { label: "Not under my roof", fx: { strain: -1, brd: { npc: { uc: -3 } } }, text: "Uc says he understands. He sews your next cut with fewer words." },
  },
  {
    id: "n_uc4", place: "courts", npc: "uc", act: [1, 2], tier: 0, art: "door", who: "Uc's Door, Shut", once: true, weight: 2,
    when: (s) => brdRel(s, "uc") < 0 && s.hollow >= 1,
    text: "You need a needle, and Uc's is the only one that doesn't write things down. His door is shut. You can hear him inside.",
    left: { label: "Knock anyway", fx: { favor: -2, hollow: -1 }, text: "He lets you in and charges you like a stranger. Fair enough. You are one again." },
    right: { label: "Find another needle", fx: { hollow: 1, mark: 1 }, text: "The almshouse surgeon sews you neatly and writes down everything." },
  },

  // ===== The Tithe Roads =====
  {
    id: "n_an1", place: "tithe", npc: "anselm", act: [1, 2], tier: 1, art: "scroll", who: "Clerk Anselm", once: true, weight: 1.5,
    text: "At the toll-stone a clerk recounts your cart twice. He's found an error, in your favor. He seems to find that painful.",
    left: { label: "Tell him it's wrong", fx: { favor: -1, mark: -1, brd: { owe: "anselm", npc: { anselm: 1 } } }, text: "He corrects it and thanks you. Actually thanks you. He'll remember your face as an honest one. He remembers everything." },
    right: { label: "Sign and go", fx: { favor: 2, brd: { owe: "anselm", npc: { anselm: -1 } } }, text: "You sign. The error leaves with you. Behind you, a sincere man rechecks the day." },
  },
  {
    id: "n_an2", place: "tithe", npc: "anselm", act: [1, 2, 3], tier: 1, art: "scroll", who: "Clerk Anselm", once: true,
    when: (s) => brdDue(s, "anselm", 3),
    text: "Anselm, again.",
    left: { label: "…", fx: {} }, right: { label: "…", fx: {} },
    build(s) {
      if (brdRel(s, "anselm") > 0)
        return {
          ...this, who: "Anselm's Word",
          text: "A sweep on the tithe road. Anselm walks with the patrol, and points at you. “That one is honest. I checked.”",
          left: { label: "Thank him", fx: { mark: -1, cage: 1, brd: { clear: "anselm" } }, text: "His trust is a lantern. It shows you to everyone, kindly." },
          right: { label: "“We've never met.”", fx: { strain: 1, untag: 1, brd: { clear: "anselm", npc: { anselm: -1 } } }, text: "He looks wounded, then writes something down. Not about you. About himself." },
        };
      return {
        ...this, who: "Anselm Rechecks",
        text: "Anselm found his error. He walked a day to find you. He isn't angry. He's precise.",
        left: { label: "Pay it back", fx: { favor: -2, mark: -1, brd: { clear: "anselm", npc: { anselm: 2 } } }, text: "He takes it, receipts it, and shakes your hand. A sincere man's ledger balances. So, for now, does yours." },
        right: {
          label: "Deny it", roll: { stat: "wits" },
          hit: brdO("He has arithmetic, not proof. Arithmetic isn't a warrant. Yet.", { untag: 1, brd: { clear: "anselm" } }),
          mid: brdO("He lets it go, and writes down that he let it go.", { mark: 1, brd: { clear: "anselm" } }),
          miss: brdO("He reads your face the way he reads a column. Carefully, to the bottom.", { mark: 2, strain: 1, brd: { clear: "anselm" } }),
        },
      };
    },
  },
  {
    id: "n_ti1", place: "tithe", npc: "tibors", act: [1, 2], tier: 0, art: "coin", who: "The Toll-Keeper's Boy", once: true,
    text: "A boy at the toll-stone counts carts aloud, wrong on purpose, to make his father laugh. He counts you as two.",
    left: { label: "Be counted two", fx: { favor: -1, strain: -1 }, text: "You pay double toll, and it's worth it. Somebody laughed today." },
    right: { label: "Be counted none", fx: { untag: 1, longing: 1 }, text: "He winks. You were never here. You feel it, a little, all day: never here." },
  },
  {
    id: "n_ti2", place: "tithe", npc: "tibors", act: [2], tier: 0, art: "coin", who: "Tibors, at the Stone", once: true, weight: 2,
    when: (s) => brdSeen(s, "n_ti1"),
    text: "The toll-keeper's boy has the stone to himself now. His father's gone; the count's his. He still counts you wrong.",
    left: { label: "Ask after his father", fx: { longing: 1, gnosis: 1 }, text: "Struck from the roll for laughing at a clerk. Tibors says it plainly, the way you'd say a toll." },
    right: { label: "Pay the true toll", fx: { favor: -1, mark: -1 }, text: "He takes it without a joke. Growing up here is learning which jokes get written down." },
  },
  {
    id: "tr_mile", place: "tithe", act: [1, 2], tier: 1, art: "scroll", who: "The Milestone Clerk",
    text: "A clerk at every milestone. This one wants your cart's weight, your name's weight, and a little something for his trouble.",
    left: { label: "Something for him", fx: { favor: -1, mark: -1 }, text: "He waves you through without looking up. The cheapest kind of invisible." },
    right: { label: "Only the weights", fx: { strain: 1, untag: 1 }, text: "He writes slowly to punish you. The record he makes is boring. Boring is a ward." },
  },
  {
    id: "tr_cart", place: "tithe", act: [1, 2], tier: 0, art: "hand", who: "A Broken Cart", once: true,
    text: "A tithe cart, axle snapped, its driver alone in the rain. The grain inside isn't his, and isn't yours.",
    left: { label: "Help him lift", fx: { strain: 1, favor: 1, brd: { owe: "cart" } }, text: "Two hours in the mud. He shares his bread and asks your name. You give him one." },
    right: {
      label: "Take a sack", roll: { stat: "shade" },
      hit: brdO("Nobody counts a broken cart twice.", { favor: 2 }),
      mid: brdO("A sack, and a look from the driver.", { favor: 2, mark: 1 }),
      miss: brdO("The driver remembers your face. That's his job, after all.", { favor: 1, mark: 2 }),
    },
  },
  {
    id: "tr_cart2", place: "tithe", act: [1, 2, 3], tier: 0, art: "door", who: "The Driver, Again", once: true,
    when: (s) => brdDue(s, "cart", 4),
    text: "The driver you lifted with is at the fee window, in trouble for a late load. He sees you in the queue.",
    left: { label: "Say it was the axle", fx: { mark: 1, gnosis: 1, brd: { clear: "cart" } }, text: "Your word costs you a line in the record and saves him his place on the road." },
    right: { label: "Look at your feet", fx: { longing: 1, brd: { clear: "cart" } }, text: "He goes into the side room. He doesn't look back, which is a kindness." },
  },
  {
    id: "tr_hours", place: "tithe", act: [1, 2], tier: 1, art: "chain", who: "The Tithe of Hours",
    text: "Short of coin? The tithe-house will take hours instead: a day hauling stone for the new false-sun shrine.",
    left: { label: "Give the hours", fx: { hollow: 1, mark: -1 }, text: "A day of stone. The sun-wheel goes up a course higher, and your name comes off the short list." },
    right: { label: "Find the coin", fx: { favor: -2, strain: -1 }, text: "You find it. Where it comes from will be somebody else's day of stone." },
  },
  {
    id: "tr_eye", place: "tithe", act: [1, 2], tier: 2, art: "eye", who: "A Stone Marked Twice", once: true, weight: 0.7,
    text: "A milestone with the Dominion's seal. Under it, cut finer, an eye: carved so it's read every time theirs is.",
    left: { label: "Trace it", fx: { gnosis: 2, mark: 1 }, text: "Your thumb finds the lines. Someone was here before you, and wasn't afraid of the seal." },
    right: { label: "Scratch it out", fx: { mark: -1, cage: 1 }, text: "Safer for whoever cut it. Safer for you. The stone is just a stone again." },
  },

  // ===== The Unrecorded Market =====
  {
    id: "n_pe1", place: "market", npc: "peyre", act: [1, 2], tier: 1, art: "coin", who: "Peyre, Who Holds Promises", once: true, weight: 1.5,
    text: "Peyre deals in who owes whom, and how much the owing weighs. He'll lend you Favor against a promise. He won't say which.",
    left: { label: "Take the loan", fx: { favor: 3, brd: { owe: "peyre", npc: { peyre: 1 } } }, text: "He writes nothing down. He doesn't have to." },
    right: { label: "Owe no one", fx: { strain: 1, gnosis: 1 }, text: "He shrugs. “Everyone owes someone. You just don't know whom yet.”" },
  },
  {
    id: "n_pe2", place: "market", npc: "peyre", act: [1, 2, 3], tier: 1, art: "letter", who: "Peyre Collects", once: true,
    when: (s) => brdDue(s, "peyre", 3),
    text: "Peyre's promise comes due. He doesn't want the Favor back. He wants a sealed letter carried to the watch-house, unread.",
    left: { label: "Carry it", fx: { mark: 1, cage: 1, brd: { clear: "peyre", owe: "peyre_letter", npc: { peyre: 1 } } }, text: "You never learn what it says. Somebody, somewhere, does." },
    right: { label: "Pay in Favor", fx: { favor: -3, brd: { clear: "peyre", npc: { peyre: -1 } } }, text: "He takes it with a face like a closed shop. Paid in full, and remembered." },
  },
  {
    id: "n_pe3", place: "market", npc: "peyre", act: [1, 2, 3], tier: 1, art: "cup", who: "What the Letter Did", once: true,
    when: (s) => brdDue(s, "peyre_letter", 3),
    text: "Word in the market: a watch-house clerk was struck off the rolls overnight. Peyre buys you a drink without being asked.",
    left: {
      label: "Ask what it said", roll: { stat: "wits" },
      hit: brdO("The clerk's own extortions, in his own hand. Peyre traded one cruelty for its owner.", { gnosis: 2, brd: { clear: "peyre_letter" } }),
      mid: brdO("Something about the clerk's debts. Peyre won't say whose.", { gnosis: 1, strain: 1, brd: { clear: "peyre_letter" } }),
      miss: brdO("He talks about the weather for an hour, and you pay for the second round.", { strain: 1, favor: -1, brd: { clear: "peyre_letter" } }),
    },
    right: { label: "Don't ask", fx: { favor: 2, cage: 1, brd: { clear: "peyre_letter", npc: { peyre: 1 } } }, text: "The drink is good. Peyre likes people who don't ask. That's the whole problem." },
  },
  {
    id: "mk_scale", place: "market", act: [1, 2], tier: 0, art: "coin", who: "The Honest Scale",
    text: "A grain-seller's scale is true. The Dominion's weights are lighter. By hers, she'll be fined. By theirs, she cheats you.",
    left: { label: "Buy by her scale", fx: { favor: -1, mark: 1, gnosis: 1 }, text: "Real weight costs. You both feel watched, and well fed." },
    right: { label: "Buy by theirs", fx: { hollow: 1, mark: -1 }, text: "Short weight, legal weight. You carry home the difference as an ache." },
  },
  {
    id: "mk_names", place: "market", act: [1, 2], tier: 1, art: "scroll", who: "A Seller of Names",
    text: "A woman sells names: real ones, off the roll, of people the Dominion forgot. One would fit you.",
    left: { label: "Buy a name", fx: { favor: -2, untag: 2, cage: 1 }, text: "It fits. You stop answering to your own, a little." },
    right: { label: "Leave it to its owner", fx: { gnosis: 1, longing: 1 }, text: "You ask whose it was. She tells you. That stays." },
  },
  {
    id: "mk_tooth", place: "market", act: [1, 2], tier: 0, art: "hand", who: "The Tooth-Puller's Stall",
    text: "Between the stalls a tooth-puller sings while he works. The patient laughs between yells. It's the best show in the Warrens.",
    left: { label: "Stay and watch", fx: { strain: -1, mark: 1 }, text: "You laugh, and so do the two Watchmen beside you. For a minute there are no sides. Then there are." },
    right: { label: "Have yours seen to", fx: { favor: -1, hollow: -1 }, text: "He sings your name wrong all the way through. You'll eat on that side again." },
  },
  {
    id: "mk_fold", place: "market", act: [1, 2], tier: 1, art: "horn", who: "The Market Folds",
    text: "A whistle. The market packs away in the time it takes to say so. A seller pushes a sack into your arms and runs.",
    left: {
      label: "Keep the sack", roll: { stat: "shade" },
      hit: brdO("Gone into the crowd with it. Turnips, mostly. And a purse.", { favor: 2 }),
      mid: brdO("You get away. The sack gets noticed.", { favor: 2, mark: 1 }),
      miss: brdO("A Watchman takes the sack and your name, in that order.", { favor: 1, mark: 2 }),
    },
    right: { label: "Drop it and walk", fx: { mark: -1, strain: 1 }, text: "Empty-handed is the only honest look. You wear it out of the square." },
  },
  {
    id: "mk_charm", place: "market", act: [1, 2], tier: 0, art: "rose", who: "A Charm-Seller",
    text: "A charm-seller swears this pendant hides you from the Inquisition. It doesn't. It might hide you from yourself.",
    left: { label: "Buy it", fx: { favor: -1, strain: -1, cage: 1 }, text: "It's warm in your hand. You sleep better. You check less." },
    right: { label: "Laugh, kindly", fx: { gnosis: 1, strain: 1 }, text: "She laughs too. Then she sells three to the next woman, who needs them more." },
  },
  {
    id: "mk_tally", place: "market", act: [1, 2], tier: 2, art: "stone", who: "The Ledger Nobody Keeps", once: true, weight: 0.7,
    text: "Under the busiest stall, scratched into the cobbles: every debt this market ever forgave, in tally-marks, so nobody forgets it can.",
    left: { label: "Forgive one of yours", fx: { favor: -1, gnosis: 1, untag: 1 }, text: "You let go a debt you were owed. The tally is one mark longer." },
    right: { label: "Count, and go", fx: { gnosis: 1, longing: -1 }, text: "It's more than you'd guess. You leave lighter for knowing." },
  },

  // ===== The Shut Chapel =====
  {
    id: "n_mi1", place: "chapel", npc: "mirande", act: [1, 2], tier: 0, art: "veil", who: "Mirande, Who Reads Sleep", once: true, weight: 1.5,
    text: "In the shut chapel a woman sleeps in shifts with the pigeons. She reads dreams, she says, for a dream.",
    left: { label: "Tell her yours", fx: { longing: 1, gnosis: 1, brd: { owe: "mirande", npc: { mirande: 1 } } }, text: "She listens without nodding. “Ask me later,” she says. “It isn't finished.”" },
    right: { label: "Keep your dreams", fx: { cage: -1, strain: 1 }, text: "“Good,” she says. “Most people sell them to the first one who asks.”" },
  },
  {
    id: "n_mi2", place: "chapel", npc: "mirande", act: [1, 2, 3], tier: 0, art: "star", who: "Mirande's Reading", once: true,
    when: (s) => brdDue(s, "mirande", 3),
    text: "Mirande finds you. Your dream has finished, she says, and you were in it differently than you thought.",
    left: {
      label: "Ask what it means", roll: { stat: "freq" },
      hit: brdO("She tells you one thing. It's enough, it's true, and it isn't comfortable.", { gnosis: 2, brd: { clear: "mirande" } }),
      mid: brdO("She tells you half. You argue with the other half for days.", { gnosis: 1, longing: 1, brd: { clear: "mirande" } }),
      miss: brdO("She tells you too much. You carry it around like wet wool.", { longing: 2, brd: { clear: "mirande" } }),
    },
    right: { label: "Let it stay hers", fx: { untag: 1, longing: -1, brd: { clear: "mirande", npc: { mirande: 1 } } }, text: "“Good,” she says, the same as before. You think she was hoping you'd say it." },
  },
  {
    id: "n_mi3", place: "chapel", npc: "mirande", act: [3], tier: 0, art: "ways", who: "Mirande at the Edge", once: true, weight: 3,
    when: (s) => brdRel(s, "mirande") >= 2,
    text: "Near the city's edge, Mirande again. She dreamt of you walking out, she says. She couldn't see whether you went alone.",
    left: { label: "Ask who was with me", fx: { longing: 1, gnosis: 1 }, text: "“I didn't say anyone was,” she says, and goes back to sleep in the doorway." },
    right: { label: "Don't tell me", fx: { cage: -1, strain: 1 }, text: "She smiles like you passed something. You'll find out on the road." },
  },
  {
    id: "sc_pews", place: "chapel", act: [1, 2, 3], tier: 0, art: "candle", who: "The Nave's Tenants", rests: true, weight: (s) => (s.hollow >= 2 ? 4 : 1),
    text: "The shut chapel's pews are full of the unregistered, asleep. There's room for one more, if you'll take a turn at the door.",
    left: { label: "Take the door", fx: { hollow: -1, strain: 1, rest: true }, text: "Half a night awake, half asleep in a pew. More sleep than you've had in a week." },
    right: { label: "Sleep elsewhere", fx: { hollow: 1, mark: -1 }, text: "The pews are on somebody's list. You'd rather not be." },
  },
  {
    id: "sc_altar", place: "chapel", act: [1, 2, 3], tier: 2, art: "serpent", who: "The Bare Altar", once: true, weight: 0.7,
    text: "Where they pried the sun-wheel off the altar, an older carving shows: a serpent coiled around an open door.",
    left: { label: "Sit with it", fx: { gnosis: 1, strain: -1, longing: 1 }, text: "Nobody preaches at you. The door just stays open, in stone, for an hour." },
    right: { label: "Cover it again", fx: { mark: -1, cage: 1 }, text: "Someone will find it who needs it more. That's what you tell yourself." },
  },
  {
    id: "sc_priest", place: "chapel", act: [1, 2], tier: 1, art: "hood", who: "A Priest Without a Parish",
    text: "A man in a scraped-off cassock says Mass to the empty chapel every dawn. He preached against your kind once. Now he can't stop.",
    left: {
      label: "Hear him out", roll: { stat: "wits" },
      hit: brdO("He doesn't want absolution. He wants a witness. You can be that.", { gnosis: 1, cage: -1 }),
      mid: brdO("Two hours of him arguing with a voice that isn't yours.", { strain: 1, gnosis: 1 }),
      miss: brdO("It wasn't the doctrine he loved, it turns out. It was the certainty. He offers you some.", { strain: 1, cage: 1 }),
    },
    right: { label: "Leave him to it", fx: { strain: -1, longing: 1 }, text: "His voice follows you down the street, telling the pigeons what's holy." },
  },
  {
    id: "sc_seal", place: "chapel", act: [1, 2], tier: 1, art: "seal", who: "The Seal on the Door",
    text: "The Dominion's seal on the chapel door is cracking. Whoever breaks it is liable. Whoever reports it is rewarded.",
    left: { label: "Report it", fx: { favor: 2, cage: 1, mark: -1 }, text: "A clerk comes, reseals it and pays you. The pews are empty by the next night." },
    right: { label: "Let it crack", fx: { untag: 1, strain: 1 }, text: "Not your seal, and not your report. The chapel's tenants nod to you in the street." },
  },

  // ===== The Archive Stair =====
  {
    id: "n_or1", place: "archive", npc: "orable", act: [1, 2], tier: 1, art: "scroll", who: "Orable of the Ninth Shelf", once: true, weight: 1.5,
    text: "An archivist with ink to the wrist. She's misfiled a box on purpose, she says, and someone should know what's in it besides her.",
    left: {
      label: "Copy a page", roll: { stat: "wits" },
      hit: brdO("A list of the Named, and why. You copy it in a hand that isn't yours.", { gnosis: 2, brd: { owe: "orable", npc: { orable: 1 } } }),
      mid: brdO("Half a page, and a clerk on the stair saw you come down.", { gnosis: 1, mark: 1, brd: { owe: "orable", npc: { orable: 1 } } }),
      miss: brdO("A clerk comes in halfway. Orable talks him out of it. Mostly.", { mark: 2, brd: { owe: "orable" } }),
    },
    right: { label: "Keep out of it", fx: { strain: -1, brd: { npc: { orable: -1 } } }, text: "She nods. She'll find somebody braver, or more careless." },
  },
  {
    id: "n_or2", place: "archive", npc: "orable", act: [1, 2, 3], tier: 2, art: "eye", who: "The Search of the Shelves", once: true,
    when: (s) => brdDue(s, "orable", 3),
    text: "Inquisitors on the archive stair. Orable is being questioned about the ninth shelf. She hasn't looked your way once, which is how you know.",
    left: {
      label: "Draw them off", roll: { stat: "shade" },
      hit: brdO("A dropped crate, a shout, a door left open. Orable walks out with the lunch crowd.", { mark: 1, brd: { clear: "orable", owe: "orable_safe", npc: { orable: 1 } } }),
      mid: brdO("She walks out. They took a good look at whoever dropped the crate.", { mark: 2, brd: { clear: "orable", owe: "orable_safe", npc: { orable: 1 } } }),
      miss: brdO("They keep you an hour, and her all night.", { mark: 2, strain: 1, brd: { clear: "orable" } }),
    },
    right: { label: "Stay out of sight", fx: { longing: 1, untag: 1, brd: { clear: "orable", npc: { orable: -1 } } }, text: "Orable isn't on the stair the next day, or the next." },
  },
  {
    id: "n_or3", place: "archive", npc: "orable", act: [1, 2, 3], tier: 1, art: "scroll", who: "What Orable Kept", once: true,
    when: (s) => brdDue(s, "orable_safe", 3),
    text: "A boy brings a bundle from Orable: the page you copied, and three like it. “Keep these where I can't,” her note says.",
    left: { label: "Keep them", fx: { gnosis: 2, mark: 1, brd: { clear: "orable_safe" } }, text: "Names, and why. Somebody has to remember the why." },
    right: { label: "Burn them, carefully", fx: { untag: 2, longing: 1, brd: { clear: "orable_safe" } }, text: "Some names go free by being forgotten. You hope these are those." },
  },
  {
    id: "ar_stair", place: "archive", act: [1, 2], tier: 1, art: "stair", who: "The Public Stair",
    text: "The archive stair is public, so the Dominion counts who climbs it. Twice is a pattern. Once is a question.",
    left: { label: "Climb anyway", fx: { gnosis: 1, mark: 1 }, text: "Three floors up, a reading room nobody uses. You read until the bell." },
    right: { label: "Send a written request", fx: { favor: -1, untag: 1 }, text: "It comes back stamped NO SUCH RECORD. Which is a record, and not of you." },
  },
  {
    id: "ar_file", place: "archive", act: [1, 2], tier: 2, art: "scroll", who: "Your Own File", once: true, weight: 1.2,
    when: (s) => s.mark >= 2,
    text: "On a cart outside the archive, a bundle tied with your name: the Inquisition's catalog of you. Thinner than you feared. Thicker than you'd like.",
    left: { label: "Read it", fx: { gnosis: 1, strain: 1, cage: -1 }, text: "They've got your curfew wrong. They've got your face right." },
    right: {
      label: "Take it", roll: { stat: "shade" },
      hit: brdO("A thin file is easy to lose.", { mark: -2 }),
      mid: brdO("Lost, and someone noticed the gap on the cart.", { mark: -1, strain: 1 }),
      miss: brdO("A missing file is a louder file.", { mark: 2 }),
    },
  },
  {
    id: "ar_clerks", place: "archive", act: [1, 2], tier: 1, art: "blade", who: "Two Clerks Disagree",
    text: "Two archive clerks argue on the stair. One says burn the heretical books. One says catalog them. They ask you to settle it.",
    left: { label: "Catalog them", fx: { gnosis: 1, cage: 1 }, text: "Kept, then: behind a door, in order. Order is how they like a thing." },
    right: { label: "Burn them", fx: { mark: -1, longing: 1 }, text: "The one who wanted fire thanks you warmly. The other memorizes your face." },
  },

  // ===== The Processional District (T2) =====
  {
    id: "d_step", place: "district", act: [1, 2], tier: 0, art: "flag", who: "Walking in Step",
    text: "The processional way: wide stones, a marshal's chalk line, everyone keeping pace. Out of step is a kind of speech.",
    left: { label: "Keep the pace", fx: { mark: -1, longing: 1 }, text: "You blend. For a hundred paces you're nobody, which is a rest and a loss." },
    right: { label: "Break step", fx: { gnosis: 1, mark: 1 }, text: "You see who notices. Three do." },
  },
  {
    id: "d_thresh", place: "district", act: [1, 2], tier: 0, art: "door", who: "The Staffed Threshold",
    text: "A threshold on the way: a clerk, a bench, a bowl of water. Crossing is free. Being seen crossing is not.",
    left: { label: "Cross and rest", fx: { strain: -1, mark: 1 }, text: "The water is cold and the bench is real. The clerk writes you down kindly." },
    right: { label: "Go round the back", fx: { strain: 1, untag: 1 }, text: "A wall, a drain, a long way. Nobody has a record of your feet." },
  },
  {
    id: "d_banner", place: "district", act: [1, 2], tier: 0, art: "flag", who: "Banners Going Up",
    text: "Banners go up for a feast day. Every ladder is a Watch ladder, and every Watchman is looking up.",
    left: {
      label: "Slip through below", roll: { stat: "shade" },
      hit: brdO("Nobody looks down. You come out the far side owing no one.", { untag: 1, favor: 1 }),
      mid: brdO("A shadow across a ladder-foot. Somebody grunts.", { untag: 1, strain: 1 }),
      miss: brdO("A rung comes down beside you, and a face with it.", { mark: 2 }),
    },
    right: { label: "Hold a ladder", fx: { favor: 1, mark: 1, longing: 1 }, text: "A coin for the hands, and a name for the hands' owner." },
  },
  {
    id: "d_kerb", place: "district", act: [1, 2], tier: 0, art: "stone", who: "The Kerb Inspector",
    text: "An inspector measures the kerb with a rod and the shopfronts with his eyes. The street is a day behind on its fines.",
    when: (s) => s.mark >= 1,
    left: { label: "Pay the street's fine", fx: { favor: -1, mark: -1 }, text: "He seems almost sorry to be paid. He chalks a tick where your name would go." },
    right: { label: "Point him elsewhere", fx: { strain: 1, untag: 1 }, text: "Down the street, a worse kerb. He goes to it like a dog to a bone." },
  },
  {
    id: "d_glyph", place: "district", act: [1, 2], tier: 2, art: "eye", who: "A Glyph With One Stroke Off", once: true, weight: 0.7,
    text: "A ward-glyph cut fresh on a lintel. Someone altered one stroke, so that it sees a little less than it was meant to.",
    left: { label: "Alter one more", fx: { untag: 2, mark: 1 }, text: "The cut is easy. Being the second person to have cut it is not." },
    right: { label: "Learn the stroke", fx: { gnosis: 2, cage: 1 }, text: "It's a small grammar. You'll see it now on every door, and so will they." },
  },
  {
    id: "n_he1", place: "district", npc: "hesper", act: [1, 2], tier: 1, art: "flag", who: "Hesper, Procession Marshal", once: true, weight: 1.5,
    text: "The woman who chalks the route has a sharp eye and a short temper. She can put your name on the slow, safe way. She'd like a favor for it.",
    left: { label: "Ask for the safe way", fx: { mark: -1, strain: 1, brd: { owe: "marshal", npc: { hesper: 1 } } }, text: "She chalks you onto the long route, full of eyes. “Don't think I've forgotten,” she says." },
    right: { label: "Walk your own way", fx: { untag: 1, mark: 1, brd: { npc: { hesper: -1 } } }, text: "She watches you go, and marks where you cut across." },
  },
  {
    id: "n_he2", place: "district", npc: "hesper", act: [1, 2, 3], tier: 1, art: "letter", who: "The Marshal's Price", once: true,
    when: (s) => brdDue(s, "marshal", 3),
    text: "Hesper's favor comes due. A name needs taking off tonight's chalk, quietly, before the count. It isn't yours.",
    left: { label: "Rub it out", fx: { gnosis: 1, mark: 1, cage: 1, brd: { clear: "marshal", npc: { hesper: 1 } } }, text: "A tidy name, in a tidy hand. You'll meet it again, one way or another." },
    right: { label: "Refuse her", fx: { strain: -1, favor: -1, brd: { clear: "marshal", npc: { hesper: -1 } } }, text: "She doesn't argue. She re-chalks your route a long way round." },
  },
  {
    id: "n_he3", place: "district", npc: "hesper", act: [2], tier: 0, art: "lantern", who: "Hesper, Off Duty", once: true, weight: 3,
    when: (s) => brdRel(s, "hesper") >= 2,
    text: "Hesper without her chalk. She asks you to walk the route with her, slowly, and say what you see that she's stopped seeing.",
    left: { label: "Walk it with her", fx: { gnosis: 1, longing: 1, brd: { npc: { hesper: 1 } } }, text: "She stops at a corner you'd walked past. “Everyone ends up here,” she says, “and no one stays.”" },
    right: { label: "Keep your counsel", fx: { mark: -1, untag: 1, brd: { npc: { hesper: -1 } } }, text: "She nods like it's what she expected, and picks up her chalk." },
  },
  {
    id: "n_he4", place: "district", npc: "hesper", act: [1, 2], tier: 0, art: "flag", who: "Hesper's Chalk", once: true, weight: 4,
    when: (s) => brdRel(s, "hesper") < 0,
    text: "Your name is chalked to the long way round now. Every march finds you somewhere inconvenient. Hesper is not looking at you.",
    left: { label: "Take the long way", fx: { strain: 1, mark: -1 }, text: "It costs you an hour and a corner. It also costs you nothing the Watch can write." },
    right: { label: "Cut through", fx: { strain: -1, mark: 1 }, text: "Faster, and seen. Hesper notes it without looking up." },
  },

  // ===== The Sun-Houses (T2) =====
  {
    id: "s_wheel", place: "shrine", act: [1, 2], tier: 0, art: "wheel", who: "The Hooked Wheel",
    text: "A hooked wheel over the door, new gilt. The congregation sings on the hour. You can feel the song looking for gaps.",
    left: { label: "Sing with them", fx: { mark: -1, longing: 1 }, text: "The song fits you like a collar. For an hour, nobody looks." },
    right: { label: "Wait it out", fx: { strain: 1, gnosis: 1 }, text: "You count the gaps. There are fewer than you'd think." },
  },
  {
    id: "s_alms", place: "shrine", act: [1, 2], tier: 0, art: "cup", who: "The Sun's Alms",
    text: "A shrine gives bread to anyone who recites the litany. The bread is real. So is the list by the door.",
    left: { label: "Recite and eat", fx: { hollow: -1, mark: 1 }, text: "The bread is warm. Your lips know the words, which you'd rather they didn't." },
    right: { label: "Refuse the bread", fx: { strain: 1, untag: 1 }, text: "Hungry and unlisted. It's a kind of freedom, if you squint." },
  },
  {
    id: "s_dish", place: "shrine", act: [1, 2], tier: 0, art: "coin", who: "The Offering Dish",
    text: "An offering dish, half full. The shrine-keeper counts it twice. The second count is for you.",
    left: {
      label: "Palm a coin back", roll: { stat: "shade" },
      hit: brdO("A coin for the road, and nobody counts anything again.", { favor: 2 }),
      mid: brdO("You keep the coin. The keeper keeps your face.", { favor: 1, mark: 1 }),
      miss: brdO("A hand closes on your wrist. “The sun sees,” he says, and so does everyone.", { mark: 2, favor: -1 }),
    },
    right: { label: "Put one in", fx: { favor: -1, mark: -1 }, text: "He nods without looking up. It's the cheapest receipt in the Warrens." },
  },
  {
    id: "s_lamp", place: "shrine", act: [1, 2], tier: 0, art: "lantern", who: "The Lamp Goes Out",
    text: "A lamp in the shrine gutters and dies. For a breath the false sun's gilt is only paint. Someone gasps. Someone else lights it again.",
    left: { label: "Relight it", fx: { favor: 1, longing: 1 }, text: "You're thanked, and remembered as the one who relit it." },
    right: { label: "Stay in the dark", fx: { gnosis: 1, strain: 1 }, text: "A breath of plain dark, the first you've had in a month." },
  },
  {
    id: "s_window", place: "shrine", act: [1, 2], tier: 2, art: "sun", who: "The Eastern Window", once: true, weight: 0.7,
    text: "The shrine's east window, glazed wrong: the false sun's rays fall where the wheel isn't. Light, with no hook in it.",
    left: { label: "Stand in it", fx: { strain: -1, gnosis: 1, longing: 1 }, text: "It's only warm. It asks nothing. You'd forgotten that was possible." },
    right: { label: "Report the flaw", fx: { favor: 2, cage: 1 }, text: "A glazier and a clerk have it covered by evening. The light was nice while it lasted." },
  },
  {
    id: "n_ca1", place: "shrine", npc: "calix", act: [1, 2], tier: 1, art: "lantern", who: "Brother Calix, Lamp-Keeper", once: true, weight: 1.5,
    text: "Brother Calix trims the lamps. He asks, as if it were a secret he'd keep: does the light ever feel like it's looking at you?",
    left: { label: "Say yes", fx: { gnosis: 1, mark: 1, brd: { owe: "lamp", npc: { calix: 1 } } }, text: "He nods and trims a wick that didn't need it." },
    right: { label: "Say it's only light", fx: { strain: -1, cage: 1, brd: { npc: { calix: -1 } } }, text: "He smiles the way you smile at someone still asleep." },
  },
  {
    id: "n_ca2", place: "shrine", npc: "calix", act: [1, 2, 3], tier: 1, art: "lantern", who: "The Dark Aisle", once: true,
    when: (s) => brdDue(s, "lamp", 4),
    text: "Calix has let the east aisle's lamps go dark on purpose, and he's watching who notices. He sees you notice.",
    left: { label: "Stand in the dark", fx: { gnosis: 1, brd: { clear: "lamp", npc: { calix: 1 } } }, text: "No one comes. For a minute the shrine is only a room, and both of you are in it." },
    right: { label: "Tell the verger", fx: { favor: 2, cage: 1, brd: { clear: "lamp", npc: { calix: -2 } } }, text: "They relight it and take Calix to be spoken to. You're thanked by someone who won't meet your eye." },
  },
  {
    id: "n_ca3", place: "shrine", npc: "calix", act: [2], tier: 0, art: "door", who: "Calix at the Back Door", once: true, weight: 3,
    when: (s) => brdRel(s, "calix") >= 2,
    text: "Calix has his cassock folded in his arms. He's leaving the shrine tonight and knows every lamp-hour in the district. Have you room?",
    left: { label: "Take him in", fx: { favor: -1, gnosis: 2, strain: 1, brd: { npc: { calix: 1 } } }, text: "He knows when every shift changes. It's worth more than his bed." },
    right: { label: "Point him to a door", fx: { favor: 1, longing: 1, brd: { npc: { calix: -1 } } }, text: "Someone else's door. He thanks you for that, too, which is worse." },
  },

  // ===== The Hidden Assemblies (T2) =====
  {
    id: "a_knock", place: "assembly", act: [1, 2], tier: 0, art: "door", who: "The Knock That Changes",
    text: "The knock at the upstairs door changes every week. Tonight you were told it by someone who has since stopped coming.",
    left: {
      label: "Knock it", roll: { stat: "wits" },
      hit: brdO("They open at once. Nobody asks where you got it. That's a kindness.", { gnosis: 1 }),
      mid: brdO("They open late and count the room twice.", { strain: -1, mark: 1 }),
      miss: brdO("The door doesn't open. Somewhere below, someone makes a note.", { mark: 1, strain: 1 }),
    },
    right: { label: "Don't knock", fx: { longing: 1, mark: -1 }, text: "The door keeps its secret, and you keep yours." },
  },
  {
    id: "a_hymn", place: "assembly", act: [1, 2], tier: 0, art: "candle", who: "A Hymn Without Words",
    text: "Twenty voices hum a hymn with no words, in case the walls are listening. It's the most honest music in the Warrens.",
    left: { label: "Hum along", fx: { strain: -1, longing: -1, mark: 1 }, text: "You've no tune and it doesn't matter. Somebody squeezes your sleeve." },
    right: { label: "Listen from the stairs", fx: { gnosis: 1, longing: 1 }, text: "You hear what the hymn's for: it's a count of who's still here." },
  },
  {
    id: "a_bread", place: "assembly", act: [1, 2], tier: 0, art: "cup", who: "Bread, Passed Along",
    text: "A loaf goes hand to hand, each tearing a piece. When it reaches you there is one piece left, and a woman watching what you do.",
    left: { label: "Take the last piece", fx: { hollow: -1, favor: -1 }, text: "She nods. You're fed, and in debt to something with no name." },
    right: { label: "Hand it back", fx: { favor: 1, hollow: 1 }, text: "She breaks it in two and gives you the larger half, which is its own rebuke." },
  },
  {
    id: "a_count", place: "assembly", act: [1, 2], tier: 0, art: "bell", who: "The Head Count",
    text: "Someone counts the room each week. The count is the first thing the Watch will ask for, so it's also the first thing they've rehearsed.",
    left: { label: "Be counted", fx: { untag: -1, favor: 1 }, text: "A number among numbers. It's the most comfort you've had since the Bell." },
    right: { label: "Slip out first", fx: { untag: 1, longing: 1 }, text: "They'll count one short, and tell themselves a story about it." },
  },
  {
    id: "a_split", place: "assembly", act: [1, 2], tier: 1, art: "hood", who: "The Argument Upstairs",
    text: "The assembly is split: keep to the cellar, or go public on the festival day. You're asked which you'd bear.",
    left: { label: "Keep to the cellar", fx: { mark: -1, longing: 1 }, text: "Small and safe. Nobody who stays is ever in the Dominion's story." },
    right: { label: "Go public", fx: { mark: 1, favor: 2, cage: -1 }, text: "They'll be seen, and some will be taken. Some will be seen who needed to be." },
  },
  {
    id: "a_chalk", place: "assembly", act: [1, 2], tier: 2, art: "key", who: "The Chalked Door", once: true, weight: 0.7,
    text: "A door in a back wall, chalked with a sign you almost know. Behind it, an assembly older than the tithe. They're still keeping their accounts.",
    left: { label: "Go through", fx: { gnosis: 2, mark: 1 }, text: "They don't ask your name, only your trade. Yours is the oldest in the room." },
    right: { label: "Chalk it over", fx: { untag: 1, cage: -1 }, text: "A kindness to everyone inside. A loss to everyone who comes after." },
  },
  {
    id: "n_wr1", place: "assembly", npc: "wren", act: [1, 2], tier: 1, art: "door", who: "Wren, Who Keeps the Door", once: true, weight: 1.5,
    text: "A woman sits by a door, knitting nothing. She asks one question, and means it: what are you hiding from? She'll remember the answer.",
    left: { label: "Tell her the truth", fx: { mark: 1, strain: -1, brd: { owe: "knock", npc: { wren: 1 } } }, text: "She nods, and for the first time her hands find something to knit." },
    right: { label: "Say you're not", fx: { untag: 1, longing: 1, brd: { npc: { wren: -1 } } }, text: "She puts away the needles, and her face." },
  },
  {
    id: "n_wr2", place: "assembly", npc: "wren", act: [1, 2, 3], tier: 1, art: "hand", who: "A Knock, At Last", once: true,
    when: (s) => brdDue(s, "knock", 3),
    text: "Wren at your door: three short and one long, a knock she's never used. Someone she sheltered has been taken. She needs a bed for the night.",
    left: { label: "Open the door", fx: { strain: 1, favor: -1, untag: 1, brd: { clear: "knock", npc: { wren: 2 } } }, text: "By dawn you have a guest who won't say her name and won't leave a trace. Wren leaves bread." },
    right: { label: "Say you can't", fx: { longing: 1, mark: -1, brd: { clear: "knock", npc: { wren: -2 } } }, text: "Wren's footsteps go down the stair as if counting them." },
  },

  // ===== The Day-Houses (T2) =====
  {
    id: "df_bed", place: "refuge", act: [1, 2], tier: 0, art: "house", who: "A Cot in the Day-House", rests: true, weight: (s) => (s.hollow >= 2 ? 4 : 1),
    text: "The day-house has a cot, a blanket, and a ledger of who slept. The ledger will be read. The cot is warm.",
    left: { label: "Take the cot", fx: { hollow: -1, mark: 1, rest: true }, text: "You sleep. By morning your name is in the ledger, in a clerk's neat hand." },
    right: { label: "Sleep in the stairwell", fx: { untag: 1, hollow: 1 }, text: "Cold stone, no ledger. You wake with a draught in every joint." },
  },
  {
    id: "df_ladle", place: "refuge", act: [1, 2], tier: 0, art: "cup", who: "The Ladle Line",
    text: "A long queue for the ladle. A boy at the front is giving the bread out of order, and no one is stopping him.",
    left: { label: "Queue", fx: { hollow: -1, strain: 1 }, text: "An hour in the cold for a bowl and a crust. It's the best hour of your day." },
    right: { label: "Step out", fx: { favor: 1, hollow: 1 }, text: "You'd sooner not be counted among the hungry. The count doesn't care." },
  },
  {
    id: "df_quiet", place: "refuge", act: [1, 2], tier: 0, art: "candle", who: "The Quiet Room",
    text: "A room with a bench and a sign that says SILENCE. People weep here and are not asked why.",
    left: { label: "Sit", fx: { strain: -1, longing: 1 }, text: "Nobody speaks, and it's a kind of company." },
    right: { label: "Keep walking", fx: { gnosis: 1, strain: 1 }, text: "You see the faces leaving, and read the whole district off them." },
  },
  {
    id: "df_roll", place: "refuge", act: [1, 2], tier: 0, art: "scroll", who: "The Almoner's Roll",
    text: "The almoner reads out names for tomorrow's meal. Yours isn't on it, though you've eaten here twice. She looks up, pen ready.",
    left: { label: "Ask to be added", fx: { hollow: -1, mark: 1 }, text: "She writes you in with the care of someone writing a very small will." },
    right: { label: "Go hungry", fx: { hollow: 1, mark: -1 }, text: "No name, no record. Your stomach says the record would have been cheaper." },
  },
  {
    id: "df_cradle", place: "refuge", act: [1, 2], tier: 2, art: "star", who: "The Day-House Cradle", once: true, weight: 0.7,
    text: "A cradle in the corner, rocked by whoever passes. Nobody knows whose child it is. Someone leaves a coin each day for its milk.",
    left: { label: "Rock it a while", fx: { strain: -1, longing: 1, gnosis: 1 }, text: "It sleeps through all of it. You envy that, and leave a coin." },
    right: { label: "Add a coin", fx: { favor: -1, cage: -1 }, text: "It's the only fund in the Warrens with no ledger. You leave the coin and no name." },
  },
  {
    id: "n_de1", place: "refuge", npc: "dessa", act: [1, 2], tier: 0, art: "house", who: "Almoner Dessa", once: true, weight: 1.5,
    text: "Dessa runs the day-house on a fund she won't explain. She'll feed you and put you to work and write down nothing. This costs her.",
    left: { label: "Carry water for her", fx: { strain: 1, hollow: -1, brd: { owe: "ration", npc: { dessa: 1 } } }, text: "A day's water for a day's rest. She nods like it was the right price." },
    right: { label: "Eat and go", fx: { hollow: -1, favor: -1, brd: { npc: { dessa: -1 } } }, text: "She doesn't mind. She minds that you didn't say thanks." },
  },
  {
    id: "n_de2", place: "refuge", npc: "dessa", act: [1, 2, 3], tier: 1, art: "coin", who: "The Ration Runs Short", once: true,
    when: (s) => brdDue(s, "ration", 4),
    text: "The tithe-house has docked the day-house's flour. Dessa asks everyone she's fed to bring a little, from wherever they can.",
    left: { label: "Give what you can", fx: { favor: -2, longing: -1, brd: { clear: "ration", npc: { dessa: 1 } } }, text: "A coin and a loaf. For a week the almshouse smells like bread." },
    right: { label: "Say you can't", fx: { strain: -1, brd: { clear: "ration", npc: { dessa: -1 } } }, text: "She says that's fine. It isn't what her face says." },
  },
  {
    id: "n_de3", place: "refuge", npc: "dessa", act: [2], tier: 0, art: "candle", who: "Dessa's Spare Cot", once: true, weight: 3,
    when: (s) => brdRel(s, "dessa") >= 2,
    text: "Dessa keeps back a cot, unlisted. She says she kept it for you, and would rather not say how long.",
    left: { label: "Sleep there", fx: { hollow: -1, rest: true, brd: { npc: { dessa: 1 } } }, text: "Four walls and no ledger. You sleep like someone with a place." },
    right: { label: "Give it to another", fx: { favor: 1, longing: -1, hollow: 1, brd: { npc: { dessa: 1 } } }, text: "She watches you give it away and says nothing. It's the right answer." },
  },

  // ===== The Closed Stacks (T2) =====
  {
    id: "l_room", place: "library", act: [1, 2], tier: 1, art: "scroll", who: "A Reading Room, By Appointment",
    text: "A reading room that admits those with a reason. You have a reason; it's the wrong one. A clerk waits to see if you know that.",
    left: {
      label: "Give the right reason", roll: { stat: "wits" },
      hit: brdO("The clerk's pen stops. “Of course,” he says, and brings you what you came for.", { gnosis: 2 }),
      mid: brdO("He brings the wrong volume, and watches you read it.", { gnosis: 1, mark: 1 }),
      miss: brdO("He writes the reason down, and then your name beside it.", { mark: 2 }),
    },
    right: { label: "Leave quietly", fx: { longing: 1, strain: -1 }, text: "The door closes slowly behind you, on a very well-oiled hinge." },
  },
  {
    id: "l_dust", place: "library", act: [1, 2], tier: 0, art: "stone", who: "The Dust on the Shelves",
    text: "Dust on every shelf but one. Someone reads that shelf, and wipes the spines after.",
    left: { label: "Read the shelf", fx: { gnosis: 1, strain: 1, mark: 1 }, text: "Three books, all about the same drowned town. By the end you've learned what it was called." },
    right: { label: "Wipe it clean", fx: { untag: 1, longing: 1 }, text: "Whoever reads here will find it clean and think they've gone mad. That's a kindness, of a sort." },
  },
  {
    id: "l_ink", place: "library", act: [1, 2], tier: 0, art: "letter", who: "Fresh Ink on an Old Page",
    text: "A page that was blank last week has writing on it. Your hand, about a day you haven't had yet.",
    left: { label: "Read it", fx: { gnosis: 2, apo: 1 }, text: "It's accurate. That's the trouble with it." },
    right: { label: "Tear it out", fx: { strain: 1, untag: 1 }, text: "The page comes away easily. The next one has the same line on it." },
  },
  {
    id: "l_hush", place: "library", act: [1, 2], tier: 0, art: "bell", who: "The Hush Rule",
    text: "A sign: SILENCE, BY ORDER. A smaller one under it: SILENCE IS NOT THE SAME AS SECRECY. Someone has crossed out the second.",
    left: { label: "Restore the second", fx: { gnosis: 1, mark: 1 }, text: "A pencil line, rewritten in ink. It will be crossed out again by the week's end." },
    right: { label: "Keep the hush", fx: { strain: -1, longing: 1 }, text: "It's easy to be quiet where quiet is the law." },
  },
  {
    id: "l_aisle", place: "library", act: [1, 2], tier: 2, art: "tower", who: "The Unlit Aisle", once: true, weight: 0.7,
    text: "An aisle with no lamp. Here the books are shelved by what they did to the people who read them.",
    left: { label: "Take one down", fx: { gnosis: 2, strain: 1, apo: 1 }, text: "It's heavy and warm. It knows your name already." },
    right: { label: "Leave them shelved", fx: { strain: -1, cage: -1 }, text: "You walk out with your hands clean and a sense of having been spared." },
  },
  {
    id: "n_fe1", place: "library", npc: "ferrant", act: [1, 2], tier: 1, art: "hand", who: "Ferrant the Binder", once: true, weight: 1.5,
    text: "Ferrant mends the books the Dominion calls sick. He'll bind a page for you if you don't ask what it's from. He takes payment in news.",
    left: { label: "Pay in news", fx: { gnosis: 1, mark: 1, brd: { owe: "binding", npc: { ferrant: 1 } } }, text: "You tell him what's said on the stair. He writes none of it down, and repeats all of it." },
    right: { label: "Pay in coin", fx: { favor: -1, strain: -1 }, text: "Coin is clean. He ties the thread and says nothing more." },
  },
  {
    id: "n_fe2", place: "library", npc: "ferrant", act: [1, 2, 3], tier: 1, art: "scroll", who: "What Ferrant Bound", once: true,
    when: (s) => brdDue(s, "binding", 3),
    text: "Ferrant has a bound page for you: a name off the rolls, struck through twice. His reading is that the strikes aren't by the same hand.",
    left: { label: "Take the page", fx: { gnosis: 1, mark: 1, brd: { clear: "binding", owe: "binding_page", npc: { ferrant: 1 } } }, text: "Two strokes, two hands. One struck it out. One tried to strike the first." },
    right: { label: "Burn it", fx: { strain: 1, untag: 1, brd: { clear: "binding", npc: { ferrant: -1 } } }, text: "The page curls and goes. Ferrant watches it with the face of a man at a graveside." },
  },
  {
    id: "n_fe3", place: "library", npc: "ferrant", act: [1, 2, 3], tier: 1, art: "grave", who: "The Page Comes Due", once: true,
    when: (s) => brdDue(s, "binding_page", 3),
    text: "The struck name is back on the Dominion's rolls, under another hand. Ferrant asks if you'd return the page, quietly, to where it was found.",
    left: { label: "Return the page", fx: { gnosis: 1, brd: { clear: "binding_page", npc: { ferrant: 1 } } }, text: "Back on its shelf by supper. The name is read, and struck again, and now someone knows the hand." },
    right: { label: "Keep it", fx: { gnosis: 2, mark: 1, brd: { clear: "binding_page", npc: { ferrant: -1 } } }, text: "It's yours, and somebody's loss. Ferrant doesn't ask for it again, which is its own reproach." },
  },

  // ===== The Night-Cart (T2, The Tithe Roads) =====
  {
    id: "n_od1", place: "tithe", npc: "odo", act: [1, 2], tier: 1, art: "wheel", who: "Odo, Who Drives the Night-Cart", once: true, weight: 1.5,
    text: "A cart with a tarp creeps along the tithe road after the bell. The driver tips his hat. He'll take you somewhere. He won't say where.",
    left: { label: "Climb on", fx: { strain: -1, untag: 1, mark: 1, brd: { owe: "night_cart", npc: { odo: 1 } } }, text: "Under the tarp, nine silent others. At dawn you're set down by a stranger's way." },
    right: { label: "Wave him on", fx: { mark: -1, hollow: 1, brd: { npc: { odo: -1 } } }, text: "He tips his hat again and the cart goes on. You walk home the way you'd walk anywhere." },
  },
  {
    id: "n_od2", place: "tithe", npc: "odo", act: [1, 2, 3], tier: 1, art: "wheel", who: "The Cart at the Toll", once: true,
    when: (s) => brdDue(s, "night_cart", 4),
    text: "Odo's cart is stopped at a toll. He's seen you across the lane and isn't looking at you, hard. The tarp is moving.",
    left: {
      label: "Make a scene", roll: { stat: "wits" },
      hit: brdO("A drunk's quarrel, loud enough. The cart rolls on, and Odo tips his hat.", { favor: 1, brd: { clear: "night_cart", npc: { odo: 2 } } }),
      mid: brdO("The clerk looks up. The cart gets through, and so do you, barely.", { mark: 1, brd: { clear: "night_cart", npc: { odo: 1 } } }),
      miss: brdO("The clerk takes your name, and the cart's, and the driver's.", { mark: 2, brd: { clear: "night_cart", npc: { odo: -1 } } }),
    },
    right: { label: "Walk on", fx: { longing: 1, strain: -1, brd: { clear: "night_cart", npc: { odo: -1 } } }, text: "You hear the tarp behind you and don't turn. You'll think about it." },
  },

  // ===== T3: the institutions, divided (2026-11-26) =====
  // Each faction is two minds inside one institution. A card where you take a side sets that side's flag (a bounded, named
  // fact of the run, not a meter); later cards read it. Neither side is good: each pays and each costs.

  // --- The Inquisition: keep it, or burn it ---
  {
    id: "fa_bins", place: "archive", faction: "inquiry", act: [1, 2], tier: 1, art: "scroll", who: "The Two Bins", once: true, weight: 1.5,
    text: "On the archive stair, two bins: KEEP and PURGE. A clerk hands you a page from your own street and asks which.",
    left: { label: "Keep it", fx: { gnosis: 1, cage: 1, set: { f_keep: true } }, text: "It goes behind a door, in order. Somebody will read it, later, as a map." },
    right: { label: "Purge it", fx: { mark: -1, longing: 1, set: { f_purge: true } }, text: "It goes into the stove. The clerk looks relieved, and a little ashamed of it." },
  },
  {
    id: "fa_kept", place: "archive", faction: "inquiry", act: [2, 3], tier: 0, art: "scroll", who: "The Catalogued Street", once: true, weight: 8,
    when: (s) => !!s.flags.f_keep,
    text: "Your street's pages were kept. A cataloguer asks you to check them for errors. He is kind about it, which is how the catalog works.",
    left: { label: "Check them", fx: { gnosis: 2, mark: 1 }, text: "You find the errors, and then the fact that you're the one who knows. He thanks you by name." },
    right: { label: "Say they're right", fx: { strain: -1, cage: 1 }, text: "He files your word beside the pages. The street is now exactly as accurate as you are." },
  },
  {
    id: "fa_burnt", place: "archive", faction: "inquiry", act: [2, 3], tier: 0, art: "blade", who: "The Purgers' Thanks", once: true, weight: 8,
    when: (s) => !!s.flags.f_purge,
    text: "The Purgers thank you for your street's pages, the way a furnace thanks coal. They've a use for people who know what to burn.",
    left: { label: "Take the thanks", fx: { favor: 2, cage: 1 }, text: "A purse and a stamped slip. Neither is quite a warning." },
    right: { label: "Ask what else burned", fx: { gnosis: 1, longing: 1, mark: 1 }, text: "A list, read aloud. It's long. You'll remember some of it." },
  },
  {
    id: "fa_both", place: "archive", faction: "inquiry", act: [2, 3], tier: 0, art: "seal", who: "They're Arguing About You", once: true, weight: 10,
    when: (s) => !!s.flags.f_keep && !!s.flags.f_purge,
    text: "A Cataloguer and a Purger on the stair, over a ledger with your name in it twice: once kept, once burned. Each says the other did it.",
    left: { label: "Settle it for them", fx: { untag: 1, favor: 1, strain: 1 }, text: "Whichever page they keep, both agree you never settled anything. You're a loose end now, neatly tied." },
    right: { label: "Let them argue", fx: { mark: -1, longing: 1 }, text: "You leave them at it. It's the most useful the Inquisition has ever been to you." },
  },
  {
    id: "fa_hand", place: "archive", faction: "inquiry", act: [1, 2], tier: 0, art: "hand", who: "A Clerk Who Does Both", once: true,
    text: "One clerk keeps a page and burns its copy, so nothing is lost and no one can say what is. He asks if that is cheating.",
    left: { label: "It's mercy", fx: { gnosis: 1, untag: 1, strain: 1 }, text: "He nods slowly. “That's what I tell myself, on the stairs.”" },
    right: { label: "It's cheating", fx: { favor: 1, mark: 1 }, text: "He thanks you for the honesty and does exactly the same tomorrow." },
  },

  // --- The Office of Seals: the sincere, and the ones going up ---
  {
    id: "fs_desk", place: "district", faction: "seals", act: [1, 2], tier: 1, art: "seal", who: "Two Clerks, One Desk", once: true, weight: 1.5,
    text: "At the Office of Seals, two clerks share a desk. One stamps what's true. The other stamps what's useful. You may only go to one.",
    left: { label: "Stamps what's true", fx: { strain: 1, gnosis: 1, set: { f_true: true } }, text: "It takes all afternoon, and a form you didn't know was missing. Everything on it is correct." },
    right: { label: "Stamps what's useful", fx: { favor: 1, cage: 1, set: { f_ladder: true } }, text: "It takes a minute. You leave with exactly what you needed, and a debt you can't name." },
  },
  {
    id: "fs_sincere", place: "district", faction: "seals", act: [2, 3], tier: 0, art: "seal", who: "The Honest Clerk Is Passed Over", once: true, weight: 8,
    when: (s) => !!s.flags.f_true,
    text: "The clerk who stamped you true has been passed over for a post. He tells you so plainly, as if you'd asked, and you feel you ought to have.",
    left: { label: "Speak for him", fx: { favor: -1, mark: 1, longing: -1 }, text: "It does nothing. He's moved, and you notice the effort of being moved." },
    right: { label: "Say you're sorry", fx: { strain: -1, longing: 1 }, text: "“So am I,” he says. “It's hardly the Office's fault.” He believes that. That's the trouble." },
  },
  {
    id: "fs_climb", place: "district", faction: "seals", act: [2, 3], tier: 0, art: "seal", who: "The Clerk Who Climbed", once: true, weight: 8,
    when: (s) => !!s.flags.f_ladder,
    text: "The clerk who stamped you useful has a new sash. He remembers you and wants it known that he remembers. It's a debt, and a courtesy.",
    left: { label: "Call it in", fx: { favor: 2, mark: 1 }, text: "He pays at once, with the ease of a man for whom money is a form of speech." },
    right: { label: "Let it stand", fx: { untag: 1, cage: 1 }, text: "A debt held both ways is a kind of shelter. It's also a kind of leash." },
  },
  {
    id: "fs_stamps", place: "district", faction: "seals", act: [2, 3], tier: 0, art: "seal", who: "Both Stamps On One Page", once: true, weight: 10,
    when: (s) => !!s.flags.f_true && !!s.flags.f_ladder,
    text: "Your papers carry both stamps, true and useful, on one page. Neither clerk will say which came first. It's hard to refuse.",
    left: { label: "Use it everywhere", fx: { untag: 2, mark: 1 }, text: "Doors open. They'll remember which door, and in what order." },
    right: { label: "Burn it", fx: { strain: -1, cage: -1, favor: -1 }, text: "A page that did that much is a page someone will look for." },
  },
  {
    id: "fs_queue", place: "district", faction: "seals", act: [1, 2], tier: 0, art: "bell", who: "The Seal Queue", once: true,
    text: "A queue for the Office of Seals goes round the block twice. A boy sells places in it. He swears they're real places.",
    left: { label: "Buy a place", fx: { favor: -1, strain: -1 }, text: "It's real. You reach the window with a good hour to spare, and the clerk's mood intact." },
    right: { label: "Wait it out", fx: { strain: 1, gnosis: 1 }, text: "Two hours of listening to a queue explain the Office to itself." },
  },

  // --- The independent seekers: open the book, or close it ---
  {
    id: "fk_circle", place: "library", faction: "seekers", act: [1, 2], tier: 1, art: "candle", who: "A Circle of Readers", once: true, weight: 1.5,
    text: "A few readers meet behind the Stacks. They've found a way of reading that survives the clerks. They ask whether you'd share yours.",
    left: { label: "Share what you know", fx: { gnosis: -1, longing: -1, set: { f_open: true } }, text: "It's thinner when it's out of your hands. It's also, for the first time, someone else's problem too." },
    right: { label: "Keep it close", fx: { gnosis: 1, longing: 1, set: { f_close: true } }, text: "They nod. They don't think less of you. They do stop saving you a place." },
  },
  {
    id: "fk_open", place: "library", faction: "seekers", act: [2, 3], tier: 0, art: "scroll", who: "What the Circle Made of It", once: true, weight: 8,
    when: (s) => !!s.flags.f_open,
    text: "The readers wrote what you shared into a grammar. It's better than yours. It's theirs now, cited by people you'll never meet.",
    left: { label: "Take their version", fx: { gnosis: 2, mark: 1 }, text: "It reads more clearly. That is its own risk: a clear thing is easy to copy." },
    right: { label: "Keep your own", fx: { untag: 1, longing: 1 }, text: "You hold both in your head, which is slow, and yours." },
  },
  {
    id: "fk_close", place: "library", faction: "seekers", act: [2, 3], tier: 0, art: "key", who: "A Reader Who Stopped Coming", once: true, weight: 8,
    when: (s) => !!s.flags.f_close,
    text: "A reader from the Circle stopped coming. Nobody says why. You are the one who kept your reading to yourself. You are the one they ask.",
    left: { label: "Go and look", fx: { strain: 1, gnosis: 1, longing: -1 }, text: "A shut room, a cold hearth, a note: “Read what's left.” It is a short shelf." },
    right: { label: "Stay out of it", fx: { mark: -1, longing: 1 }, text: "You say you don't know. That's true, and not an answer, and everyone hears the difference." },
  },
  {
    id: "fk_both", place: "library", faction: "seekers", act: [2, 3], tier: 0, art: "eye", who: "You Told Them, and You Didn't", once: true, weight: 10,
    when: (s) => !!s.flags.f_open && !!s.flags.f_close,
    text: "The readers have worked out that you shared half and kept half. Neither half is the one that matters. They aren't angry. They're curious.",
    left: { label: "Tell them which", fx: { gnosis: -1, cage: -1, strain: 1 }, text: "Half a secret is a weight. A whole one told is somebody else's weight." },
    right: { label: "Let them wonder", fx: { gnosis: 1, longing: 1 }, text: "They shrug in unison. Nobody's more patient than someone who reads." },
  },
  {
    id: "fk_slip", place: "library", faction: "seekers", act: [1, 2], tier: 0, art: "letter", who: "A Slip in a Book", once: true,
    text: "A slip in a returned book: a line in a stranger's hand, underlined twice. It's meant for the next reader. That's you.",
    left: { label: "Add a line of your own", fx: { gnosis: 1, mark: 1 }, text: "Two hands now. Whoever reads next will know they're not first." },
    right: { label: "Put it back", fx: { strain: -1, longing: 1 }, text: "Whoever left it will never know it was read. That is its own sort of loneliness." },
  },

  // --- The brokers of the Unrecorded Market: the weights, and the short weights ---
  {
    id: "fb_ring", place: "market", faction: "brokers", act: [1, 2], tier: 1, art: "coin", who: "The Guild and the Ring", once: true, weight: 1.5,
    text: "At the market's edge, the Guild of True Weights (strict, slow, honest) and the Ring (quick, cheap, short). Both want you.",
    left: { label: "Stand with the Guild", fx: { favor: -1, gnosis: 1, set: { f_guild: true } }, text: "Real weight, real price, real queues. The Ring's boys remember who walked to which side." },
    right: { label: "Stand with the Ring", fx: { favor: 1, cage: 1, set: { f_ring: true } }, text: "Cheaper by a third, and quicker. It's the poor who buy from the Ring, which isn't nothing." },
  },
  {
    id: "fb_guild", place: "market", faction: "brokers", act: [2, 3], tier: 0, art: "coin", who: "The Guild Keeps Its Book", once: true, weight: 8,
    when: (s) => !!s.flags.f_guild,
    text: "The Guild of True Weights keeps a book of every dealer who cheated. It wants you to read from it aloud at the market gate.",
    left: { label: "Read it out", fx: { mark: 1, gnosis: 1, favor: 1 }, text: "Thirty names. Eleven of them are listening. You're not popular for a week." },
    right: { label: "Decline politely", fx: { favor: -1, strain: -1 }, text: "They'll find another reader. They find you less useful, and say nothing." },
  },
  {
    id: "fb_short", place: "market", faction: "brokers", act: [2, 3], tier: 0, art: "hand", who: "The Ring Takes a Cut", once: true, weight: 8,
    when: (s) => !!s.flags.f_ring,
    text: "The Ring wants a cut of whatever you carry through the market, as if it were a favor to the market. It's said easily. It isn't a favor.",
    left: { label: "Pay the cut", fx: { favor: -2, untag: 1 }, text: "They wave you through every gate afterward. They'd wave anyone through who paid." },
    right: { label: "Name a smaller cut", fx: { strain: 1, favor: -1, gnosis: 1 }, text: "It costs you a week of looking over your shoulder." },
  },
  {
    id: "fb_both", place: "market", faction: "brokers", act: [2, 3], tier: 0, art: "key", who: "Both Sides Want a Word", once: true, weight: 10,
    when: (s) => !!s.flags.f_guild && !!s.flags.f_ring,
    text: "The Guild and the Ring both claim you. You've paid both a little and a little less than you should. Each now thinks you belong to the other.",
    left: { label: "Pick one", fx: { favor: -1, cage: 1, untag: 1 }, text: "The other lets you go without grudge. They have a long memory, and a short temper for it." },
    right: { label: "Stay between them", fx: { strain: 1, favor: 2 }, text: "A market with two sheriffs feeds whoever stands between them, as long as they're quick." },
  },
  {
    id: "fb_scale", place: "market", faction: "brokers", act: [1, 2], tier: 0, art: "key", who: "A Scale Weighed Against Itself", once: true,
    text: "A seller weighs two stones against each other, both on one scale. They don't match. He does it again. He wants to know which to trust.",
    left: { label: "The scale", fx: { gnosis: 1, strain: 1 }, text: "He frowns, and adjusts the pan, and now they do. He thanks you, and then he's quiet for a long while." },
    right: { label: "The stones", fx: { favor: 1, longing: 1 }, text: "He keeps the lighter and sells it by the heavier's name. Everyone at the stall is a little richer." },
  },

  // --- The refuge networks: the cellar, and the street ---
  {
    id: "fr_vote", place: "refuge", faction: "networks", act: [1, 2], tier: 1, art: "door", who: "Cellar or Street", once: true, weight: 1.5,
    text: "The Day-Houses and the Assemblies disagree: keep to the cellar, or stand where you're seen? They ask what you'd bear.",
    left: { label: "Keep to the cellar", fx: { mark: -1, longing: 1, set: { f_cellar: true } }, text: "Small, quiet, and safe. The cellar side thinks you've seen sense. The street side thinks you've seen a wall." },
    right: { label: "Stand in the street", fx: { mark: 1, favor: 1, cage: -1, set: { f_street: true } }, text: "Loud, visible, harder to take. The street side thinks you've seen sense. The cellar side thinks you've seen a gallows." },
  },
  {
    id: "fr_cellar", place: "refuge", faction: "networks", act: [2, 3], tier: 0, art: "candle", who: "The Cellar Fills", once: true, weight: 8,
    when: (s) => !!s.flags.f_cellar,
    text: "The cellar has filled with people since you spoke for it. It's warm and very quiet. Someone has started counting the loaves aloud.",
    left: { label: "Add your bread", fx: { favor: -1, hollow: -1, longing: -1 }, text: "It goes into the common bin. You eat from it too. That is the point of a common bin." },
    right: { label: "Count the exits", fx: { gnosis: 1, strain: 1 }, text: "Three. One is blocked. You say so, and someone starts moving barrels." },
  },
  {
    id: "fr_street", place: "refuge", faction: "networks", act: [2, 3], tier: 0, art: "flag", who: "The Street Remembers", once: true, weight: 8,
    when: (s) => !!s.flags.f_street,
    text: "A crowd on the street, because of what you said. They've brought bread and, in one case, a drum. Somewhere nearby, the Watch is reading a list.",
    left: { label: "Lead them off", fx: { mark: 1, favor: 1, strain: 1 }, text: "It works for a street. The drum will be mentioned in a report." },
    right: { label: "Slip away", fx: { untag: 1, cage: 1, longing: 1 }, text: "You leave them with the loaves. Nobody blames you, and you hear it anyway." },
  },
  {
    id: "fr_both", place: "refuge", faction: "networks", act: [2, 3], tier: 0, art: "ways", who: "A Door In Both Walls", once: true, weight: 10,
    when: (s) => !!s.flags.f_cellar && !!s.flags.f_street,
    text: "Both sides think you're theirs. A woman asks if you'd carry word between the cellar and the street. They've no one else both will believe.",
    left: { label: "Carry it", fx: { strain: 1, mark: 1, untag: 1, bond: "table" }, text: "A go-between's life: tired, trusted, tallied. The Open Table sets a place for you in return." },
    right: { label: "Not yet", fx: { strain: -1, longing: 1 }, text: "She nods. “Someone will,” she says, and you wish you could be sure who." },
  },
  {
    id: "fr_bell", place: "refuge", faction: "networks", act: [1, 2], tier: 0, art: "bell", who: "Whose Bell Is That", once: true,
    text: "A bell in the Day-House, not the Dominion's note. It means someone's coming. Everyone knows what to do. No one told you.",
    left: { label: "Follow them", fx: { strain: 1, untag: 1 }, text: "Down a stair, into a cupboard, behind a wall. You've been trained by people you didn't know were training you." },
    right: { label: "Stay and watch", fx: { gnosis: 1, mark: 1 }, text: "The Watch walks through, polite, and writes down your face and the room's emptiness." },
  },

  // ===== T4a: rare discoveries (2026-11-26) =====
  // Each waits on an unusual build or an earlier road: a relic carried, a Mask worn, a Bond held, a track run high, or two
  // people who both think well of you. Rare by their gates; once each; no state of their own.
  {
    id: "x_glass", place: "library", act: [1, 2], tier: 2, art: "relic_glass", who: "The Glass Finds a Spine", once: true, weight: 8,
    when: (s) => s.asc.relics.includes("glass"),
    text: "Through the Confessor's Glass, one spine on a shut shelf shows a title the lamp doesn't. Someone wanted it unreadable.",
    left: { label: "Read the title", fx: { gnosis: 2, longing: 1 }, text: "It's a name you know, and not as an author." },
    right: { label: "Cover the glass", fx: { strain: -1, cage: 1 }, text: "Some titles are better learned from other people's mouths." },
  },
  {
    id: "x_key", place: "assembly", act: [1, 2], tier: 2, art: "relic_key", who: "The Key Knows the Door", once: true, weight: 8,
    when: (s) => s.asc.relics.includes("key"),
    text: "The Ophite Key is warm in your pocket on a stair that isn't yours. A door at the top has no lock, only a place a lock would go.",
    left: { label: "Try the key", fx: { gnosis: 1, untag: 1, strain: 1 }, text: "It fits the gap between the lock and the idea of one. The room beyond has been waiting, and is untidy." },
    right: { label: "Walk past", fx: { mark: -1, longing: 1 }, text: "The key stays warm until you're two streets away." },
  },
  {
    id: "x_halo", place: "shrine", act: [1, 2], tier: 2, art: "relic_halo", who: "The Halo Recognises the Wheel", once: true, weight: 8,
    when: (s) => s.asc.relics.includes("halo"),
    text: "Under the hooked wheel, the Broken Halo hums, like a cut wire that remembers the current. The congregation's singing falters, just once.",
    left: { label: "Hold it up", fx: { mark: 1, gnosis: 1, cage: -1 }, text: "For a bar of music the wheel is only wood. Someone sees. Someone looks away." },
    right: { label: "Hide it", fx: { strain: 1, mark: -1 }, text: "The hum goes on in your coat, loud only to you." },
  },
  {
    id: "x_crown", place: "district", act: [1, 2], tier: 2, art: "relic_crown", who: "A Crown In the Procession", once: true, weight: 8,
    when: (s) => s.asc.relics.includes("crown"),
    text: "A float in the procession bears a crown like yours, whole. A man beside it keeps looking at your coat, as if it were a face.",
    left: { label: "Look at him", fx: { gnosis: 1, mark: 1, favor: 1 }, text: "He nods once and falls back into step. By dusk someone has left a coin on your sill." },
    right: { label: "Lose yourself in it", fx: { untag: 1, longing: 1 }, text: "It's easy, in a procession. That's what processions are for." },
  },
  {
    id: "x_lamp", place: "refuge", act: [1, 2], tier: 2, art: "relic_lamp", who: "The Lamp, At a Window", once: true, weight: 8,
    when: (s) => s.asc.relics.includes("lamp"),
    text: "The Ward-Keeper's Lamp, set on a day-house sill, burns steadier than it should. People come to it without being called.",
    left: { label: "Let them gather", fx: { longing: -1, mark: 1, favor: 1 }, text: "They sit and say nothing. Someone leaves bread, which is what the lamp is for." },
    right: { label: "Take it away", fx: { strain: -1, cage: 1 }, text: "The window goes dark. Nobody says a word, which is its own sentence." },
  },
  {
    id: "x_purse", place: "market", act: [1, 2], tier: 2, art: "relic_purse", who: "Somebody's Owed", once: true, weight: 8,
    when: (s) => s.asc.relics.includes("purse"),
    text: "The Almoner's Purse is recognised. A seller at the edge of the market names who it belonged to, and what it owed, to the coin.",
    left: { label: "Pay some of it", fx: { favor: -2, cage: -1, gnosis: 1 }, text: "It doesn't clear the debt. It does clear a corner of your own." },
    right: { label: "Say it isn't yours", fx: { mark: 1, favor: 1 }, text: "“No,” he agrees, in a voice that has stopped believing in agreement." },
  },
  {
    id: "x_nyx", place: "courts", act: [1, 2], tier: 2, art: "veil", who: "A Court That Doesn't See You", once: true, weight: 8,
    when: (s) => s.mask === "nyx",
    text: "In Nyx's veil the court goes on washing and quarrelling as if you weren't there. The trouble is, you can hear all of it.",
    left: { label: "Listen to everything", fx: { gnosis: 2, strain: 1, longing: 1 }, text: "Who owes, who lies, who's afraid. You leave knowing too much about ten people." },
    right: { label: "Slip through", fx: { untag: 1, mark: -1 }, text: "Quiet, unseen, and a little less than yourself." },
  },
  {
    id: "x_eris", place: "market", act: [1, 2], tier: 2, art: "mask", who: "Eris at the Weights", once: true, weight: 8,
    when: (s) => s.mask === "eris",
    text: "Wearing Eris, you notice both pans of every scale in the market shift a hair when you pass. A seller notices you noticing.",
    left: { label: "Tip them further", fx: { favor: 2, mark: 1 }, text: "Everyone's a little richer or poorer by closing. Nobody can say why." },
    right: { label: "Steady them", fx: { strain: -1, favor: -1 }, text: "The scales settle. Somebody curses the weather." },
  },
  {
    id: "x_lilith", place: "chapel", act: [1, 2], tier: 2, art: "candle", who: "Lilith in the Nave", once: true, weight: 8,
    when: (s) => s.mask === "lilith",
    text: "Lilith lights the pews' only candle without a flame. The sleepers turn toward you in their sleep, like plants to a window.",
    left: { label: "Keep it lit", fx: { longing: -2, strain: 1, mark: 1 }, text: "You're wanted, for a night, by people who'll forget it in the morning." },
    right: { label: "Put it out", fx: { longing: 1, strain: -1 }, text: "They turn away in their sleep. You're alone, and nobody's hurt." },
  },
  {
    id: "x_bare", place: "refuge", act: [1, 2], tier: 2, art: "hand", who: "A Face With Nothing On It", once: true, weight: 8,
    when: (s) => s.mask === "bare",
    text: "With no Mask, the almoner looks at you a long while. “You've nothing on,” she says. It isn't an accusation. It's kindly meant.",
    left: { label: "Say thank you", fx: { hollow: -1, longing: -1, mark: 1 }, text: "She feeds you without a ledger entry. You've a face, for the length of a meal." },
    right: { label: "Put a Mask on", fx: { strain: 1, untag: 1 }, text: "She nods like you've said something. It's an old nod, and it isn't a judgment." },
  },
  {
    id: "x_sister", place: "courts", act: [1, 2], tier: 2, art: "door", who: "The Sister's Door", once: true, weight: 8,
    when: (s) => s.bonds.includes("sister"),
    text: "Your Sister is at the top of the court's stair, as if she'd been there all day. She says she's hidden three people on it since breakfast.",
    left: { label: "Take a turn on the stair", fx: { strain: 1, favor: 1, mark: -1 }, text: "You hold the landing while someone small goes past. Nobody's counted." },
    right: { label: "Ask who they were", fx: { gnosis: 1, longing: 1 }, text: "She tells you, because you asked. Their names are the only thing you'll carry out of the day." },
  },
  {
    id: "x_sponsor", place: "assembly", act: [1, 2], tier: 2, art: "bell", who: "The Sponsor Calls a Meeting", once: true, weight: 8,
    when: (s) => s.bonds.includes("sponsor"),
    text: "Your Sponsor stands at the back of the assembly and says nothing. The room goes quiet around her, as for someone who's been there.",
    left: { label: "Speak", fx: { mark: 1, longing: -1, gnosis: 1 }, text: "You say a short thing, plainly. It's what they came to hear." },
    right: { label: "Sit beside her", fx: { strain: -1, longing: 1 }, text: "She doesn't look at you. She moves her bag so you can sit." },
  },
  {
    id: "x_gnosis", place: "archive", act: [1, 2], tier: 2, art: "eye", who: "What You Know Is Written", once: true, weight: 8,
    when: (s) => s.gnosis >= 6,
    text: "On a low shelf, a folder titled with a word you've only thought, never said. Inside, your last three weeks, in a fair hand, with notes.",
    left: { label: "Read the notes", fx: { gnosis: 1, mark: 1, apo: 1 }, text: "They understand you better than you'd like. The last note is a question." },
    right: { label: "Close the folder", fx: { strain: -1, cage: 1 }, text: "Whoever wrote it won't know you read it. That's a mercy, and a risk." },
  },
  {
    id: "x_untag", place: "tithe", act: [1, 2], tier: 2, art: "stone", who: "Nobody Sees You Pass", once: true, weight: 8,
    when: (s) => s.untag >= 5,
    text: "A toll-clerk looks straight through you, at the cart behind. For the first time in your life, a count that doesn't include you.",
    left: { label: "Walk on", fx: { untag: 1, longing: 1 }, text: "It's easy. It's a little like dying, and a little like being let off." },
    right: { label: "Say good morning", fx: { mark: 1, longing: -1 }, text: "He starts as if a wall had spoken. Then he writes it down." },
  },
  {
    id: "x_pair", place: "courts", act: [2, 3], tier: 2, art: "ways", who: "Two Doors, One Corridor", once: true, weight: 8,
    when: (s) => brdRel(s, "uc") >= 1 && brdRel(s, "wren") >= 1,
    text: "Uc and Wren, who've never met, are on your stair, comparing needles to knitting. They've each told the other your name, and not yours.",
    left: { label: "Introduce yourself", fx: { favor: 2, mark: 1, longing: -1 }, text: "They know already. The introduction is for them to keep you straight." },
    right: { label: "Leave them to it", fx: { strain: -1, untag: 1 }, text: "A court that has two friends in it is a court with a stair." },
  },

  // ===== T4b: adversaries on the road (2026-11-26) =====
  // Seven of the public edition's threat archetypes (§13) as short hostile chains. A sighting asks how you answer: once,
  // then silence (the Counter §13 gives), or engage. Either way the thing follows, 3-4 draws on; what finds you is milder
  // for the one and heavier for the other. Each is a thread (a key the sighting begins, ended on every outcome of the
  // answer) and one bounded flag; none is a fight.
  // --- The Collector (the Unrecorded Market) ---
  {
    id: "ad_col1", place: "market", adversary: "collector", act: [1, 2], tier: 1, art: "hand", who: "The Collector", once: true, weight: 1.5,
    text: "A buyer wants a sample of your work, then another, then a description. Never a price. Each ask is a little bigger than the last.",
    left: { label: "One answer, then silence", fx: { strain: -1, longing: 1, brd: { owe: "adv_collector" } }, text: "One line, no more. They write it down anyway, and seem almost bored." },
    right: { label: "Humour them", fx: { favor: 1, mark: 1, set: { a_collector: true }, brd: { owe: "adv_collector" } }, text: "A coin for each answer. By the third you've said more than you were paid for." },
  },
  {
    id: "ad_col2", place: "market", adversary: "collector", act: [1, 2, 3], tier: 0, art: "hand", who: "The Collector, Unanswered", once: true, weight: 4,
    when: (s) => brdDue(s, "adv_collector", 3) && !s.flags.a_collector,
    text: "A stall-boy says someone's been asking for you by description, bored, not angry. Without answers they have nothing to sell.",
    left: { label: "Move stalls", fx: { strain: 1, untag: 1, brd: { clear: "adv_collector" } }, text: "A new corner, a new face. The description will be out of date by Sunday." },
    right: { label: "Let it lapse", fx: { mark: 1, strain: -1, brd: { clear: "adv_collector" } }, text: "Easier, and you feel it in the file. Not much, and not nothing." },
  },
  {
    id: "ad_col3", place: "market", adversary: "collector", act: [1, 2, 3], tier: 0, art: "coin", who: "The Collector's File", once: true, weight: 4,
    when: (s) => brdDue(s, "adv_collector", 3) && !!s.flags.a_collector,
    text: "The Collector has a thick file on you, built from your own answers, and has begun selling it in pieces. It's no one's secret now.",
    left: { label: "Buy it back", fx: { favor: -2, mark: -1, brd: { clear: "adv_collector" } }, text: "Every piece you find costs more than the last. You stop finding pieces." },
    right: { label: "Burn what you find", fx: { strain: 1, mark: 1, gnosis: 1, brd: { clear: "adv_collector" } }, text: "Three pieces, one stove. You learn which of your answers were worth buying." },
  },
  // --- The Past-Life Probe (the Closed Stacks) ---
  {
    id: "ad_pro1", place: "library", adversary: "probe", act: [1, 2], tier: 1, art: "eye", who: "The One Who Already Knew", once: true, weight: 1.5,
    text: "A reader at your elbow cites a detail of your past you never told this room. They say it kindly, as if giving a gift.",
    left: { label: "Say nothing, go", fx: { longing: 1, strain: -1, brd: { owe: "adv_probe" } }, text: "You walk out the way you came in, at the pace of someone who isn't being followed." },
    right: { label: "Ask how they know", fx: { gnosis: 1, mark: 1, set: { a_probe: true }, brd: { owe: "adv_probe" } }, text: "They tell you, warmly, and you notice that the answer was ready." },
  },
  {
    id: "ad_pro2", place: "library", adversary: "probe", act: [1, 2, 3], tier: 0, art: "eye", who: "The Reader, Across the Room", once: true, weight: 4,
    when: (s) => brdDue(s, "adv_probe", 3) && !s.flags.a_probe,
    text: "They're across the room again, not looking. They know your hour. You made them wait, and they've noted that you did.",
    left: { label: "Change your hour", fx: { strain: 1, untag: 1, brd: { clear: "adv_probe" } }, text: "It's a small break in a routine. It's also a small break in their map." },
    right: { label: "Meet their eye", fx: { mark: 1, gnosis: 1, brd: { clear: "adv_probe" } }, text: "They look away first. Then, slowly, they smile, as if you'd passed something." },
  },
  {
    id: "ad_pro3", place: "library", adversary: "probe", act: [1, 2, 3], tier: 0, art: "scroll", who: "Your History, Bound", once: true, weight: 4,
    when: (s) => brdDue(s, "adv_probe", 3) && !!s.flags.a_probe,
    text: "The reader has your whole history in a tidy hand and offers it back, chapter by chapter, with comfort. It's well made. It's a hook.",
    left: { label: "Take the comfort", fx: { longing: -1, mark: 1, cage: 1, brd: { clear: "adv_probe" } }, text: "It does comfort. Chapter nine is the one about the day you trusted them." },
    right: { label: "Refuse the book", fx: { strain: 1, longing: 1, untag: 1, brd: { clear: "adv_probe" } }, text: "They close it gently, like a door in a house they plan to come back to." },
  },
  // --- The Entangler (the Back Courts) ---
  {
    id: "ad_ent1", place: "courts", adversary: "entangler", act: [1, 2], tier: 1, art: "letter", who: "The Long Letters", once: true, weight: 1.5,
    text: "Letters under your door: long, warm, confessing everything, asking you to confess back. Four in a week. None gives an address.",
    left: { label: "Don't answer", fx: { longing: 1, strain: -1, brd: { owe: "adv_entangler" } }, text: "The fifth letter comes anyway, and is a little shorter." },
    right: { label: "Write back", fx: { longing: -1, mark: 1, set: { a_entangler: true }, brd: { owe: "adv_entangler" } }, text: "You say more than you meant to. It feels like the first real thing in a month." },
  },
  {
    id: "ad_ent2", place: "courts", adversary: "entangler", act: [1, 2, 3], tier: 0, art: "letter", who: "The Last Letter, Colder", once: true, weight: 4,
    when: (s) => brdDue(s, "adv_entangler", 3) && !s.flags.a_entangler,
    text: "A last letter, shorter. The tone has cooled by a degree, and you can see where the hook was meant to go.",
    left: { label: "Burn it", fx: { strain: -1, longing: 1, brd: { clear: "adv_entangler" } }, text: "It burns well. Good paper, for a thing that wanted so little." },
    right: { label: "Keep it as proof", fx: { gnosis: 1, mark: 1, brd: { clear: "adv_entangler" } }, text: "In a drawer, under the rest. Evidence of a kind of patience you'll recognise again." },
  },
  {
    id: "ad_ent3", place: "courts", adversary: "entangler", act: [1, 2, 3], tier: 0, art: "door", who: "They Want to Meet", once: true, weight: 4,
    when: (s) => brdDue(s, "adv_entangler", 3) && !!s.flags.a_entangler,
    text: "They want to meet, tonight, somewhere small. They know things you told no one else. That was the point of the letters.",
    left: { label: "Go and look", fx: { gnosis: 1, mark: 1, strain: 1, brd: { clear: "adv_entangler" } }, text: "Nobody's there. A chair, a candle, a letter on the seat. It's a long one." },
    right: { label: "Stay in", fx: { longing: 1, untag: 1, brd: { clear: "adv_entangler" } }, text: "You sit with the lamp out and the door locked. It's lonely, and it's yours." },
  },
  // --- The Fevered (the Tithe Roads) ---
  {
    id: "ad_fev1", place: "tithe", adversary: "fevered", act: [1, 2], tier: 1, art: "bell", who: "The Purge-Drunk", once: true, weight: 1.5,
    text: "Someone on the tithe road, fervor-sick, weeping and shouting by turns, grabs your sleeve and calls you something holy, then something worse.",
    left: { label: "Step away", fx: { strain: 1, untag: 1, brd: { owe: "adv_fevered" } }, text: "Gently, without a word. The shouting moves on without you, and you hear where it goes." },
    right: { label: "Steady them", fx: { favor: 1, mark: 1, set: { a_fevered: true }, brd: { owe: "adv_fevered" } }, text: "They cling for a minute and then cry, and then are very quiet. A coin appears in your hand." },
  },
  {
    id: "ad_fev2", place: "tithe", adversary: "fevered", act: [1, 2, 3], tier: 0, art: "bell", who: "The Shouting Carries", once: true, weight: 4,
    when: (s) => brdDue(s, "adv_fevered", 3) && !s.flags.a_fevered,
    text: "The fevered one's shouting carries three streets, and the Watch follows the noise. You were only the first to step away.",
    left: { label: "Keep walking", fx: { mark: -1, longing: 1, brd: { clear: "adv_fevered" } }, text: "You don't turn. The noise stops, abruptly, and you walk faster." },
    right: { label: "Watch from a doorway", fx: { gnosis: 1, strain: 1, brd: { clear: "adv_fevered" } }, text: "They're taken gently, which is its own kind of horror. You learn the Watch's gentle voice." },
  },
  {
    id: "ad_fev3", place: "tithe", adversary: "fevered", act: [1, 2, 3], tier: 0, art: "door", who: "They Followed You Home", once: true, weight: 4,
    when: (s) => brdDue(s, "adv_fevered", 3) && !!s.flags.a_fevered,
    text: "The fevered one followed you home, weeping gratitude, naming you to the street. The Watch is curious who the saint might be.",
    left: { label: "Send them away", fx: { longing: 1, mark: -1, strain: 1, brd: { clear: "adv_fevered" } }, text: "Kindly, firmly, at the door. It will not be forgotten, by them or by you." },
    right: { label: "Hide them", fx: { favor: -1, mark: 1, longing: -1, brd: { clear: "adv_fevered" } }, text: "A night on your floor, a blanket, a bowl. By morning they're calmer, and not gone." },
  },
  // --- The Hunting Party (the Processional District) ---
  {
    id: "ad_hun1", place: "district", adversary: "hunt", act: [1, 2], tier: 1, art: "flag", who: "A Patrol, Passing", once: true, weight: 1.5,
    text: "The same patrol passes the same corner a second time, slower. A third coat crosses, not in step. You are being herded, gently.",
    left: { label: "Leave the street", fx: { strain: 1, untag: 1, brd: { owe: "adv_hunt" } }, text: "Down an alley, through a gate, into a crowd. You don't look back. That's the point of crowds." },
    right: { label: "Hold your corner", fx: { mark: 1, gnosis: 1, set: { a_hunt: true }, brd: { owe: "adv_hunt" } }, text: "They pass a third time and see you looking. They write something." },
  },
  {
    id: "ad_hun2", place: "district", adversary: "hunt", act: [1, 2, 3], tier: 0, art: "lantern", who: "The Lit Street", once: true, weight: 4,
    when: (s) => brdDue(s, "adv_hunt", 3) && !s.flags.a_hunt,
    text: "The patrol doesn't come back. It doesn't need to. You left by the lit street, and that was the route it wanted noted.",
    left: { label: "Take the lit way", fx: { mark: 1, strain: -1, brd: { clear: "adv_hunt" } }, text: "Slower and safer. Many eyes, all of them bored." },
    right: { label: "Take the dark way", fx: { strain: 1, untag: 1, brd: { clear: "adv_hunt" } }, text: "Faster, with no eyes at all, which is its own kind of noise." },
  },
  {
    id: "ad_hun3", place: "district", adversary: "hunt", act: [1, 2, 3], tier: 0, art: "door", who: "Two Ends, Two Coats", once: true, weight: 4,
    when: (s) => brdDue(s, "adv_hunt", 3) && !!s.flags.a_hunt,
    text: "They've closed the corner you held: two ends, two coats. A woman at a window says nothing and opens the shutter a hand's width.",
    left: { label: "Through the window", fx: { strain: 1, untag: 1, favor: -1, brd: { clear: "adv_hunt" } }, text: "A kitchen, a stair, a yard. She doesn't ask. She'll want something, someday." },
    right: { label: "Wait it out", fx: { mark: 2, strain: -1, brd: { clear: "adv_hunt" } }, text: "They find nothing, which they note. They'll be back, and they know your corner." },
  },
  // --- The Zealot (the Sun-Houses) ---
  {
    id: "ad_zea1", place: "shrine", adversary: "zealot", act: [1, 2], tier: 1, art: "sun", who: "The Preacher at the Pump", once: true, weight: 1.5,
    text: "A preacher at the pump names devils in the queue, and looks at you a half beat too long. “Some here know what they are,” they say.",
    left: { label: "One line, then go", fx: { strain: 1, mark: -1, brd: { owe: "adv_zealot" } }, text: "“This is fiction and mechanism,” you say, evenly, and leave. It's not an argument. It's a door." },
    right: { label: "Argue the point", fx: { gnosis: 1, mark: 1, set: { a_zealot: true }, brd: { owe: "adv_zealot" } }, text: "You win the exchange. A crowd collects, and watches who won." },
  },
  {
    id: "ad_zea2", place: "shrine", adversary: "zealot", act: [1, 2, 3], tier: 0, art: "scroll", who: "A Pamphlet, Nailed Up", once: true, weight: 4,
    when: (s) => brdDue(s, "adv_zealot", 3) && !s.flags.a_zealot,
    text: "Two days on, a pamphlet is nailed up with a shape like your coat. The crowd's heard it; no one's checked it. It'll pass by Sunday.",
    left: { label: "Tear it down", fx: { mark: 1, strain: -1, brd: { clear: "adv_zealot" } }, text: "A torn corner is a statement of its own. Someone sees you do it." },
    right: { label: "Leave it", fx: { longing: 1, mark: -1, brd: { clear: "adv_zealot" } }, text: "It's weather. You walk under it. By Sunday it's wrapping fish." },
  },
  {
    id: "ad_zea3", place: "shrine", adversary: "zealot", act: [1, 2, 3], tier: 0, art: "flag", who: "A Chant With Your Name", once: true, weight: 4,
    when: (s) => brdDue(s, "adv_zealot", 3) && !!s.flags.a_zealot,
    text: "The preacher's flock has a chant with your name in it. By dusk the Watch will have a list, helpfully compiled by neighbours.",
    left: { label: "Go to ground", fx: { untag: 1, strain: 1, favor: -1, brd: { clear: "adv_zealot" } }, text: "A cellar, a week, no bread but what's brought. Nobody's chant reaches a cellar." },
    right: { label: "Walk through them", fx: { mark: 2, gnosis: 1, cage: -1, brd: { clear: "adv_zealot" } }, text: "Nobody lays a hand on you. Everybody sees your face, and the face is plain." },
  },
  // --- The Master-Seeker (the Shut Chapel) ---
  {
    id: "ad_mas1", place: "chapel", adversary: "master", act: [1, 2], tier: 1, art: "hood", who: "“I'll Handle Everything”", once: true, weight: 1.5,
    text: "A stranger offers to arrange your night: a room, a cart, a meal. Everything decided; you'd only have to arrive. Questions seem to annoy them.",
    left: { label: "Make your own plan", fx: { strain: 1, untag: 1, brd: { owe: "adv_master" } }, text: "They sniff, and tell you you'll regret it. The way they say it isn't a prediction." },
    right: { label: "Let them arrange it", fx: { hollow: -1, favor: 1, set: { a_master: true }, brd: { owe: "adv_master" } }, text: "A meal and a bed are sorted. It's very efficient. You should have asked how." },
  },
  {
    id: "ad_mas2", place: "chapel", adversary: "master", act: [1, 2, 3], tier: 0, art: "door", who: "They Offered Again", once: true, weight: 4,
    when: (s) => brdDue(s, "adv_master", 3) && !s.flags.a_master,
    text: "They offered again at the chapel door, brisk and put out. When you named your own plan they went to find easier company.",
    left: { label: "Wish them luck", fx: { longing: 1, strain: -1, brd: { clear: "adv_master" } }, text: "They don't hear it. Somebody else will be their luck, or their prey." },
    right: { label: "Warn the pews", fx: { favor: 1, mark: 1, brd: { clear: "adv_master" } }, text: "A quiet word, a few nods. The next sleeper to be offered a room will ask how." },
  },
  {
    id: "ad_mas3", place: "chapel", adversary: "master", act: [1, 2, 3], tier: 0, art: "key", who: "The Room at the End of the Yard", once: true, weight: 4,
    when: (s) => brdDue(s, "adv_master", 3) && !!s.flags.a_master,
    text: "The room they arranged is at the end of a long yard, with one way in. The stranger is already there, setting out two cups.",
    left: { label: "Leave at once", fx: { strain: 1, favor: -1, mark: -1, brd: { clear: "adv_master" } }, text: "You back out the way you came, unhurried. They don't follow. They know where you'll be." },
    right: { label: "Sit, and watch the door", fx: { gnosis: 2, mark: 2, strain: 1, brd: { clear: "adv_master" } }, text: "You learn what they want, and it's worse than you thought. You leave with that." },
  },

  // Two more places to sleep, for a road that has grown crowded (rests: exempt from the Hollow cut, and drawn 4x when spent).
  {
    id: "a_loft", place: "assembly", act: [1, 2], tier: 0, art: "candle", who: "A Pallet in the Loft", rests: true, weight: (s) => (s.hollow >= 2 ? 4 : 1),
    text: "The assembly keeps a loft of straw pallets for whoever's out past the Bell. The rule is: no names, no questions, out by dawn.",
    left: { label: "Take a pallet", fx: { hollow: -1, strain: 1, rest: true }, text: "Straw, a blanket, twelve strangers breathing. You sleep better than you have in a week." },
    right: { label: "Give yours to a child", fx: { favor: 1, longing: -1, hollow: 1 }, text: "You sit by the stair all night. Nobody thanks you. Someone makes room for you at dawn." },
  },
  {
    id: "s_hall", place: "shrine", act: [1, 2], tier: 0, art: "house", who: "The Sun-House Night Hall", rests: true, weight: (s) => (s.hollow >= 2 ? 4 : 1),
    text: "The Sun-House opens its hall to the weary at dusk: pews, a hot bowl, a litany. The list at the door is for the morning.",
    left: { label: "Sleep in the hall", fx: { hollow: -1, mark: 1, rest: true }, text: "Warm, fed, and written down. The litany sings you under." },
    right: { label: "Take the bowl and go", fx: { hollow: -1, strain: 1 }, text: "You eat on the steps in the dark, and nobody has a name for you." },
  },
];

// ---------- the epilogue (T5) ----------
// One line under an ending, from the road's memorable state: a person who stood by you or turned from you, which half
// of an institution you sided with, an adversary you engaged. It reads the same under every Way Out and every loss, adds
// no ending and no counter, and shows nothing at all on a road that kept none of these. Rules 4 only.
// Proposed canon: the lines say what people did after the road, which the public edition does not.
const BRD_EPI_PEOPLE = {
  uc: ["Uc stitched a second coat that winter, and left it on the almshouse step with no name.", "Uc stopped mending for anyone on your street, and nobody said why."],
  anselm: ["Anselm put your tithe in the wrong column, once, and slept better.", "Anselm kept your page in the count, exact to the farthing."],
  tibors: ["Tibors counted the carts wrong that week, in your favour.", "Tibors told the toll-keeper which way you'd gone."],
  peyre: ["Peyre never said who owed whom. Somebody paid your debt anyway.", "Peyre sold your name by the end of the month."],
  mirande: ["Mirande read one more dream aloud, and left your part out.", "Mirande told the next sleeper what you dreamed."],
  orable: ["Orable misfiled your page where only she would think to look.", "Orable filed you correctly, which is the worst thing she does."],
  hesper: ["Hesper chalked the next procession a street wide of yours.", "Hesper chalked your door."],
  calix: ["Calix let one lamp in the Sun-House go out, and said it was the oil.", "Calix trimmed every lamp that night, and wrote down who had sat beneath them."],
  wren: ["Wren kept a seat by the door, and kept it empty for you.", "Wren decided you weren't safe, and was probably right."],
  dessa: ["Dessa set a bowl aside for you at the day-house, and never mentioned it.", "Dessa's day-house closed its door to you, politely."],
  ferrant: ["Ferrant mended a book in your name and shelved it under another.", "Ferrant stopped taking your news."],
  odo: ["Odo's cart stopped outside your lodging on the third night, and moved on.", "Odo's cart took a different road after you."],
};
const BRD_EPI_FACTIONS = {
  f_keep: "The Inquisition's gentler half kept you on file, kindly, and meant it.",
  f_purge: "The half of the Inquisition that burns files burned yours, and somebody else's with it.",
  f_true: "The clerks of Seals who stamp only what's true stamped one more thing, and it was yours.",
  f_ladder: "The long stair at the Office of Seals has a rung with your name on it. It leads up.",
  f_open: "The Readers' Circles passed what you found hand to hand, until it had no owner.",
  f_close: "The Readers' Circles closed ranks around what you found. It's still safe, and still unread.",
  f_guild: "The Guild weighed honestly the week you were gone, and lost money doing it.",
  f_ring: "The Ring took the weight that fell short of your debt. The poor used it, and said nothing.",
  f_cellar: "The Cellar stayed hidden, and a few more of its people came out alive.",
  f_street: "The Street stayed in the open, and was seen, and was fed.",
};
const BRD_EPI_ADVERSARIES = {
  a_collector: "The Collector has your answers filed under a name that isn't yours.",
  a_probe: "The Past-Life Probe still knows more about you than it ought, and keeps it.",
  a_entangler: "Someone is still writing to a name you used once.",
  a_fevered: "The Fevered burned something else that week, and the Watch went after that.",
  a_hunt: "A patrol still circles a pass you used, a day behind.",
  a_zealot: "The Zealot preaches your sermon now, with the middle left out.",
  a_master: "The room at the end of the yard is still laid with two cups.",
};

// The lines that apply, in a fixed order; one is chosen by the road's length, so it varies from run to run without
// drawing a number from the encounter or dice streams.
export function brdEpilogue(s) {
  if (!brdOn(s)) return "";
  const all = [];
  for (const [id, pair] of Object.entries(BRD_EPI_PEOPLE)) {
    const r = brdRel(s, id);
    if (r >= 2) all.push(pair[0]);
    else if (r < 0) all.push(pair[1]);
  }
  for (const [flag, line] of Object.entries(BRD_EPI_FACTIONS)) if (s.flags[flag]) all.push(line);
  for (const [flag, line] of Object.entries(BRD_EPI_ADVERSARIES)) if (s.flags[flag]) all.push(line);
  if (!all.length) return "";
  return all[((s.day | 0) + (s.draws | 0)) % all.length];
}

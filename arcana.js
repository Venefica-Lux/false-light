// FALSE LIGHT — the Celestial Arcana (2026-10-26). Data and pure readers; engine.js runs it.
//
// Tarot says what fate presents; the sky says the conditions it arrives under; the player accepts, turns, trades for,
// or contradicts it. The foundation is canon: the rulebook already names its three movements after Major Arcana
// (§23: the Star, Death, Temperance), Rex Mundi is "the Architect of Limitation" (§1.1), the Ophite current runs
// inside his order (§1.3), and the Contradiction Seat is the one voice allowed to say no (§19.5).
//
// The sky is a game convention, not an ephemeris. The seven classical planets rule the days of the week in the
// traditional order (Sunday the Sun ... Saturday Saturn). One sign holds the run: in the Vigil, the Sun's sign by the
// calendar's conventional dates; in Exodus, the sign the heretic was born under, from the seed. Every planet is judged
// in that one sign by its traditional dignities: at home or exalted, its boon without its toll; in detriment or fall,
// its toll without its boon; anywhere else, both. A card is judged the same way through its ruler (the Golden Dawn's
// attributions: a planet, a sign, or an element), and the sky raises a dignified card upright and turns an afflicted
// one over. Nothing here claims where the planets actually are tonight.
//
// In this game the seven planets are also the seven spheres the Geometry is built from: the Ophite diagram's seven
// rulers, one for each day. That reading is this file's proposal, from the Ophite current canon names, and the cards leave it
// open: a planet at home gives its gift cleanly, and the cards never say whether that's mercy or good management.

export const SIGNS = [
  { k: "aries", name: "Aries", glyph: "♈", el: "fire", ruler: "mars" },
  { k: "taurus", name: "Taurus", glyph: "♉", el: "earth", ruler: "venus" },
  { k: "gemini", name: "Gemini", glyph: "♊", el: "air", ruler: "mercury" },
  { k: "cancer", name: "Cancer", glyph: "♋", el: "water", ruler: "moon" },
  { k: "leo", name: "Leo", glyph: "♌", el: "fire", ruler: "sun" },
  { k: "virgo", name: "Virgo", glyph: "♍", el: "earth", ruler: "mercury" },
  { k: "libra", name: "Libra", glyph: "♎", el: "air", ruler: "venus" },
  { k: "scorpio", name: "Scorpio", glyph: "♏", el: "water", ruler: "mars" },
  { k: "sagittarius", name: "Sagittarius", glyph: "♐", el: "fire", ruler: "jupiter" },
  { k: "capricorn", name: "Capricorn", glyph: "♑", el: "earth", ruler: "saturn" },
  { k: "aquarius", name: "Aquarius", glyph: "♒", el: "air", ruler: "saturn" },
  { k: "pisces", name: "Pisces", glyph: "♓", el: "water", ruler: "jupiter" },
];
const SIGN_AT = Object.fromEntries(SIGNS.map((x, i) => [x.k, i]));
// Fire and Water oppose, Air and Earth (the elemental dignities of the cards).
const CONTRARY = { fire: "water", water: "fire", air: "earth", earth: "air" };

// The keeper of each day's sphere: its boon, which the Mask that answers to it shares, and its toll. stat: the roll it lifts.
// The traditional weekday order (index 0 is Sunday).
export const WEEK = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
export const PLANETS = {
  sun: {
    name: "the Sun", glyph: "☉", day: "Sunday", short: "Sun",
    boon: "rolls against the Light +1", cost: "the Light finds you twice as easily",
    line: "The false sun's own day. It's generous. It always is.",
  },
  moon: {
    name: "the Moon", glyph: "☽", day: "Monday", short: "Moon", stat: "shade",
    boon: "Shade +1", cost: "a night without rest brings Longing +1",
    line: "Nyx's sphere. The quarter is harder to see by, and so are you.",
  },
  mars: {
    name: "Mars", glyph: "♂", day: "Tuesday", short: "Mars", stat: "steel",
    boon: "Steel +1", cost: "wolves come half again as often",
    line: "The Blade's day. Everyone's carrying one.",
  },
  mercury: {
    name: "Mercury", glyph: "☿", day: "Wednesday", short: "Mercury", stat: "wits",
    boon: "Wits +1", cost: "the Geometry comes half again as often",
    line: "The clerk's day. Every word you say is written somewhere.",
  },
  jupiter: {
    name: "Jupiter", glyph: "♃", day: "Thursday", short: "Jupiter",
    boon: "every Favor rise is 1 bigger", cost: "every rise of the Pull is 1 bigger",
    line: "Largesse. Everything is a little more than it should be, you included.",
  },
  venus: {
    name: "Venus", glyph: "♀", day: "Friday", short: "Venus", stat: "freq",
    boon: "Frequency +1", cost: "every Longing rise is 1 bigger",
    line: "The Eye's evening. Everything is beautiful, and wants something.",
  },
  saturn: {
    name: "Saturn", glyph: "♄", day: "Saturday", short: "Saturn",
    boon: "a rested night clears 1 more Strain", cost: "a night without rest clears no Strain",
    line: "The Architect's planet, and his day is the Sabbath. Nobody's sure who it belongs to.",
  },
};
// Traditional essential dignities: domicile and exaltation (well dignified), detriment and fall (afflicted).
const DIGNIFIED = {
  sun: ["leo", "aries"], moon: ["cancer", "taurus"], mercury: ["gemini", "virgo"], venus: ["taurus", "libra", "pisces"],
  mars: ["aries", "scorpio", "capricorn"], jupiter: ["sagittarius", "pisces", "cancer"], saturn: ["capricorn", "aquarius", "libra"],
};
const AFFLICTED = {
  sun: ["aquarius", "libra"], moon: ["capricorn", "scorpio"], mercury: ["sagittarius", "pisces"], venus: ["aries", "scorpio", "virgo"],
  mars: ["libra", "taurus", "cancer"], jupiter: ["gemini", "virgo", "capricorn"], saturn: ["cancer", "leo", "aries"],
};
// 1 dignified, −1 afflicted, 0 peregrine.
export const dignity = (planet, sign) => (DIGNIFIED[planet].includes(SIGNS[sign].k) ? 1 : AFFLICTED[planet].includes(SIGNS[sign].k) ? -1 : 0);
export const DIGNITY_WORD = { 1: "at home", 0: "a stranger", "-1": "in exile" };

// ---------- the deck ----------
// Every card of the 78 is listed, in the traditional order, with its Golden Dawn ruler. A card with `up` and `rev`
// is implemented: the engine gives it those effects. The rest are planned (ARCANA_PLANNED counts them) and are
// never dealt. modes: where a card is dealt (the Vigil's reading takes only cards whose effects exist there).
// Every effect named here is one engine.js applies; the tests read this table.
const V = ["vigil", "ascension"];
const X = ["ascension"];
export const ARCANA = {
  fool: {
    n: "0", name: "The Fool", ruler: { el: "air" }, modes: V,
    s: { up: "Once a day, a miss lands as a 7–9.", rev: "Once a day, a hit lands as a 7–9." },
    sx: { up: "Once a movement, a miss lands as a 7–9.", rev: "Once a movement, a hit lands as a 7–9." },
    up: "The first roll each day that would miss lands as a 7–9 instead; in Exodus, the first each movement. A step off the edge, caught.",
    rev: "The first roll each day that would hit lands as a 7–9 instead; in Exodus, the first each movement. You weren't looking where you stepped.",
  },
  magician: {
    n: "I", name: "The Magician", ruler: { planet: "mercury" }, modes: X,
    s: { up: "Every relic gains a working; transmuting pays Gnosis +1 more.", rev: "Every relic loses a working now, and every working costs Strain +1." },
    up: "Every relic you carry gains a working now, and a transmutation pays Gnosis +1 more. Venefica's own card: the poisoner turning their tools.",
    rev: "Every relic loses a working now, and every working costs Strain +1 more. The tools are turning you.",
    open: { up: { relics: 1 }, rev: { relics: -1 } },
  },
  priestess: {
    n: "II", name: "The High Priestess", ruler: { planet: "moon" }, modes: V,
    s: { up: "The Cage, shown, and 1 looser.", rev: "The Cage +2, unseen." },
    up: "What's hidden is shown: the Cage now, and it loosens by 1. In Exodus, the Pull is shown too.",
    rev: "The veil thickens: the Cage +2, and you won't see it do it.",
    open: { up: { reveal: true, cage: -1 }, rev: { cage: 2 } },
  },
  empress: {
    n: "III", name: "The Empress", ruler: { planet: "venus" }, modes: V,
    s: { up: "A card that lowers Hollow lowers it 1 more.", rev: "A card that lowers Hollow raises the Cage 1." },
    up: "Abundance: a card that lowers Hollow lowers it 1 more. The body is fed.",
    rev: "Smothered: a card that lowers Hollow also raises the Cage 1. Every meal has a host.",
  },
  emperor: {
    n: "IV", name: "The Emperor", ruler: { sign: "aries" }, modes: V,
    s: { up: "Every rise of the Pull is 1 bigger.", rev: "The Pull −2 now." },
    up: "Rex Mundi's own card. The throne calls: every rise of the Pull is 1 bigger.",
    rev: "The throne, seen from underneath: the Pull −2 now.",
    open: { rev: { apo: -2 } },
  },
  hierophant: {
    n: "V", name: "The Hierophant", ruler: { sign: "taurus" }, modes: V,
    s: { up: "Cage and Gnosis rises of 2+ are 1 smaller.", rev: "Gnosis and Mark rises of 2+ are 1 bigger." },
    up: "The orthodox shelter: rises of 2 or more in the Cage and in Gnosis are each 1 smaller. The church keeps you, and keeps things from you.",
    rev: "Heresy: rises of 2 or more in Gnosis and in Mark are each 1 bigger. You learn faster, and you're noticed learning.",
  },
  lovers: {
    n: "VI", name: "The Lovers", ruler: { sign: "gemini" }, modes: V,
    s: { up: "Every Longing fall is 1 bigger.", rev: "Every Longing rise raises the Cage 1." },
    up: "Witnessed: every Longing fall is 1 bigger. Being seen by the real replaces the hunger for the false.",
    rev: "Chosen: every Longing rise also raises the Cage 1. The hunger to be picked is the door the subtlest enemy walks through.",
  },
  chariot: {
    n: "VII", name: "The Chariot", ruler: { sign: "cancer" }, modes: V,
    s: { up: "An Activation can stir a Mask, never seize.", rev: "An Activation that would stir seizes." },
    up: "You hold the reins: under load a Mask can stir, but it can't seize you. Who decides is still you.",
    rev: "The horses bolt: an Activation that would only stir a Mask seizes instead.",
  },
  strength: {
    n: "VIII", name: "Strength", ruler: { sign: "leo" }, modes: V,
    s: { up: "At Strain 5 your rolls are no worse.", rev: "From Strain 4, every roll is 1 worse." },
    up: "The lion lies down. At Strain 5, your rolls are no worse for it.",
    rev: "The lion has you. From Strain 4, every roll is 1 worse.",
  },
  hermit: {
    n: "IX", name: "The Hermit", ruler: { sign: "virgo" }, modes: V,
    s: { up: "A rested night gives Untaggable +1.", rev: "A night without rest takes Untaggable 1." },
    up: "Your own lamp: every rested night gives Untaggable +1. Alone, and not findable.",
    rev: "The lamp goes out: every night without rest takes 1 from Untaggable.",
  },
  wheel: {
    n: "X", name: "Wheel of Fortune", ruler: { planet: "jupiter" }, modes: V,
    s: { up: "Fortune rolls at advantage.", rev: "Fortune rolls at disadvantage." },
    up: "Fortune rolls at advantage: the turn of the wheel is with you. In a fight, the last stand is a Fortune roll.",
    rev: "Fortune rolls at disadvantage. The wheel has a hand on it, and it isn't yours.",
  },
  justice: {
    n: "XI", name: "Justice", ruler: { sign: "libra" }, modes: V,
    s: { up: "Every Mark fall is 1 bigger.", rev: "Every Mark fall is 1 smaller." },
    up: "The record set straight: every Mark fall is 1 bigger.",
    rev: "The scales reversed: every Mark fall is 1 smaller. The file remembers what you did to get it closed.",
  },
  hanged: {
    n: "XII", name: "The Hanged Man", ruler: { el: "water" }, modes: X,
    s: { up: "Disengaging pays Gnosis +1 more and costs no Favor.", rev: "Disengaging costs Strain +2." },
    up: "Letting go is a way of seeing: disengaging from a fight pays Gnosis +1 more and costs no Favor.",
    rev: "You can't let go: disengaging from a fight costs Strain +2.",
  },
  death: {
    n: "XIII", name: "Death", ruler: { sign: "scorpio" }, modes: V,
    s: { up: "Once, an ending by Mark or Strain goes to 4 instead.", rev: "Hollow can't fall below 1." },
    up: "Change, not the end: once, a Naming or a Fracture that nothing else catches doesn't come. Mark or Strain goes to 4 instead, and Gnosis +1.",
    rev: "Refusing to change: Hollow can't fall below 1. The body remembers what the schedule deleted.",
  },
  temperance: {
    n: "XIV", name: "Temperance", ruler: { sign: "sagittarius" }, modes: V,
    s: { up: "Strain rises of 2+ are 1 smaller.", rev: "Strain rises of 2+ are 1 bigger." },
    up: "The middle way: every Strain rise of 2 or more is 1 smaller.",
    rev: "Excess: every Strain rise of 2 or more is 1 bigger.",
  },
  devil: {
    n: "XV", name: "The Devil", ruler: { sign: "capricorn" }, modes: X,
    s: { up: "Favor +2 now; every Chain you give in to counts twice.", rev: "The next Chain you give in to is struck from the Grammar." },
    up: "The bargain, made plain: Favor +2 now, and every Chain you give in to counts twice when the Grammar speaks.",
    rev: "You can see the chain: the next Chain you give in to is struck from the Grammar instead.",
    open: { up: { favor: 2 } },
  },
  tower: {
    n: "XVI", name: "The Tower", ruler: { planet: "mars" }, modes: X,
    s: { up: "Strain +2 now; the next adversary's clock starts 2 lower.", rev: "Strain −1 now; the next adversary's clock starts 2 higher." },
    up: "Lightning: Strain +2 now, and the next adversary's clock starts 2 lower. The structure was always going to fall.",
    rev: "The fall, postponed: Strain −1 now, and the next adversary's clock starts 2 higher.",
    open: { up: { strain: 2 }, rev: { strain: -1 } },
  },
  star: {
    n: "XVII", name: "The Star", ruler: { sign: "aquarius" }, modes: V,
    s: { up: "A rested night gives Gnosis +1.", rev: "A night without rest takes Gnosis 1." },
    up: "Hope: every rested night gives Gnosis +1. You remember you were never theirs while you sleep.",
    rev: "Despair: every night without rest takes 1 from Gnosis.",
  },
  moon: {
    n: "XVIII", name: "The Moon", ruler: { sign: "pisces" }, modes: V,
    s: { up: "The day's last card: Shade and Frequency +1.", rev: "The day's last card: every roll 1 worse." },
    up: "The dark is yours: on each day's last card, Shade and Frequency +1.",
    rev: "The dark lies: on each day's last card, every roll is 1 worse.",
  },
  sun: {
    n: "XIX", name: "The Sun", ruler: { planet: "sun" }, modes: V,
    s: { up: "Communion clears 1 more Strain; the Reckoning, 1 harder.", rev: "The Light comes half as often; Holds are 1 harder." },
    up: "Which sun? The deck doesn't say. Communion clears 1 more Strain, and the Reckoning lands 1 harder: the gift is real, and so is the bill.",
    rev: "Eclipse: the Light finds you half as easily, and every roll against it is 1 worse.",
  },
  judgement: {
    n: "XX", name: "Judgement", ruler: { el: "fire" }, modes: X,
    s: { up: "The next adversary's people road starts 2 pips higher.", rev: "The next adversary's people road starts empty." },
    up: "The trumpet, once, and the Named answer it: the next adversary's people road starts 2 pips higher.",
    rev: "The trumpet, and nobody rises: the next adversary's people road starts empty, whoever you've freed.",
  },
  world: {
    n: "XXI", name: "The World", ruler: { planet: "saturn" }, modes: X,
    s: { up: "The Ways Out ask the Pull 1 higher.", rev: "The Ways Out ask the Pull 1 lower." },
    up: "The circle closes kindly: the Ways Out ask the Pull 1 higher, and walking out alone is certain 1 Untaggable sooner.",
    rev: "The circle tightens: the Ways Out ask the Pull 1 lower.",
  },
};
// The Minor Arcana. Each suit is an element, and in FALSE LIGHT each element answers to a Mask: Wands the Blade's
// fire (Eris), Cups the Eye's water (Lilith), Swords the Veil's air (Nyx, the machine-sight that cuts), Pentacles the
// body's earth (the Bare Face). The Majors are the big levers; the Minors are weather. The Aces make their Mask easy
// or hard to put on. The nine pips (Two to Ten) are small standing conditions on their suit's own ground, built from
// five shared shapes (a roll shifted, a rise or a fall shifted, a rider on a roll's result, a rider on the night, a
// weight on the deck). The Pages are a message that lands now. The Knights, Queens and Kings answer to the Mask of
// their suit and do nothing unless you wear it: the Knight rides for it (advantage or disadvantage on its roll), the
// Queen holds its risk, the King its gift. That is this file's reading, from the Golden Dawn's suits and the game's
// Masks; the cards themselves never say why.
export const SUITS = {
  wands: { name: "Wands", el: "fire", mask: "eris" },
  cups: { name: "Cups", el: "water", mask: "lilith" },
  swords: { name: "Swords", el: "air", mask: "nyx" },
  pentacles: { name: "Pentacles", el: "earth", mask: "bare" },
};
export const SUIT_OF = Object.fromEntries(Object.entries(SUITS).map(([k, x]) => [x.mask, k]));
const RANKS = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
const MASK_NAME = { eris: "Eris", lilith: "Lilith", nyx: "Nyx", bare: "the Bare Face" };

// The five shapes a pip is built from, and the sentence each says. The engine reads the shapes (engine.js, minorFx).
const TRACK = { mark: "Mark", strain: "Strain", favor: "Favor", hollow: "Hollow", longing: "Longing", untag: "Untaggable", gnosis: "Gnosis", cage: "the Cage", apo: "the Pull" };
const ROLL = { steel: "Steel", shade: "Shade", wits: "Wits", freq: "Frequency", light: "rolls against the Light", any: "any roll" };
const sg = (n) => `${n < 0 ? "−" : "+"}${Math.abs(n)}`;
const fxWords = (fx) => Object.entries(fx).map(([k, v]) => `${TRACK[k]} ${sg(v)}`).join(", ");
const roll = (stat, d) => ({ t: "roll", stat, d });
const rises = (k, d, big) => ({ t: "rise", k, d, ...(big ? { big: true } : {}) });
const falls = (k, d, big) => ({ t: "fall", k, d, ...(big ? { big: true } : {}) });
const upon = (stat, tier, fx) => ({ t: "tier", stat, tier, fx });
const nite = (rested, fx) => ({ t: "night", rested, fx });
const deck = (tier, m) => ({ t: "weight", tier, m });
const TIER_WORD = { hit: "clean hit", mid: "7–9", miss: "miss" };
export function say(d) {
  switch (d.t) {
    case "roll": return d.stat === "light" ? `Rolls against the Light ${sg(d.d)}.` : `${ROLL[d.stat]} ${sg(d.d)}.`;
    case "rise": return `${d.d > 0 && !d.big ? "Every rise" : "Rises"} of ${TRACK[d.k]}${d.d > 0 && !d.big ? "" : " of 2 or more"} ${d.d > 0 && !d.big ? "is" : "are"} 1 ${d.d > 0 ? "bigger" : "smaller"}.`;
    case "fall": return `${d.d > 0 && !d.big ? "Every fall" : "Falls"} of ${TRACK[d.k]}${d.d > 0 && !d.big ? "" : " of 2 or more"} ${d.d > 0 && !d.big ? "is" : "are"} 1 ${d.d > 0 ? "bigger" : "smaller"}.`;
    case "tier": return `A ${TIER_WORD[d.tier]} on ${d.stat === "any" ? "any roll" : ROLL[d.stat]}: ${fxWords(d.fx)}.`;
    case "night": return `${d.rested ? "A rested night" : "A night without rest"}: ${fxWords(d.fx)}.`;
    case "weight": return `${d.tier === 2 ? "Wolves" : "The Geometry"} come ${d.m < 1 ? "a third less often" : "half again as often"}.`;
  }
}
const sayAll = (ds) => ds.map(say).join(" ");

// Per suit, Two to Ten: [image upright, shapes upright, image reversed, shapes reversed]. A Ten may instead be a
// reading's immediate effect: { open }.
const PIPS = {
  wands: [
    ["The world in one hand, a wand in the other: you choose your heading.", [roll("steel", 1)], "The map is yours and you won't read it.", [roll("steel", -1)]],
    ["You stand on the cliff and the ships are yours.", [upon("steel", "hit", { favor: 1 })], "The ships are late, and everyone is counting.", [upon("steel", "miss", { favor: -1 })]],
    ["Garlands, a gate, a table laid. Somewhere to come back to.", [nite(true, { longing: -1 })], "The garlands are up and nobody has come.", [nite(false, { longing: 1 })]],
    ["Five staves, no blood: a scuffle that stays a scuffle.", [deck(2, 0.67)], "Everyone armed and everyone right.", [deck(2, 1.5)]],
    ["The laurel and the road home. The crowd carries you.", [upon("steel", "hit", { strain: -1 })], "The rider is home. The crowd saw which way.", [upon("steel", "hit", { strain: 1 })]],
    ["You hold the high ground, and the high ground holds you.", [upon("steel", "mid", { strain: -1 })], "You hold the high ground by your fingernails.", [upon("steel", "mid", { strain: 1 })]],
    ["Eight staves in the air at once. None of them is aimed at you.", [roll("shade", 1)], "Eight staves in the air, and every one of them is looking.", [roll("shade", -1)]],
    ["Bandaged, wary, still standing. A bad night clears a little.", [nite(false, { strain: -1 })], "Bandaged, wary, and tired of it. Even rest takes some of you.", [nite(true, { strain: 1 })]],
    ["Ten staves, laid down at last at the door.", [falls("apo", 1)], "Ten staves and a bent back: you carry what you could have set down.", [rises("apo", 1)]],
  ],
  cups: [
    ["Two cups, one exchange: someone is actually listening.", [roll("freq", 1)], "Two cups, one spilled. You said the wrong name.", [roll("freq", -1)]],
    ["Three cups raised. For a minute it isn't a performance.", [upon("freq", "hit", { longing: -1 })], "Three cups raised, and every toast is a leash.", [upon("freq", "hit", { cage: 1 })]],
    ["A cup is offered and you don't take it. The hunger notices.", [rises("longing", -1)], "A cup is offered and you can't see it. The hunger grows.", [rises("longing", 1)]],
    ["Three spilled and two still standing. You count the two.", [upon("freq", "miss", { gnosis: 1 })], "Three spilled and you won't turn around.", [upon("freq", "miss", { longing: 1 })]],
    ["Old cups full of flowers: somebody remembers you kindly.", [rises("favor", 1)], "Old cups, old flowers, and the past won't pay.", [rises("favor", -1)]],
    ["Seven cups on a cloud. This time you can tell which is real.", [upon("freq", "mid", { gnosis: 1 })], "Seven cups on a cloud, and you pick the one that glows.", [upon("freq", "mid", { longing: 1 })]],
    ["You walk away from the cups at dusk and nothing follows.", [falls("cage", 1)], "You turn to go and the cups come with you.", [falls("cage", -1)]],
    ["The wish cup: a full table, and nobody watching you eat.", [nite(true, { favor: 1 })], "The wish cup: all of it yours and none of it enough.", [upon("freq", "hit", { longing: 1 })]],
    ["Ten cups under a rainbow. The table is full and you are at it.", [upon("freq", "hit", { hollow: -1 })], "Ten cups, and the rainbow is a painting.", [upon("freq", "miss", { hollow: 1 })]],
  ],
  swords: [
    ["Two blades crossed, eyes covered. You can hold still.", [roll("wits", 1)], "Two blades down, blindfold off. There is too much to see.", [roll("wits", -1)]],
    ["Three blades through one heart. It teaches fast.", [upon("wits", "miss", { gnosis: 1 })], "Three blades and nobody to tell.", [upon("wits", "miss", { strain: 1 })]],
    ["A knight on a tomb, hands folded. Lying low is a craft.", [nite(true, { mark: -1 })], "Hands folded on the tomb, and the door is open.", [upon("wits", "mid", { mark: 1 })]],
    ["Five swords, a small victory: the Geometry looks away.", [deck(3, 0.67)], "Five swords taken, and the sentinel counts them.", [deck(3, 1.5)]],
    ["A boat, six blades, a quiet crossing. Nobody on the bank.", [rises("mark", -1)], "A boat, six blades, and the bank is watching.", [rises("mark", 1, true)]],
    ["Five swords carried off on tiptoe. They never counted.", [upon("shade", "hit", { untag: 1 })], "Five swords carried off, and you trip.", [upon("shade", "miss", { mark: 1 })]],
    ["Bound, blindfolded, ringed in blades. The ring has a door.", [upon("wits", "hit", { strain: -1 })], "Bound, and the knots are your own.", [upon("wits", "miss", { cage: 1 })]],
    ["Up in the night with nine blades on the wall. Awake, you see all of it.", [nite(false, { gnosis: 1 })], "Up in the night with nine blades on the wall and sleep gone.", [upon("shade", "miss", { strain: 1 })]],
    ["Ten blades in a back. It has already happened; nothing worse can.", { open: { gnosis: 2, strain: 1 }, say: "Gnosis +2, Strain +1, now." }, "Ten blades in a back, and you get up anyway. The file hears it.", { open: { mark: 1, untag: -1 }, say: "Mark +1, Untaggable −1, now." }],
  ],
  pentacles: [
    ["Two coins in a loop, a ship on a swell. You keep both moving.", [roll("light", 1)], "Two coins and a wave. One drops.", [roll("light", -1)]],
    ["Three coins in an arch: the mason, the monk, the patron agree.", [upon("wits", "hit", { favor: 1 })], "Three coins in an arch and nobody agrees on the plans.", [upon("wits", "miss", { favor: -1 })]],
    ["Four coins held tight. Hold them and they stay yours.", [falls("favor", -1)], "Four coins clutched so hard they cut.", [falls("favor", 1, true)]],
    ["Five coins in a lit window. Somebody opens the door.", [nite(true, { hollow: -1 })], "Five coins in a lit window, and the door stays shut.", [falls("hollow", -1)]],
    ["Six coins and the scales level. Giving counts.", [upon("freq", "hit", { untag: 1 })], "Six coins and the scales tilt. Giving is watched.", [upon("freq", "hit", { mark: 1 })]],
    ["Seven coins on the vine. You are patient, and it has paid.", [upon("any", "mid", { favor: 1 })], "Seven coins on the vine, and you keep checking them.", [upon("any", "mid", { strain: 1 })]],
    ["Eight coins, a bench, a chisel. Practice is a kind of rest.", [falls("strain", 1)], "Eight coins, the same cut forever. Practice wears.", [falls("strain", -1)]],
    ["Nine coins in a garden, a hooded bird. Nothing you need is out there.", [rises("hollow", -1)], "Nine coins in a garden, and the walls are too high to see over.", [rises("hollow", 1)]],
    ["Ten coins, a hearth, a dog: what you built will outlast you.", { open: { favor: 2 }, say: "Favor +2, now." }, "Ten coins in a ledger. They are all owed.", { open: { favor: -1, cage: 1 }, say: "Favor −1, the Cage +1, now." }],
  ],
};
// The Pages: a message that lands the moment you accept it.
const PAGES = {
  wands: ["A page with a wand in the desert and a good idea.", { gnosis: 1 }, "A page with a wand and nothing to point it at.", { strain: 1 }],
  cups: ["A page and a fish in a cup, speaking.", { longing: -1 }, "A page and a fish that will not stop talking.", { longing: 1 }],
  swords: ["A page on the ridge, sword up, eyes open.", { untag: 1 }, "A page in the wind, the sword at the wrong angle.", { mark: 1 }],
  pentacles: ["A page studying a coin as if it might answer.", { favor: 1 }, "A page studying the coin so long the day went.", { hollow: 1 }],
};
// The Knights ride for their Mask: advantage (upright) or disadvantage (reversed) on the roll it lifts. The Bare Face
// lifts no roll, so its Knight rides on Wits: the plain, patient work.
const KNIGHT_ROLL = { eris: "steel", lilith: "freq", nyx: "shade", bare: "wits" };
const KNIGHTS = {
  wands: ["A knight in flame-colored armor, the horse already running.", "The horse bolts and the knight goes with it."],
  cups: ["A knight carrying a cup level, as if it were a vow.", "A knight who has spilled it and is still smiling."],
  swords: ["A knight at full gallop into the wind, blade low.", "A knight charging in every direction at once."],
  pentacles: ["A knight on a plowhorse, slow and sure, coin held out.", "A knight on a plowhorse that has stopped in the road."],
};
// The Queens hold their Mask's risk; the Kings its gift.
const QUEENS = {
  eris: ["A queen on a throne of lions, a black cat at her feet.", "Isolation never comes.", "The cat has left her feet.", "Isolation comes on every 4th card."],
  lilith: ["A queen with a cup closed like a reliquary.", "Exposure is waived: Longing rises only by what they are (+1 only when she takes the wheel).", "A queen who has opened it.", "Exposure doubles: every Longing rise +2 (+3 when she takes the wheel)."],
  nyx: ["A queen whose sword is held up, not drawn.", "Dissolution comes one card later (every 4th; every 3rd when she takes the wheel).", "A queen whose sword is drawn and shaking.", "Dissolution comes every 2nd card, and no worse when she takes the wheel."],
  bare: ["A queen in a garden, a rabbit in her lap.", "Wolves cost bare-faced no Strain (the Geometry still does).", "A queen in a garden with the rabbit gone.", "Wolves cost bare-faced 2 Strain."],
};
const KINGS = {
  eris: ["A king on a throne carved with salamanders.", "Severance cuts clean: a clean hit on a wolf takes Mark −2, and a fight lost isn't loud.", "A king who forgot what the salamanders were for.", "Severance forgets nothing: a clean hit takes no Mark, and a fight lost is loud: Mark +2."],
  lilith: ["A king on a sea-throne, fish at his feet, cup steady.", "Hunger wakes at Longing 2 (not 3).", "A king whose cup has gone over.", "Hunger wakes only at Longing 4."],
  nyx: ["A king with the sword straight up and nothing on his face.", "The Veil takes the first two looks each day.", "A king whose face is the only thing showing.", "The Veil takes nothing: the first look lands whole."],
  bare: ["A king among vines, a bull's head on the throne's arm.", "A rested night bare-faced clears 4 Strain.", "A king among vines who has stopped eating.", "A rested night clears 2 Strain, bare-faced or not."],
};
const COURT = { Page: 0, Knight: 1, Queen: 2, King: 3 };
const SHORT_MASK = { eris: "Eris", lilith: "Lilith", nyx: "Nyx", bare: "bare-faced" };
const wear = (m) => (m === "bare" ? "While you are bare-faced" : `While you wear ${MASK_NAME[m]}`);
for (const [suit, x] of Object.entries(SUITS)) {
  RANKS.forEach((rank, i) => {
    const k = `${rank.toLowerCase()}_${suit}`;
    const card = { n: rank, name: `${rank} of ${x.name}`, ruler: { el: x.el }, suit };
    const m = x.mask;
    if (i === 0)
      Object.assign(card, {
        modes: V, mask: m,
        s: { up: `Putting on ${MASK_NAME[m]} costs no Strain.`, rev: `Putting on ${MASK_NAME[m]} costs 1 Strain more.` },
        up: `The pure element: putting on ${MASK_NAME[m]} costs no Strain, at any hour. A seized Mask still holds.`,
        rev: `The element turned: putting on ${MASK_NAME[m]} costs 1 Strain more.`,
      });
    else if (i <= 9) {
      const [iu, du, ir, dr] = PIPS[suit][i - 1];
      const mk = (img, d) => (Array.isArray(d) ? { fx: d, short: sayAll(d), line: `${img} ${sayAll(d)}` } : { open: d.open, short: d.say, line: `${img} ${d.say}` });
      const u = mk(iu, du), r = mk(ir, dr);
      Object.assign(card, { modes: V, s: { up: u.short, rev: r.short }, up: u.line, rev: r.line });
      if (u.fx) card.fx = { up: u.fx, rev: r.fx };
      else card.open = { up: u.open, rev: r.open };
    } else if (rank === "Page") {
      const [iu, ou, ir, or] = PAGES[suit];
      Object.assign(card, {
        modes: V, open: { up: ou, rev: or },
        s: { up: `${fxWords(ou)}, now.`, rev: `${fxWords(or)}, now.` },
        up: `${iu} ${fxWords(ou)}, now.`, rev: `${ir} ${fxWords(or)}, now.`,
      });
    } else if (rank === "Knight") {
      const [iu, ir] = KNIGHTS[suit];
      const what = `${ROLL[KNIGHT_ROLL[m]]} rolls`;
      Object.assign(card, {
        modes: V, rides: { mask: m, stat: KNIGHT_ROLL[m] },
        s: { up: `${wear(m)}, ${what} are at advantage.`, rev: `${wear(m)}, ${what} are at disadvantage.` },
        up: `${iu} ${wear(m)}, ${what} are at advantage.`, rev: `${ir} ${wear(m)}, ${what} are at disadvantage.`,
      });
    } else {
      const [iu, lu, ir, lr] = (rank === "Queen" ? QUEENS : KINGS)[m];
      Object.assign(card, {
        modes: V, holds: { mask: m, of: rank === "Queen" ? "risk" : "gift" },
        s: { up: `${wear(m)}: ${lu}`, rev: `${wear(m)}: ${lr}` },
        up: `${iu} ${wear(m)}: ${lu}`, rev: `${ir} ${wear(m)}: ${lr}`,
      });
    }
    ARCANA[k] = card;
  });
}
export const ARCANA_IDS = Object.keys(ARCANA);
export const isLive = (k) => !!(ARCANA[k] && ARCANA[k].up && ARCANA[k].rev);
export const ARCANA_LIVE = ARCANA_IDS.filter(isLive);
export const ARCANA_PLANNED = ARCANA_IDS.filter((k) => !isLive(k));

// The sky judges a card through its ruler: 1 raises it upright, −1 turns it over, 0 leaves it as it fell.
export function cardDignity(k, sign) {
  const r = ARCANA[k].ruler;
  if (r.planet) return dignity(r.planet, sign);
  if (r.sign) return SIGN_AT[r.sign] === sign ? 1 : SIGN_AT[r.sign] === (sign + 6) % 12 ? -1 : 0;
  const el = SIGNS[sign].el;
  return r.el === el ? 1 : CONTRARY[r.el] === el ? -1 : 0;
}
export const rulerName = (k) => {
  const r = ARCANA[k].ruler;
  return r.planet ? PLANETS[r.planet].name : r.sign ? SIGNS[SIGN_AT[r.sign]].name : r.el.charAt(0).toUpperCase() + r.el.slice(1);
};

// FNV-1a: the Arcana's own seeded draws, so nothing here touches the deck's encounter stream or the dice.
export function arcHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

// The three places of an Exodus reading, laid over canon's three movements (§23).
export const PLACES = [
  { k: "omen", name: "The Omen", over: "the Star" },
  { k: "trial", name: "The Trial", over: "Death" },
  { k: "verdict", name: "The Verdict", over: "Temperance" },
];

// The Sun's sign by the calendar's conventional dates (tropical, rounded to whole days): a convention, not a position.
const SUN_DATES = [[1, 20, 10], [2, 19, 11], [3, 21, 0], [4, 20, 1], [5, 21, 2], [6, 21, 3], [7, 23, 4], [8, 23, 5], [9, 23, 6], [10, 23, 7], [11, 22, 8], [12, 22, 9]];
export function sunSign(iso) {
  const [, m, d] = iso.split("-").map(Number);
  let sign = 9; // early January: Capricorn
  for (const [mm, dd, k] of SUN_DATES) if (m > mm || (m === mm && d >= dd)) sign = k;
  return sign;
}

// A reading: the cards dealt (distinct, from the cards live in this mode), each as it fell and then as the sky has it.
// set: 1 the sky raised it, −1 the sky turned it, 0 it fell that way.
// In Exodus a movement recognizes its own card: the Star dealt over the Star, Death over Death, Temperance over
// Temperance comes up upright whatever the sky says (own).
export const OWN = ["star", "death", "temperance"];
export function deal(seed, mode, sign, n) {
  const pool = ARCANA_LIVE.filter((k) => ARCANA[k].modes.includes(mode));
  const out = [];
  for (let i = 0; out.length < n && i < 64; i++) {
    const h = arcHash(`${seed}:arcana:${i}`);
    const k = pool[h % pool.length];
    if (out.some((c) => c.id === k)) continue;
    out.push(fall(k, (h >>> 16) & 1 ? true : false, sign, mode === "ascension" && OWN[out.length] === k));
  }
  return out;
}
export function fall(id, rev, sign, own = false) {
  const set = own ? 1 : cardDignity(id, sign);
  return { id, fell: rev, rev: set === 1 ? false : set === -1 ? true : rev, set, st: "down", ...(own ? { own: true } : {}) };
}

// The sky for a run: the sign it's held under and the weekday of its first night.
export function skyFor(seed, mode) {
  if (mode === "vigil") return { sign: sunSign(seed), wk: new Date(seed + "T00:00:00Z").getUTCDay() };
  return { sign: arcHash(seed + ":sky") % 12, wk: arcHash(seed + ":week") % 7 };
}

// Readers. arcOn(s, k): "up" or "rev" if card k is read (turned up, not struck) in this run; otherwise null.
export function arcOn(s, k) {
  const a = s.arc;
  if (!a) return null;
  const c = a.spread.find((x) => x.id === k);
  return c && c.st === "up" ? (c.rev ? "rev" : "up") : null;
}
export const dayPlanet = (s) => (s.arc ? WEEK[(s.arc.wk + s.day - 1) % 7] : null);
// The day's sphere, its boon and toll today: dignified gives the boon only, afflicted the toll only, a stranger both.
export function planetToday(s) {
  const p = dayPlanet(s);
  if (!p) return null;
  const d = dignity(p, s.arc.sign);
  return { p, d, boon: d >= 0, cost: d <= 0 };
}
export const boonOn = (s, p) => {
  const t = planetToday(s);
  return !!(t && t.p === p && t.boon);
};
export const costOn = (s, p) => {
  const t = planetToday(s);
  return !!(t && t.p === p && t.cost);
};
// The Minor Arcana's shapes, for every Minor read in this run (arcana.js PIPS), each tagged with the card it came from.
export function minorFx(s) {
  const out = [];
  if (!s.arc) return out;
  for (const c of s.arc.spread) {
    const fx = c.st === "up" && ARCANA[c.id].fx;
    if (fx) for (const d of fx[c.rev ? "rev" : "up"]) out.push({ ...d, from: ARCANA[c.id].name });
  }
  return out;
}
// A court card read in this run, for the Mask of its suit: "up", "rev" or null.
export const courtOn = (s, rank, mask) => arcOn(s, `${rank}_${SUIT_OF[mask]}`);
export const knightRoll = (mask) => KNIGHT_ROLL[mask];
export { fxWords };
// The one being read right now: the first still face down (an Exodus reading turns one per movement).
export const reading = (s) => (s.arc ? s.arc.spread.find((c) => c.st === "down") || null : null);
export const placeOf = (s, c) => PLACES[s.arc.spread.indexOf(c)] || PLACES[0];
// What turning a card over costs. In the Vigil, 1 Strain, 2 against the sky's own setting. In Exodus, where the Pull
// is a road's whole question, bending fate to your will is what feeds it (§2.2, §10.4): the Pull +1, and Strain +1
// against the sky.
export const turnCost = (c) => (c.set ? 2 : 1);
export const turnFx = (s, c) => (s.asc ? { apo: 1, ...(c.set ? { strain: 1 } : {}) } : { strain: turnCost(c) });
export const skyWhy = (c) => (c.own ? "Its own movement raised it upright." : c.cor ? "A relic of its ruler's metal turned it upright." : c.set === 1 ? "The sky raised it upright." : c.set === -1 ? "The sky turned it over." : c.rev ? "It fell reversed." : "It fell upright.");
export const cardTitle = (c) => `${ARCANA[c.id].name}${c.rev ? ", reversed" : ""}`;
export const cardLine = (c) => ARCANA[c.id][c.rev ? "rev" : "up"];

// ---------- the reading, as cards ----------
// Each place of a reading is one forced card and one real choice: accept what fate presents, or act on it. Turning a
// card over is will against fate (Strain, more against the sky's own setting). At the Trial you can lay down a relic
// and turn the sky one sign instead, so the Trial and the Verdict fall again under it. At the Verdict, the
// Contradiction Seat (§19.5): someone with permission to say no tests your certainty that the card means what you
// think. 10+, it means nothing and is struck. 7–9, it reads the other way. 6−, she was right that you needed a sign
// too badly: it stands, Strain +1, and the Pull −1, because you were protected from yourself.
// relicName is passed in by engine.js, which has the relics; this file stays free of Exodus's data.
const ART_OF = {
  fool: "door", magician: "serpent", priestess: "veil", emperor: "crown", strength: "hand", wheel: "wheel", hanged: "chain",
  devil: "horn", tower: "tower", judgement: "bell", world: "star", empress: "cup", hierophant: "scroll", lovers: "rose",
  chariot: "flag", hermit: "lantern", justice: "blade", death: "grave", temperance: "candle", star: "eye", moon: "mask", sun: "sun", ace_wands: "blade", ace_cups: "cup", ace_swords: "veil", ace_pentacles: "coin",
};
// The Minors wear their suit's symbol (the Aces' own); the court takes its rank's.
const SUIT_ART = { wands: "blade", cups: "cup", swords: "veil", pentacles: "coin" };
const COURT_ART = { Page: "scroll", Knight: "flag", Queen: "rose", King: "crown" };
const artOf = (id) => ART_OF[id] || (ARCANA[id].suit ? COURT_ART[ARCANA[id].n] || SUIT_ART[ARCANA[id].suit] : "star");
const ro = (text, fx) => ({ text, fx });
// Exodus has its own short line where a card's rhythm differs there (the Fool: once a movement, not once a day).
const shortLine = (s, c) => ((s.asc && ARCANA[c.id].sx) || ARCANA[c.id].s)[c.rev ? "rev" : "up"];
function readFace(s, base, who) {
  const c = reading(s);
  if (!c) return base;
  const k = ARCANA[c.id];
  return {
    ...base,
    who,
    art: artOf(c.id),
    numeral: k.n,
    flip: c.rev,
    tierText: c.rev ? "reversed" : "upright",
    text: `${cardTitle(c)}. ${skyWhy(c)} ${shortLine(s, c)}`,
    left: { ...base.left, fx: { arc: "accept" }, text: cardLine(c) },
    right: turnSide(s, c),
  };
}
const turnSide = (s, c) => {
  const t = { ...c, rev: !c.rev };
  const will = s.asc ? " Bending fate to your will feeds the Pull: +1." : "";
  const against = c.set ? " Against the sky: it costs more." : "";
  return { label: c.set ? "Defy the sky" : "Turn it over", fx: { ...turnFx(s, c), arc: "turn" }, text: `${cardTitle(t)}. ${cardLine(t)}${against}${will}` };
};
export function readingCards(relicName) {
  return [
    {
      id: "r_vigil", forcedOnly: true, fixed: true, dusk: true, tier: 0, art: "star", who: "Tonight's Card",
      text: "A card turned over at dusk, the same one for everyone keeping this Vigil.",
      build(s) {
        const t = planetToday(s);
        return readFace(s, this, t ? `Tonight's Card · ${SIGNS[s.arc.sign].name}` : this.who);
      },
      left: { label: "Accept it", fx: {} },
      right: { label: "Turn it over", fx: {} },
    },
    {
      id: "r_omen", forcedOnly: true, fixed: true, dusk: true, tier: 0, art: "star", who: "The Omen",
      text: "Three cards laid face down over the three movements. The first turns over now.",
      build(s) {
        return readFace(s, this, `The Omen · over the Star · ${SIGNS[s.arc.sign].name}`);
      },
      left: { label: "Accept the Omen", fx: {} },
      right: { label: "Turn it over", fx: {} },
    },
    {
      id: "r_trial", forcedOnly: true, fixed: true, dusk: true, tier: 0, art: "star", who: "The Trial",
      text: "The second card, over Death.",
      build(s) {
        const card = readFace(s, this, `The Trial · over Death · ${SIGNS[s.arc.sign].name}`);
        const c = reading(s);
        // Never the relic in the occult expansion's vessel (occult.js), which can't be laid down.
        const v = s.asc && s.asc.occ && s.asc.occ.vessel;
        const r = s.asc && s.asc.relics.find((k) => !(v && v.k === k));
        if (!c || !r) return card;
        const next = (s.arc.sign + 1) % 12;
        const now = fall(c.id, c.fell, next);
        return {
          ...card,
          right: {
            label: `Lay down the ${relicName(r).split(" ").pop()}`,
            fx: { arc: "sky" },
            text: `The sky turns to ${SIGNS[next].name}, and the cards still down fall again under it. ${cardTitle(now)}: ${cardLine(now)}`,
          },
        };
      },
      left: { label: "Accept the Trial", fx: {} },
      right: { label: "Turn it over", fx: {} },
    },
    {
      id: "r_verdict", forcedOnly: true, fixed: true, dusk: true, tier: 0, art: "star", who: "The Verdict",
      text: "The last card, over Temperance.",
      build(s) {
        const card = readFace(s, this, `The Verdict · over Temperance · ${SIGNS[s.arc.sign].name}`);
        if (!reading(s)) return card;
        return {
          ...card,
          left: { ...card.left, label: "Let it stand" },
          right: {
            label: "The Contradiction Seat",
            roll: { stat: "wits", seat: true },
            hit: ro("She says it means nothing, and she's right. Struck from the reading: it has no say.", { arc: "strike" }),
            mid: ro("One assumption was wrong. It reads the other way.", { arc: "turn" }),
            miss: ro("She says you wanted a sign too badly, and she's right. It stands. You're a little smaller, which helps.", { arc: "accept", strain: 1, apo: -1 }),
          },
        };
      },
      left: { label: "Let it stand", fx: {} },
      right: { label: "The Contradiction Seat", fx: {} },
    },
  ];
}

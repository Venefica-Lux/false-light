// The Depth Pass's strategic preparation. Data and pure readers, like ritual.js; the engine applies the effects
// (engine.js prepFx) through the same fx path as every card, so the preview is the result.
//
// Two dusk cards, both outside the day, neither a new meter or deck:
//   The Hour (d_hour): a night spent preparing (not resting) at a chapel buys one preparation against the adversary the
//   road leads to: Strike (it removes one intent from that fight) or Read (the fight shows the intent after next).
//   Both cost something. Resting forecloses it: healing and preparing compete for the same night.
//   The Spoils (d_spoils): a won fight's reward is a choice among consequences, not only a relic.
// Plus the dossier on the route cards and the Codex's Preparation section (what the player learned, never what the
// character has).
import { ROADS, INTENTS, RELICS, ENCOUNTERS } from "./ascension.js";
import { ritSafe } from "./ritual.js";
import { isStone, inVessel } from "./occult.js";

// Each adversary: what it punishes and what answers it (the dossier), the Strike (an intent, a price) and the Read.
export const PREPS = {
  hierarch: {
    name: "The Hierarch", punishes: "leaning on a crowd that is told to hold you", answer: "take the roll yourself",
    strike: { label: "Take the roll yourself", tag: "the Levy struck", intent: "conscript", fx: { mark: 1 }, say: "You answer to your own name at the muster. Nobody is conscripted in your place, and everybody saw who stood." },
    read: { label: "Study the muster", tag: "the intent after next, shown", fx: { strain: 1 }, say: "You count the ranks twice. By morning you know the order they come in." },
  },
  sentinel: {
    name: "The Sentinel", punishes: "doing what the paper allows and nothing it doesn't", answer: "find who holds the stamp",
    strike: { label: "Find who holds the stamp", tag: "the Seal struck", intent: "seal", fx: { favor: -1 }, say: "The right clerk is a small bribe and a long walk. The gate will never have a seal for you." },
    read: { label: "Walk the gate's route", tag: "the intent after next, shown", fx: { strain: 1 }, say: "You walk its route in the dark, and learn where it turns." },
  },
  shepherd: {
    name: "The False Shepherd", punishes: "taking the help that closes behind you", answer: "refuse the first kindness",
    strike: { label: "Refuse the first kindness", tag: "the offer to handle it, struck", intent: "handle", fx: { strain: 1 }, say: "Nothing is handled for you. It is harder, and it will not be remembered as a favor." },
    read: { label: "Ask who he helped before", tag: "the intent after next, shown", fx: { strain: 1 }, say: "The ones he helped before don't want to talk. How they don't, tells you the order of it." },
  },
  ledger: {
    name: "The Ledger", punishes: "being worth keeping", answer: "give the good boots away",
    strike: { label: "Give the good boots away", tag: "the New Boots struck", intent: "boots", fx: { favor: -2 }, say: "Somebody else is wearing the ledger's best offer. You walk in as poor as you are." },
    read: { label: "Read the almshouse ledger", tag: "the intent after next, shown", fx: { strain: 1 }, say: "The page is already dated for the day you walk in. You read down it." },
  },
  grammar: {
    name: "The Grammar", punishes: "every Chain you gave in to, said back", answer: "say no to the heaviest one first",
    strike: { label: "Name your heaviest Chain aloud", tag: "its Chain struck, this fight", intent: null, fx: { mark: 1, strain: 1 }, say: "You say it before it can. It has less to say after." },
    read: { label: "Rehearse the Grammar", tag: "the intent after next, shown", fx: { strain: 1 }, say: "You say the eight aloud, in the order you think it will, until it holds." },
  },
};

// ---------- readers ----------
export const prepOf = (s) => (s && s.asc && s.asc.syn && s.asc.syn.prep) || null;
// The adversary the road leads to: the Grammar in Act III; in Act II, the chosen road's keeper.
export function nextAdv(s) {
  const a = s && s.asc;
  if (!a) return null;
  if (a.act === 3) return "grammar";
  if (a.act === 2 && a.road && ROADS[a.road]) return ROADS[a.road].enc;
  return null;
}
// The Chain the Grammar would say first: the heaviest one given in to and not yet struck (ties to the run's own order).
export function heaviestChain(s) {
  const a = s.asc;
  return Object.keys(a.chains || {}).filter((c) => a.chains[c] > 0 && !(a.struck || []).includes(c)).sort((x, y) => a.chains[y] - a.chains[x])[0] || null;
}
const encIntents = (id) => [...new Set((ENCOUNTERS[id].phases || []).flatMap((ph) => ph.intents || []))];
// What a Strike takes out of the fight: the adversary's named intent, or (the Grammar) every intent of the heaviest Chain.
export function strikeOf(s, adv) {
  if (adv !== "grammar") return [PREPS[adv].strike.intent];
  const heavy = heaviestChain(s);
  return heavy ? encIntents("grammar").filter((k) => INTENTS[k] && INTENTS[k].chain === heavy) : [];
}
// A price the run can pay: under the workbench's ceilings, and never the last Favor.
const payable = (s, fx) => ritSafe(s, fx) && (fx.favor === undefined || s.favor + fx.favor >= 1);
// -d3 (Reigns-core correction 2): the Ledger's New Boots come only at Favor 4+, so a Strike that leaves the run under
// that can strike nothing; it isn't dealt. (The Sentinel's seal comes in its Seal phase: a real hedge, named on the tag.)
const BOOTS_FAVOR = 4;
const strikeCanMatter = (s, adv, fx) => !(s.asc.syn.v >= 3 && adv === "ledger") || s.favor + (landed(s, fx).favor || 0) >= BOOTS_FAVOR;
// The Hour on offer now, or null: a Prepare night at this chapel (not a Rest), not yet spent, outside a fight, with at
// least one side the run can pay. Sides in order: Strike, Read.
export function hourOffer(s) {
  const p = prepOf(s);
  const a = s && s.asc;
  if (!p || !a.occ || a.enc) return null;
  const ch = a.occ.chapel;
  if ((ch !== 1 && ch !== 2) || a.occ.prepared !== ch || p.hours[ch]) return null;
  const adv = nextAdv(s);
  if (!adv || !PREPS[adv] || (ch === 2) !== (adv === "grammar")) return null;
  const x = PREPS[adv];
  const sides = [];
  const strike = strikeOf(s, adv);
  if (strike.length && payable(s, x.strike.fx) && strikeCanMatter(s, adv, x.strike.fx)) sides.push({ kind: "strike", ...x.strike, strike });
  if (payable(s, x.read.fx)) sides.push({ kind: "read", ...x.read, strike: [] });
  return sides.length ? { adv, chapel: ch, sides } : null;
}

// The Spoils on offer now, or null: a won fight's reward, twice a run, as a choice of two. The relic (on the chapel's
// shelf; the chapel's Prepare still takes it), a cut (the heaviest Chain, gone from the Grammar; Mark +1) or a refining
// (a carried relic readied with one use more; Strain +1). Fewer than two sides the run can take: skipped.
export const SPOILS_MAX = 2;
export function refineOf(s) {
  const a = s.asc;
  const p = prepOf(s);
  let best = null;
  for (const r of a.relics) {
    if (!RELICS[r] || isStone(s, r) || inVessel(s, r) || (p && p.plus[r])) continue;
    if (!best || RELICS[r].uses < RELICS[best].uses) best = r;
  }
  return best;
}
const SPOILS_PRICE = { cut: { mark: 1 }, refine: { strain: 1 } };
export function spoilsOffer(s) {
  const p = prepOf(s);
  const a = s && s.asc;
  if (!p || !a.spoils || a.enc || p.spoils >= SPOILS_MAX) return null;
  const heavy = heaviestChain(s);
  const cut = heavy && (a.struck || []).length < 6 && payable(s, SPOILS_PRICE.cut) ? { kind: "cut", chain: heavy, fx: SPOILS_PRICE.cut } : null;
  const k = refineOf(s);
  const refine = k && payable(s, SPOILS_PRICE.refine) ? { kind: "refine", relic: k, fx: SPOILS_PRICE.refine } : null;
  const relic = a.offer.length ? { kind: "relic", relic: a.offer[0], fx: {} } : null;
  // -d2: the first reward makes a one-pip Chain visible; the last chapel still offers its chance to Refine.
  // -d3 (Reigns-core correction 1): a payable Cut takes the second side at any weight, in any act.
  const preferCut = cut && (a.chains[heavy] >= 2 || a.syn.v >= 3 || (a.syn.v === 2 && a.act === 1));
  let sides;
  if (relic) sides = [relic, (preferCut ? cut : null) || refine || cut].filter(Boolean);
  else sides = [cut, refine].filter(Boolean);
  return sides.length >= 2 ? { sides } : null;
}

// The dossier on a road card: one line per keeper that side leads to (a road chosen, or the crossroads it opens on).
// Only on a run with preparation; it says what the player can know, and changes nothing a side does.
const LEADS = { a_cross: ["tithe", "chapter"], a_order: ["procession", "aperture"] };
const dossier = (k) => {
  const x = PREPS[ROADS[k].enc];
  return `${x.name} punishes ${x.punishes}; ${x.answer}.`;
};
// brief: the line under a choice on a narrow phone, the keeper and what answers it; the full dossier (left, right) is
// the choice's spoken label and the Codex's.
const briefOf = (k) => `${PREPS[ROADS[k].enc].name.replace(/^The /, "")}: ${PREPS[ROADS[k].enc].answer}.`;
export function routeIntel(s, c) {
  if (!prepOf(s) || !c || !["a_routes", "a_order", "a_cross"].includes(c.id)) return null;
  const roadsOf = (side) => {
    const fx = (c[side] && c[side].fx) || {};
    return fx.choose && ROADS[fx.choose] ? [fx.choose] : LEADS[fx.then] || [];
  };
  const left = roadsOf("left").map(dossier).join(" ");
  const right = roadsOf("right").map(dossier).join(" ");
  const brief = { left: roadsOf("left").map(briefOf).join(" "), right: roadsOf("right").map(briefOf).join(" ") };
  return left || right ? { left, right, brief } : null;
}

// ---------- the cards ----------
// The engine lends one reader (engine.js sets it): what a price lands on this board, after every Mask, sphere and card
// that shifts it, so the words on the card are the result. Without it (a bare import), the price as written.
export const prepHost = { land: null };
const landed = (s, fx) => (prepHost.land ? prepHost.land(s, fx) : fx);
const PRICE_WORD = { mark: "Mark", strain: "Strain", favor: "Favor", longing: "Longing", hollow: "Hollow", cage: "Cage", apo: "the Pull" };
export const prepPrice = (fx) => Object.entries(fx).filter(([k, v]) => PRICE_WORD[k] && typeof v === "number" && v).map(([k, v]) => `${PRICE_WORD[k]} ${v > 0 ? "+" : "−"}${Math.abs(v)}`).join(" · ");
const conditionalStrike = {
  ledger: "No New Boots at Favor 4+",
  sentinel: "No seals from the Seal phase",
};
const strikeTag = (s, adv, sd) => {
  if (sd.kind !== "strike") return sd.tag;
  if (adv === "grammar") return `${sd.tag}: ${sd.strike.map((k) => INTENTS[k].name || k).join(", ")}`;
  return s.asc.syn.v >= 2 ? conditionalStrike[adv] || sd.tag : sd.tag;
};
const hourSide = (s, o, sd) => ({
  label: sd.label,
  tag: [strikeTag(s, o.adv, sd), prepPrice(landed(s, sd.fx))].filter(Boolean).join(" · "),
  fx: { ...sd.fx, prep: { hour: o.chapel, ready: { enc: o.adv, kind: sd.kind, strike: [...sd.strike] } } },
  text: sd.say,
});

const relicName = (k) => RELICS[k].name.replace(/^The /, "the ");
const spoilsSide = (s, x) => {
  const fx = { ...x.fx, prep: { spoils: x.kind, ...(x.relic ? { relic: x.relic } : {}), ...(x.chain ? { chain: x.chain } : {}) } };
  if (x.kind === "relic") return { label: `Leave it for ${relicName(x.relic)}`, tag: "the chapel's Prepare takes it", fx, text: `You leave everything else where it fell. ${RELICS[x.relic].name.replace(/^the /, "The ")} will be on the chapel's shelf.` };
  if (x.kind === "cut") return { label: `Cut ${INTENTS[x.chain] ? INTENTS[x.chain].name : x.chain}`, tag: ["a Chain struck: the Grammar can't say it", prepPrice(landed(s, x.fx)), "no relic"].join(" · "), fx, text: "What it left is a key to one of your Chains. You use it, and they see you do it." };
  return { label: `Refine ${relicName(x.relic)}`, tag: [s.asc.syn.v >= 3 ? "One use more now and at each Prepare" : s.asc.syn.v === 2 ? "Extra use on chapel Prepare" : "one use more each time it is readied", prepPrice(landed(s, x.fx)), "no relic"].join(" · "), fx, text: `You spend the night on ${relicName(x.relic)}, and it will hold one more working.` };
};

export const PREP_CARDS = [
  {
    id: "d_hour", forcedOnly: true, fixed: true, dusk: true, tier: 0, art: "candle", who: "The Hour Before", tierText: "at dusk",
    text: "You did not sleep. You prepared.",
    build(s) {
      const o = hourOffer(s);
      if (!o) return this;
      const x = PREPS[o.adv];
      const [l, r] = o.sides;
      return {
        ...this,
        who: `The Hour Before · ${x.name}`,
        text: `You did not sleep. You prepared. ${x.name} punishes ${x.punishes}.`,
        left: hourSide(s, o, l),
        right: r ? hourSide(s, o, r) : { label: "Go as you are", fx: { prep: { hour: o.chapel } }, text: "You put the night down unspent. Whatever is waiting, it meets you as you are." },
      };
    },
    left: { label: "Strike", fx: {}, text: "" },
    right: { label: "Read", fx: {}, text: "" },
  },
  {
    id: "d_spoils", forcedOnly: true, fixed: true, dusk: true, tier: 0, art: "candle", who: "What the Fight Left", tierText: "at dusk",
    text: "It is over, and the room is full of what it left behind.",
    build(s) {
      const o = spoilsOffer(s);
      if (!o) return this;
      const [l, r] = o.sides.map((x) => spoilsSide(s, x));
      return { ...this, left: l, right: r };
    },
    left: { label: "Take it", fx: {}, text: "" },
    right: { label: "Take it", fx: {}, text: "" },
  },
];


// ---------- the Codex: what the player learned, never what the character has ----------
// Per adversary: met, prepared for, prepared for and won, and which preparation was tried. Booked at a run's end.
export const PREP_STATES = ["unmet", "met", "prepared", "won"];
const prepCount = (x) => (Number.isInteger(x) && x > 0 ? Math.min(x, 999) : 0);
const PREP_KEYS = ["met", "prepared", "won", "strike", "read"];
export function prepRecord(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const adv of Object.keys(PREPS)) {
    const e = raw[adv];
    if (!e || typeof e !== "object" || Array.isArray(e)) continue;
    out[adv] = Object.fromEntries(PREP_KEYS.map((k) => [k, prepCount(e[k])]));
  }
  return out;
}
// A finished run, booked onto the record (a new record; the old one isn't touched).
export function prepBook(rec, prep) {
  const out = prepRecord(rec);
  if (!prep || !prep.log || typeof prep.log !== "object") return out;
  for (const [adv, x] of Object.entries(prep.log)) {
    if (!PREPS[adv] || !x || typeof x !== "object") continue;
    const e = (out[adv] ||= Object.fromEntries(PREP_KEYS.map((k) => [k, 0])));
    e.met++;
    if (x.did === "strike" || x.did === "read") {
      e.prepared++;
      e[x.did]++;
      if (x.won === true) e.won++;
    }
  }
  return out;
}
export function prepState(e) {
  if (!e || !prepCount(e.met)) return "unmet";
  if (prepCount(e.won)) return "won";
  return prepCount(e.prepared) ? "prepared" : "met";
}
// What the Codex shows of a keeper at its state: the dossier once met; the preparations once one was tried.
export function prepEntry(adv, e) {
  const x = PREPS[adv];
  const state = prepState(e);
  const rank = PREP_STATES.indexOf(state);
  const lines = [];
  if (rank >= 1) lines.push(`Punishes ${x.punishes}. What answers it: ${x.answer}.`);
  if (rank >= 2) {
    lines.push(`The Strike: ${x.strike.label} (${conditionalStrike[adv] || x.strike.tag}).${prepCount(e.strike) ? ` Tried ×${prepCount(e.strike)}.` : ""}`);
    lines.push(`The Read: ${x.read.label} (${x.read.tag}).${prepCount(e.read) ? ` Tried ×${prepCount(e.read)}.` : ""}`);
  }
  if (rank >= 3) lines.push(`Prepared for and beaten ×${prepCount(e.won)}.`);
  return { state, name: rank >= 1 ? x.name : "an unmet keeper", lines };
}

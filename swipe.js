// FALSE LIGHT — swipe release math. Pure functions, no DOM: app.js feeds them pointer samples.
//
// Velocity is read from the last ~80 ms of samples, not averaged over the whole drag: a card dragged slowly and
// then flicked goes; one thrown out fast and then held still does not. Distance and speed thresholds decide the
// commit, and an axis lock keeps a vertical drag from steering the card.
//
// Informed by @use-gesture's DragEngine (https://github.com/pmndrs/use-gesture, MIT, Copyright (c) 2018-present
// Paul Henschel; license read at tag @use-gesture/vanilla@10.3.1): speed as displacement over elapsed time with no
// speed on a pause before release, a distance-plus-velocity swipe test, and the first-axis-past-a-threshold lock. The
// code here is written for this game and copies none of theirs. The thresholds are the game's own, unchanged from
// the earlier whole-drag average (95 px commits, 40 px commits at 0.6 px/ms), so the feel stays.
export const SWIPE = {
  slop: 8, // px of travel before the drag picks an axis
  window: 80, // ms of samples that make up the release velocity
  commit: 95, // px: past this the card goes whatever its speed
  flick: 40, // px: past this the card goes if it is still moving out fast enough
  speed: 0.6, // px/ms along the drag at release
};

// The axis a drag belongs to once it has travelled past the slop: "x" (a swipe), "y" (not ours), or null (not yet).
export function lockAxis(dx, dy, slop = SWIPE.slop) {
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (ax > ay && ax > slop) return "x";
  if (ay > ax && ay > slop) return "y";
  return null;
}

// Keep the samples a release can still use. Mutates and returns the list.
export function pushSample(samples, x, t, window = SWIPE.window) {
  samples.push({ x, t });
  while (samples.length > 2 && samples[1].t < t - window) samples.shift();
  return samples;
}

// Signed px/ms over the last `window` ms before `now`: from the oldest sample inside the window to the pointer's
// position at release. A pointer that rested before release has no sample in the window (moves stop reporting) and
// reads 0, so a pause is not a flick.
export function releaseVelocity(samples, x, now, window = SWIPE.window) {
  const from = samples.find((s) => s.t >= now - window);
  if (!from || now <= from.t) return 0;
  return (x - from.x) / (now - from.t);
}

// "left", "right" or null for a drag that has moved `dx` px and is moving at `vx` px/ms at release.
// A card moving back toward where it started never goes.
export function decide(dx, vx, t = SWIPE) {
  const d = Math.abs(dx);
  const outward = Math.sign(vx) === Math.sign(dx) ? Math.abs(vx) : 0;
  const go = d > t.commit || (d > t.flick && outward > t.speed);
  return go ? (dx < 0 ? "left" : "right") : null;
}

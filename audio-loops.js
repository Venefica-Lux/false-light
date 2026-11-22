// Wall-time loop transitions. The three long-road tracks use equal-power gains;
// their compositions and MP3 cuts stay intact. Audio elements keep streaming.
export const POLISHED_LOOPS = new Set(["litany", "architect", "unmaking"]);
export function loopFadeCurve(direction, samples = 65) {
  return Float32Array.from({ length: samples }, (_, i) => {
    const a = (i / (samples - 1)) * Math.PI / 2;
    return Math.max(0.0001, direction === "in" ? Math.sin(a) : Math.cos(a));
  });
}
export function loopDue(time, duration, rate, overlap = 4) {
  return Number.isFinite(duration) && duration > overlap * rate && rate > 0 && (duration - time) / rate <= overlap;
}

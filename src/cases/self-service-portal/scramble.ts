/** Glyph pool and the frame builder for the decrypt reveal, taken from
    adehad/cv web/_static/contact.js. Kept free of React and of the clock so the
    frames can be asserted. */

const GLYPHS = "ABCDEF0123456789@.+#%&$xyz/\\";

/** Structural characters never scramble: a name keeps its spaces and an address
    keeps its @ and its dots, so the reveal reads as one value settling rather
    than as a row of noise. */
const KEEP = new Set([" ", "@", "+", ".", "-"]);

export function isStructural(char: string): boolean {
  return KEEP.has(char);
}

/** One frame of the reveal. `locked` runs 0 to 1 and is the share of the target
    already settled, left to right; everything past it is a random glyph. The
    frame always matches the target's length, so the text never reflows. */
export function scrambleFrame(target: string, locked: number, random: () => number): string {
  const clamped = Math.min(Math.max(locked, 0), 1);
  const settled = Math.floor(clamped * target.length);
  let out = "";
  for (let i = 0; i < target.length; i++) {
    const char = target[i] ?? "";
    out +=
      i < settled || KEEP.has(char) ? char : (GLYPHS[Math.floor(random() * GLYPHS.length)] ?? char);
  }
  return out;
}

/** Accelerate then settle, so the lock-in front sweeps fastest mid-run. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Progress of the lock-in front at run progress `p`. Nothing locks during the
    first `hold` of the run, which buys a moment of pure scramble before the
    value starts to appear. */
export function lockProgress(p: number, hold: number): number {
  if (p <= hold) return 0;
  return easeInOutCubic((p - hold) / (1 - hold));
}

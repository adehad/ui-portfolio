/** The star field and the scramble frames are randomised from a seed string
    rather than from Math.random, so a rebuild lays the same stars in the same
    places and replays the same glyphs. Chromatic compares pixels, and anything
    that respawned per build would diff on every run. */
export function hashSeed(seed: string): number {
  let hash = 0x81_1c_9d_c5;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(hash ^ seed.charCodeAt(i), 0x01_00_01_93);
  }
  return hash >>> 0;
}

/** mulberry32: small, fast, and good enough to scatter stars. */
export function makeRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d_2b_79_f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Geometry the border chase needs from its host. The angle formula in
    SparklePen.scss walks a rectangle and reads the angle back with atan2, so it
    needs the host's aspect ratio: that ratio is what decides how much of the
    cycle belongs to the long edges rather than the corners.

    `kx` and `ky` set how much of the cycle the walk holds against each pair of
    edges. Only their ratio does any work while both stay under 1, because the
    clamps never engage there, and atan2 is scale invariant. So the pair ramps
    from 0.1 and 0.1, a ratio of 1 and the plain linear sweep, to 0.6 and 1.6.

    Walking the border numerically on a 3.3:1 rectangle, that takes the spot's
    speed spread from 11.8x to 8.0x and the worst frame-to-frame change from
    168% to 140% of mean. A ratio nearer 0.46, such as 1.1 and 2.4, scores 2.5x
    and 26% on the same measurement, so there is room here if the chase ever
    wants it.

    A host taller than wide gets a ramp of 0 and the plain sweep. The mirrored
    treatment would need kx and ky swapped, and nothing here wraps one. */
export type ChaseGeometry = { aspect: number; kx: number; ky: number };

/** Aspect at which the ramp reaches the tuned pair. Past 3.3:1 the same values
    stay put rather than extrapolate into a shape nobody measured. */
const RAMP_TOP = 3.3;

/** Both constants at the square end, where the walk is a plain circle. */
const RAMP_BASE = 0.1;

const KX_TOP = 0.6;
const KY_TOP = 1.6;

export function chaseGeometry(width: number, height: number): ChaseGeometry {
  if (!(width > 0) || !(height > 0)) {
    return { aspect: 1, kx: RAMP_BASE, ky: RAMP_BASE };
  }
  const aspect = width / height;
  const ramp = Math.min(Math.max((aspect - 1) / (RAMP_TOP - 1), 0), 1);
  return {
    aspect,
    kx: RAMP_BASE + (KX_TOP - RAMP_BASE) * ramp,
    ky: RAMP_BASE + (KY_TOP - RAMP_BASE) * ramp,
  };
}

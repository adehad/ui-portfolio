/** Floor on the pose distance, so a degenerate pose still yields near < far. */
const MIN_DISTANCE = 1e-4;

/**
 * Clip planes for a camera pose, scaled to its own distance from its target.
 * The Canvas default near plane (0.1) sits inside the authored poses for this
 * model, which is under 0.2 units across, and would slice the front off it, so
 * any consumer applying a pose must apply these too and call
 * updateProjectionMatrix(). The margins are wide so the user can orbit and
 * zoom well past a pose before reaching a plane, at any model scale.
 */
export function clipPlanes(distance: number): { near: number; far: number } {
  const scaled = Math.max(distance, MIN_DISTANCE);
  return { near: scaled / 100, far: scaled * 100 };
}

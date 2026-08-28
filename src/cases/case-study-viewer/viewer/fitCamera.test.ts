import { describe, expect, it } from "vitest";
import { clipPlanes } from "@/cases/case-study-viewer/viewer/fitCamera";

/** The closest authored pose: the Detail view, ~0.133 units from its target. */
const DETAIL_DISTANCE = 0.133;
/** How close the eye GLB's bounding box comes to the Detail view's camera. */
const DETAIL_NEAREST_SURFACE = 0.091;

describe("clipPlanes", () => {
  it("keeps the near plane inside the nearest surface at the closest authored pose", () => {
    const { near } = clipPlanes(DETAIL_DISTANCE);
    expect(near).toBeLessThan(DETAIL_NEAREST_SURFACE);
  });

  it("brackets the pose distance", () => {
    const { near, far } = clipPlanes(DETAIL_DISTANCE);
    expect(near).toBeLessThan(DETAIL_DISTANCE);
    expect(far).toBeGreaterThan(DETAIL_DISTANCE);
  });

  it("keeps near below far for a degenerate pose", () => {
    const { near, far } = clipPlanes(0);
    expect(near).toBeGreaterThan(0);
    expect(far).toBeGreaterThan(near);
  });
});

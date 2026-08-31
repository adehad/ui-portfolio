import { expect, test } from "vitest";
import { chaseGeometry } from "@/cases/self-service-portal/chaseGeometry";

test("a square host gets equal constants, which is the plain linear sweep", () => {
  expect(chaseGeometry(200, 200)).toEqual({ aspect: 1, kx: 0.1, ky: 0.1 });
});

test("a host taller than wide also gets the plain sweep", () => {
  const { kx, ky } = chaseGeometry(100, 400);
  expect([kx, ky]).toEqual([0.1, 0.1]);
});

test("the ramp reaches the tuned pair at 3.3:1 and holds past it", () => {
  const at = chaseGeometry(330, 100);
  expect(at.kx).toBeCloseTo(0.6, 5);
  expect(at.ky).toBeCloseTo(1.6, 5);
  expect(chaseGeometry(1000, 100)).toMatchObject({ kx: at.kx, ky: at.ky });
});

test("the ramp is monotonic between square and 3.3:1", () => {
  const widths = [110, 150, 200, 260, 320];
  const kys = widths.map((w) => chaseGeometry(w, 100).ky);
  expect(kys).toEqual([...kys].toSorted((a, b) => a - b));
  expect(kys[0]).toBeGreaterThan(0.1);
});

test("a host with no size yet does not divide by zero", () => {
  expect(chaseGeometry(0, 0)).toEqual({ aspect: 1, kx: 0.1, ky: 0.1 });
});

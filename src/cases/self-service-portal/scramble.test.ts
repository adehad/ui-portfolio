import { expect, test } from "vitest";
import { lockProgress, scrambleFrame } from "@/cases/self-service-portal/scramble";
import { hashSeed, makeRandom } from "@/cases/self-service-portal/seededRandom";

const seeded = () => makeRandom(hashSeed("scramble-test"));

test("a frame keeps the target's length", () => {
  for (const locked of [0, 0.4, 1]) {
    expect(scrambleFrame("Heavenly Halt", locked, seeded())).toHaveLength(13);
  }
});

test("a fully locked frame is the target", () => {
  expect(scrambleFrame("ada.lovelace@example.com", 1, seeded())).toBe("ada.lovelace@example.com");
});

test("an unlocked frame scrambles letters and leaves structure alone", () => {
  const frame = scrambleFrame("Heavenly Halt", 0, seeded());
  expect(frame).not.toBe("Heavenly Halt");
  expect(frame[8]).toBe(" ");
});

test("the lock-in front sweeps left to right", () => {
  const early = scrambleFrame("Heavenly Halt", 0.25, seeded());
  const late = scrambleFrame("Heavenly Halt", 0.75, seeded());
  expect(early.startsWith("Hea")).toBe(true);
  expect(late.startsWith("Heavenly ")).toBe(true);
});

test("the same seed replays the same frame", () => {
  expect(scrambleFrame("Heavenly Halt", 0.3, seeded())).toBe(
    scrambleFrame("Heavenly Halt", 0.3, seeded()),
  );
});

test("nothing locks during the opening hold", () => {
  expect(lockProgress(0, 0.3)).toBe(0);
  expect(lockProgress(0.3, 0.3)).toBe(0);
  expect(lockProgress(0.65, 0.3)).toBeGreaterThan(0);
  expect(lockProgress(1, 0.3)).toBe(1);
});

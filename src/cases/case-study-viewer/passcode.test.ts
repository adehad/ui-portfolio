import { expect, test } from "vitest";
import { checkPasscode, DEMO_PASSCODE, sha256Hex } from "@/cases/case-study-viewer/passcode";

test("the demo passcode matches the baked-in hash", async () => {
  await expect(checkPasscode(DEMO_PASSCODE)).resolves.toBe(true);
});

test("anything else is rejected", async () => {
  await expect(checkPasscode("0000")).resolves.toBe(false);
  await expect(checkPasscode("")).resolves.toBe(false);
});

test("sha256Hex returns lowercase hex", async () => {
  await expect(sha256Hex("1234")).resolves.toBe(
    "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",
  );
});

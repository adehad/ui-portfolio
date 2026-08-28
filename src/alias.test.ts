import { expect, test } from "vitest";

test("the @/ alias resolves to src", async () => {
  await expect(import("@/styles/globals.css")).resolves.toBeDefined();
  await expect(import("@/styles/not-a-file.css")).rejects.toThrow(/not-a-file\.css/);
});

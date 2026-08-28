import { expect, test } from "vitest";
import { currentUser, userOptions, users } from "@/cases/self-service-portal/users";

test("the roster is the same on every build", () => {
  expect(users).toHaveLength(24);
  expect(users.slice(0, 3).map((u) => u.displayName)).toEqual([
    "Edward Bechtelar",
    "Cyril Gorczany",
    "Earl Torphy",
  ]);
  expect(currentUser.initials).toBe("EB");
});

test("initials are unique, so react-select can key options by value", () => {
  expect(new Set(userOptions.map((o) => o.value)).size).toBe(userOptions.length);
});

test("no address can leave the machine", () => {
  for (const user of users) expect(user.email).toMatch(/@example\.invalid$/);
});

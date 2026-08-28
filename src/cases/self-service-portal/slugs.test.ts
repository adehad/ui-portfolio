import { expect, test } from "vitest";
import { GITLAB_SLUG_RE, toGitLabSlug, toJenkinsName } from "@/cases/self-service-portal/slugs";

test("a GitLab slug is lowercase with hyphens for spaces", () => {
  expect(toGitLabSlug("  Heavenly Halt ")).toBe("heavenly-halt");
  expect(toGitLabSlug("Osinski, Baumbach and Larson")).toBe("osinski-baumbach-and-larson");
});

test("a Jenkins folder name keeps its case", () => {
  expect(toJenkinsName(" Heavenly Halt ")).toBe("Heavenly-Halt");
});

test("the slug rule rejects what GitLab would", () => {
  expect(GITLAB_SLUG_RE.test(toGitLabSlug("Heavenly Halt"))).toBe(true);
  expect(GITLAB_SLUG_RE.test(toGitLabSlug("..."))).toBe(false);
  expect(GITLAB_SLUG_RE.test(toGitLabSlug("-edge-"))).toBe(false);
});

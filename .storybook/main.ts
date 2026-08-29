import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const CASES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "cases");

function knownCases(): string[] {
  return readdirSync(CASES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted();
}

/**
 * The stories a build carries. `SHOWCASE=<case directory>` narrows it to one
 * case, so a link handed to one client carries that client's work alone.
 *
 * The narrowing is by directory and not by story title: a story titled outside
 * its case's own group still ships with the case whose directory holds it.
 */
function storyGlobs(): string[] {
  const showcase = process.env.SHOWCASE?.trim();
  if (!showcase) return ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"];

  const known = knownCases();
  if (!known.includes(showcase)) {
    throw new Error(
      `SHOWCASE=${showcase} names no directory under src/cases. Known cases: ${known.join(", ") || "none"}.`,
    );
  }
  return [
    `../src/cases/${showcase}/**/*.mdx`,
    `../src/cases/${showcase}/**/*.stories.@(js|jsx|mjs|ts|tsx)`,
  ];
}

const config: StorybookConfig = {
  stories: storyGlobs(),
  addons: ["@storybook/addon-docs"],
  framework: { name: "@storybook/react-vite", options: {} },
};

export default config;

import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const CASES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "cases");
const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

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

/**
 * The static files a build serves. `SHOWCASE` narrows these alongside the
 * stories, remapped so the filtered build serves them at the URLs the full
 * build serves them at.
 *
 * A case need not own a subtree of `public/`. One that owns none serves nothing
 * rather than falling back to the whole of `public/`.
 */
function publicDirs(): NonNullable<StorybookConfig["staticDirs"]> {
  const showcase = process.env.SHOWCASE?.trim();
  if (!showcase) return ["../public"];
  if (!existsSync(join(PUBLIC_DIR, showcase))) return [];
  return [{ from: `../public/${showcase}`, to: `/${showcase}` }];
}

const config: StorybookConfig = {
  stories: storyGlobs(),
  addons: ["@storybook/addon-docs"],
  // GLBs and model previews are fetched at runtime by three's loaders, so they
  // are served as-is rather than going through Vite's asset pipeline.
  staticDirs: publicDirs(),
  // Vite copies its own publicDir into the build on top of whatever staticDirs
  // names, which would put the whole of public/ back into a narrowed build.
  viteFinal: (vite) => ({ ...vite, publicDir: false }),
  framework: { name: "@storybook/react-vite", options: {} },
};

export default config;

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CASES_DIR = join(ROOT, "src", "cases");

function knownCases(): string[] {
  return readdirSync(CASES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted();
}

/**
 * Spellings of a case directory name that a build could carry. Story IDs keep
 * the hyphens, story titles and prose space the words, and identifiers run them
 * together, so one literal needle would miss most of them.
 */
function needles(name: string): string[] {
  const words = name.split("-");
  return [...new Set([name, words.join(" "), words.join("_"), words.join("")])];
}

function filesUnder(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile()) found.push(join(entry.parentPath, entry.name));
  }
  return found;
}

type Leak = { file: string; where: "path" | "content"; names: string[] };

function scan(buildDir: string, others: string[]): { files: number; leaks: Leak[] } {
  const probes = others.map((name) => ({ name, needles: needles(name) }));
  const files = filesUnder(buildDir);
  const leaks: Leak[] = [];

  for (const file of files) {
    const asUrl = relative(buildDir, file).replaceAll("\\", "/").toLowerCase();
    const inPath = probes.filter((p) => p.needles.some((n) => asUrl.includes(n)));
    if (inPath.length > 0) {
      leaks.push({ file: asUrl, where: "path", names: inPath.map((p) => p.name) });
      continue;
    }
    // latin1 rather than utf8: the needles are ASCII, and decoding a GLB or an
    // mp4 as utf8 would replace the bytes a needle could be hiding in.
    const bytes = readFileSync(file).toString("latin1").toLowerCase();
    const inBody = probes.filter((p) => p.needles.some((n) => bytes.includes(n)));
    if (inBody.length > 0) {
      leaks.push({ file: asUrl, where: "content", names: inBody.map((p) => p.name) });
    }
  }

  return { files: files.length, leaks };
}

function build(showcase: string, out: string): void {
  const result = spawnSync("bun", ["x", "storybook", "build", "-o", out], {
    cwd: ROOT,
    env: { ...process.env, SHOWCASE: showcase },
    stdio: ["ignore", "ignore", "inherit"],
  });
  if (result.status !== 0) {
    throw new Error(`storybook build failed for SHOWCASE=${showcase}`);
  }
}

function parseArgs(argv: string[]): { names: string[]; dir: string | null } {
  const names: string[] = [];
  let dir: string | null = null;

  const rest = [...argv];
  for (let arg = rest.shift(); arg !== undefined; arg = rest.shift()) {
    if (arg === "--dir") {
      dir = rest.shift() ?? null;
      if (dir === null) throw new Error("--dir needs a path");
    } else if (arg.startsWith("-")) {
      throw new Error(`unknown option ${arg}`);
    } else {
      names.push(arg);
    }
  }

  return { names, dir };
}

const { names, dir } = parseArgs(process.argv.slice(2));
const cases = knownCases();

for (const name of names) {
  if (!cases.includes(name)) {
    throw new Error(
      `${name} names no directory under src/cases. Known cases: ${cases.join(", ") || "none"}.`,
    );
  }
}
if (dir !== null && names.length !== 1) {
  throw new Error("--dir checks one build, so name the one case it was built with");
}
if (dir !== null && !existsSync(dir)) {
  throw new Error(`${dir} does not exist`);
}

const targets = names.length > 0 ? names : cases;
if (targets.length === 0) {
  console.log("No cases under src/cases, so nothing to check.");
  process.exit(0);
}
if (cases.length < 2) {
  console.log(`Only one case (${cases[0]}), so no other case can leak into a build.`);
}

let failed = false;

for (const showcase of targets) {
  const others = cases.filter((name) => name !== showcase);
  const scratch = dir === null ? mkdtempSync(join(tmpdir(), "showcase-")) : null;
  const buildDir = dir ?? join(scratch as string, "build");

  try {
    if (scratch !== null) build(showcase, buildDir);
    const { files, leaks } = scan(buildDir, others);

    console.log(`SHOWCASE=${showcase}  ${files} files in ${buildDir}`);
    if (leaks.length === 0) {
      console.log(`  clean: no file names ${others.join(" or ") || "another case"}`);
    } else {
      failed = true;
      for (const leak of leaks) {
        console.log(`  LEAK ${leak.file}  (${leak.where} names ${leak.names.join(", ")})`);
      }
    }
  } finally {
    if (scratch !== null) rmSync(scratch, { recursive: true, force: true });
  }
}

if (failed) {
  console.error("\nA filtered build carried another case. Do not send it.");
  process.exit(1);
}

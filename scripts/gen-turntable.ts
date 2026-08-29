/**
 * Renders the case study's model view as a turntable clip and encodes it.
 *
 * Deliberately manual, not a build step: it needs a headless browser and
 * ffmpeg, it takes minutes, and re-encoding on every build would make the
 * video view's Chromatic snapshot diff on every run.
 *
 *     bun run build-storybook
 *     bun run gen:turntable
 *
 * The browser is the locally installed Chrome. playwright-core ships no
 * browser of its own, so `bun install` stays light for everyone who never
 * runs this.
 */
import { spawn } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { theEye } from "../src/cases/case-study-viewer/viewer/content";
import type { CameraView, ModelMediaView, Vec3 } from "../src/cases/case-study-viewer/viewer/types";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STATIC_DIR = join(REPO, "storybook-static");
const STORY_ID = "01-case-study-viewer-case-study-page--default";
const OUT_VIDEO = join(REPO, "public/case-study-viewer/media/eye-turntable.mp4");
const OUT_POSTER = join(REPO, "public/case-study-viewer/previews/eye-turntable.jpg");
const OUT_CHAPTERS = join(REPO, "src/cases/case-study-viewer/viewer/video/turntableChapters.ts");

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;
/** Encoded width. The canvas is inset in the page, so frames arrive at the
    stage's own size and aspect; -2 keeps that aspect on an even height. */
const ENCODE_WIDTH = 960;
/** Seconds given to each authored camera view, in the order they are authored. */
const SECONDS_PER_VIEW = [8, 4];
/** Fraction of a view's segment spent easing in from the previous pose. */
const EASE_IN = 0.45;
/** Extra rotation applied across a segment after it has eased in. */
const DRIFT_RADIANS = (25 * Math.PI) / 180;
/** How far either side of the first authored view the opening sweep reaches.
    The eye is a cross section 0.077 units thick against 0.191 across, so it
    goes end-on and all but vanishes at a quarter turn. */
const SWEEP_RADIANS = (55 * Math.PI) / 180;
/** Camera lift at each end of that sweep. */
const LIFT_RADIANS = (20 * Math.PI) / 180;

type Pose = Pick<CameraView, "position" | "target">;

interface Orbit {
  azimuth: number;
  elevation: number;
  radius: number;
  target: Vec3;
}

function toOrbit(pose: Pose): Orbit {
  const dx = pose.position[0] - pose.target[0];
  const dy = pose.position[1] - pose.target[1];
  const dz = pose.position[2] - pose.target[2];
  const radius = Math.hypot(dx, dy, dz);
  return {
    azimuth: Math.atan2(dx, dz),
    elevation: Math.asin(dy / (radius || 1)),
    radius,
    target: pose.target,
  };
}

function positionOf(orbit: Orbit): Vec3 {
  const horizontal = orbit.radius * Math.cos(orbit.elevation);
  return [
    orbit.target[0] + horizontal * Math.sin(orbit.azimuth),
    orbit.target[1] + orbit.radius * Math.sin(orbit.elevation),
    orbit.target[2] + horizontal * Math.cos(orbit.azimuth),
  ];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** Smoothstep, so a segment eases out of the previous pose and into its own. */
function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

interface Frame {
  position: Vec3;
  target: Vec3;
}

interface Segment {
  view: CameraView;
  startFrame: number;
  frames: Frame[];
}

/**
 * A frame track that opens with a sweep either side of the first camera view,
 * then eases into each following view and drifts around it. Every authored
 * view owns a contiguous run of frames, which is where its chapter starts.
 */
function buildSegments(views: CameraView[]): Segment[] {
  const segments: Segment[] = [];
  let startFrame = 0;
  let previous: Orbit | null = null;

  for (const [index, view] of views.entries()) {
    const seconds = SECONDS_PER_VIEW[index] ?? SECONDS_PER_VIEW[SECONDS_PER_VIEW.length - 1]!;
    const count = Math.round(seconds * FPS);
    const orbit = toOrbit({ position: view.position, target: view.target });
    const frames: Frame[] = [];
    const settled = previous;

    for (let i = 0; i < count; i++) {
      if (!settled) {
        // One rock either side of the authored pose, rising at each end. It
        // begins and ends on that pose, so the last frame lands one step short
        // of the first and the run reads as continuous.
        const phase = 2 * Math.PI * (i / count);
        const azimuth = orbit.azimuth + SWEEP_RADIANS * Math.sin(phase);
        const elevation = orbit.elevation + LIFT_RADIANS * Math.sin(phase) ** 2;
        frames.push({
          position: positionOf({ ...orbit, azimuth, elevation }),
          target: orbit.target,
        });
        continue;
      }
      const t = count === 1 ? 1 : i / (count - 1);
      const blend = ease(Math.min(1, t / EASE_IN));
      const drift = DRIFT_RADIANS * Math.max(0, (t - EASE_IN) / (1 - EASE_IN));
      const here: Orbit = {
        azimuth: lerp(settled.azimuth, orbit.azimuth, blend) + drift,
        elevation: lerp(settled.elevation, orbit.elevation, blend),
        radius: lerp(settled.radius, orbit.radius, blend),
        target: lerpVec(settled.target, orbit.target, blend),
      };
      frames.push({ position: positionOf(here), target: here.target });
    }

    segments.push({ view, startFrame, frames });
    startFrame += count;
    previous = orbit;
  }

  return segments;
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise((ok, fail) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", fail);
    child.on("close", (code) => {
      if (code === 0) ok();
      else fail(new Error(`${command} exited ${code}\n${stderr.slice(-2000)}`));
    });
  });
}

function capture(command: string, args: string[]): Promise<string> {
  return new Promise((ok, fail) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "ignore"] });
    let stdout = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.on("error", fail);
    child.on("close", (code) => {
      if (code === 0) ok(stdout.trim());
      else fail(new Error(`${command} exited ${code}`));
    });
  });
}

async function requireTool(name: string): Promise<void> {
  try {
    await run(name, ["-version"]);
  } catch {
    throw new Error(`${name} is not on PATH. Install ffmpeg and try again.`);
  }
}

const MIME: Record<string, string | undefined> = {
  ".css": "text/css",
  ".glb": "model/gltf-binary",
  ".html": "text/html",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".mjs": "text/javascript",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

interface ByteRange {
  start: number;
  end: number;
}

/**
 * The byte range a request asks for. `undefined` means it asked for none this
 * server understands, which is served whole; `null` means it asked for one that
 * cannot be satisfied, which is a 416.
 */
function resolveRange(header: string | undefined, size: number): ByteRange | null | undefined {
  const match = header === undefined ? null : /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return undefined;
  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") return undefined;
  const start = rawStart === "" ? Math.max(0, size - Number(rawEnd)) : Number(rawStart);
  const end = rawStart === "" || rawEnd === "" ? size - 1 : Math.min(Number(rawEnd), size - 1);
  if (start > end || start >= size) return null;
  return { start, end };
}

/**
 * Static server for the built Storybook. Hand-rolled because the usual
 * one-line static servers drop the query string, and a story is addressed by
 * its `?id=`.
 *
 * It answers byte ranges. A server that ignores them leaves a `<video>` with an
 * empty `seekable`, so Vidstack reads `seekableEnd - seekableStart` as Infinity,
 * treats the clip as live and never builds the chapter track.
 */
async function serve(root: string): Promise<{ port: number; close: () => Promise<void> }> {
  const server = createServer((request, response) => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    const name = path.endsWith("/") ? `${path}index.html` : path;
    const file = join(root, name);
    if (!file.startsWith(root) || !existsSync(file)) {
      response.writeHead(404).end("not found");
      return;
    }
    const type = MIME[name.slice(name.lastIndexOf("."))] ?? "application/octet-stream";
    const size = statSync(file).size;
    const range = resolveRange(request.headers.range, size);
    if (range === null) {
      response.writeHead(416, { "content-range": `bytes */${size}` }).end();
      return;
    }
    if (range === undefined) {
      response.writeHead(200, {
        "accept-ranges": "bytes",
        "content-length": size,
        "content-type": type,
      });
      createReadStream(file).pipe(response);
      return;
    }
    response.writeHead(206, {
      "accept-ranges": "bytes",
      "content-length": range.end - range.start + 1,
      "content-range": `bytes ${range.start}-${range.end}/${size}`,
      "content-type": type,
    });
    createReadStream(file, { start: range.start, end: range.end }).pipe(response);
  });
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("the static server has no port");
  return {
    port: address.port,
    close: () => new Promise<void>((ok) => server.close(() => ok())),
  };
}

interface Captured {
  renderer?: {
    render: (scene: unknown, camera: unknown) => void;
    domElement: HTMLCanvasElement;
  };
  scene?: unknown;
  camera?: {
    position: { set: (x: number, y: number, z: number) => void };
    lookAt: (x: number, y: number, z: number) => void;
    near: number;
    far: number;
    updateProjectionMatrix: () => void;
  };
}

declare global {
  interface Window {
    turntableCapture: Captured;
  }
}

async function main() {
  await requireTool("ffmpeg");
  await requireTool("ffprobe");
  if (!existsSync(STATIC_DIR)) {
    throw new Error(`${STATIC_DIR} is missing. Run \`bun run build-storybook\` first.`);
  }

  const modelView = theEye.caseStudy.mediaViews.find(
    (view): view is ModelMediaView => view.kind === "model",
  );
  if (!modelView || modelView.cameraViews.length === 0) {
    throw new Error("the case study has no authored camera views to follow");
  }

  const segments = buildSegments(modelView.cameraViews);
  const track = segments.flatMap((segment) => segment.frames);
  await mkdir(dirname(OUT_VIDEO), { recursive: true });
  await mkdir(dirname(OUT_POSTER), { recursive: true });
  const frameDir = await mkdtemp(join(tmpdir(), "turntable-"));
  const server = await serve(STATIC_DIR);
  const browser = await chromium.launch({ channel: "chrome" });

  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
    // three announces its renderer and scene to a devtools hook that is
    // already installed when they are constructed, which is the only handle on
    // them from outside the page. The camera only arrives as an argument to
    // the renderer's own render(), so that call is wrapped to keep it.
    await page.addInitScript(() => {
      const hook = new EventTarget();
      const held: Record<string, unknown> = {};
      hook.addEventListener("observe", (event) => {
        const detail = (event as CustomEvent).detail as Record<string, unknown> | undefined;
        if (!detail) return;
        if (detail["isScene"]) held["scene"] = detail;
        if (typeof detail["render"] === "function" && detail["domElement"]) {
          held["renderer"] = detail;
          const original = (detail["render"] as (s: unknown, c: unknown) => void).bind(detail);
          detail["render"] = (scene: unknown, camera: unknown) => {
            held["camera"] = camera;
            original(scene, camera);
          };
        }
      });
      Object.assign(window, { __THREE_DEVTOOLS__: hook, turntableCapture: held });
    });

    await page.goto(`http://localhost:${server.port}/iframe.html?id=${STORY_ID}&viewMode=story`);
    await page.getByRole("button", { name: "Retina" }).waitFor({ timeout: 60_000 });
    await page.waitForFunction(() => {
      const held = window.turntableCapture;
      return Boolean(held.renderer && held.scene && held.camera);
    });
    // The scene keeps drawing for a few frames after the model resolves;
    // capturing before it settles catches the camera mid-lerp.
    await page.waitForTimeout(2000);

    const backdrop = await page.evaluate(() => {
      let node: HTMLElement | null = document.querySelector("canvas");
      while (node) {
        const colour = getComputedStyle(node).backgroundColor;
        if (colour && colour !== "rgba(0, 0, 0, 0)" && colour !== "transparent") return colour;
        node = node.parentElement;
      }
      return "rgb(0, 0, 0)";
    });

    await mkdir(frameDir, { recursive: true });
    // One canvas, one camera: the frames have to be posed, drawn and read
    // back in order, which is why .oxlintrc.json turns off no-await-in-loop
    // for this directory.
    for (const [index, frame] of track.entries()) {
      const png = await page.evaluate(
        ({ pose, fill }) => {
          const { renderer, scene, camera } = window.turntableCapture;
          if (!renderer || !scene || !camera) throw new Error("the scene was not captured");
          const [px, py, pz] = pose.position;
          const [tx, ty, tz] = pose.target;
          camera.position.set(px, py, pz);
          camera.lookAt(tx, ty, tz);
          // Clip planes travel with the pose for the reason they do in
          // ModelScene: the stock near plane sits inside this model.
          const distance = Math.hypot(px - tx, py - ty, pz - tz);
          camera.near = distance / 100;
          camera.far = distance * 100;
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);

          const source = renderer.domElement;
          const flat = document.createElement("canvas");
          flat.width = source.width;
          flat.height = source.height;
          const ctx = flat.getContext("2d");
          if (!ctx) throw new Error("no 2d context for the frame");
          // The WebGL canvas is transparent, so a frame has to be laid on the
          // same surface the page shows behind it.
          ctx.fillStyle = fill;
          ctx.fillRect(0, 0, flat.width, flat.height);
          ctx.drawImage(source, 0, 0);
          return flat.toDataURL("image/png").slice("data:image/png;base64,".length);
        },
        { pose: frame, fill: backdrop },
      );
      const name = `f${String(index).padStart(5, "0")}.png`;
      await writeFile(join(frameDir, name), Buffer.from(png, "base64"));
    }

    await run("ffmpeg", [
      "-y",
      "-framerate",
      String(FPS),
      "-i",
      join(frameDir, "f%05d.png"),
      "-vf",
      `scale=${ENCODE_WIDTH}:-2:flags=lanczos`,
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "slower",
      "-crf",
      "30",
      "-pix_fmt",
      "yuv420p",
      "-g",
      String(FPS),
      "-movflags",
      "+faststart",
      OUT_VIDEO,
    ]);
    await run("ffmpeg", ["-y", "-i", OUT_VIDEO, "-frames:v", "1", "-q:v", "4", OUT_POSTER]);

    const duration = Number(
      await capture("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=nw=1:nk=1",
        OUT_VIDEO,
      ]),
    );
    const chapters = segments.map((segment) => ({
      id: segment.view.id,
      name: segment.view.name,
      startTime: Number((segment.startFrame / FPS).toFixed(3)),
    }));
    const last = chapters.at(-1);
    if (!last) throw new Error("the model view has no camera views, so the clip has no chapters");
    if (last.startTime >= duration) {
      throw new Error(`the last chapter starts at ${last.startTime}s, past the ${duration}s clip`);
    }
    const lines = [
      "// Generated by scripts/gen-turntable.ts. The start times are frame",
      "// positions in the encoded clip, so hand-editing them drifts the chapter",
      "// track off the video. Run `bun run gen:turntable` instead.",
      'import type { Chapter } from "../types";',
      "",
      "export const turntableChapters: Chapter[] = [",
      ...chapters.map(
        (chapter) =>
          `  { id: ${JSON.stringify(chapter.id)}, name: ${JSON.stringify(chapter.name)}, startTime: ${chapter.startTime} },`,
      ),
      "];",
      "",
    ];
    await writeFile(OUT_CHAPTERS, lines.join("\n"));

    console.log(`frames    ${track.length} at ${FPS}fps`);
    console.log(`duration  ${duration}s`);
    console.log(`chapters  ${chapters.map((c) => `${c.name} @ ${c.startTime}s`).join(", ")}`);
    console.log(`video     ${OUT_VIDEO}`);
    console.log(`poster    ${OUT_POSTER}`);
  } finally {
    await browser.close();
    await server.close();
    await rm(frameDir, { recursive: true, force: true });
  }
}

await main();

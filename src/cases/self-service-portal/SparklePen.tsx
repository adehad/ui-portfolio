import { type CSSProperties, type ReactNode, useMemo } from "react";
import "@/cases/self-service-portal/SparklePen.scss";

/** 4-point star on a 15x15 viewBox, taken from adehad/cv web/_static/contact.js. */
const STAR_PATH =
  "M6.937 3.846L7.75 1L8.563 3.846C8.773 4.581 9.167 5.251 9.708 5.791C10.248 6.332 10.918 6.726 11.653 6.936L14.5 7.75L11.654 8.563C10.919 8.773 10.249 9.167 9.709 9.708C9.168 10.248 8.774 10.918 8.564 11.653L7.75 14.5L6.937 11.654C6.727 10.919 6.333 10.249 5.792 9.709C5.252 9.168 4.582 8.774 3.847 8.564L1 7.75L3.846 6.937C4.581 6.727 5.251 6.333 5.791 5.792C6.332 5.252 6.726 4.582 6.936 3.847L6.937 3.846Z";

/** The star field is randomised from the seed key rather than from Math.random,
    so a rebuild lays the same stars in the same places. Chromatic compares
    pixels, and a field that respawned per build would diff on every run. */
function hashSeed(seed: string): number {
  let hash = 0x81_1c_9d_c5;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(hash ^ seed.charCodeAt(i), 0x01_00_01_93);
  }
  return hash >>> 0;
}

/** mulberry32: small, fast, and good enough to scatter stars. */
function makeRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d_2b_79_f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

type Particle = { id: string; style: CSSProperties };

/** Position, orbit, twinkle and size for each star, already shaped as the custom
    properties the stylesheet reads. */
function makeParticles(count: number, seed: string): Particle[] {
  const random = makeRandom(hashSeed(`${seed}:${count}`));
  const between = (min: number, max: number) => random() * (max - min) + min;
  const sign = () => (random() < 0.5 ? -1 : 1);

  return Array.from({ length: count }, (_, index) => ({
    id: `${seed}-${index}`,
    style: {
      "--ssp-x": between(20, 80),
      "--ssp-y": between(20, 80),
      "--ssp-duration": between(6, 20),
      "--ssp-delay": between(1, 10),
      "--ssp-alpha": between(0.55, 0.95),
      "--ssp-size": between(0.45, 0.9),
      "--ssp-origin-x": `${sign() * between(300, 800)}%`,
      "--ssp-origin-y": `${sign() * between(300, 800)}%`,
      "--ssp-twinkle-duration": between(1.4, 3.2),
      "--ssp-twinkle-delay": between(0, 3),
    } as CSSProperties,
  }));
}

/** Whether the OS has been asked to minimise non-essential motion. Read here
    rather than left to the media query alone, so the resulting class can be
    asserted. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export type SparklePenProps = {
  /** Draw the overlay only while true, that is while the value will be created. */
  active: boolean;
  /** Star count. 20 suits a form control; inline route segments pass fewer. */
  count?: number;
  /** Feeds the per-instance hue rotation, so adjacent sparkling segments differ. */
  index?: number;
  /** Both the field's randomness and when it respawns. */
  seedKey?: string | undefined;
  /** Overrides what matchMedia reports, so a story can show the static variant. */
  reducedMotion?: boolean;
  className?: string;
  children: ReactNode;
};

/** Drifting, twinkling stars drawn behind the children to mark a value that does
    not exist yet. The overlay is absolutely positioned and click-through, so it
    neither shifts layout nor swallows pointer events, and the host carries a
    spark-coloured glow that ties the stars to the control they belong to. */
export function SparklePen({
  active,
  count = 20,
  index = 0,
  seedKey,
  reducedMotion,
  className,
  children,
}: SparklePenProps) {
  const reduced = useMemo(() => reducedMotion ?? prefersReducedMotion(), [reducedMotion]);
  const particles = useMemo(() => makeParticles(count, seedKey ?? "ssp-spark"), [count, seedKey]);
  const penStyle = useMemo(() => ({ "--ssp-spark-i": index }) as CSSProperties, [index]);

  const hostClass = `ssp-sparkle-host${active ? " ssp-sparkle-active" : ""}${
    className ? ` ${className}` : ""
  }`;

  return (
    <div className={hostClass}>
      {active ? (
        <div
          className={`ssp-particle-pen${reduced ? " ssp-reduced-motion" : ""}`}
          aria-hidden="true"
          data-testid="ssp-particle-pen"
          style={penStyle}
        >
          {particles.map((particle) => (
            <svg
              key={particle.id}
              className="ssp-particle"
              viewBox="0 0 15 15"
              style={particle.style}
            >
              <path d={STAR_PATH} />
            </svg>
          ))}
        </div>
      ) : null}
      {children}
    </div>
  );
}

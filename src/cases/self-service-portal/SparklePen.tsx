import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { chaseGeometry } from "@/cases/self-service-portal/chaseGeometry";
import "@/cases/self-service-portal/SparklePen.scss";
import { hashSeed, makeRandom } from "@/cases/self-service-portal/seededRandom";

/** 4-point star on a 15x15 viewBox, taken from adehad/cv web/_static/contact.js. */
const STAR_PATH =
  "M6.937 3.846L7.75 1L8.563 3.846C8.773 4.581 9.167 5.251 9.708 5.791C10.248 6.332 10.918 6.726 11.653 6.936L14.5 7.75L11.654 8.563C10.919 8.773 10.249 9.167 9.709 9.708C9.168 10.248 8.774 10.918 8.564 11.653L7.75 14.5L6.937 11.654C6.727 10.919 6.333 10.249 5.792 9.709C5.252 9.168 4.582 8.774 3.847 8.564L1 7.75L3.846 6.937C4.581 6.727 5.251 6.333 5.791 5.792C6.332 5.252 6.726 4.582 6.936 3.847L6.937 3.846Z";

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
  /** Multiplies every star's size. The component demo runs at 2. */
  starScale?: number;
  /** Send a spark chasing round the host's edge as well as through the field. */
  chase?: boolean;
  /** Quicken the chase and brighten the field while the value settles. */
  working?: boolean;
  /** Overrides what matchMedia reports, so a story can show the static variant. */
  reducedMotion?: boolean;
  className?: string;
  children: ReactNode;
};

/** Drifting, twinkling stars drawn behind the children to mark a value that does
    not exist yet, and optionally a spark chasing the host's edge. Both overlays
    are absolutely positioned and click-through, so they neither shift layout nor
    swallow pointer events, and the host carries a spark-coloured glow that ties
    the stars to the control they belong to. */
export function SparklePen({
  active,
  count = 20,
  index = 0,
  seedKey,
  starScale = 1,
  chase = false,
  working = false,
  reducedMotion,
  className,
  children,
}: SparklePenProps) {
  const reduced = useMemo(() => reducedMotion ?? prefersReducedMotion(), [reducedMotion]);
  const hostRef = useRef<HTMLDivElement>(null);
  const particles = useMemo(() => makeParticles(count, seedKey ?? "ssp-spark"), [count, seedKey]);
  const penStyle = useMemo(
    () => ({ "--ssp-spark-i": index, "--ssp-star-scale": starScale }) as CSSProperties,
    [index, starScale],
  );

  /** The chase's angle formula is tuned by the host's proportions, so they are
      measured rather than declared. Written straight onto the node, so a resize
      costs no render and the ring stays even while the host is dragged. */
  const applyGeometry = useCallback(
    (width: number, height: number) => {
      const host = hostRef.current;
      if (!host || !active || !chase) return;
      const { aspect, kx, ky } = chaseGeometry(width, height);
      host.style.setProperty("--ssp-chase-aspect", aspect.toFixed(3));
      host.style.setProperty("--ssp-chase-kx", kx.toFixed(3));
      host.style.setProperty("--ssp-chase-ky", ky.toFixed(3));
    },
    [active, chase],
  );

  /** Every commit, because a prop that reshapes the host lands as a render and
      no observer notification is guaranteed to follow it. */
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    applyGeometry(rect.width, rect.height);
  });

  /** Resizes nobody rendered: the viewport, a font landing, a sibling growing.
      The size comes off the entry, never from a layout read inside the callback,
      which would force layout mid-observation. */
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !active || !chase || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const border = entry.borderBoxSize.at(0);
        if (border) applyGeometry(border.inlineSize, border.blockSize);
        else applyGeometry(entry.contentRect.width, entry.contentRect.height);
      }
    });
    observer.observe(host, { box: "border-box" });
    return () => observer.disconnect();
  }, [active, chase, applyGeometry]);

  const hostClass = [
    "ssp-sparkle-host",
    active && "ssp-sparkle-active",
    active && chase && "ssp-sparkle-chased",
    working && "ssp-sparkle-working",
    reduced && "ssp-reduced-motion",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={hostClass} ref={hostRef}>
      {active ? (
        <div
          className="ssp-particle-pen"
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
      {active && chase ? (
        <span className="ssp-sparkle-chase" aria-hidden="true" data-testid="ssp-sparkle-chase" />
      ) : null}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { lockProgress, scrambleFrame } from "@/cases/self-service-portal/scramble";
import "@/cases/self-service-portal/ScrambleText.scss";
import { hashSeed, makeRandom } from "@/cases/self-service-portal/seededRandom";

export type ScrambleTextProps = {
  /** The value to settle on. Every change to it runs a fresh reveal. */
  value: string;
  /** Length of one reveal in milliseconds. */
  duration?: number;
  /** Share of the run spent scrambling before the first character locks. */
  hold?: number;
  /** Overrides what matchMedia reports, so a story can show the static variant. */
  reducedMotion?: boolean;
  /** Fires on both edges of a run, so the host can react while one plays. */
  onRunningChange?: (running: boolean) => void;
  className?: string;
};

/** Characters churn through a glyph pool and lock in left to right until the
    value stands there sharp. The first paint is the value itself: a reveal runs
    only once `value` changes, so a fresh mount is never mid-scramble.

    `frame` is null whenever no reveal is playing, which is what makes the value
    the rendered default rather than something an effect has to write back. */
export function ScrambleText({
  value,
  duration = 1600,
  hold = 0.3,
  reducedMotion,
  onRunningChange,
  className,
}: ScrambleTextProps) {
  const [frame, setFrame] = useState<string | null>(null);
  const mounted = useRef(false);

  /** Held in a ref so a fresh callback identity cannot restart a run. */
  const notify = useRef(onRunningChange);
  useEffect(() => {
    notify.current = onRunningChange;
  });

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (reducedMotion) return;

    const random = makeRandom(hashSeed(value));
    const start = performance.now();
    let raf = 0;

    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      if (p < 1) {
        setFrame(scrambleFrame(value, lockProgress(p, hold), random));
        raf = requestAnimationFrame(step);
        return;
      }
      setFrame(null);
      notify.current?.(false);
    };

    notify.current?.(true);
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      notify.current?.(false);
    };
  }, [value, duration, hold, reducedMotion]);

  const classes = ["ssp-scramble", frame !== null && "ssp-scramble-running", className]
    .filter(Boolean)
    .join(" ");

  /** The churning frame is decoration; a screen reader gets the settled value. */
  return (
    <span className={classes} data-testid="ssp-scramble">
      <span aria-hidden="true">{frame ?? value}</span>
      {frame === null ? null : <span className="ssp-visually-hidden">{value}</span>}
    </span>
  );
}

import { useEffect, useRef, useState } from "react";
import type { CameraView } from "./types";
import { useViewerStore } from "./useViewerStore";

const CARET_CLASS =
  "flex size-cdp-touch cdp-pressable cursor-pointer items-center justify-center rounded-cdp-xl text-cdp-fg disabled:opacity-30";

/**
 * Camera view carousel. The carets step through the authored views one at a
 * time, every stop carries its own indicator, and the active one elongates
 * into a bar.
 *
 * Not the usual carousel that collapses to three dots: booth staff need to see
 * how many views a model has and where they are in the set, and no model here
 * carries enough views for the full list to crowd.
 *
 * Labels stay hidden until the first press and hide again on the next press
 * outside the rail, so the frame returns to clean without anyone putting it
 * back. A timer would pull the label away mid-sentence.
 *
 * Free orbit is the first stop rather than a separate control: it is what the
 * camera returns to, so folding it in keeps a reachable state reachable.
 */
export function CameraViewRail({ cameraViews }: { cameraViews: CameraView[] }) {
  const activeCameraViewId = useViewerStore((s) => s.activeCameraViewId);
  const setCameraView = useViewerStore((s) => s.setCameraView);
  const [labelsShown, setLabelsShown] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  // pointerdown, not click: it fires before the canvas swallows the gesture,
  // and it reaches the R3F canvas, which emits no DOM click of its own.
  useEffect(() => {
    if (!labelsShown) return undefined;
    const onPointerDown = (e: PointerEvent) => {
      if (!railRef.current?.contains(e.target as Node)) setLabelsShown(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [labelsShown]);

  // Every hook runs above this: an earlier return would break the hook order
  // on a model view that has no camera views.
  if (!cameraViews.length) return null;

  const stops: { id: string | null; name: string }[] = [
    { id: null, name: "Free orbit" },
    ...cameraViews.map((v) => ({ id: v.id, name: v.name })),
  ];
  const index = stops.findIndex((s) => s.id === (activeCameraViewId ?? null));
  const activeIndex = index === -1 ? 0 : index;

  function go(to: number) {
    setLabelsShown(true);
    const clamped = Math.max(0, Math.min(stops.length - 1, to));
    setCameraView(stops[clamped]!.id);
  }

  return (
    // One glass panel behind the whole rail. The dots and labels sit over a
    // live render whose brightness is not known ahead of time, and unbacked
    // they vanish against a bright frame. The buttons inside stay plain:
    // glass on glass reads as mud.
    <div
      ref={railRef}
      className="pointer-events-auto cdp-glass flex flex-col items-end gap-1 rounded-cdp-2xl px-1.5 py-2"
    >
      <button
        aria-label="Previous view"
        disabled={activeIndex === 0}
        onClick={() => go(activeIndex - 1)}
        className={CARET_CLASS}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
          <path
            d="M6 15l6-6 6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <ol aria-label="Camera views" className="flex w-full flex-col">
        {stops.map((stop, i) => {
          const active = i === activeIndex;
          return (
            <li key={stop.id ?? "free"}>
              {/* The row is the target, not the 8px indicator: a dot that size
                  is a fifth of the 44px minimum. */}
              <button
                aria-label={stop.name}
                aria-current={active ? "true" : undefined}
                onClick={() => go(i)}
                className="flex h-cdp-touch w-full cursor-pointer items-center justify-end gap-3 pr-[17px] pl-3"
              >
                {/* The label sits inboard of the dot: the rail is anchored to
                    the right edge, so the indicators read down the edge and the
                    labels run back toward the model. */}
                {labelsShown && (
                  <span
                    className={`text-cdp-caption whitespace-nowrap ${
                      active ? "font-semibold text-cdp-fg" : "text-cdp-fg-subtle"
                    }`}
                  >
                    {stop.name}
                  </span>
                )}
                <span
                  aria-hidden
                  className={`w-2 shrink-0 rounded-full transition-[height,background-color] duration-200 ${
                    active ? "h-7 bg-cdp-fg" : "h-2 bg-cdp-fg-subtle"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ol>

      <button
        aria-label="Next view"
        disabled={activeIndex === stops.length - 1}
        onClick={() => go(activeIndex + 1)}
        className={CARET_CLASS}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

import { useState } from "react";
import { modelPreviewUrl } from "./content";
import type { CaseStudy, ModelView } from "./types";
import { useViewerStore } from "./useViewerStore";

/**
 * Collapsible model-selection drawer over the right edge of the canvas panel:
 * a handle tab slides open a rail of tiles, one per Model View. Tiles show the
 * pre-built preview when one exists, an explicit thumbnail on the Model View
 * winning, and fall back to the view name. It overlays the canvas rather than
 * sitting beside it so toggling never resizes the WebGL drawing buffer.
 */
export function ModelDrawer({
  caseStudy,
  activeModelView,
}: {
  caseStudy: CaseStudy;
  activeModelView: ModelView;
}) {
  const setModelView = useViewerStore((s) => s.setModelView);
  const [open, setOpen] = useState(true);

  return (
    // Starts below the panel's top control row so an open drawer never
    // intercepts the info, views and refresh clicks.
    <div className="absolute top-24 right-0 bottom-6 z-10 flex items-center">
      <button
        aria-label={open ? "Hide models" : "Show models"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-24 w-9 cursor-pointer items-center justify-center rounded-l-[15px] bg-cdp-slate-dark text-white/70 shadow-cdp-neu-dark-raised transition hover:text-white"
      >
        <svg
          viewBox="0 0 24 24"
          className={`size-5 transition-transform ${open ? "" : "rotate-180"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
      <div
        className={`flex h-full flex-col items-center gap-6 overflow-y-auto rounded-l-[30px] bg-cdp-slate px-6 py-6 shadow-cdp-neu-dark-inset transition-all duration-300 ${
          open ? "w-[184px] opacity-100" : "pointer-events-none w-0 px-0 opacity-0"
        }`}
      >
        {caseStudy.modelViews.map((mv) => {
          const active = mv.id === activeModelView.id;
          const preview = mv.thumbnail ?? modelPreviewUrl(mv.src);
          return (
            <button
              key={mv.id}
              onClick={() => setModelView(mv.id)}
              aria-pressed={active}
              aria-label={mv.name}
              className={`flex size-[130px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[20px] p-2 transition ${
                active
                  ? "bg-cdp-slate-dark shadow-cdp-neu-dark-inset-sm"
                  : "bg-cdp-slate shadow-cdp-neu-dark-raised"
              }`}
            >
              {preview ? (
                <img src={preview} alt={mv.name} className="size-full object-contain" />
              ) : (
                <span
                  className={`text-center text-sm font-semibold ${active ? "text-white" : "text-white/70"}`}
                >
                  {mv.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

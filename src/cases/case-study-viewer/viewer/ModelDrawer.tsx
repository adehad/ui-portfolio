import { modelPreviewUrl } from "./content";
import type { CaseStudy, ModelView } from "./types";
import { useViewerStore } from "./useViewerStore";

/**
 * Collapsible model-selection drawer over the right edge of the canvas panel:
 * a handle tab slides open a rail of tiles, one per Model View. Tiles show the
 * pre-built preview when one exists, an explicit thumbnail on the Model View
 * winning, and fall back to the view name. It overlays the canvas rather than
 * sitting beside it so toggling never resizes the WebGL drawing buffer.
 *
 * `open` is owned by the viewer rather than by this component, because the
 * camera view rail shares the right edge and has to step aside by the drawer's
 * width, so both have to read the same state.
 */
export function ModelDrawer({
  caseStudy,
  activeModelView,
  open,
  onOpenChange,
}: {
  caseStudy: CaseStudy;
  activeModelView: ModelView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setModelView = useViewerStore((s) => s.setModelView);

  return (
    // The handle sits on the panel's right edge rather than inset from it, so
    // it reads as something to pull the drawer in from. inset-y-6 keeps it
    // clear of the rounded corners at any panel height.
    <div className="absolute inset-y-6 right-0 z-10 flex items-center justify-end">
      <button
        aria-label={open ? "Hide models" : "Show models"}
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="cdp-glass flex h-28 w-cdp-touch shrink-0 cdp-pressable cursor-pointer items-center justify-center rounded-l-cdp-xl text-cdp-fg-muted"
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
      {/* border-0 while collapsed is load-bearing: cdp-glass carries a 1px
          border per side, so a w-0 panel is still 2px wide and pushes the
          handle off the right edge by that sliver. */}
      <div
        className={`cdp-glass flex max-h-full flex-col items-center gap-4 overflow-y-auto overscroll-contain rounded-l-cdp-2xl transition-[width,opacity,padding] duration-300 ${
          open
            ? "w-cdp-drawer px-4 py-4 opacity-100"
            : "pointer-events-none w-0 border-0 px-0 py-0 opacity-0"
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
              className={`flex size-[136px] shrink-0 cdp-pressable cursor-pointer items-center justify-center overflow-hidden rounded-cdp-xl border p-2 ${
                active ? "border-cdp-sector bg-cdp-sector-tint" : "border-cdp-line bg-cdp-surface-2"
              }`}
            >
              {preview ? (
                <img src={preview} alt={mv.name} className="size-full object-contain" />
              ) : (
                <span
                  className={`text-center text-cdp-caption font-semibold ${
                    active ? "text-cdp-fg" : "text-cdp-fg-muted"
                  }`}
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

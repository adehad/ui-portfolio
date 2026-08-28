import { useGLTF } from "@react-three/drei";
import { useEffect, useState } from "react";
import watermark from "@/cases/case-study-viewer/brand/cdp-watermark.svg";
import { TouchGestureGuard } from "@/cases/case-study-viewer/TouchGestureGuard";
import { CameraViewRail } from "./CameraViewRail";
import { modelUrl } from "./content";
import { LayerPanel } from "./LayerPanel";
import { MediaStage } from "./MediaStage";
import { ModelDrawer } from "./ModelDrawer";
import { sectorStyle } from "./theme";
import type { CaseStudyRef } from "./types";
import { useViewerStore } from "./useViewerStore";
import { ViewerErrorBoundary } from "./ViewerErrorBoundary";

export function CaseStudyViewer({ refData }: { refData: CaseStudyRef }) {
  const { caseStudy, sector } = refData;
  const activeMediaViewId = useViewerStore((s) => s.activeMediaViewId);
  const setMediaView = useViewerStore((s) => s.setMediaView);
  const infoOpen = useViewerStore((s) => s.infoOpen);
  const toggleInfo = useViewerStore((s) => s.toggleInfo);
  const refresh = useViewerStore((s) => s.refresh);
  const [layersOpen, setLayersOpen] = useState(false);
  // Owned here rather than inside the drawer: the camera view rail shares the
  // right edge and steps aside by the drawer's width when it opens.
  const [drawerOpen, setDrawerOpen] = useState(true);

  useEffect(() => {
    setMediaView(caseStudy.mediaViews[0].id);
  }, [caseStudy.mediaViews, setMediaView]);

  const mediaView =
    caseStudy.mediaViews.find((m) => m.id === activeMediaViewId) ?? caseStudy.mediaViews[0];

  const hasInfo = Boolean(mediaView.infoPrompt || caseStudy.body);

  // Evict the failed load from drei's suspense cache so the boundary's
  // remount re-fetches instead of re-throwing the cached error.
  const clearFailedLoad = () => {
    if (mediaView.kind === "model") useGLTF.clear(modelUrl(mediaView.src));
  };

  return (
    <main
      style={sectorStyle(sector.id)}
      className="flex h-dvh min-h-dvh flex-col gap-5 bg-cdp-surface-0 cdp-safe cdp-root"
    >
      <TouchGestureGuard />
      <header className="flex items-center gap-5">
        <button
          aria-label={`Back to ${sector.name}`}
          className="flex size-cdp-touch-comfort shrink-0 cdp-pressable cursor-pointer items-center justify-center rounded-cdp-xl border border-cdp-line bg-cdp-surface-2 text-cdp-fg"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span aria-hidden className="h-10 w-1 shrink-0 rounded-full bg-cdp-sector" />
        <h1 className="flex-1 truncate text-cdp-header font-semibold text-cdp-fg">
          {caseStudy.tagline}
        </h1>
        {mediaView.kind === "model" && mediaView.layers.length > 0 && (
          <button
            aria-label="Toggle layers"
            aria-pressed={layersOpen}
            onClick={() => setLayersOpen((v) => !v)}
            className={`flex size-cdp-touch-comfort shrink-0 cdp-pressable cursor-pointer items-center justify-center rounded-cdp-xl border ${
              layersOpen
                ? "border-cdp-sector-edge bg-cdp-sector-tint text-cdp-sector-fg"
                : "border-cdp-line bg-cdp-surface-2 text-cdp-fg-muted"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2 2 7l10 5 10-5-10-5z" />
              <path d="m2 12 10 5 10-5" />
              <path d="m2 17 10 5 10-5" />
            </svg>
          </button>
        )}
      </header>
      <div className="flex min-h-0 flex-1 gap-7">
        <section className="relative flex-1 rounded-cdp-2xl">
          <div className="absolute inset-0 overflow-hidden rounded-cdp-2xl">
            <ViewerErrorBoundary onRetry={clearFailedLoad}>
              <MediaStage mediaView={mediaView} drawerOpen={drawerOpen} />
            </ViewerErrorBoundary>
          </div>
          {/* A hairline is the whole edge treatment: this language has no
              bevel, so the panel is defined by where the surface stops. */}
          <div className="pointer-events-none absolute inset-0 rounded-cdp-2xl border border-cdp-line" />
          {hasInfo && (
            <div className="absolute top-6 left-6">
              <button
                aria-label="Info"
                aria-expanded={infoOpen}
                onClick={toggleInfo}
                className="cdp-glass flex size-cdp-touch-comfort cdp-pressable cursor-pointer items-center justify-center rounded-cdp-xl font-serif text-cdp-title leading-none text-cdp-fg italic"
              >
                i
              </button>
              {/* Dark glass with light text, because the backdrop here is a
                  live render and carries no fixed contrast ratio. */}
              {infoOpen && (
                <div className="absolute top-[68px] left-0 cdp-glass z-10 w-80 space-y-2 rounded-cdp-2xl p-5 text-cdp-fg">
                  {mediaView.infoPrompt && (
                    <p className="text-cdp-body font-semibold">{mediaView.infoPrompt}</p>
                  )}
                  {caseStudy.body && (
                    <p className="text-cdp-caption leading-relaxed text-cdp-fg-muted">
                      {caseStudy.body}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {/* right-14 clears the 44px drawer handle plus a gap, and the inner
              wrapper moves the rail by exactly the drawer's width, so the two
              share the right edge without ever colliding. Transform rather than
              `right`, so the shift stays on the compositor. */}
          <div className="absolute top-1/2 right-14 -translate-y-1/2">
            <div
              className={`transition-transform duration-300 ${
                drawerOpen ? "-translate-x-[var(--spacing-cdp-drawer)]" : "translate-x-0"
              }`}
            >
              {mediaView.kind === "model" && <CameraViewRail cameraViews={mediaView.cameraViews} />}
            </div>
          </div>
          <div className="absolute top-6 right-6 flex items-center gap-3">
            <button
              aria-label="Reset view"
              onClick={refresh}
              className="cdp-glass flex size-cdp-touch-comfort cdp-pressable cursor-pointer items-center justify-center rounded-cdp-xl text-cdp-fg"
            >
              <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
                <path
                  d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          {layersOpen && mediaView.kind === "model" && (
            <div className="absolute top-[104px] left-6">
              <LayerPanel mediaView={mediaView} />
            </div>
          )}
          <img
            src={watermark}
            alt=""
            className="pointer-events-none absolute right-8 bottom-8 h-[97px] w-auto opacity-80"
          />
          <ModelDrawer
            caseStudy={caseStudy}
            activeMediaView={mediaView}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
          />
        </section>
      </div>
    </main>
  );
}

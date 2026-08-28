import { useGLTF } from "@react-three/drei";
import { useEffect, useState } from "react";
import backButton from "@/cases/case-study-viewer/brand/back-button.svg";
import refreshIcon from "@/cases/case-study-viewer/brand/icon-refresh.svg";
import watermark from "@/cases/case-study-viewer/brand/cdp-watermark.svg";
import { modelUrl } from "./content";
import { LayerPanel } from "./LayerPanel";
import { ModelDrawer } from "./ModelDrawer";
import type { CaseStudyRef } from "./types";
import { useViewerStore } from "./useViewerStore";
import { ViewerCanvas } from "./ViewerCanvas";
import { ViewerErrorBoundary } from "./ViewerErrorBoundary";
import { ViewsMenu } from "./ViewsMenu";

export function CaseStudyViewer({ refData }: { refData: CaseStudyRef }) {
  const { caseStudy, sector } = refData;
  const activeModelViewId = useViewerStore((s) => s.activeModelViewId);
  const setModelView = useViewerStore((s) => s.setModelView);
  const infoOpen = useViewerStore((s) => s.infoOpen);
  const toggleInfo = useViewerStore((s) => s.toggleInfo);
  const refresh = useViewerStore((s) => s.refresh);
  const [layersOpen, setLayersOpen] = useState(false);

  useEffect(() => {
    setModelView(caseStudy.modelViews[0].id);
  }, [caseStudy.modelViews, setModelView]);

  const modelView =
    caseStudy.modelViews.find((m) => m.id === activeModelViewId) ?? caseStudy.modelViews[0];

  const hasInfo = Boolean(modelView.infoPrompt || caseStudy.body);

  // Evict the failed load from drei's suspense cache so the boundary's
  // remount re-fetches instead of re-throwing the cached error.
  const clearFailedLoad = () => useGLTF.clear(modelUrl(modelView.src));

  return (
    <main className="flex h-dvh min-h-dvh flex-col gap-5 bg-cdp-slate p-7 pt-6 cdp-root scheme-dark">
      <header className="flex items-center gap-6">
        <button
          aria-label={`Back to ${sector.name}`}
          className="relative block size-[67px] shrink-0 cursor-pointer"
        >
          {/* Baked tile export from Figma (chevron, tile and soft shadows);
              the SVG canvas bleeds past the 67px tile for the shadow. */}
          <img src={backButton} alt="" className="absolute inset-[-12%] size-[124%] max-w-none" />
        </button>
        <h1 className="flex-1 truncate text-3xl font-bold tracking-[-0.03em] text-white/90 lg:text-4xl">
          {caseStudy.tagline}
        </h1>
        {modelView.layers.length > 0 && (
          <button
            aria-label="Toggle layers"
            aria-pressed={layersOpen}
            onClick={() => setLayersOpen((v) => !v)}
            className={`shrink-0 cursor-pointer rounded-[15px] p-2.5 transition ${
              layersOpen
                ? "bg-cdp-slate-dark text-white shadow-cdp-neu-dark-inset-sm"
                : "text-white/60 hover:text-white"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-8"
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
        <section className="relative flex-1 rounded-[30px]">
          <div className="absolute inset-0 overflow-hidden rounded-[30px]">
            <ViewerErrorBoundary onRetry={clearFailedLoad}>
              <ViewerCanvas key={modelView.id} modelView={modelView} />
            </ViewerErrorBoundary>
          </div>
          {/* Inset lip above the canvas so the panel reads as carved in. */}
          <div className="pointer-events-none absolute inset-0 rounded-[30px] shadow-cdp-neu-dark-inset" />
          {hasInfo && (
            <div className="absolute top-8 left-8">
              <button
                aria-label="Info"
                aria-expanded={infoOpen}
                onClick={toggleInfo}
                className="size-10 cursor-pointer rounded-[15px] bg-white/60 pb-1 font-serif text-3xl leading-none text-cdp-slate italic hover:bg-white/80"
              >
                i
              </button>
              {infoOpen && (
                <div className="absolute top-12 left-0 z-10 w-72 space-y-2 rounded-[20px] bg-white/90 p-4 text-cdp-slate shadow-cdp-neu-dark-raised">
                  {modelView.infoPrompt && (
                    <p className="text-sm font-semibold">{modelView.infoPrompt}</p>
                  )}
                  {caseStudy.body && <p className="text-xs leading-relaxed">{caseStudy.body}</p>}
                </div>
              )}
            </div>
          )}
          <div className="absolute top-8 right-8 flex items-center gap-3">
            <ViewsMenu cameraViews={modelView.cameraViews} />
            <button
              aria-label="Refresh view"
              onClick={refresh}
              className="cursor-pointer opacity-60 transition hover:opacity-100"
            >
              <img src={refreshIcon} alt="" className="size-[41px]" />
            </button>
          </div>
          {layersOpen && (
            <div className="absolute top-24 left-8">
              <LayerPanel modelView={modelView} />
            </div>
          )}
          <img
            src={watermark}
            alt=""
            className="pointer-events-none absolute right-8 bottom-8 h-[97px] w-auto opacity-80"
          />
          <ModelDrawer caseStudy={caseStudy} activeModelView={modelView} />
        </section>
      </div>
    </main>
  );
}

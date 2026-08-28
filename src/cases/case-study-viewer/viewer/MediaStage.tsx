import { ModelScene } from "./ModelScene";
import type { MediaView } from "./types";
import { VideoStage } from "./video/VideoStage";
import { ViewerCanvas } from "./ViewerCanvas";

/**
 * Picks a renderer for the active media view. The Canvas is mounted for the
 * whole page and only its scene comes and goes (see ViewerCanvas); anything
 * that is not a model is DOM painted over it on an opaque surface, so the
 * canvas keeps its last frame underneath rather than being torn down.
 */
export function MediaStage({
  mediaView,
  drawerOpen,
}: {
  mediaView: MediaView;
  drawerOpen: boolean;
}) {
  return (
    <div className="relative h-full w-full">
      <ViewerCanvas>
        {mediaView.kind === "model" && <ModelScene key={mediaView.id} mediaView={mediaView} />}
      </ViewerCanvas>
      {mediaView.kind === "video" && (
        <div className="absolute inset-0 bg-cdp-surface-0">
          <VideoStage key={mediaView.id} mediaView={mediaView} drawerOpen={drawerOpen} />
        </div>
      )}
    </div>
  );
}

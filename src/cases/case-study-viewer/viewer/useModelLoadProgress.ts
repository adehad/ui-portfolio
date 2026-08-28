import { useEffect, useState } from "react";
import { FileLoader } from "three";
import { modelSizeBytes, modelUrl } from "./content";

export interface ModelLoadProgress {
  loadedBytes: number;
  totalBytes: number | undefined;
  /** Download finished; anything still pending is parse and GPU-upload time. */
  downloaded: boolean;
}

function idle(src: string): ModelLoadProgress {
  return { loadedBytes: 0, totalBytes: modelSizeBytes(src), downloaded: false };
}

/**
 * Byte-level download progress for a model src. drei's useProgress counts
 * loading-manager items (files), so a single large GLB sits at 0% for the
 * whole download, which is useless feedback for exactly the models that need
 * it.
 *
 * This attaches a FileLoader.load() for the same URL instead: three's
 * module-global in-flight registry coalesces it with the GLTFLoader fetch
 * already running, so no second network request is made and we just receive
 * the shared request's progress events. Content-Length can be absent
 * (chunked or gzipped responses), so fall back to the size manifest.
 */
export function useModelLoadProgress(src: string): ModelLoadProgress {
  const [state, setState] = useState(() => ({ src, progress: idle(src) }));
  if (state.src !== src) setState({ src, progress: idle(src) });

  useEffect(() => {
    let alive = true;
    const loader = new FileLoader();
    loader.setResponseType("arraybuffer");
    loader.load(
      modelUrl(src),
      () => {
        if (alive) {
          setState((s) => ({
            src,
            progress: {
              ...s.progress,
              loadedBytes: s.progress.totalBytes ?? s.progress.loadedBytes,
              downloaded: true,
            },
          }));
        }
      },
      (event) => {
        if (alive) {
          setState({
            src,
            progress: {
              loadedBytes: event.loaded,
              totalBytes: event.total > 0 ? event.total : modelSizeBytes(src),
              downloaded: false,
            },
          });
        }
      },
      () => {
        // Errors surface through the real GLTF load path and the error
        // boundary; this listener is feedback only.
      },
    );
    return () => {
      alive = false;
    };
  }, [src]);

  return state.progress;
}

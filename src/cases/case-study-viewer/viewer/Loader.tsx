import { Html } from "@react-three/drei";
import { useMemo } from "react";
import type { Camera, Object3D } from "three";
import { useModelLoadProgress } from "./useModelLoadProgress";

function formatMb(bytes: number): string {
  return `${(bytes / 1e6).toFixed(1)}`;
}

/**
 * <Html> normally projects the scene position it is mounted at. This model's
 * world origin sits below the eye, so the projected panel reads low in the
 * frame; pin it to the middle of the canvas instead.
 */
function centreOfCanvas(_el: Object3D, _camera: Camera, size: { width: number; height: number }) {
  return [size.width / 2, size.height / 2];
}

/**
 * Suspense fallback for the viewer canvas. Two phases, both with real
 * feedback: a byte-accurate bar while downloading, then an indeterminate
 * shimmer while three parses the GLB and uploads it to the GPU.
 */
export function Loader({ src }: { src: string }) {
  const { loadedBytes, totalBytes, downloaded } = useModelLoadProgress(src);
  const pct = totalBytes ? Math.min(100, (loadedBytes / totalBytes) * 100) : null;
  const barStyle = useMemo(() => ({ width: `${pct ?? 5}%` }), [pct]);

  return (
    <Html center calculatePosition={centreOfCanvas}>
      <div className="w-64 text-center text-cdp-fg">
        {downloaded ? (
          <>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-cdp-surface-3">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-cdp-sector" />
            </div>
            <p className="mt-2 text-cdp-caption text-cdp-fg-muted">Preparing model…</p>
          </>
        ) : (
          <>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-cdp-surface-3">
              <div
                className="h-full rounded-full bg-cdp-sector transition-[width]"
                style={barStyle}
              />
            </div>
            <p className="mt-2 text-cdp-caption text-cdp-fg-muted tabular-nums">
              {totalBytes
                ? `${formatMb(loadedBytes)} / ${formatMb(totalBytes)} MB`
                : `${formatMb(loadedBytes)} MB`}
              {pct !== null && ` · ${Math.round(pct)}%`}
            </p>
          </>
        )}
      </div>
    </Html>
  );
}

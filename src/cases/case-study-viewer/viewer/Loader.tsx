import { Html } from "@react-three/drei";
import { useMemo } from "react";
import { useModelLoadProgress } from "./useModelLoadProgress";

function formatMb(bytes: number): string {
  return `${(bytes / 1e6).toFixed(1)}`;
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
    <Html center>
      <div className="w-56 text-center text-white">
        {downloaded ? (
          <>
            <div className="h-1.5 w-full overflow-hidden rounded-sm bg-white/10">
              <div className="h-full w-1/3 animate-pulse rounded-sm bg-cdp-blue" />
            </div>
            <p className="mt-2 text-xs text-white/70">Preparing model…</p>
          </>
        ) : (
          <>
            <div className="h-1.5 w-full overflow-hidden rounded-sm bg-white/10">
              <div className="h-full rounded-sm bg-cdp-blue transition-all" style={barStyle} />
            </div>
            <p className="mt-2 text-xs text-white/70 tabular-nums">
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

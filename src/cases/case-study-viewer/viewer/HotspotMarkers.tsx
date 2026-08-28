import { Html } from "@react-three/drei";
import type { Hotspot } from "./types";
import { useViewerStore } from "./useViewerStore";

const ZINDEX_RANGE: [number, number] = [9, 0];

export function HotspotMarkers({ hotspots }: { hotspots: Hotspot[] }) {
  const openId = useViewerStore((s) => s.openHotspotId);
  const openHotspot = useViewerStore((s) => s.openHotspot);

  return (
    <>
      {hotspots.map((h) => (
        <Html key={h.id} position={h.position} center zIndexRange={ZINDEX_RANGE}>
          <button
            aria-label={h.title}
            aria-expanded={openId === h.id}
            onClick={() => openHotspot(openId === h.id ? null : h.id)}
            className="h-6 w-6 cursor-pointer rounded-full border-2 border-white bg-black/70 text-xs font-bold text-white"
          >
            +
          </button>
          {openId === h.id && (
            <div className="absolute top-0 left-8 w-56 rounded-xl bg-white p-3 text-black shadow-xl">
              <p className="text-sm font-bold">{h.title}</p>
              <p className="mt-1 text-xs">{h.body}</p>
            </div>
          )}
        </Html>
      ))}
    </>
  );
}

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
          {/* The dot stays 24px so it does not obscure the geometry it marks;
              padding plus a negative margin give it a 44px hit area without
              moving it. */}
          <button
            aria-label={h.title}
            aria-expanded={openId === h.id}
            onClick={() => openHotspot(openId === h.id ? null : h.id)}
            className="-m-2.5 flex size-cdp-touch cursor-pointer items-center justify-center p-2.5"
          >
            <span
              aria-hidden
              className={`flex size-6 items-center justify-center rounded-full border-2 border-cdp-fg text-cdp-caption font-semibold transition-colors ${
                openId === h.id
                  ? "bg-cdp-sector text-cdp-slate-dark"
                  : "bg-cdp-surface-0/80 text-cdp-fg"
              }`}
            >
              +
            </span>
          </button>
          {openId === h.id && (
            <div className="absolute top-0 left-9 cdp-glass w-64 rounded-cdp-2xl p-4 text-cdp-fg">
              <p className="text-cdp-body font-semibold">{h.title}</p>
              <p className="mt-1 text-cdp-caption leading-relaxed text-cdp-fg-muted">{h.body}</p>
            </div>
          )}
        </Html>
      ))}
    </>
  );
}

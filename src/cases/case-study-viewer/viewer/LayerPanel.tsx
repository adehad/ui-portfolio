import type { ModelView } from "./types";
import { useViewerStore } from "./useViewerStore";

export function LayerPanel({ modelView }: { modelView: ModelView }) {
  const ghostedLayerIds = useViewerStore((s) => s.ghostedLayerIds);
  const toggleLayer = useViewerStore((s) => s.toggleLayer);

  if (!modelView.layers.length) return null;

  return (
    <div className="pointer-events-auto cdp-glass flex w-56 flex-col gap-1 rounded-cdp-2xl p-3">
      <p className="px-3 py-2 text-cdp-caption font-semibold tracking-[0.14em] text-cdp-fg-subtle uppercase">
        Layers
      </p>
      {modelView.layers.map((layer) => {
        const ghosted = ghostedLayerIds.includes(layer.id);
        return (
          <button
            key={layer.id}
            aria-pressed={ghosted}
            onClick={() => toggleLayer(layer.id)}
            className={`flex min-h-cdp-touch cdp-pressable cursor-pointer items-center justify-between gap-3 rounded-cdp-xl border px-3 text-left text-cdp-body ${
              ghosted
                ? "border-cdp-line bg-transparent text-cdp-fg-subtle"
                : "border-cdp-line bg-cdp-surface-2 text-cdp-fg"
            }`}
          >
            {layer.label}
            {/* State carried by a filled or hollow dot as well as by colour;
                a strikethrough on its own reads as disabled. */}
            <span
              aria-hidden
              className={`size-3 shrink-0 rounded-full border ${
                ghosted ? "border-cdp-fg-subtle" : "border-cdp-sector bg-cdp-sector"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

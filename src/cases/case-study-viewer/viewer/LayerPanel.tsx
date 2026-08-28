import type { ModelView } from "./types";
import { useViewerStore } from "./useViewerStore";

export function LayerPanel({ modelView }: { modelView: ModelView }) {
  const ghostedLayerIds = useViewerStore((s) => s.ghostedLayerIds);
  const toggleLayer = useViewerStore((s) => s.toggleLayer);

  if (!modelView.layers.length) return null;

  return (
    <div className="pointer-events-auto flex flex-col gap-2 rounded-[20px] bg-cdp-slate-dark/85 p-3 shadow-cdp-neu-dark-raised backdrop-blur-sm">
      <p className="text-xs tracking-widest text-white/50 uppercase">Layers</p>
      {modelView.layers.map((layer) => {
        const ghosted = ghostedLayerIds.includes(layer.id);
        return (
          <button
            key={layer.id}
            aria-pressed={ghosted}
            onClick={() => toggleLayer(layer.id)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-left text-sm transition ${
              ghosted ? "text-white/40 line-through" : "text-white hover:bg-white/10"
            }`}
          >
            {layer.label}
          </button>
        );
      })}
    </div>
  );
}

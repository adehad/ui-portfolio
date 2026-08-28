import { useGLTF } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect } from "react";
import { modelUrl } from "./content";
import { sanitizeFullTransmission } from "./sanitizeModel";
import type { ModelView } from "./types";
import { useGhosting } from "./useGhosting";
import { useViewerStore } from "./useViewerStore";

export function ModelStage({ modelView }: { modelView: ModelView }) {
  const { scene } = useGLTF(modelUrl(modelView.src));
  const ghostedLayerIds = useViewerStore((s) => s.ghostedLayerIds);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    sanitizeFullTransmission(scene);
    invalidate();
  }, [scene, invalidate]);

  useGhosting(scene, modelView.layers, ghostedLayerIds, invalidate);

  return (
    <primitive
      object={scene}
      onDoubleClick={(e: ThreeEvent<MouseEvent>) => {
        if (!import.meta.env.DEV) return;
        e.stopPropagation();
        const p = e.point;
        console.log(`hotspot position: [${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)}]`);
      }}
    />
  );
}

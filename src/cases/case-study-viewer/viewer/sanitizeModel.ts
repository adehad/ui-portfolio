import type { Object3D } from "three";

interface TransmissiveMaterial {
  transmission: number;
  needsUpdate: boolean;
}

function isTransmissive(m: unknown): m is TransmissiveMaterial {
  return typeof m === "object" && m !== null && "transmission" in m;
}

/**
 * Workaround for GLBs exported with transmissionFactor=1 on every material
 * (the eye model has one "Eye Muscles" material covering the whole mesh):
 * full-surface glass refracts an empty background, so the model renders as
 * nothing. When every material is fully transmissive the export was almost
 * certainly meant to be opaque, so zero the transmission. Assets that mix
 * real glass parts with opaque bodies are left untouched.
 *
 * Duck-typed on `transmission` rather than instanceof MeshPhysicalMaterial so
 * it holds whatever material class the loader produced.
 */
export function sanitizeFullTransmission(root: Object3D): void {
  const materials: unknown[] = [];
  root.traverse((obj) => {
    const material = (obj as { material?: unknown }).material;
    if (!material) return;
    materials.push(...(Array.isArray(material) ? (material as unknown[]) : [material]));
  });
  const fullyTransmissive = materials.filter(
    (m): m is TransmissiveMaterial => isTransmissive(m) && m.transmission >= 0.99,
  );
  const sawOpaque = fullyTransmissive.length < materials.length;
  if (sawOpaque || !fullyTransmissive.length) return;
  for (const m of fullyTransmissive) {
    m.transmission = 0;
    m.needsUpdate = true;
  }
}

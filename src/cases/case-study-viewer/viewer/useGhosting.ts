import { useEffect } from "react";
import { Mesh, type Material, type Object3D } from "three";
import type { Layer } from "./types";

const GHOST_OPACITY = 0.15;

function eachLayerMesh(root: Object3D, layer: Layer, fn: (mesh: Mesh) => void) {
  for (const name of layer.nodeNames) {
    const node = root.getObjectByName(name);
    node?.traverse((child) => {
      // instanceof narrows to Mesh<any, any, any>; assert back to the default
      // type arguments so type-aware lint does not see `any` flow onward.
      if (child instanceof Mesh) fn(child as Mesh);
    });
  }
}

function toMaterialArray(material: Material | Material[]): Material[] {
  return Array.isArray(material) ? material : [material];
}

function ghostOf(material: Material): Material {
  const ghost = material.clone();
  ghost.transparent = true;
  ghost.opacity = GHOST_OPACITY;
  ghost.depthWrite = false;
  return ghost;
}

function ghostMesh(mesh: Mesh) {
  if (mesh.userData["originalMaterials"]) return;
  const original = mesh.material;
  mesh.userData["originalMaterials"] = original;
  mesh.material = Array.isArray(original) ? original.map(ghostOf) : ghostOf(original);
}

function restoreMesh(mesh: Mesh) {
  if (!mesh.userData["originalMaterials"]) return;
  for (const ghost of toMaterialArray(mesh.material)) ghost.dispose();
  mesh.material = mesh.userData["originalMaterials"] as Material | Material[];
  delete mesh.userData["originalMaterials"];
}

/**
 * Swaps ghost materials in and out for the given layers. `invalidate` is
 * called after every swap because the canvas renders on demand: a material
 * change alone schedules no frame.
 */
export function useGhosting(
  root: Object3D,
  layers: Layer[],
  ghostedLayerIds: string[],
  invalidate: () => void,
) {
  useEffect(() => {
    for (const layer of layers) {
      const ghosted = ghostedLayerIds.includes(layer.id);
      eachLayerMesh(root, layer, ghosted ? ghostMesh : restoreMesh);
    }
    invalidate();
    // Restore on cleanup so the module-cached GLTF scene never carries ghost
    // materials across unmounts; each effect re-run re-ghosts as needed.
    return () => {
      for (const layer of layers) {
        eachLayerMesh(root, layer, restoreMesh);
      }
      invalidate();
    };
  }, [root, layers, ghostedLayerIds, invalidate]);
}

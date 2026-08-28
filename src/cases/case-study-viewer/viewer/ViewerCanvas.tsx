import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";
import type { Vec3 } from "./types";

const LIGHT_POSITION: Vec3 = [5, 8, 5];
// Only a starting pose. Per-view poses are applied by <ModelScene>, because
// this Canvas is constructed once and outlives every media view.
const CAMERA = { position: [0, 0, 5] as Vec3, fov: 45 };
// Cap the drawing buffer at 1.5x CSS pixels: on a 2x display this nearly
// halves the pixels shaded per frame, which is the difference between smooth
// and stuttery orbiting on an integrated GPU.
const DPR_RANGE: [number, number] = [1, 1.5];
// preserveDrawingBuffer keeps the last frame readable after compositing.
// Under frameloop="demand" nothing redraws between snapshots, so without it a
// screenshot or canvas readback gets an empty buffer.
const GL_OPTIONS = { preserveDrawingBuffer: true };

/**
 * The renderer and its lights, created once for the page. Nothing here may be
 * keyed by the active media view: tearing the Canvas down to show a video and
 * rebuilding it on the way back would cost a fresh WebGL context and a full
 * re-upload of the GLB, and would free nothing, because R3F does not dispose
 * the object a `<primitive>` carries. Only the scene inside it unmounts, and
 * under frameloop="demand" a Canvas with no scene draws nothing.
 */
export function ViewerCanvas({ children }: { children?: ReactNode }) {
  return (
    <Canvas frameloop="demand" camera={CAMERA} dpr={DPR_RANGE} gl={GL_OPTIONS}>
      <ambientLight intensity={0.6} />
      <directionalLight position={LIGHT_POSITION} intensity={1.4} />
      {children}
    </Canvas>
  );
}

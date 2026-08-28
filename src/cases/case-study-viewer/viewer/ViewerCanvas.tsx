import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type ComponentRef } from "react";
import { CameraRig } from "./CameraRig";
import { clipPlanes } from "./fitCamera";
import { HotspotMarkers } from "./HotspotMarkers";
import { Loader } from "./Loader";
import { ModelStage } from "./ModelStage";
import type { ModelView, Vec3 } from "./types";
import { useViewerStore } from "./useViewerStore";

const LIGHT_POSITION: Vec3 = [5, 8, 5];
const FOV = 45;
// Cap the drawing buffer at 1.5x CSS pixels: on a 2x display this nearly
// halves the pixels shaded per frame, which is the difference between smooth
// and stuttery orbiting on an integrated GPU.
const DPR_RANGE: [number, number] = [1, 1.5];
// preserveDrawingBuffer keeps the last frame readable after compositing.
// Under frameloop="demand" nothing redraws between snapshots, so without it a
// screenshot or canvas readback gets an empty buffer.
const GL_OPTIONS = { preserveDrawingBuffer: true };

function distanceBetween(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function ViewerCanvas({ modelView }: { modelView: ModelView }) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const resetToken = useViewerStore((s) => s.resetToken);

  useEffect(() => {
    if (resetToken === 0) return;
    controlsRef.current?.reset();
  }, [resetToken]);

  const { position, target } = modelView.defaultCamera;
  // The stock 0.1 near plane sits inside this model's authored poses, so the
  // camera has to carry clip planes scaled to its own distance.
  const camera = useMemo(
    () => ({ position, fov: FOV, ...clipPlanes(distanceBetween(position, target)) }),
    [position, target],
  );
  const controlsTarget = useMemo(() => [...target] as Vec3, [target]);
  const loaderFallback = useMemo(() => <Loader src={modelView.src} />, [modelView.src]);

  return (
    <Canvas frameloop="demand" camera={camera} dpr={DPR_RANGE} gl={GL_OPTIONS}>
      <ambientLight intensity={0.6} />
      <directionalLight position={LIGHT_POSITION} intensity={1.4} />
      <Suspense fallback={loaderFallback}>
        <ModelStage key={modelView.id} modelView={modelView} />
        <HotspotMarkers hotspots={modelView.hotspots} />
      </Suspense>
      <OrbitControls ref={controlsRef} makeDefault target={controlsTarget} enableDamping />
      <CameraRig cameraViews={modelView.cameraViews} defaultCamera={modelView.defaultCamera} />
    </Canvas>
  );
}

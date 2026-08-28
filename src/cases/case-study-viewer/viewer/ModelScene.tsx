import { OrbitControls } from "@react-three/drei";
import { useStore } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type ComponentRef } from "react";
import { CameraRig } from "./CameraRig";
import { clipPlanes } from "./fitCamera";
import { HotspotMarkers } from "./HotspotMarkers";
import { Loader } from "./Loader";
import { ModelStage } from "./ModelStage";
import type { ModelMediaView, Vec3 } from "./types";
import { useViewerStore } from "./useViewerStore";

function distanceBetween(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * Everything inside the Canvas that belongs to one model view. Mounted only
 * while a model view is active; the Canvas itself outlives it.
 */
export function ModelScene({ mediaView }: { mediaView: ModelMediaView }) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const resetToken = useViewerStore((s) => s.resetToken);
  const store = useStore();

  const { position, target } = mediaView.defaultCamera;
  const controlsTarget = useMemo(() => [...target] as Vec3, [target]);
  const loaderFallback = useMemo(() => <Loader src={mediaView.src} />, [mediaView.src]);

  useEffect(() => {
    if (resetToken === 0) return;
    controlsRef.current?.reset();
  }, [resetToken]);

  // The Canvas is built once, so its camera prop cannot carry a per-view pose;
  // the authored one is applied here instead. The stock 0.1 near plane sits
  // inside this model's authored shots, so the clip planes have to come from
  // the pose's own distance.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const { camera, invalidate } = store.getState();
    const { near, far } = clipPlanes(distanceBetween(position, target));
    camera.position.set(...position);
    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();
    controls.target.set(...target);
    controls.update();
    controls.saveState();
    invalidate();
  }, [position, target, store]);

  return (
    <>
      <Suspense fallback={loaderFallback}>
        <ModelStage mediaView={mediaView} />
        <HotspotMarkers hotspots={mediaView.hotspots} />
      </Suspense>
      <OrbitControls ref={controlsRef} makeDefault target={controlsTarget} enableDamping />
      <CameraRig cameraViews={mediaView.cameraViews} defaultCamera={mediaView.defaultCamera} />
    </>
  );
}

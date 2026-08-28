import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import type { CameraView } from "./types";
import { useViewerStore } from "./useViewerStore";

type DefaultCamera = Pick<CameraView, "position" | "target">;

interface ControlsHandle {
  saveState?: () => void;
  target: Vector3;
  update: () => void;
}

const LERP_FACTOR = 0.08;

export function CameraRig({
  cameraViews,
  defaultCamera,
}: {
  cameraViews: CameraView[];
  /** Where to lerp back to when the active camera view returns to null. */
  defaultCamera: DefaultCamera;
}) {
  const activeId = useViewerStore((s) => s.activeCameraViewId);
  const resetToken = useViewerStore((s) => s.resetToken);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useThree((s) => s.controls) as unknown as ControlsHandle | null;
  const targetPos = useRef<Vector3 | null>(null);
  const targetLook = useRef<Vector3 | null>(null);

  useEffect(() => {
    // drei's <OrbitControls> builds its three-stdlib instance in a useMemo,
    // whose constructor calls saveState() synchronously, capturing target0 as
    // three's default (0,0,0) before React commits the `target` prop onto the
    // instance. position0 lands correctly because the camera already has its
    // final position by construction time, but target0 stays wrong, so
    // reset() would snap the look-at point to the world origin. This effect
    // runs in the same R3F commit, after the target prop has landed during
    // the mutation phase, so re-running saveState() here re-baselines it.
    controls?.saveState?.();
  }, [controls]);

  useEffect(() => {
    const resolved: DefaultCamera | undefined =
      cameraViews.find((c) => c.id === activeId) ?? (activeId === null ? defaultCamera : undefined);
    if (resolved) {
      targetPos.current = new Vector3(...resolved.position);
      targetLook.current = new Vector3(...resolved.target);
      invalidate();
    }
  }, [activeId, cameraViews, defaultCamera, invalidate]);

  useEffect(() => {
    // refresh() bumps resetToken and clears activeCameraViewId in one store
    // update, and ViewerCanvas answers resetToken by calling
    // OrbitControls.reset(), which snaps to the default instantly. That
    // effect lives in a different renderer root, so nothing orders it against
    // the effect above; cancel any queued lerp here (declared last, so it
    // runs last within the commit) and let the hard reset be the only source
    // of truth for this transition.
    if (resetToken === 0) return;
    targetPos.current = null;
    targetLook.current = null;
  }, [resetToken]);

  useFrame(({ camera }) => {
    if (!targetPos.current || !targetLook.current) return;
    camera.position.lerp(targetPos.current, LERP_FACTOR);
    controls?.target.lerp(targetLook.current, LERP_FACTOR);
    controls?.update();
    // Scale-relative arrival threshold: this model is ~0.04 world units
    // across, so a fixed world-unit distance would either never trigger or
    // snap early. 1% of the camera's distance from the origin plus a small
    // floor for near-origin targets scales across models.
    const arrive = targetPos.current.length() * 0.01 + 0.0005;
    if (camera.position.distanceTo(targetPos.current) < arrive) {
      targetPos.current = null;
      targetLook.current = null;
    } else {
      invalidate();
    }
  });

  return null;
}

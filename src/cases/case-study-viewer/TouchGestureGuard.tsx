import { useEffect } from "react";

/**
 * Suppresses iOS pinch-zoom of the page itself.
 *
 * `gesturestart`, `gesturechange` and `gestureend` are non-standard WebKit
 * events that fire once two or more fingers touch the screen. They are the
 * supported route for this on iOS: the `user-scalable=no` viewport meta is a
 * WCAG 1.4.4 failure and has been ignored by iOS Safari since iOS 10.
 *
 * Only an accidental pinch on the page is blocked. A pinch on the 3D model
 * still reaches the canvas, which owns its own gestures through
 * `touch-action: none`, and system zoom in Accessibility settings is unaffected.
 *
 * `passive: false` is required: a passive listener cannot call preventDefault,
 * and the browser ignores the attempt without warning.
 */
const GESTURE_EVENTS = ["gesturestart", "gesturechange", "gestureend"] as const;

export function TouchGestureGuard() {
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    for (const type of GESTURE_EVENTS) {
      document.addEventListener(type, block, { passive: false });
    }
    return () => {
      for (const type of GESTURE_EVENTS) {
        document.removeEventListener(type, block);
      }
    };
  }, []);

  return null;
}

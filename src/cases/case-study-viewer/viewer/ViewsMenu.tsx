import { useState } from "react";
import type { CameraView } from "./types";
import { useViewerStore } from "./useViewerStore";

/**
 * Dropdown for authored camera views: the trigger names the active view, so
 * switching gives visible feedback, and the menu lists Free orbit plus every
 * authored view with the active one highlighted.
 */
export function ViewsMenu({ cameraViews }: { cameraViews: CameraView[] }) {
  const activeCameraViewId = useViewerStore((s) => s.activeCameraViewId);
  const setCameraView = useViewerStore((s) => s.setCameraView);
  const [open, setOpen] = useState(false);

  if (!cameraViews.length) return null;

  const active = cameraViews.find((v) => v.id === activeCameraViewId);
  const options: { id: string | null; name: string }[] = [
    { id: null, name: "Free orbit" },
    ...cameraViews.map((v) => ({ id: v.id, name: v.name })),
  ];

  return (
    <div className="relative">
      <button
        aria-label="Camera views"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="cdp-glass flex h-cdp-touch-comfort cdp-pressable cursor-pointer items-center gap-2 rounded-cdp-xl px-4 text-cdp-body font-semibold text-cdp-fg"
      >
        {active ? active.name : "Views"}
        <svg
          viewBox="0 0 24 24"
          className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul className="absolute top-[68px] right-0 cdp-glass z-20 w-52 overflow-hidden rounded-cdp-2xl p-1">
          {options.map((opt) => {
            const isActive = (activeCameraViewId ?? null) === opt.id;
            return (
              <li key={opt.id ?? "free"}>
                <button
                  onClick={() => {
                    setCameraView(opt.id);
                    setOpen(false);
                  }}
                  className={`flex min-h-cdp-touch w-full cdp-pressable cursor-pointer items-center justify-between rounded-cdp-lg px-4 text-left text-cdp-body ${
                    isActive ? "font-semibold text-cdp-sector-fg" : "text-cdp-fg-muted"
                  }`}
                >
                  {opt.name}
                  {isActive && <span aria-hidden>✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

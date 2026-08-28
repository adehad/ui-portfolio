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
        className="flex cursor-pointer items-center gap-2 rounded-[15px] bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/20"
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
        <ul className="absolute top-11 right-0 z-20 w-44 overflow-hidden rounded-[15px] bg-cdp-slate-dark/95 py-1 shadow-cdp-neu-dark-raised backdrop-blur-sm">
          {options.map((opt) => {
            const isActive = (activeCameraViewId ?? null) === opt.id;
            return (
              <li key={opt.id ?? "free"}>
                <button
                  onClick={() => {
                    setCameraView(opt.id);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition ${
                    isActive ? "font-semibold text-cdp-blue" : "text-white/80 hover:bg-white/10"
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

import { create } from "zustand";

interface ViewerState {
  activeMediaViewId: string | null;
  ghostedLayerIds: string[];
  activeCameraViewId: string | null;
  openHotspotId: string | null;
  infoOpen: boolean;
  /** Incremented by refresh(); ViewerCanvas watches it to reset OrbitControls. */
  resetToken: number;
  setMediaView: (id: string) => void;
  toggleLayer: (id: string) => void;
  /** null returns to the free-orbit default pose. */
  setCameraView: (id: string | null) => void;
  openHotspot: (id: string | null) => void;
  toggleInfo: () => void;
  refresh: () => void;
}

const perViewDefaults = {
  ghostedLayerIds: [] as string[],
  activeCameraViewId: null as string | null,
  openHotspotId: null as string | null,
  infoOpen: false,
};

export const useViewerStore = create<ViewerState>((set) => ({
  activeMediaViewId: null,
  ...perViewDefaults,
  resetToken: 0,
  setMediaView: (id) => set({ activeMediaViewId: id, ...perViewDefaults }),
  toggleLayer: (id) =>
    set((s) => ({
      ghostedLayerIds: s.ghostedLayerIds.includes(id)
        ? s.ghostedLayerIds.filter((l) => l !== id)
        : [...s.ghostedLayerIds, id],
    })),
  setCameraView: (id) => set({ activeCameraViewId: id }),
  openHotspot: (id) => set({ openHotspotId: id }),
  toggleInfo: () => set((s) => ({ infoOpen: !s.infoOpen })),
  refresh: () => set((s) => ({ ...perViewDefaults, resetToken: s.resetToken + 1 })),
}));

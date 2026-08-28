import { create } from "zustand";

interface ViewerState {
  activeModelViewId: string | null;
  ghostedLayerIds: string[];
  activeCameraViewId: string | null;
  openHotspotId: string | null;
  infoOpen: boolean;
  /** Incremented by refresh(); ViewerCanvas watches it to reset OrbitControls. */
  resetToken: number;
  setModelView: (id: string) => void;
  toggleLayer: (id: string) => void;
  /** null returns to the free-orbit default pose. */
  setCameraView: (id: string | null) => void;
  openHotspot: (id: string | null) => void;
  toggleInfo: () => void;
  refresh: () => void;
}

const perModelDefaults = {
  ghostedLayerIds: [] as string[],
  activeCameraViewId: null as string | null,
  openHotspotId: null as string | null,
  infoOpen: false,
};

export const useViewerStore = create<ViewerState>((set) => ({
  activeModelViewId: null,
  ...perModelDefaults,
  resetToken: 0,
  setModelView: (id) => set({ activeModelViewId: id, ...perModelDefaults }),
  toggleLayer: (id) =>
    set((s) => ({
      ghostedLayerIds: s.ghostedLayerIds.includes(id)
        ? s.ghostedLayerIds.filter((l) => l !== id)
        : [...s.ghostedLayerIds, id],
    })),
  setCameraView: (id) => set({ activeCameraViewId: id }),
  openHotspot: (id) => set({ openHotspotId: id }),
  toggleInfo: () => set((s) => ({ infoOpen: !s.infoOpen })),
  refresh: () => set((s) => ({ ...perModelDefaults, resetToken: s.resetToken + 1 })),
}));

export type Vec3 = [number, number, number];

export interface CameraView {
  id: string;
  name: string;
  position: Vec3;
  target: Vec3;
}

export interface Layer {
  id: string;
  label: string;
  /** Names of GLB nodes that ghost together. */
  nodeNames: string[];
}

export interface Hotspot {
  id: string;
  position: Vec3;
  title: string;
  body: string;
}

export interface Chapter {
  id: string;
  name: string;
  startTime: number;
  /** Omit to run to the next chapter, or to the end of the clip. */
  endTime?: number;
}

interface MediaViewBase {
  id: string;
  name: string;
  /** Bare filename, resolved against the base URL for the view's kind. */
  src: string;
  thumbnail?: string;
  infoPrompt?: string;
}

export interface ModelMediaView extends MediaViewBase {
  kind: "model";
  /** Applied on mount. Required: nothing fits a camera to a model's bounds. */
  defaultCamera: Pick<CameraView, "position" | "target">;
  cameraViews: CameraView[];
  layers: Layer[];
  hotspots: Hotspot[];
}

export interface VideoMediaView extends MediaViewBase {
  kind: "video";
  /** Bare filename in the previews folder, used as the drawer tile and poster. */
  poster?: string;
  chapters: Chapter[];
}

/**
 * Discriminated on `kind` so camera views, layers and hotspots are only
 * reachable on the kind that can honour them, and so the stage can pick a
 * renderer without a cast.
 */
export type MediaView = ModelMediaView | VideoMediaView;

export interface CaseStudy {
  id: string;
  name: string;
  tagline: string;
  body: string;
  accent: "green" | "blue" | "orange";
  /** At least one. The viewer falls back to the first when none is active. */
  mediaViews: [MediaView, ...MediaView[]];
}

export interface Sector {
  id: string;
  name: string;
}

export interface CaseStudyRef {
  sector: Sector;
  caseStudy: CaseStudy;
}

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

export interface ModelView {
  id: string;
  name: string;
  /** Bare GLB filename, resolved against the model base URL by `modelUrl`. */
  src: string;
  thumbnail?: string;
  /** Applied on mount. Required: nothing fits a camera to a model's bounds. */
  defaultCamera: Pick<CameraView, "position" | "target">;
  cameraViews: CameraView[];
  layers: Layer[];
  hotspots: Hotspot[];
  infoPrompt?: string;
}

export interface CaseStudy {
  id: string;
  name: string;
  tagline: string;
  body: string;
  accent: "green" | "blue" | "orange";
  /** At least one. The viewer falls back to the first when none is active. */
  modelViews: [ModelView, ...ModelView[]];
}

export interface Sector {
  id: string;
  name: string;
}

export interface CaseStudyRef {
  sector: Sector;
  caseStudy: CaseStudy;
}

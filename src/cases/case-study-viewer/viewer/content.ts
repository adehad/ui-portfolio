import type { CaseStudyRef } from "./types";

const MODEL_BASE_URL = "/case-study-viewer/models";
const PREVIEW_BASE_URL = "/case-study-viewer/previews";

/** Byte sizes of the shipped GLBs, so the loader can show a percentage before
    the first progress event arrives and when the server sends no
    Content-Length. */
const MODEL_SIZES: Record<string, number | undefined> = {
  "eye-cross-section.glb": 595_516,
};

const MODEL_PREVIEWS: Record<string, string | undefined> = {
  "eye-cross-section.glb": `${PREVIEW_BASE_URL}/eye-cross-section.png`,
};

export function modelUrl(src: string): string {
  return `${MODEL_BASE_URL}/${src}`;
}

export function modelSizeBytes(src: string): number | undefined {
  return MODEL_SIZES[src];
}

export function modelPreviewUrl(src: string): string | undefined {
  return MODEL_PREVIEWS[src];
}

export const theEye: CaseStudyRef = {
  sector: { id: "drug-delivery", name: "Drug Delivery" },
  caseStudy: {
    id: "the-eye",
    name: "The Eye",
    tagline: "Precision delivery to the back of the eye.",
    body: "Detailed breakdown of the ocular delivery concept: mechanism, material choices, and design constraints. Booth staff talk over the detail — keep on-screen copy minimal.",
    accent: "green",
    modelViews: [
      {
        id: "eye-cross-section",
        name: "Cross Section",
        src: "eye-cross-section.glb",
        // Fitted to the GLB's measured world bounds, ~0.191 x 0.127 x 0.077
        // units centred on [0.006, 0.065, -0.009].
        defaultCamera: {
          position: [0.006, 0.065, 0.28],
          target: [0.006, 0.065, -0.009],
        },
        cameraViews: [
          {
            id: "front",
            name: "Front",
            position: [0.006, 0.065, 0.28],
            target: [0.006, 0.065, -0.009],
          },
          {
            id: "detail",
            name: "Detail",
            position: [0.05, 0.05, 0.12],
            target: [0.007, 0.046, -0.006],
          },
        ],
        hotspots: [
          {
            id: "retina",
            // Read off the model with ModelStage's double-click position logger.
            position: [0.007, 0.046, -0.006],
            title: "Retina",
            body: "Target site for posterior-segment delivery.",
          },
        ],
        // three's GLTFLoader sanitizes node names at load time, replacing
        // spaces with underscores, so the GLB's "Eye Cross Section" is
        // "Eye_Cross_Section" on the runtime scene graph.
        layers: [{ id: "eye-shell", label: "Eye Assembly", nodeNames: ["Eye_Cross_Section"] }],
        infoPrompt: "Spin to show the injection path. Pinch to zoom into the retina.",
      },
    ],
  },
};

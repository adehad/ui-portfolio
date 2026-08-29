import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { theEye } from "@/cases/case-study-viewer/viewer/content";
import { CaseStudyViewer } from "@/cases/case-study-viewer/viewer/CaseStudyViewer";

const meta = {
  title: "01 Case Study Viewer/Case Study Page",
  component: CaseStudyViewer,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "Case study page for The Eye. The drawer on the right lists the model views, the rail",
          "down the right edge moves the camera between saved shots, the layers button in the",
          "header ghosts the eye assembly, and the marker opens its hotspot. The canvas renders",
          "on demand, so it holds a still frame once everything has settled.",
        ].join(" "),
      },
    },
  },
} satisfies Meta<typeof CaseStudyViewer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { refData: theEye },
  play: async ({ canvasElement }) => {
    const view = within(canvasElement);
    // The hotspot marker lives inside the same <Suspense> as the model, so it
    // is the first DOM node that only exists once the GLB has resolved.
    await waitFor(() => expect(view.getByRole("button", { name: "Retina" })).toBeTruthy(), {
      timeout: 30_000,
    });
    await waitFor(() => expect(view.queryByText(/Preparing model/)).toBeNull());
  },
};

const turntable = theEye.caseStudy.mediaViews.find((mv) => mv.id === "eye-turntable");
const CHAPTER_COUNT = turntable?.kind === "video" ? turntable.chapters.length : 0;

/**
 * The second drawer entry is a video rather than a model. It opens paused on
 * its poster frame, so the snapshot is a fixed frame, and the scrub bar is
 * split into the segments of the chapter track built from the authored
 * chapters.
 */
export const VideoView: Story = {
  args: { refData: theEye },
  play: async ({ canvasElement }) => {
    const view = within(canvasElement);
    await userEvent.click(view.getByRole("button", { name: "Turntable" }));
    await waitFor(() => expect(view.getByRole("button", { name: "Play" })).toBeTruthy());
    // The chapter track is built from the duration the player reports, so a
    // segment per chapter is the proof it was built at all.
    await waitFor(() =>
      expect(canvasElement.querySelectorAll("[data-chapter]")).toHaveLength(CHAPTER_COUNT),
    );
  },
};

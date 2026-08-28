import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
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
          "Case study page for The Eye. The drawer on the right lists the model views, the Views",
          "dropdown moves the camera between saved shots, the layers button in the header ghosts",
          "the eye assembly, and the marker on the model opens its hotspot. The canvas renders on",
          "demand, so it holds a still frame once everything has settled.",
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

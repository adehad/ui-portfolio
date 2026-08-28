import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { CreatePage } from "@/cases/self-service-portal/CreatePage";
import { currentUser, userOptions } from "@/cases/self-service-portal/users";

const meta = {
  title: "02 Self-Service Portal/Create",
  component: CreatePage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "Request a new project. Requesting User, Type and Destination share the top row;",
          "the client, the group cascade, the repo and the route preview each take a full",
          "row, so a long path reads in one line. Destination picks which tree is served,",
          "and the cascade drills into it one level at a time. Anything the form would",
          "create sparkles: a name typed into a select, a cascade level with no id, and a",
          "route segment the Jenkins probe reports as absent. Submit is blocked when every",
          "segment already exists. The theme button swaps the theme class on the page root,",
          "and react-select follows it through custom properties. Submit posts nothing, it",
          "prints the request body.",
        ].join(" "),
      },
    },
  },
  args: {
    users: userOptions,
    currentUser,
  },
} satisfies Meta<typeof CreatePage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Names from the seeded tree in `groups.ts`, which is fixed across rebuilds. The
    repo is the one part typed rather than picked, so it is what sparkles. */
const CLIENT = "Considine-Volkman Group";
const GROUP = "Heavenly Halt";
const REPO = "telemetry-service";
const OWNER = "Magdalena Littel";

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByRole("checkbox", { name: "Jenkins" }));

    await userEvent.click(await canvas.findByLabelText("Client Name"));
    await userEvent.click(await canvas.findByText(CLIENT));

    await userEvent.click(await canvas.findByLabelText("Project Name"));
    await userEvent.click(await canvas.findByText(GROUP));

    const repo = await canvas.findByLabelText("Repo Name");
    await userEvent.click(repo);
    await userEvent.type(repo, REPO);
    await userEvent.click(await canvas.findByText(`Create "${REPO}"`));

    await userEvent.click(await canvas.findByLabelText("Project Owner"));
    await userEvent.click(await canvas.findByText(OWNER));

    await waitFor(() => {
      expect(canvasElement.querySelectorAll(".ssp-form-error")).toHaveLength(0);
    });
    // The repo control plus its GitLab and Jenkins route segments.
    await expect(await canvas.findAllByTestId("ssp-particle-pen")).toHaveLength(3);
  },
};

/** The form as it mounts. The cascade reports an empty resolution on mount, which
    runs the form validator before anything is touched, so the required-field
    errors are on screen from the first paint. */
export const EmptyForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Repo Name is required");
  },
};

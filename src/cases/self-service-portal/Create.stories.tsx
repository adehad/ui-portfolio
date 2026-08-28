import type { Meta, StoryObj } from "@storybook/react-vite";
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
          "Request a new project. Jenkins builds run off the GitLab project, so ticking",
          "Jenkins forces GitLab on and locks it. Project Name and Repo Name are required",
          "and at least one target has to be chosen, which is what keeps Submit disabled.",
          "The theme button swaps the theme class on the page root; react-select follows it",
          "through custom properties. Submit posts nothing, it prints the request body.",
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

export const Default: Story = {};

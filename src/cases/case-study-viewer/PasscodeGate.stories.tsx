import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { PasscodeGate } from "@/cases/case-study-viewer/PasscodeGate";
import { DEMO_PASSCODE, UNLOCK_KEY } from "@/cases/case-study-viewer/passcode";

/**
 * Runs once per mount, before PasscodeGate's own mount effect reads the key, so
 * reopening the story always shows the gate rather than a stale unlock.
 */
function StartLocked({ children }: { children: ReactNode }) {
  useState(() => localStorage.removeItem(UNLOCK_KEY));
  return <>{children}</>;
}

function ViewerHome() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-cdp-surface-0 cdp-safe cdp-root text-cdp-fg">
      <p className="text-cdp-header">Case studies</p>
      <p className="text-cdp-caption text-cdp-fg-muted">Unlocked.</p>
    </main>
  );
}

const meta = {
  title: "01 Case Study Viewer/Passcode Gate",
  component: PasscodeGate,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          `Shared passcode gate for the case study viewer. The demo passcode is ${DEMO_PASSCODE}.`,
          "Anything else shows the error state, and the eye toggles the field between password and",
          `text. A success writes ${UNLOCK_KEY} to localStorage; the story clears that key on every`,
          "mount so the gate is always the first thing you see.",
        ].join(" "),
      },
    },
  },
  decorators: [
    (Story) => (
      <StartLocked>
        <Story />
      </StartLocked>
    ),
  ],
} satisfies Meta<typeof PasscodeGate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: <ViewerHome /> },
};

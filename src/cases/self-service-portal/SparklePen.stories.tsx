import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { SparklePen } from "@/cases/self-service-portal/SparklePen";
import "@/cases/self-service-portal/theme.scss";
import { ThemePicker } from "@/cases/self-service-portal/ThemePicker";
import { ThemeWrapper } from "@/cases/self-service-portal/ThemeWrapper";

const HEADER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const STAGE_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  padding: "8rem 0",
};

const BOX_STYLE: CSSProperties = {
  minWidth: "380px",
  padding: "2rem 3rem",
  borderRadius: "4px",
  border: "2px solid var(--ssp-input-border)",
  backgroundColor: "var(--ssp-header-bkg)",
  color: "var(--ssp-font-color)",
  fontFamily: "monospace",
  fontSize: "1.6rem",
  textAlign: "center",
};

type DemoProps = {
  active: boolean;
  count: number;
  reducedMotion: boolean;
  label: string;
};

function SparklePenDemo({ active, count, reducedMotion, label }: DemoProps) {
  return (
    <ThemeWrapper>
      <main className="ssp-readable">
        <div style={HEADER_STYLE}>
          <h2>Sparkle Pen</h2>
          <ThemePicker />
        </div>
        <p>
          The overlay sits behind its children and marks a value that does not exist yet. The host
          carries the spark-coloured glow, so the stars stay attached to the control they belong to.
        </p>
        <div style={STAGE_STYLE}>
          <SparklePen active={active} count={count} reducedMotion={reducedMotion}>
            <div style={BOX_STYLE}>{label}</div>
          </SparklePen>
        </div>
      </main>
    </ThemeWrapper>
  );
}

const meta = {
  title: "03 Components/Sparkle Pen",
  component: SparklePenDemo,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "Every star gets its own position, orbit duration, phase, alpha, size, transform",
          "origin and twinkle timing, picked once per mount. The field is masked at the edges",
          "and sits at z-index -1, so the box background hides all but the halo. The fill is",
          "--ssp-spark, gold in the light theme and cyan in the dark one, and each instance",
          "rotates the hue by its index so adjacent sparkling segments read as distinct.",
          "Reduced motion drops both animations and keeps the glow.",
        ].join(" "),
      },
    },
  },
  args: {
    active: true,
    count: 20,
    reducedMotion: false,
    label: "new-repo-name",
  },
  argTypes: {
    count: { control: { type: "range", min: 4, max: 40, step: 1 } },
  },
} satisfies Meta<typeof SparklePenDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ReducedMotion: Story = {
  args: { reducedMotion: true },
};

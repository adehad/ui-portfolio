import { en, Faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type CSSProperties, useMemo, useState } from "react";
import { ScrambleText } from "@/cases/self-service-portal/ScrambleText";
import { SparklePen } from "@/cases/self-service-portal/SparklePen";
import { toGitLabSlug } from "@/cases/self-service-portal/slugs";
import "@/cases/self-service-portal/theme.scss";
import { ThemePicker } from "@/cases/self-service-portal/ThemePicker";
import { ThemeWrapper } from "@/cases/self-service-portal/ThemeWrapper";

/** Its own faker instance, seeded, rather than the global one users.ts and
    groups.ts share: the first name has to be identical on every build for
    Chromatic, and seeding the shared instance here would shift their data. */
const names = new Faker({ locale: en });
names.seed(20_240_922);

/** hacker.noun over word.noun: the pool is all infrastructure vocabulary, so
    every draw reads like something a team would really call a repository. Some
    of its entries are two words, hence the form's own slug rule. */
function nextRepoName(previous?: string): string {
  let name = previous;
  while (name === previous) {
    name = toGitLabSlug(`${names.word.adjective()} ${names.hacker.noun()}`);
  }
  return name ?? "new-repo-name";
}

const HEADER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const STAGE_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "2rem",
  padding: "7rem 0",
};

/** The chase traces --ssp-radius, so the wrapped box has to carry the same
    radius or the spark leaves the edge on every corner. 999px is a pill: CSS
    clamps a radius larger than half the box. */
const SHAPE_RADIUS = {
  square: 0,
  rounded: 4,
  soft: 18,
  pill: 999,
} as const;

type Shape = keyof typeof SHAPE_RADIUS;

const BOX_STYLE: CSSProperties = {
  padding: "1.6rem 3rem",
  border: "2px solid var(--ssp-input-border)",
  backgroundColor: "var(--ssp-header-bkg)",
  color: "var(--ssp-font-color)",
  fontSize: "1.6rem",
  textAlign: "center",
};

const LABEL_STYLE: CSSProperties = {
  display: "block",
  marginBottom: "0.6rem",
  color: "var(--ssp-font-color-secondary)",
  fontSize: "0.8rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const BUTTON_STYLE: CSSProperties = {
  padding: "0.5rem 1.4rem",
  borderRadius: "3px",
  border: "none",
  backgroundColor: "var(--ssp-btn-bkg)",
  color: "var(--ssp-btn-text)",
  fontSize: "0.95rem",
  fontWeight: 600,
  cursor: "pointer",
};

type DemoProps = {
  active: boolean;
  chase: boolean;
  count: number;
  starScale: number;
  duration: number;
  reducedMotion: boolean;
  shape: Shape;
  width: number;
  chaseWidth: number;
  chaseInset: number;
  chasePeriod: number;
};

function SparklePenDemo({
  active,
  chase,
  count,
  starScale,
  duration,
  reducedMotion,
  shape,
  width,
  chaseWidth,
  chaseInset,
  chasePeriod,
}: DemoProps) {
  const [name, setName] = useState(nextRepoName);
  const [running, setRunning] = useState(false);

  /** Custom properties inherit, so the stage can shape the pen and its ring
      without the component taking a style prop. */
  const shapeStyle = useMemo(
    () =>
      ({
        "--ssp-radius": `${SHAPE_RADIUS[shape]}px`,
        "--ssp-chase-width": `${chaseWidth}px`,
        "--ssp-chase-inset": `${chaseInset}px`,
        "--ssp-chase-period": `${chasePeriod}s`,
        ...STAGE_STYLE,
      }) as CSSProperties,
    [shape, chaseWidth, chaseInset, chasePeriod],
  );

  const boxStyle = useMemo<CSSProperties>(
    () => ({ ...BOX_STYLE, width: `${width}px`, borderRadius: `${SHAPE_RADIUS[shape]}px` }),
    [shape, width],
  );

  return (
    <ThemeWrapper>
      <main className="ssp-readable">
        <div style={HEADER_STYLE}>
          <h2>Sparkle Pen</h2>
          <ThemePicker />
        </div>
        <p>
          The overlay sits behind its children and marks a value that does not exist yet. The host
          carries the spark-coloured glow, so the stars stay attached to the control they belong to,
          and a spark chases the edge to keep the mark visible once the field settles into the
          background.
        </p>
        <p>
          Randomise picks a fresh repository name and hands it to the reveal, which churns the
          characters through a glyph pool and locks them in left to right. The pen quickens its
          chase while a reveal plays.
        </p>
        <div style={shapeStyle}>
          <SparklePen
            active={active}
            chase={chase}
            working={running}
            count={count}
            starScale={starScale}
            reducedMotion={reducedMotion}
            seedKey="sparkle-pen-demo"
          >
            <div style={boxStyle}>
              <span style={LABEL_STYLE}>repository</span>
              <ScrambleText
                value={name}
                duration={duration}
                reducedMotion={reducedMotion}
                onRunningChange={setRunning}
              />
            </div>
          </SparklePen>
          <button
            type="button"
            style={BUTTON_STYLE}
            onClick={() => setName((current) => nextRepoName(current))}
          >
            Randomise
          </button>
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
          "and sits at z-index -1, so the box background hides all but the halo; this demo runs",
          "the stars at twice their in-form size to make one visible on its own. The chase is a",
          "conic gradient masked down to a ring that sits --ssp-chase-inset outside the host and",
          "carries the host's own --ssp-radius plus that inset. Its angle is computed from a",
          "linear 0 to 1 through clamp, sin, cos and atan2, which evens out the spark's speed",
          "along a wide border. Measured in Chrome on this card, the spot runs 95 to 930 px/s",
          "where a plain angle sweep spans about 12x. The fill is --ssp-spark, gold in the light",
          "theme and cyan in the dark",
          "one, and each instance rotates the hue by its index so adjacent sparkling segments",
          "read as distinct. Reduced motion drops the animations, flattens the chase to an even",
          "outline, and snaps the reveal straight to its value. The shape, width, thickness and",
          "inset controls are there because the chase is mostly a story about edges: a pill shows",
          "the spark sweeping one continuous arc, a square edge shows it turning corners.",
        ].join(" "),
      },
    },
  },
  args: {
    active: true,
    chase: true,
    count: 20,
    starScale: 2,
    duration: 1600,
    reducedMotion: false,
    shape: "pill",
    width: 420,
    chaseWidth: 2,
    chaseInset: 2,
    chasePeriod: 3.6,
  },
  argTypes: {
    count: { control: { type: "range", min: 4, max: 40, step: 1 } },
    starScale: { control: { type: "range", min: 0.5, max: 4, step: 0.1 } },
    duration: { control: { type: "range", min: 400, max: 4000, step: 100 } },
    shape: { control: { type: "inline-radio" }, options: ["square", "rounded", "soft", "pill"] },
    width: { control: { type: "range", min: 260, max: 640, step: 10 } },
    chaseWidth: { control: { type: "range", min: 1, max: 8, step: 0.5 } },
    chaseInset: { control: { type: "range", min: 0, max: 10, step: 0.5 } },
    chasePeriod: { control: { type: "range", min: 0.4, max: 8, step: 0.2 } },
  },
} satisfies Meta<typeof SparklePenDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ReducedMotion: Story = {
  args: { reducedMotion: true },
};

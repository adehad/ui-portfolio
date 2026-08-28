import {
  MuteButton,
  PlayButton,
  Time,
  TimeSlider,
  useMediaRemote,
  useMediaState,
} from "@vidstack/react";

const ICON_CLASS = "size-6";
const BUTTON_CLASS =
  "flex size-cdp-touch cdp-pressable cursor-pointer items-center justify-center rounded-cdp-lg text-cdp-fg";

/**
 * Rendered inside <MediaPlayer>, so the hooks resolve the player from context.
 * Fullscreen targets the provider, the <video> element itself, rather than the
 * panel: iPadOS draws chapter markers from the chapters TextTrack in its own
 * scrubber, and a video view carries no hotspots to keep on screen.
 */
export function VideoControls() {
  const remote = useMediaRemote();
  const paused = useMediaState("paused");
  const muted = useMediaState("muted");

  return (
    // In flow below the picture rather than overlaid on it: over a bright
    // frame the scrub bar and the buttons stop being readable. Opaque and
    // raised, because the CDP watermark sits at the panel's bottom right and
    // otherwise shows through.
    <div className="relative z-10 mt-3 flex w-full shrink-0 items-center gap-3 rounded-cdp-xl border border-cdp-line bg-cdp-surface-1 px-3 py-1 shadow-cdp-e2">
      <PlayButton aria-label={paused ? "Play" : "Pause"} className={BUTTON_CLASS}>
        <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="currentColor" aria-hidden="true">
          {paused ? <path d="M8 5v14l11-7z" /> : <path d="M6 5h4v14H6zm8 0h4v14h-4z" />}
        </svg>
      </PlayButton>

      <TimeSlider.Root className="group relative inline-flex h-cdp-touch flex-1 cursor-pointer touch-none items-center select-none">
        <TimeSlider.Chapters className="relative flex h-full w-full items-center">
          {(cues, forwardRef) =>
            cues.map((cue) => (
              <div
                key={cue.startTime}
                ref={forwardRef}
                data-chapter
                className="relative mr-0.5 flex h-full w-full items-center last:mr-0"
              >
                <TimeSlider.Track className="relative z-0 h-1.5 w-full rounded-full bg-cdp-surface-3">
                  <TimeSlider.TrackFill className="absolute z-20 h-full w-[var(--chapter-fill)] rounded-full bg-cdp-sector" />
                  {/* Its width is how much of the mp4 has arrived, which is not
                      settled at snapshot time, and Chrome throttles buffering on
                      a paused video so there is no full-buffer state to wait for.
                      Chromatic ignores this element alone, leaving the rest of the
                      bar under visual regression. */}
                  <TimeSlider.Progress
                    data-chromatic="ignore"
                    className="absolute z-10 h-full w-[var(--chapter-progress)] rounded-full bg-cdp-fg-subtle"
                  />
                </TimeSlider.Track>
              </div>
            ))
          }
        </TimeSlider.Chapters>
        <TimeSlider.Preview
          className="pointer-events-none flex flex-col items-center opacity-0 transition-opacity data-[visible]:opacity-100"
          noClamp
        >
          <TimeSlider.ChapterTitle className="text-cdp-caption font-semibold text-cdp-fg" />
          <TimeSlider.Value className="rounded-cdp-sm bg-cdp-surface-0/90 px-2 py-px text-cdp-caption text-cdp-fg tabular-nums" />
        </TimeSlider.Preview>
        <TimeSlider.Thumb className="absolute top-1/2 left-[var(--slider-fill)] z-30 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cdp-fg opacity-0 transition-opacity group-data-[active]:opacity-100" />
      </TimeSlider.Root>

      {/* flex, not inline text: Vidstack's Time renders a block element, so
          "current / duration" stacks onto three lines as plain children. */}
      <span className="flex shrink-0 items-center gap-1 text-cdp-caption text-cdp-fg-muted tabular-nums">
        <Time type="current" />
        <span aria-hidden>/</span>
        <Time type="duration" />
      </span>

      <MuteButton aria-label={muted ? "Unmute" : "Mute"} className={BUTTON_CLASS}>
        <svg viewBox="0 0 24 24" className={ICON_CLASS} fill="currentColor" aria-hidden="true">
          {muted ? (
            <path d="M4 9v6h4l5 5V4L8 9H4zm12.5 3-2.7-2.7 1.4-1.4 2.7 2.7 2.7-2.7 1.4 1.4-2.7 2.7 2.7 2.7-1.4 1.4-2.7-2.7-2.7 2.7-1.4-1.4 2.7-2.7z" />
          ) : (
            <path d="M4 9v6h4l5 5V4L8 9H4zm12 3a4 4 0 0 0-2-3.46v6.92A4 4 0 0 0 16 12z" />
          )}
        </svg>
      </MuteButton>

      <button
        aria-label="Fullscreen"
        onClick={() => remote.enterFullscreen("provider")}
        className={BUTTON_CLASS}
      >
        <svg
          viewBox="0 0 24 24"
          className={ICON_CLASS}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </button>
    </div>
  );
}

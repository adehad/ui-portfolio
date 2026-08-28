import type { Chapter } from "../types";

function pad(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}

function timestamp(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const whole = Math.floor(clamped);
  const ms = Math.round((clamped - whole) * 1000);
  return `${pad(Math.floor(whole / 3600))}:${pad(Math.floor((whole % 3600) / 60))}:${pad(whole % 60)}.${pad(ms, 3)}`;
}

/**
 * WebVTT chapter track built from a video view's authored chapters. Vidstack
 * draws the scrub bar's segments from a chapters TextTrack, so the chapters
 * have to become a real VTT document; the caller turns this into a Blob URL
 * rather than shipping a file per video. A chapter with no endTime runs to the
 * next chapter's start, and the last one runs to `duration`.
 */
export function chaptersToVtt(chapters: Chapter[], duration: number): string {
  const ordered = chapters.toSorted((a, b) => a.startTime - b.startTime);
  const cues = ordered.map((chapter, index) => {
    const nextStart = ordered[index + 1]?.startTime ?? duration;
    const end = Math.min(chapter.endTime ?? nextStart, duration);
    return `${chapter.id}\n${timestamp(chapter.startTime)} --> ${timestamp(end)}\n${chapter.name}`;
  });
  return cues.length === 0 ? "WEBVTT\n" : `WEBVTT\n\n${cues.join("\n\n")}\n`;
}

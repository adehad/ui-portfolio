import { describe, expect, it } from "vitest";
import { chaptersToVtt } from "./chaptersVtt";

const chapter = (id: string, startTime: number, endTime?: number) => ({
  id,
  name: `Chapter ${id}`,
  startTime,
  ...(endTime === undefined ? {} : { endTime }),
});

describe("chaptersToVtt", () => {
  it("runs each chapter to the next one's start", () => {
    expect(chaptersToVtt([chapter("a", 0), chapter("b", 30)], 90)).toBe(
      [
        "WEBVTT",
        "",
        "a",
        "00:00:00.000 --> 00:00:30.000",
        "Chapter a",
        "",
        "b",
        "00:00:30.000 --> 00:01:30.000",
        "Chapter b",
        "",
      ].join("\n"),
    );
  });

  it("honours an explicit endTime", () => {
    expect(chaptersToVtt([chapter("a", 0, 12.5)], 90)).toContain("00:00:00.000 --> 00:00:12.500");
  });

  it("clamps an endTime past the end of the video", () => {
    expect(chaptersToVtt([chapter("a", 0, 500)], 90)).toContain("00:00:00.000 --> 00:01:30.000");
  });

  it("sorts chapters by start time regardless of authored order", () => {
    const vtt = chaptersToVtt([chapter("b", 30), chapter("a", 0)], 90);
    expect(vtt.indexOf("Chapter a")).toBeLessThan(vtt.indexOf("Chapter b"));
    expect(vtt).toContain("00:00:00.000 --> 00:00:30.000");
  });

  it("formats past an hour", () => {
    expect(chaptersToVtt([chapter("a", 3725.25)], 3800)).toContain("01:02:05.250 -->");
  });

  it("returns a header-only track for no chapters", () => {
    expect(chaptersToVtt([], 90)).toBe("WEBVTT\n");
  });

  it("does not mutate the chapters it was given", () => {
    const chapters = [chapter("b", 30), chapter("a", 0)];
    chaptersToVtt(chapters, 90);
    expect(chapters.map((c) => c.id)).toEqual(["b", "a"]);
  });
});

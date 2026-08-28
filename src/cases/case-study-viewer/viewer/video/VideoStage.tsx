import { MediaPlayer, MediaProvider, Track, useMediaRemote, useMediaState } from "@vidstack/react";
import "@vidstack/react/player/styles/base.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { mediaUrl, previewUrl } from "../content";
import { StageError } from "../StageError";
import type { VideoMediaView } from "../types";
import { useViewerStore } from "../useViewerStore";
import { chaptersToVtt } from "./chaptersVtt";
import { VideoControls } from "./VideoControls";

/**
 * Bridges the player's state to the viewer store. Lives inside <MediaPlayer>
 * so the hooks resolve the player from context rather than needing a ref
 * threaded through.
 */
function PlaybackSync({
  onDuration,
  onError,
}: {
  onDuration: (duration: number) => void;
  onError: () => void;
}) {
  const remote = useMediaRemote();
  const duration = useMediaState("duration");
  const error = useMediaState("error");
  const resetToken = useViewerStore((s) => s.resetToken);

  useEffect(() => {
    if (Number.isFinite(duration) && duration > 0) onDuration(duration);
  }, [duration, onDuration]);

  useEffect(() => {
    if (error) onError();
  }, [error, onError]);

  // Reset means a clean slate for the next visitor, not "play it again": back
  // to the start, paused, out of fullscreen. Token 0 is the untouched state a
  // video view already mounts in.
  useEffect(() => {
    if (resetToken === 0) return;
    remote.pause();
    remote.seek(0);
    remote.exitFullscreen();
  }, [resetToken, remote]);

  return null;
}

export function VideoStage({
  mediaView,
  drawerOpen,
}: {
  mediaView: VideoMediaView;
  drawerOpen: boolean;
}) {
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const src = useMemo(
    () => ({
      src: attempt === 0 ? mediaUrl(mediaView.src) : `${mediaUrl(mediaView.src)}?retry=${attempt}`,
      type: "video/mp4" as const,
    }),
    [mediaView.src, attempt],
  );

  // The track cannot be built until the duration is known, because the last
  // chapter runs to the end of the clip. Built here rather than shipped as a
  // .vtt file so the chapters stay authored alongside the rest of the content.
  const chaptersUrl = useMemo(() => {
    if (!mediaView.chapters.length || duration <= 0) return undefined;
    const vtt = chaptersToVtt(mediaView.chapters, duration);
    return URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
  }, [mediaView.chapters, duration]);

  useEffect(() => {
    return () => {
      if (chaptersUrl) URL.revokeObjectURL(chaptersUrl);
    };
  }, [chaptersUrl]);

  const onError = useCallback(() => setFailed(true), []);

  const onRetry = useCallback(() => {
    setFailed(false);
    setDuration(0);
    setAttempt((a) => a + 1);
  }, []);

  if (failed) {
    return (
      <StageError
        title="Video failed to load"
        detail="The clip could not be fetched. Retry, or pick another view from the drawer."
        onRetry={onRetry}
      />
    );
  }

  return (
    // top-24 clears the panel's control row, and the right edge reserves the
    // drawer's width so an open drawer shrinks the picture instead of painting
    // over the end of the control bar. The drawer is a later sibling at the
    // same z-index, so it would win.
    <div
      className={`absolute top-24 bottom-6 left-6 flex flex-col ${
        drawerOpen
          ? "right-[calc(var(--spacing-cdp-drawer)+var(--spacing-cdp-touch))]"
          : "right-cdp-touch"
      }`}
    >
      <MediaPlayer
        className="flex h-full w-full flex-col"
        src={src}
        title={mediaView.name}
        poster={mediaView.poster ? previewUrl(mediaView.poster) : undefined}
        muted
        playsInline
        load="eager"
        viewType="video"
        streamType="on-demand"
      >
        <MediaProvider className="min-h-0 w-full flex-1">
          {chaptersUrl && <Track kind="chapters" src={chaptersUrl} lang="en-US" default />}
        </MediaProvider>
        <PlaybackSync onDuration={setDuration} onError={onError} />
        <VideoControls />
      </MediaPlayer>
    </div>
  );
}

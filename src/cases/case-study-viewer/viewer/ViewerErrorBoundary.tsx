import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /**
   * Runs before the remount. suspend-react, behind drei's useGLTF, caches
   * thrown errors, so without evicting the failed cache entry a remount would
   * synchronously re-throw the cached error instead of re-attempting the load.
   */
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  /** Bumped on retry so children remount fresh under a new key. */
  attempt: number;
}

/**
 * Catches render and load errors from the viewer canvas, so a visitor sees a
 * retry button rather than a dead page needing a full reload. Retry bumps a
 * key to remount the whole subtree, which re-triggers the Suspense load from
 * scratch.
 */
export class ViewerErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, attempt: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown): void {
    console.warn("[viewer] canvas crashed, showing retry panel", error);
  }

  retry = (): void => {
    this.props.onRetry?.();
    this.setState((s) => ({ hasError: false, attempt: s.attempt + 1 }));
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-8">
          <div className="flex flex-col items-center gap-5 rounded-cdp-2xl border border-cdp-line bg-cdp-surface-1 p-10 text-center">
            <p className="text-cdp-title font-semibold text-cdp-fg">Model failed to load</p>
            {/* Read at arm's length mid-conversation, so the panel states the
                recovery rather than only the failure. */}
            <p className="max-w-[34ch] text-cdp-body text-cdp-fg-muted">
              The 3D model could not be fetched. Retry, or go back and pick another case study.
            </p>
            <button
              onClick={this.retry}
              className="h-cdp-touch-comfort cdp-pressable cursor-pointer rounded-cdp-xl border border-transparent bg-cdp-blue px-8 text-cdp-body font-semibold text-cdp-slate-dark"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return (
      <div key={this.state.attempt} className="h-full">
        {this.props.children}
      </div>
    );
  }
}

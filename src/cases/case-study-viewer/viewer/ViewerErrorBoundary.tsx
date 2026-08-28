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
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-cdp-slate-dark p-8 text-center">
            <p className="text-sm text-white/70">Model failed to load</p>
            <button
              onClick={this.retry}
              className="cursor-pointer rounded-lg bg-white px-5 py-2 text-sm font-semibold text-cdp-slate hover:bg-white/80"
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

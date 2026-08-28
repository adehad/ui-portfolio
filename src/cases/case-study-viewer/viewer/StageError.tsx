export function StageError({
  title,
  detail,
  onRetry,
}: {
  title: string;
  detail: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-5 rounded-cdp-2xl border border-cdp-line bg-cdp-surface-1 p-10 text-center">
        <p className="text-cdp-title font-semibold text-cdp-fg">{title}</p>
        {/* Read at arm's length mid-conversation, so the panel states the
            recovery rather than only the failure. */}
        <p className="max-w-[34ch] text-cdp-body text-cdp-fg-muted">{detail}</p>
        <button
          onClick={onRetry}
          className="h-cdp-touch-comfort cdp-pressable cursor-pointer rounded-cdp-xl border border-transparent bg-cdp-blue px-8 text-cdp-body font-semibold text-cdp-slate-dark"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

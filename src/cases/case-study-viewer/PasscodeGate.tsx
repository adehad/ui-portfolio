import { type ReactNode, type SubmitEvent, useEffect, useState } from "react";
import logo from "@/cases/case-study-viewer/brand/cdp-logo-full-white.svg";
import { EyeIcon } from "@/cases/case-study-viewer/EyeIcon";
import { checkPasscode, UNLOCK_KEY } from "@/cases/case-study-viewer/passcode";

export function PasscodeGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"checking" | "locked" | "unlocked">("checking");
  const [error, setError] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);

  useEffect(() => {
    // Render stays pure: localStorage is read only after mount, and "checking"
    // holds the first paint so an unlocked visitor never sees a flash of the gate.
    // oxlint-disable-next-line react/set-state-in-effect
    setState(localStorage.getItem(UNLOCK_KEY) === "1" ? "unlocked" : "locked");
  }, []);

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = new FormData(e.currentTarget).get("passcode");
    if (typeof input === "string" && (await checkPasscode(input))) {
      localStorage.setItem(UNLOCK_KEY, "1");
      setState("unlocked");
    } else {
      setError(true);
    }
  }

  if (state === "unlocked") return <>{children}</>;
  if (state === "checking") return null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cdp-surface-0 cdp-safe cdp-root">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="flex w-full max-w-[420px] flex-col gap-8 rounded-cdp-2xl border border-cdp-line bg-cdp-surface-1 p-10"
      >
        <img src={logo} alt="Cambridge Design Partnership" className="h-20 w-auto self-center" />

        <div className="relative flex flex-col gap-2">
          {/* A placeholder disappears the moment the user types, taking the only
              description of the field with it. */}
          <label htmlFor="passcode" className="text-cdp-caption font-semibold text-cdp-fg-muted">
            Passcode
          </label>
          <div className="relative">
            <input
              id="passcode"
              name="passcode"
              type={showPasscode ? "text" : "password"}
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              // kiosk unlock screen; the passcode field is the only input
              // oxlint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              aria-label="Passcode"
              aria-invalid={error}
              onChange={() => setError(false)}
              className="h-cdp-touch-comfort w-full rounded-cdp-xl border border-cdp-line bg-cdp-surface-2 pr-cdp-touch-comfort pl-5 text-cdp-body text-cdp-fg outline-none focus-visible:border-cdp-sector-edge"
            />
            <button
              type="button"
              aria-label={showPasscode ? "Hide passcode" : "Show passcode"}
              aria-pressed={showPasscode}
              onClick={() => setShowPasscode((v) => !v)}
              className="absolute top-1/2 right-0 flex size-cdp-touch-comfort -translate-y-1/2 cdp-pressable items-center justify-center rounded-cdp-xl text-cdp-fg-subtle"
            >
              <EyeIcon className="h-4 w-6" />
            </button>
          </div>
          {/* aria-live so the failure is announced, not only recoloured. */}
          <p aria-live="polite" className="absolute top-full mt-2 text-cdp-caption text-cdp-orange">
            {error ? "Wrong passcode" : ""}
          </p>
        </div>

        <button
          type="submit"
          className="h-cdp-touch-comfort w-full cdp-pressable cursor-pointer rounded-cdp-xl bg-cdp-blue text-cdp-body font-semibold text-cdp-slate-dark"
        >
          Unlock
        </button>
      </form>
    </main>
  );
}

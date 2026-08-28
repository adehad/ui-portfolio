import { type ReactNode, type SubmitEvent, useEffect, useState } from "react";
import logo from "@/cases/case-study-viewer/brand/cdp-logo-full-grey.svg";
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
    <main className="flex min-h-dvh items-center justify-center bg-cdp-grey p-6 cdp-root">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="flex w-full max-w-md flex-col items-center gap-8 rounded-[91px] bg-cdp-grey px-10 py-16 shadow-cdp-neu-raised-lg"
      >
        <img src={logo} alt="Cambridge Design Partnership" className="h-20 w-auto" />
        <div className="relative mt-4 w-full max-w-xs">
          <input
            name="passcode"
            type={showPasscode ? "text" : "password"}
            // kiosk unlock screen; the passcode field is the only input
            // oxlint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            placeholder="PASSCODE"
            aria-label="Passcode"
            className="h-[49px] w-full rounded-full bg-cdp-grey px-6 text-sm text-cdp-slate shadow-cdp-neu-inset outline-none placeholder:text-xs placeholder:tracking-wide placeholder:text-cdp-slate/45"
          />
          <button
            type="button"
            aria-label={showPasscode ? "Hide passcode" : "Show passcode"}
            onClick={() => setShowPasscode((v) => !v)}
            className="absolute top-1/2 right-5 -translate-y-1/2 text-cdp-slate opacity-25"
          >
            <EyeIcon className="h-4 w-6" />
          </button>
        </div>
        {error && <p className="-my-4 text-sm text-cdp-orange">Wrong passcode</p>}
        <button
          type="submit"
          className="h-[49px] w-full max-w-xs cursor-pointer rounded-full bg-cdp-blue text-xl font-light text-white shadow-cdp-neu-raised transition active:shadow-cdp-neu-inset"
        >
          Sign In
        </button>
      </form>
    </main>
  );
}

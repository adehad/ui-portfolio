export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const UNLOCK_KEY = "cdp-viewer-unlocked";

export const DEMO_PASSCODE = "1234";

/** SHA-256 of DEMO_PASSCODE, baked in so the story runs with no environment setup. */
const DEMO_PASSCODE_HASH = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";

/**
 * crypto.subtle is only defined in a secure context, so a built Storybook has to
 * be served over http://localhost or https. Opening index.html from file:// throws.
 */
export async function checkPasscode(input: string): Promise<boolean> {
  return (await sha256Hex(input)) === DEMO_PASSCODE_HASH;
}

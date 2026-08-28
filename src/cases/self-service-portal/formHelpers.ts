/** The provisioning systems this form can target. */
export type BuildType = "gitlab" | "jenkins";

/** What a submit reports back to the page. */
export type SubmittedBuild = { target: BuildType; body: string };

/** Field names that travel as build parameters rather than in the request body. */
const TARGET_FLAGS = new Set(["provisionGitlab", "provisionJenkins"]);

/** The request body the form would post, url-encoded. Nothing leaves the page, so
    the page prints this instead. */
export function toRequestBody(payload: Record<string, unknown>): string {
  const encoded = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (!TARGET_FLAGS.has(key)) encoded.append(key, String(value));
  }
  return encoded.toString();
}

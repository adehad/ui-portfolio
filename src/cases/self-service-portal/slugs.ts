/** Client-side mirrors of the path rules the provisioning systems apply. They are
    informational: the server owns the real slugification. The regex and the GitLab
    slug are also what the form validator rejects on, so a name that would fail at
    GitLab never reaches submit. */

export const toGitLabSlug = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

export const toJenkinsName = (name: string): string => name.trim().replace(/\s+/g, "-");

/** A GitLab path segment starts and ends alphanumeric, with hyphens inside.
    Anything else fails mid-chain at GitLab. */
export const GITLAB_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

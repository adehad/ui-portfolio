export type User = {
  displayName: string;
  initials: string;
  email: string;
  givenName: string;
  surname: string;
  jobTitle: string;
  id: string;
};

export type Option = {
  label: string;
  value: string;
};

/** One row of the group and repo listings: minimal id and display name. */
export type GitLabGroupSummary = {
  id: number;
  name: string;
};

export type GitLabRepoSummary = GitLabGroupSummary;

/** One group nested under a client at any depth. parentId links it to its parent
    so the cascade can rebuild an ancestor chain from a deep pick; breadcrumb is
    the display path used to label deep search results. */
export type GitLabDescendantGroup = {
  id: number;
  name: string;
  parentId: number | null;
  breadcrumb: string;
};

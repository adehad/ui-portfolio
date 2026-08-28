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

export type BuildParameters = {
  REQUESTING_USER: string;
  IS_GITLAB: boolean;
  IS_JENKINS: boolean;
  PROJECT_NAME: string;
  REPO_NAME: string;
  CLIENT_NAME: string;
  IS_CCSM: boolean;
  PROJECT_OWNER: string;
  PROJECT_ADMINS: string[];
  PROJECT_DEVELOPERS: string[];
};

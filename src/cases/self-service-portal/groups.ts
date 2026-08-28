import { faker } from "@faker-js/faker";
import type { Destination } from "@/cases/self-service-portal/destinations";
import { toJenkinsName } from "@/cases/self-service-portal/slugs";
import type {
  GitLabDescendantGroup,
  GitLabGroupSummary,
  GitLabRepoSummary,
} from "@/cases/self-service-portal/types";

/** The seed users.ts uses, so the whole fixture regenerates identically. Chromatic
    diffs pixels, and a tree that reshuffled would read as a design change. */
const SEED = 20_240_922;

/** Top-level groups per destination. The client trees are wider than the internal one. */
const CLIENTS: Record<Destination, number> = { internal: 4, project: 6, ccsm: 3 };

type GroupNode = {
  id: number;
  name: string;
  /** null for a top-level group, which the form calls the client. */
  parentId: number | null;
  destination: Destination;
};

type RepoNode = { id: number; name: string; groupId: number };

type Tree = {
  groups: GroupNode[];
  repos: RepoNode[];
  /** Group ids whose Jenkins folder already exists, and repo ids with a job. */
  jenkinsGroups: Set<number>;
  jenkinsRepos: Set<number>;
};

const titleCase = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

function buildTree(): Tree {
  faker.seed(SEED);

  const groups: GroupNode[] = [];
  const repos: RepoNode[] = [];
  const jenkinsGroups = new Set<number>();
  const jenkinsRepos = new Set<number>();
  const takenNames = new Set<string>();
  let nextId = 100;

  const unique = (make: () => string): string => {
    let name = make();
    let suffix = 1;
    while (takenNames.has(name.toLowerCase())) {
      suffix += 1;
      name = `${make()} ${suffix}`;
    }
    takenNames.add(name.toLowerCase());
    return name;
  };

  const groupName = () =>
    unique(() => `${titleCase(faker.word.adjective())} ${titleCase(faker.word.noun())}`);
  const clientName = (destination: Destination) =>
    destination === "internal" ? groupName() : unique(() => faker.company.name());
  const repoName = () =>
    unique(() => `${faker.word.adjective()}-${faker.word.noun()}`).toLowerCase();

  const addGroup = (name: string, parentId: number | null, destination: Destination): GroupNode => {
    const group: GroupNode = { id: nextId++, name, parentId, destination };
    groups.push(group);
    // Every group that exists in GitLab has a matching Jenkins folder, because
    // the portal creates both together.
    jenkinsGroups.add(group.id);
    return group;
  };

  const addRepos = (group: GroupNode, count: number) => {
    for (let i = 0; i < count; i++) {
      const repo: RepoNode = { id: nextId++, name: repoName(), groupId: group.id };
      repos.push(repo);
      // Only the first repo of a group has a Jenkins job, so most complete
      // routes still have a segment that will be newly created.
      if (i === 0) jenkinsRepos.add(repo.id);
    }
  };

  for (const destination of ["internal", "project", "ccsm"] as const) {
    for (let c = 0; c < CLIENTS[destination]; c++) {
      const client = addGroup(clientName(destination), null, destination);

      for (let p = 0; p < faker.number.int({ min: 2, max: 3 }); p++) {
        const project = addGroup(groupName(), client.id, destination);
        addRepos(project, faker.number.int({ min: 1, max: 3 }));

        for (let s = 0; s < faker.number.int({ min: 0, max: 2 }); s++) {
          const subgroup = addGroup(groupName(), project.id, destination);
          addRepos(subgroup, faker.number.int({ min: 1, max: 2 }));

          if (faker.number.int({ min: 0, max: 2 }) === 0) {
            const nested = addGroup(groupName(), subgroup.id, destination);
            addRepos(nested, 1);
          }
        }
      }
    }
  }

  return { groups, repos, jenkinsGroups, jenkinsRepos };
}

const tree = buildTree();

const byId = new Map(tree.groups.map((group) => [group.id, group]));

const toSummary = ({ id, name }: GroupNode | RepoNode): GitLabGroupSummary => ({ id, name });

/** Ancestor chain from the top-level group down to this one, display names. */
function chainOf(group: GroupNode): string[] {
  const segments: string[] = [];
  let current: GroupNode | undefined = group;
  while (current) {
    segments.unshift(current.name);
    current = current.parentId === null ? undefined : byId.get(current.parentId);
  }
  return segments;
}

/** Top-level groups of one destination tree. Each destination is a separate root,
    so switching the selector serves a different list. */
export function clientsFor(destination: Destination): GitLabGroupSummary[] {
  return tree.groups
    .filter((group) => group.destination === destination && group.parentId === null)
    .map(toSummary);
}

/** Direct children of a group. Empty for a group that does not exist yet. */
export function childGroupsOf(parentId: number | null): GitLabGroupSummary[] {
  if (parentId === null) return [];
  return tree.groups.filter((group) => group.parentId === parentId).map(toSummary);
}

/** Every group nested under a client at any depth, carrying the parent link the
    cascade walks to rebuild an ancestor chain and the display path that labels a
    deep search result. */
export function descendantsOf(clientId: number | null): GitLabDescendantGroup[] {
  if (clientId === null) return [];

  const isUnder = (group: GroupNode): boolean => {
    let current: GroupNode | undefined = group;
    while (current?.parentId != null) {
      if (current.parentId === clientId) return true;
      current = byId.get(current.parentId);
    }
    return false;
  };

  return tree.groups.filter(isUnder).map((group) => ({
    id: group.id,
    name: group.name,
    parentId: group.parentId,
    breadcrumb: chainOf(group).slice(1).join(" / "),
  }));
}

/** Repos inside a group. Empty while the group is one the form would create. */
export function reposOf(groupId: number | null): GitLabRepoSummary[] {
  if (groupId === null) return [];
  return tree.repos.filter((repo) => repo.groupId === groupId).map(toSummary);
}

const jenkinsKey = (destination: Destination, names: string[]): string =>
  `${destination}/${names.map(toJenkinsName).join("/")}`.toLowerCase();

/** Jenkins folder paths that already exist, keyed by destination and the
    hyphenated name chain below the destination root. */
const jenkinsPaths: Set<string> = (() => {
  const paths = new Set<string>();

  for (const group of tree.groups) {
    if (tree.jenkinsGroups.has(group.id)) paths.add(jenkinsKey(group.destination, chainOf(group)));
  }
  for (const repo of tree.repos) {
    const group = byId.get(repo.groupId);
    if (group && tree.jenkinsRepos.has(repo.id)) {
      paths.add(jenkinsKey(group.destination, [...chainOf(group), repo.name]));
    }
  }

  return paths;
})();

export type JenkinsExistsSegment = { name: string; exists: boolean };

/** Stands in for the read-only Jenkins existence probe. A segment exists only when
    its own folder exists and every ancestor's does, so the first missing level
    marks itself and everything below it as to-be-created. */
export function probeJenkinsExists(
  destination: Destination,
  pathNames: string[],
): JenkinsExistsSegment[] {
  const walked: string[] = [];
  let ancestorsExist = true;

  return pathNames.map((name) => {
    walked.push(name);
    const exists = ancestorsExist && jenkinsPaths.has(jenkinsKey(destination, walked));
    ancestorsExist = exists;
    return { name, exists };
  });
}

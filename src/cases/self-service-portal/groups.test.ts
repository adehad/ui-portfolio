import { expect, test } from "vitest";
import {
  childGroupsOf,
  clientsFor,
  descendantsOf,
  probeJenkinsExists,
  reposOf,
} from "@/cases/self-service-portal/groups";

test("the tree is the same on every build", () => {
  expect(clientsFor("internal")).toHaveLength(4);
  expect(clientsFor("project")).toHaveLength(6);
  expect(clientsFor("ccsm")).toHaveLength(3);
  expect(clientsFor("project")[0]!.name).toBe("Considine-Volkman Group");
  expect(clientsFor("internal")[0]!.name).toBe("White Bungalow");
});

test("each destination serves its own tree", () => {
  const names = (destination: "internal" | "project" | "ccsm") =>
    clientsFor(destination).map((group) => group.name);
  expect(names("internal")).not.toEqual(names("project"));
  expect(names("project").filter((name) => names("ccsm").includes(name))).toEqual([]);
});

test("descendants carry the parent links resolveChain walks", () => {
  const client = clientsFor("project")[0]!;
  const descendants = descendantsOf(client.id);
  const byId = new Map(descendants.map((group) => [group.id, group]));
  const nested = descendants.find((group) => group.breadcrumb.includes(" / "));

  expect(nested).toBeDefined();
  // Every ancestor of a nested group is reachable, ending at the client itself.
  let current = nested!;
  while (current.parentId !== client.id) {
    const parent = byId.get(current.parentId!);
    expect(parent).toBeDefined();
    current = parent!;
  }
  expect(childGroupsOf(client.id).map((group) => group.name)).toContain(current.name);
});

test("a group the form would create has no children and no repos", () => {
  expect(childGroupsOf(null)).toEqual([]);
  expect(descendantsOf(null)).toEqual([]);
  expect(reposOf(null)).toEqual([]);
});

test("the probe reports some segments existing and some new", () => {
  const client = clientsFor("project")[0]!;
  const project = childGroupsOf(client.id)[0]!;
  const repo = reposOf(project.id)[0]!;

  // A chain the fixture has provisioned end to end, which is what lets the
  // all-exists submit guard fire.
  expect(probeJenkinsExists("project", [client.name, project.name, repo.name])).toEqual([
    { name: client.name, exists: true },
    { name: project.name, exists: true },
    { name: repo.name, exists: true },
  ]);

  // A missing level marks itself and everything below it.
  expect(probeJenkinsExists("project", [client.name, "Unheard Of", repo.name])).toEqual([
    { name: client.name, exists: true },
    { name: "Unheard Of", exists: false },
    { name: repo.name, exists: false },
  ]);
});

test("a name typed into the client box is new in every tree", () => {
  for (const destination of ["internal", "project", "ccsm"] as const) {
    const segments = probeJenkinsExists(destination, ["Example Client", "Anything"]);
    expect(segments.every((segment) => !segment.exists)).toBe(true);
  }
});

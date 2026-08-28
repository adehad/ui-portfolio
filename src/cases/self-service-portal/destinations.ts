/** The three provisioning destinations. The order here is the selector order, and
    "project" is the form default. Root paths feed the route preview only.

    The source's roots name a real internal GitLab group; these are stand-ins. */

export type Destination = "internal" | "project" | "ccsm";

export type DestinationInfo = {
  value: Destination;
  label: string;
  gitlabRoot: string;
  jenkinsRoot: string;
  groupFieldLabel: "Group" | "Client Name";
};

export const DESTINATIONS: DestinationInfo[] = [
  {
    value: "internal",
    label: "Internal",
    gitlabRoot: "platform/internal-tools",
    jenkinsRoot: "Internal",
    groupFieldLabel: "Group",
  },
  {
    value: "project",
    label: "Client project",
    gitlabRoot: "platform/projects",
    jenkinsRoot: "Projects",
    groupFieldLabel: "Client Name",
  },
  {
    value: "ccsm",
    label: "CCSM",
    gitlabRoot: "platform/secure-projects",
    jenkinsRoot: "Secure-Projects",
    groupFieldLabel: "Client Name",
  },
];

export function destinationInfo(destination: Destination): DestinationInfo {
  // The array is exhaustive over the union, so find cannot miss.
  return DESTINATIONS.find((entry) => entry.value === destination)!;
}

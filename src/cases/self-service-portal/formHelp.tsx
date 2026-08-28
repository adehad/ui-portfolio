import { InfoTooltip } from "@/cases/self-service-portal/InfoTooltip";

/** Help affordances for the Create form. Each carries copy written for where it
    sits rather than sharing one blurb. */

/** Beside the Destination legend: what the three trees mean. */
export function DestinationHelp() {
  return (
    <InfoTooltip label="About repo destinations">
      <p>
        <b>Internal</b> — CDP-internal tooling.
      </p>
      <p>
        <b>Client project</b> — client work.
      </p>
      <p>
        <b>CCSM</b> — secure client work, private visibility.
      </p>
    </InfoTooltip>
  );
}

/** Beside the client field: how the cascade works. */
export function GroupCascadeHelp() {
  return (
    <InfoTooltip label="About group selection">
      <p>
        Pick the client, then drill into (or create) groups level by level — typing a new name
        creates a group at that level.
      </p>
      <p>The deepest group is the project; search finds nested groups by name.</p>
    </InfoTooltip>
  );
}

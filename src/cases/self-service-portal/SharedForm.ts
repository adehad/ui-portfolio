import { formOptions } from "@tanstack/react-form";
import type { Destination } from "@/cases/self-service-portal/destinations";
import type { CascadeLevel } from "@/cases/self-service-portal/GroupCascade";

/** The fields every part shared by more than one form reads. */
export type SharedFormValues = {
  REQUESTING_USER: string;
  PROJECT_OWNER: string;
  PROJECT_ADMINS: string[];
  PROJECT_DEVELOPERS: string[];
};

export const buildFormOpts = formOptions({
  defaultValues: {
    REQUESTING_USER: "",
    provisionGitlab: false,
    provisionJenkins: false,
    CLIENT_ID: null as number | null,
    CLIENT_NAME: "",
    // Groups selected or created below the client, deepest last. The client
    // stays in CLIENT_NAME and CLIENT_ID; PROJECT_NAME and PROJECT_ID derive
    // from this chain as it resolves.
    //
    // INVARIANT: this mirrors GroupCascade's own level state, which is the
    // visible source of truth. The two resync only when GroupCascade remounts,
    // so anything that mutates CLIENT_ID or cascadeLevels from outside must
    // also change one of GroupCascade's remount-key inputs, or the visible
    // boxes drift from the request body.
    cascadeLevels: [] as CascadeLevel[],
    PROJECT_ID: null as number | null,
    PROJECT_NAME: "",
    REPO_NAME: "",
    destination: "project" as Destination,
    PROJECT_OWNER: "",
    PROJECT_ADMINS: [] as string[],
    PROJECT_DEVELOPERS: [] as string[],
  },
});

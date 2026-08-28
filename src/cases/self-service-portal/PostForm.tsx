import { useCallback, useContext, useEffect, useMemo } from "react";
import { useStore } from "@tanstack/react-form";
import { CreateFormShell } from "@/cases/self-service-portal/CreateFormShell";
import type { CreateSelectOption } from "@/cases/self-service-portal/CreateSelect";
import { DestinationSelector } from "@/cases/self-service-portal/DestinationSelector";
import { type Destination, destinationInfo } from "@/cases/self-service-portal/destinations";
import { DestinationHelp, GroupCascadeHelp } from "@/cases/self-service-portal/formHelp";
import {
  type BuildType,
  type SubmittedBuild,
  toRequestBody,
} from "@/cases/self-service-portal/formHelpers";
import { FormSubmit } from "@/cases/self-service-portal/FormSubmit";
import { type CascadeResolution, GroupCascade } from "@/cases/self-service-portal/GroupCascade";
import { clientsFor, probeJenkinsExists, reposOf } from "@/cases/self-service-portal/groups";
import { FileIcon } from "@/cases/self-service-portal/icons/File";
import { MemberSelectFields } from "@/cases/self-service-portal/MemberSelectFields";
import { type PreviewSegment, RoutePreview } from "@/cases/self-service-portal/RoutePreview";
import { buildFormOpts } from "@/cases/self-service-portal/SharedForm";
import { GITLAB_SLUG_RE, toGitLabSlug } from "@/cases/self-service-portal/slugs";
import { ThemeContext } from "@/cases/self-service-portal/ThemeContext";
import type { GitLabGroupSummary, Option, User } from "@/cases/self-service-portal/types";
import { useAppForm } from "@/cases/self-service-portal/useForm";
import { useLocalStorage } from "@/cases/self-service-portal/useLocalStorage";

type FormValues = typeof buildFormOpts.defaultValues;

/** The request body the form would post. Ids travel as CLIENT_ID and PROJECT_ID,
    where null means create from the name; display labels travel as the name
    fields, because the server owns all slugification. CLIENT_NAME is the plain
    client key, never a path. PROJECT_NAME is the cascade chain below the client,
    slash-joined, deepest level last. */
export type GitLabBuildPayload = {
  CLIENT_ID: number | null;
  CLIENT_NAME: string;
  PROJECT_ID: number | null;
  PROJECT_NAME: string;
  REPO_NAME: string;
  REQUESTING_USER: string;
  PROJECT_OWNER: string;
  PROJECT_ADMINS: string[];
  PROJECT_DEVELOPERS: string[];
  provisionGitlab: boolean;
  provisionJenkins: boolean;
  destination: Destination;
};

/** A straight projection of form state, minus the client-only cascade levels. */
const toBuildPayload = (value: FormValues): GitLabBuildPayload => ({
  CLIENT_ID: value.CLIENT_ID,
  CLIENT_NAME: value.CLIENT_NAME,
  PROJECT_ID: value.PROJECT_ID,
  PROJECT_NAME: value.PROJECT_NAME,
  REPO_NAME: value.REPO_NAME,
  REQUESTING_USER: value.REQUESTING_USER,
  PROJECT_OWNER: value.PROJECT_OWNER,
  PROJECT_ADMINS: value.PROJECT_ADMINS,
  PROJECT_DEVELOPERS: value.PROJECT_DEVELOPERS,
  provisionGitlab: value.provisionGitlab,
  provisionJenkins: value.provisionJenkins,
  destination: value.destination,
});

/** The group id a select option carries, or null. A locally created option holds
    the typed name rather than an id, so anything non-numeric means create. */
const toGroupId = (option: CreateSelectOption | null, isNew: boolean): number | null =>
  option && !isNew && typeof option.value === "number" ? option.value : null;

const toOptions = (groups: GitLabGroupSummary[]): CreateSelectOption[] =>
  groups.map(({ id, name }) => ({ label: name, value: id }));

/** The cascade makes slash-typing impossible in its own boxes, but the client box
    and the repo box are free-typed, so they get the rules the server applies to a
    single name. An empty value is the required check's business. */
function singleNameError(label: string, value: string): string | undefined {
  if (!value) return undefined;
  if (value.includes("/")) return `${label} cannot contain '/'`;
  if (!GITLAB_SLUG_RE.test(toGitLabSlug(value))) return `${label} must contain letters or digits`;
  return undefined;
}

function validateBuildForm(value: FormValues): { fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  const clientLabel = destinationInfo(value.destination).groupFieldLabel;

  if (!value.REQUESTING_USER) fields["REQUESTING_USER"] = "Requesting User is required";
  if (!value.CLIENT_NAME) fields["CLIENT_NAME"] = `${clientLabel} is required`;
  if (!value.PROJECT_NAME) fields["PROJECT_NAME"] = "Project Name is required";
  if (!value.REPO_NAME) fields["REPO_NAME"] = "Repo Name is required";
  if (!value.PROJECT_OWNER) fields["PROJECT_OWNER"] = "Project Owner is required";
  if (!value.provisionGitlab && !value.provisionJenkins)
    fields["provisionGitlab"] = "At least one build type must be selected";

  const clientName = singleNameError(clientLabel, value.CLIENT_NAME);
  if (clientName) fields["CLIENT_NAME"] = clientName;
  const repoName = singleNameError("Repo Name", value.REPO_NAME);
  if (repoName) fields["REPO_NAME"] = repoName;

  return { fields };
}

const DESTINATION_HELP = <DestinationHelp />;
const GROUP_CASCADE_HELP = <GroupCascadeHelp />;
const DESTINATION_FIELDS = { destination: "destination" } as const;

export type PostFormProps = {
  onSubmitted: (build: SubmittedBuild) => void;
  users: Option[];
  currentUser?: User | undefined;
  type?: BuildType | undefined;
};

export function PostForm({ onSubmitted, users, currentUser, type }: PostFormProps) {
  const { isDarkMode } = useContext(ThemeContext);
  const [, setUser] = useLocalStorage("ssp-userId", "");

  const form = useAppForm({
    ...buildFormOpts,
    defaultValues: {
      ...buildFormOpts.defaultValues,
      REQUESTING_USER: currentUser?.initials ?? "",
      provisionGitlab: type === "gitlab" || type === "jenkins",
      provisionJenkins: type === "jenkins",
    },
    validators: {
      onChange: ({ value }) => validateBuildForm(value),
    },
    onSubmit: ({ value }) => {
      setUser(value.REQUESTING_USER);
      onSubmitted({
        target: value.provisionJenkins ? "jenkins" : "gitlab",
        body: toRequestBody(toBuildPayload(value)),
      });
      form.reset();
    },
  });

  // Each destination is a separate tree, so the live selection drives the listing.
  const destination = useStore(form.store, (state) => state.values.destination);
  const clients = useMemo(() => toOptions(clientsFor(destination)), [destination]);

  // The client group id, null for a client that would be created. Read from form
  // state rather than local state, so Reset clears it.
  const selectedClientId = useStore(form.store, (state) => state.values.CLIENT_ID);
  const cascadeLevels = useStore(form.store, (state) => state.values.cascadeLevels);

  // The cascade owns the group chain below the client. Mirroring its resolution
  // into the derived fields gives validation, the repo scope and the preview one
  // source of truth, and lets Reset clear them.
  const handleCascadeResolve = useCallback(
    (resolution: CascadeResolution) => {
      const { levels, pathNames, deepestGroupId } = resolution;
      form.setFieldValue("cascadeLevels", levels);
      form.setFieldValue("PROJECT_NAME", pathNames.join("/"));
      // PROJECT_ID only when the client and every level exists. A created level
      // anywhere means the deepest group does not exist yet.
      const clientId = form.getFieldValue("CLIENT_ID");
      const chainExists =
        clientId !== null && levels.length > 0 && levels.every((level) => level.id !== null);
      form.setFieldValue("PROJECT_ID", chainExists ? deepestGroupId : null);
      // A different deepest group means the chosen repo no longer applies.
      form.setFieldValue("REPO_NAME", "");
    },
    [form],
  );

  // Repos are scoped to the deepest group, and a group that would be created has
  // none yet.
  const selectedProjectId = useStore(form.store, (state) => state.values.PROJECT_ID);
  const projectRepoRows = useMemo(() => reposOf(selectedProjectId), [selectedProjectId]);
  const projectRepos = useMemo(() => toOptions(projectRepoRows), [projectRepoRows]);

  // Scalar selectors, one per value, so each only re-renders on its own change.
  // The store compares by reference, so a fresh tuple per call would defeat that.
  const clientName = useStore(form.store, (state) => state.values.CLIENT_NAME);
  const projectName = useStore(form.store, (state) => state.values.PROJECT_NAME);
  const repoName = useStore(form.store, (state) => state.values.REPO_NAME);
  const provisionJenkins = useStore(form.store, (state) => state.values.provisionJenkins);

  const repoExists = useMemo(
    () => projectRepoRows.some((repo) => repo.name.toLowerCase() === repoName.trim().toLowerCase()),
    [projectRepoRows, repoName],
  );

  // GitLab newness is entirely local: a null id, from a created client or a
  // created cascade level, or a repo name that is not one of the existing repos.
  // The order matches the route below the root: client, levels, repo.
  const gitlabSegments = useMemo<PreviewSegment[]>(() => {
    const levels: PreviewSegment[] = cascadeLevels.length
      ? cascadeLevels.map((level, index) => ({
          key: `level-${index}`,
          name: level.name,
          isNew: level.id === null,
        }))
      : // No project yet, so a placeholder slot keeps the preview reading
        // root/client/…/repo rather than collapsing the project out.
        [{ key: "level-0", name: "", isNew: false }];
    return [
      { key: "client", name: clientName, isNew: !!clientName && selectedClientId === null },
      ...levels,
      { key: "repo", name: repoName, isNew: !!repoName.trim() && !repoExists },
    ];
  }, [clientName, cascadeLevels, repoName, repoExists, selectedClientId]);

  // Jenkins newness comes from the existence probe over the display-name chain,
  // and only once Jenkins is ticked and the chain is complete.
  const jenkinsPathNames = useMemo(
    () => [clientName, ...cascadeLevels.map((level) => level.name), repoName],
    [clientName, cascadeLevels, repoName],
  );
  const jenkinsProbe = useMemo(() => {
    const complete =
      provisionJenkins && !!clientName && cascadeLevels.length >= 1 && !!repoName.trim();
    return complete ? probeJenkinsExists(destination, jenkinsPathNames) : undefined;
  }, [provisionJenkins, clientName, cascadeLevels, repoName, destination, jenkinsPathNames]);

  const jenkinsSegments = useMemo<PreviewSegment[]>(
    () =>
      jenkinsProbe
        ? jenkinsProbe.map((segment, index) => ({
            key: gitlabSegments[index]?.key ?? `segment-${index}`,
            name: segment.name,
            isNew: !segment.exists,
          }))
        : gitlabSegments.map((segment) => ({ ...segment, isNew: false })),
    [jenkinsProbe, gitlabSegments],
  );

  // Block submit when nothing would be created anywhere. GitLab creates nothing
  // only when the repo already exists, which implies its whole chain existed and
  // forces provisionGitlab off. Jenkins creates nothing when it is off, or when
  // the probe reports every segment existing.
  const jenkinsCreatesNothing =
    !provisionJenkins ||
    (!!jenkinsProbe && jenkinsProbe.length > 0 && jenkinsProbe.every((segment) => segment.exists));
  const submitBlockedMessage =
    repoExists && jenkinsCreatesNothing
      ? "Everything here already exists — nothing to create."
      : null;

  // An existing repo must never be provisioned again in GitLab. Turning the flag
  // back on once the name changes is left to the user.
  useEffect(() => {
    if (repoExists && form.getFieldValue("provisionGitlab")) {
      form.setFieldValue("provisionGitlab", false);
    }
  }, [repoExists, form]);

  const typeChildren = useMemo(
    () => (
      <>
        <form.AppField name="provisionJenkins">
          {(field) => (
            <field.Checkbox
              label="Jenkins"
              type="jenkins"
              onChange={(checked) => {
                // Jenkins builds run off the GitLab project, so it cannot be
                // requested on its own, unless the repo is already there.
                form.setFieldValue("provisionGitlab", checked && !repoExists);
              }}
            />
          )}
        </form.AppField>

        <form.AppField name="provisionGitlab">
          {(field) => (
            <field.Checkbox
              label="GitLab"
              type="gitlab"
              disabled={form.getFieldValue("provisionJenkins") || repoExists}
            />
          )}
        </form.AppField>

        {repoExists ? (
          <div className="ssp-form-hint">
            Repo already exists in GitLab — only the Jenkins folder will be created.
          </div>
        ) : null}
      </>
    ),
    [form, repoExists],
  );

  const extraTopColumn = useMemo(
    () => (
      <div className="ssp-form-control ssp-col">
        <DestinationSelector
          form={form}
          fields={DESTINATION_FIELDS}
          legendHelp={DESTINATION_HELP}
          onSwitch={() => {
            // The trees are separate, so a group picked in the old one does not
            // exist in the new one. Clearing the client is enough: the
            // destination is itself a cascade remount key, and the cascade's
            // mount effect clears the levels and everything derived from them.
            form.setFieldValue("CLIENT_ID", null);
            form.setFieldValue("CLIENT_NAME", "");
          }}
        />
      </div>
    ),
    [form],
  );

  const repoOptionLabel = useCallback(
    (option: CreateSelectOption) => (
      <span className="ssp-repo-option">
        <FileIcon size={14} />
        {option.label}
      </span>
    ),
    [],
  );

  return (
    <CreateFormShell
      form={form}
      users={users}
      requestingUserLocked={Boolean(currentUser)}
      onSubmit={form.handleSubmit}
      typeChildren={typeChildren}
      extraTopColumn={extraTopColumn}
    >
      <div className="ssp-form-control">
        <form.AppField
          name="CLIENT_NAME"
          // Remount on a tree switch, so options created for the old tree clear.
          key={destination}
        >
          {(field) => (
            <field.CreateSelect
              label={destinationInfo(destination).groupFieldLabel}
              labelHelp={GROUP_CASCADE_HELP}
              placeholder={
                destination === "internal"
                  ? "Select or create a group..."
                  : "Select or create a client..."
              }
              options={clients}
              isDarkMode={isDarkMode}
              onChangeCallback={(option, isNew) => {
                // CLIENT_ID is a cascade remount key, so setting it here is what
                // clears the levels and everything derived from them.
                form.setFieldValue("CLIENT_ID", toGroupId(option, isNew));
              }}
            />
          )}
        </form.AppField>
      </div>

      <div className="ssp-form-control">
        <GroupCascade
          // These key inputs are the resync mechanism for the cascadeLevels
          // invariant in SharedForm: anything clearing CLIENT_ID or cascadeLevels
          // has to move one of them.
          key={`${destination}-${selectedClientId ?? "new"}-${clientName}`}
          clientId={selectedClientId}
          clientSelected={!!clientName}
          isDarkMode={isDarkMode}
          onResolve={handleCascadeResolve}
        />
      </div>

      <div className="ssp-form-control">
        <form.AppField
          name="REPO_NAME"
          // Remount on a project change, so options created for the old project clear.
          key={selectedProjectId ?? "no-project"}
        >
          {(field) => (
            <field.CreateSelect
              label="Repo Name"
              placeholder="The name of the repo that will be created under the project"
              options={projectRepos}
              isDarkMode={isDarkMode}
              disabled={!projectName}
              formatOptionLabel={repoOptionLabel}
            />
          )}
        </form.AppField>
      </div>

      <RoutePreview
        destination={destination}
        gitlabSegments={gitlabSegments}
        showJenkins={provisionJenkins}
        jenkinsSegments={jenkinsSegments}
      />

      <div className="ssp-row ssp-members">
        <div className="ssp-form-control ssp-col">
          <form.AppField name="PROJECT_OWNER">
            {(field) => (
              <field.UserSelect
                label="Project Owner"
                placeholder="The user to act as the project owner for this GitLab subgroup"
                options={users}
                isDarkMode={isDarkMode}
              />
            )}
          </form.AppField>
        </div>
        <MemberSelectFields form={form} users={users} isDarkMode={isDarkMode} asColumns={true} />
      </div>

      {destination === "ccsm" ? (
        <div className="ssp-ccsm-alert-box" role="alert">
          CCSM projects are provisioned under the Secure Projects tree with private visibility. Only
          the users listed here get access.
        </div>
      ) : null}

      <FormSubmit form={form} submitBlockedMessage={submitBlockedMessage} />
    </CreateFormShell>
  );
}

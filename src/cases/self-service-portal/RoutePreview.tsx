import { Fragment } from "react";
import { type Destination, destinationInfo } from "@/cases/self-service-portal/destinations";
import { toGitLabSlug, toJenkinsName } from "@/cases/self-service-portal/slugs";
import { SparklePen } from "@/cases/self-service-portal/SparklePen";

/** One logical route segment below the root: the client, an intermediate group,
    the project, or the repo. isNew marks it as to-be-created in the system being
    rendered. GitLab newness comes from the cascade and repo state, Jenkins
    newness from the existence probe. */
export type PreviewSegment = {
  /** Which part of the route this is: the client, a cascade level, or the repo.
      Stable across a name change, so React keeps the sparkle mounted. */
  key: string;
  name: string;
  isNew: boolean;
};

/** A path piece, or an ellipsis while the field behind it is still empty. */
const piece = (value: string, slug: (name: string) => string): string =>
  value.trim() ? slug(value) : "…";

function RouteRow({
  label,
  root,
  segments,
  slug,
}: {
  label: string;
  root: string;
  segments: PreviewSegment[];
  slug: (name: string) => string;
}) {
  const anyNew = segments.some((segment) => segment.isNew);
  const hasContent = segments.some((segment) => segment.name.trim());

  return (
    <div className="ssp-route-row">
      <span className="ssp-route-preview-label">{label}:</span>{" "}
      <code>
        <span className="ssp-route-segment">{root}</span>
        {segments.map((segment, index) => (
          <Fragment key={segment.key}>
            {"/"}
            {segment.isNew ? (
              <SparklePen
                active={true}
                // An inline segment is a fraction of a box, so the field is
                // scaled down to stay dense without swamping the text.
                count={9}
                index={index}
                className="ssp-sparkle-inline"
                seedKey={segment.name}
              >
                <span className="ssp-route-segment ssp-route-segment-new">
                  {piece(segment.name, slug)}
                </span>
              </SparklePen>
            ) : (
              <span className="ssp-route-segment">{piece(segment.name, slug)}</span>
            )}
          </Fragment>
        ))}
      </code>
      {!anyNew && hasContent ? <span className="ssp-route-exists-tag">already exists</span> : null}
    </div>
  );
}

export type RoutePreviewProps = {
  destination: Destination;
  /** GitLab segments below the root: client, intermediates, project, repo. */
  gitlabSegments: PreviewSegment[];
  showJenkins: boolean;
  /** The same logical segments for the Jenkins folder tree. */
  jenkinsSegments: PreviewSegment[];
};

/** Read-only preview of where the repo will land: the GitLab route always, plus
    the Jenkins folder route while Jenkins provisioning is selected. A segment
    sparkles when it will be newly created in that system, and a system that
    creates nothing carries a muted tag instead. */
export function RoutePreview({
  destination,
  gitlabSegments,
  showJenkins,
  jenkinsSegments,
}: RoutePreviewProps) {
  const info = destinationInfo(destination);

  return (
    <div className="ssp-route-preview">
      <RouteRow
        label="GitLab"
        root={info.gitlabRoot}
        segments={gitlabSegments}
        slug={toGitLabSlug}
      />
      {showJenkins ? (
        <RouteRow
          label="Jenkins"
          root={info.jenkinsRoot}
          segments={jenkinsSegments}
          slug={toJenkinsName}
        />
      ) : null}
    </div>
  );
}

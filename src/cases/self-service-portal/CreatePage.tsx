import { useState } from "react";
import "@/cases/self-service-portal/CreatePage.scss";
import type { BuildType, SubmittedBuild } from "@/cases/self-service-portal/formHelpers";
import { PostForm } from "@/cases/self-service-portal/PostForm";
import { ThemePicker } from "@/cases/self-service-portal/ThemePicker";
import { ThemeWrapper } from "@/cases/self-service-portal/ThemeWrapper";
import type { Option, User } from "@/cases/self-service-portal/types";

export type CreatePageProps = {
  users: Option[];
  currentUser?: User;
  type?: BuildType;
};

export function CreatePage({ users, currentUser, type }: CreatePageProps) {
  const [submitted, setSubmitted] = useState<SubmittedBuild | undefined>();

  return (
    <ThemeWrapper>
      <main className="ssp-readable">
        <div className="ssp-page-header">
          <h2>Create Project</h2>
          <ThemePicker />
        </div>

        {submitted ? (
          <p className="ssp-submitted-banner">
            Queued a {submitted.target} build with {submitted.body}
          </p>
        ) : null}

        <PostForm onSubmitted={setSubmitted} users={users} currentUser={currentUser} type={type} />
      </main>
    </ThemeWrapper>
  );
}

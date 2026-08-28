import { useState } from "react";
import "@/cases/self-service-portal/CreatePage.scss";
import { type BuildTarget, PostForm } from "@/cases/self-service-portal/PostForm";
import { ThemePicker } from "@/cases/self-service-portal/ThemePicker";
import { ThemeWrapper } from "@/cases/self-service-portal/ThemeWrapper";
import type { Option, User } from "@/cases/self-service-portal/types";

export type CreatePageProps = {
  users: Option[];
  currentUser?: User;
  type?: BuildTarget;
};

type Submitted = { target: BuildTarget; body: string };

export function CreatePage({ users, currentUser, type }: CreatePageProps) {
  const [submitted, setSubmitted] = useState<Submitted | undefined>();

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

        <PostForm
          onSubmitted={(target, body) => setSubmitted({ target, body })}
          currentUser={currentUser}
          users={users}
          type={type}
        />
      </main>
    </ThemeWrapper>
  );
}

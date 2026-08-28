import { Field, Formik, type FormikHelpers } from "formik";
import { useContext, useMemo } from "react";
import * as Yup from "yup";
import { GitLabIcon } from "@/cases/self-service-portal/icons/GitLab";
import { JenkinsIcon } from "@/cases/self-service-portal/icons/Jenkins";
import { ThemeContext } from "@/cases/self-service-portal/ThemeContext";
import type { BuildParameters, Option, User } from "@/cases/self-service-portal/types";
import { useLocalStorage } from "@/cases/self-service-portal/useLocalStorage";
import { UserSelect } from "@/cases/self-service-portal/UserSelect";

export type BuildTarget = "gitlab" | "jenkins";

export type PostFormProps = {
  onSubmitted: (target: BuildTarget, body: string) => void;
  currentUser?: User | undefined;
  users: Option[];
  type?: BuildTarget | undefined;
};

const validationSchema = Yup.object()
  .shape({
    PROJECT_NAME: Yup.string().required("Required"),
    REPO_NAME: Yup.string().required("Required"),
    IS_GITLAB: Yup.boolean(),
    IS_JENKINS: Yup.boolean(),
  })
  .test("one-true", "At lease one option must be true", function (value) {
    const { IS_GITLAB, IS_JENKINS } = value;

    if (!IS_GITLAB && !IS_JENKINS) {
      return this.createError({
        path: "IS_GITLAB",
        message: "At least one must be true",
      });
    }

    return true;
  });

/** Sent as the build parameters, so they are stripped from the request body. */
const TARGET_FLAGS = new Set(["IS_JENKINS", "IS_GITLAB"]);

export function PostForm({ onSubmitted, currentUser, users, type }: PostFormProps) {
  const { isDarkMode } = useContext(ThemeContext);
  const [, setUser] = useLocalStorage("ssp-userId", "");

  const submitBuild = (data: BuildParameters, { resetForm }: FormikHelpers<BuildParameters>) => {
    setUser(data.REQUESTING_USER);

    const urlEncodedData = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (!TARGET_FLAGS.has(key)) urlEncodedData.append(key, String(value));
    }

    onSubmitted(data.IS_JENKINS ? "jenkins" : "gitlab", urlEncodedData.toString());
    resetForm();
  };

  const initialValues: BuildParameters = useMemo(
    () => ({
      REQUESTING_USER: currentUser?.initials ?? "",
      IS_GITLAB: type === "gitlab" || type === "jenkins",
      IS_JENKINS: type === "jenkins",
      PROJECT_NAME: "",
      REPO_NAME: "",
      CLIENT_NAME: "",
      IS_CCSM: false,
      PROJECT_OWNER: "",
      PROJECT_ADMINS: [],
      PROJECT_DEVELOPERS: [],
    }),
    [currentUser, type],
  );

  return (
    <Formik<BuildParameters>
      enableReinitialize={true}
      initialValues={initialValues}
      onSubmit={submitBuild}
      validationSchema={validationSchema}
      validateOnMount={true}
      validateOnChange={true}
    >
      {({ dirty, isSubmitting, isValid, handleSubmit, handleReset, validateForm, values }) => (
        <form onSubmit={handleSubmit} className="ssp-post-form">
          <div className="ssp-row">
            <div className="ssp-form-control ssp-col">
              <label htmlFor="REQUESTING_USER">Requesting User</label>
              <Field
                className="ssp-user-select"
                id="REQUESTING_USER"
                name="REQUESTING_USER"
                placeholder="The person requesting this..."
                options={users}
                isDarkMode={isDarkMode}
                component={UserSelect}
                disabled={Boolean(currentUser)}
              />
            </div>

            <div className="ssp-form-control ssp-checkboxes ssp-col">
              <span className="ssp-form-label">Type</span>
              <label htmlFor="IS_JENKINS">
                <Field type="checkbox" id="IS_JENKINS" name="IS_JENKINS">
                  {({
                    field,
                    form,
                  }: {
                    field: { value: boolean };
                    form: FormikHelpers<BuildParameters>;
                  }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      id="IS_JENKINS"
                      name="IS_JENKINS"
                      onChange={(e) => {
                        // Jenkins builds run off the GitLab project, so it cannot be
                        // requested on its own.
                        void form.setFieldValue("IS_JENKINS", e.target.checked);
                        void form.setFieldValue("IS_GITLAB", e.target.checked);
                      }}
                    />
                  )}
                </Field>
                <JenkinsIcon />
                <span>Jenkins</span>
              </label>
              <label htmlFor="IS_GITLAB">
                <Field
                  type="checkbox"
                  id="IS_GITLAB"
                  name="IS_GITLAB"
                  disabled={values.IS_JENKINS}
                />
                <GitLabIcon />
                <span>GitLab</span>
              </label>
            </div>
          </div>

          <div className="ssp-row">
            <div className="ssp-form-control ssp-col">
              <label htmlFor="PROJECT_NAME">Project Name</label>
              <Field
                id="PROJECT_NAME"
                name="PROJECT_NAME"
                placeholder="A GitLab subgroup will be created with this name"
              />
            </div>

            <div className="ssp-form-control ssp-col">
              <label htmlFor="PROJECT_OWNER">Project Owner</label>
              <Field
                className="ssp-user-select"
                id="PROJECT_OWNER"
                name="PROJECT_OWNER"
                placeholder="The user to act as the project owner for this GitLab subgroup"
                options={users}
                isDarkMode={isDarkMode}
                component={UserSelect}
              />
            </div>
          </div>

          <div className="ssp-row">
            <div className="ssp-form-control ssp-col">
              <label htmlFor="REPO_NAME">Repo Name</label>
              <Field
                id="REPO_NAME"
                name="REPO_NAME"
                placeholder="The name of the repo that will be created under PROJECT_NAME"
              />
            </div>

            <div className="ssp-form-control ssp-col">
              <label htmlFor="CLIENT_NAME">Client Name</label>
              <Field id="CLIENT_NAME" name="CLIENT_NAME" placeholder="The name of the client" />
            </div>
          </div>

          <div className="ssp-form-control">
            <label htmlFor="PROJECT_ADMINS">Project Admins</label>
            <Field
              className="ssp-user-select"
              id="PROJECT_ADMINS"
              name="PROJECT_ADMINS"
              options={users}
              component={UserSelect}
              placeholder="Select project admins..."
              isMulti={true}
              isDarkMode={isDarkMode}
            />
          </div>

          <div className="ssp-form-control">
            <label htmlFor="PROJECT_DEVELOPERS">Project Developers</label>
            <Field
              className="ssp-user-select"
              id="PROJECT_DEVELOPERS"
              name="PROJECT_DEVELOPERS"
              options={users}
              component={UserSelect}
              placeholder="Select project developers..."
              isMulti={true}
              isDarkMode={isDarkMode}
            />
          </div>

          <div className="ssp-form-buttons">
            <button
              type="button"
              onClick={() => {
                handleReset();
                void validateForm();
              }}
              disabled={!dirty || isSubmitting}
            >
              Reset
            </button>
            <button type="submit" disabled={isSubmitting || !isValid}>
              Submit
            </button>
          </div>
        </form>
      )}
    </Formik>
  );
}

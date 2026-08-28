import type { ReactNode } from "react";
import { RequestingUserField } from "@/cases/self-service-portal/RequestingUserField";
import type { SharedFormValues } from "@/cases/self-service-portal/SharedForm";
import type { Option } from "@/cases/self-service-portal/types";
import type { AppForm } from "@/cases/self-service-portal/useForm";

/** The opening of the Create form: the form element, the Requesting User column
    and the Type checkbox column. The Type checkboxes arrive as typeChildren;
    extraTopColumn slots a third column into the same row, which is what puts
    Destination alongside them. Everything below the top row is children. */
export function CreateFormShell<TFormData extends SharedFormValues>({
  form,
  users,
  requestingUserLocked,
  typeChildren,
  extraTopColumn,
  onSubmit,
  children,
}: {
  form: AppForm<TFormData>;
  users: Option[];
  requestingUserLocked: boolean;
  typeChildren: ReactNode;
  extraTopColumn?: ReactNode;
  onSubmit: () => void;
  children: ReactNode;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="ssp-post-form"
    >
      <div className="ssp-row">
        <RequestingUserField form={form} users={users} locked={requestingUserLocked} />

        <div className="ssp-form-control ssp-checkboxes ssp-col">
          {/* A <label> here would have no control to point at, which fails
              jsx-a11y/label-has-associated-control. */}
          <span className="ssp-form-label">Type</span>
          {typeChildren}
        </div>
        {extraTopColumn}
      </div>
      {children}
    </form>
  );
}

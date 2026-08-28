import type { Option } from "@/cases/self-service-portal/types";
import type { AppForm } from "@/cases/self-service-portal/useForm";
import type { SharedFormValues } from "@/cases/self-service-portal/SharedForm";

/** Project Admins and Project Developers. asColumns makes each field a column so
    the caller can drop them into a shared row beside Project Owner. */
export function MemberSelectFields<TFormData extends SharedFormValues>({
  form,
  users,
  isDarkMode,
  asColumns = false,
}: {
  form: AppForm<TFormData>;
  users: Option[];
  isDarkMode: boolean;
  asColumns?: boolean;
}) {
  const controlClass = asColumns ? "ssp-form-control ssp-col" : "ssp-form-control";

  return (
    <>
      <div className={controlClass}>
        <form.AppField name="PROJECT_ADMINS" mode="array">
          {(field) => (
            <field.UserSelect
              label="Project Admins"
              placeholder="Select project admins..."
              options={users}
              isMulti={true}
              isDarkMode={isDarkMode}
            />
          )}
        </form.AppField>
      </div>

      <div className={controlClass}>
        <form.AppField name="PROJECT_DEVELOPERS" mode="array">
          {(field) => (
            <field.UserSelect
              label="Project Developers"
              placeholder="Select project developers..."
              options={users}
              isMulti={true}
              isDarkMode={isDarkMode}
            />
          )}
        </form.AppField>
      </div>
    </>
  );
}

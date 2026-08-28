import type { Option } from "@/cases/self-service-portal/types";
import type { AppForm } from "@/cases/self-service-portal/useForm";
import type { SharedFormValues } from "@/cases/self-service-portal/SharedForm";

/** The Requesting User column. Locked when the signed-in user was found in this
    form's option list and the field was seeded from it. A signed-in user absent
    from the list stays editable rather than locking on a value nobody can act on. */
export function RequestingUserField<TFormData extends SharedFormValues>({
  form,
  users,
  locked,
}: {
  form: AppForm<TFormData>;
  users: Option[];
  locked: boolean;
}) {
  return (
    <div className="ssp-form-control ssp-col">
      <form.AppField name="REQUESTING_USER">
        {(field) => (
          <field.UserSelect
            label="Requesting User"
            options={users}
            placeholder="The person requesting this..."
            disabled={locked}
          />
        )}
      </form.AppField>
    </div>
  );
}

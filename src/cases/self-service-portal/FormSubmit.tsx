import type { AppForm } from "@/cases/self-service-portal/useForm";
import type { SharedFormValues } from "@/cases/self-service-portal/SharedForm";

/** The submit footer. submitBlockedMessage is an external guard: when set it
    disables Submit and shows the reason. */
export function FormSubmit<TFormData extends SharedFormValues>({
  form,
  submitBlockedMessage,
}: {
  form: AppForm<TFormData>;
  submitBlockedMessage?: string | null;
}) {
  return (
    <>
      {submitBlockedMessage ? (
        <output className="ssp-form-hint ssp-submit-blocked">{submitBlockedMessage}</output>
      ) : null}

      <form.AppForm>
        <div className="ssp-form-buttons">
          <form.SubscribeButton label="Submit" disabled={!!submitBlockedMessage} />
        </div>
      </form.AppForm>
    </>
  );
}

import { useStore } from "@tanstack/react-form";
import { useFieldContext } from "@/cases/self-service-portal/useFormContext";

/** Renders the bound field's validation errors. Must sit inside a `form.AppField`,
    since it reads the field context created by `createFormHook`. */
export function FieldErrors() {
  const field = useFieldContext();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <>
      {errors.map((error: string) => (
        <div key={error} className="ssp-form-error">
          {error}
        </div>
      ))}
    </>
  );
}

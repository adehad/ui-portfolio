import { type AppFieldExtendedReactFormApi, createFormHook } from "@tanstack/react-form";
import { BuildTypeCheckbox } from "@/cases/self-service-portal/BuildTypeCheckbox";
import { CreateSelect } from "@/cases/self-service-portal/CreateSelect";
import {
  fieldContext,
  formContext,
  useFormContext,
} from "@/cases/self-service-portal/useFormContext";
import { UserSelect } from "@/cases/self-service-portal/UserSelect";

function SubscribeButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => [state.isValid, state.isSubmitting, state.isDirty]}>
      {([isValid, isSubmitting, isDirty]) => (
        <>
          <button type="submit" disabled={!isValid || !isDirty || disabled}>
            {isSubmitting ? "..." : label}
          </button>
          <button type="reset" onClick={() => form.reset()}>
            Reset
          </button>
        </>
      )}
    </form.Subscribe>
  );
}

const fieldComponents = { UserSelect, Checkbox: BuildTypeCheckbox, CreateSelect };
const formComponents = { SubscribeButton };

export const { useAppForm, withFieldGroup } = createFormHook({
  fieldComponents,
  formComponents,
  fieldContext,
  formContext,
});

/** The concrete form API for a value shape, carrying this case's field and form
    components so `form.AppField`'s render prop is typed with them. The eleven
    validator and submit-meta slots are `any` on purpose: nothing here reads them,
    and `any` in those invariant positions keeps every concrete `useAppForm(...)`
    result assignable to `AppForm<TFormData>`. Field names still resolve against
    TFormData. */
export type AppForm<TFormData> = AppFieldExtendedReactFormApi<
  TFormData,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  /* eslint-enable @typescript-eslint/no-explicit-any */
  typeof fieldComponents,
  typeof formComponents
>;

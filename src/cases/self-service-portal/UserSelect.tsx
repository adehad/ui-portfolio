import { useId, useMemo } from "react";
import Select from "react-select";
import { FieldErrors } from "@/cases/self-service-portal/FieldErrors";
import { getSelectClassNames, getSelectStyles } from "@/cases/self-service-portal/selectStyles";
import type { Option } from "@/cases/self-service-portal/types";
import { useFieldContext } from "@/cases/self-service-portal/useFormContext";

export type UserSelectProps = {
  label: string;
  options: Option[];
  isMulti?: boolean;
  isDarkMode?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export function UserSelect({
  label,
  options,
  isMulti = false,
  isDarkMode,
  disabled,
  placeholder,
}: UserSelectProps) {
  const field = useFieldContext<string | string[]>();
  // The source wraps the control in the <label>. jsx-a11y/label-has-associated-control
  // cannot see the input react-select renders, so the association is explicit.
  const inputId = useId();
  const classNames = useMemo(() => getSelectClassNames<Option, boolean>(), []);
  const styles = useMemo(() => getSelectStyles<Option, boolean>(isDarkMode), [isDarkMode]);

  const onChange = (option: unknown) => {
    field.handleChange(
      isMulti
        ? (option as Option[]).map((item) => item.value)
        : ((option as Option | null)?.value ?? ""),
    );
  };

  const getValue = () => {
    if (isMulti) {
      const selected = (field.state.value as string[] | undefined) ?? [];
      return options.filter((option) => selected.includes(option.value));
    }
    return field.state.value === ""
      ? null
      : (options.find((option) => option.value === field.state.value) ?? null);
  };

  return (
    <div>
      <div className="ssp-mb-1">
        <label htmlFor={inputId}>{label}</label>
      </div>
      <Select<Option, boolean>
        inputId={inputId}
        classNames={classNames}
        name={field.name}
        value={getValue()}
        onChange={onChange}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        options={options}
        isMulti={isMulti}
        isDisabled={disabled}
        styles={styles}
      />
      <FieldErrors />
    </div>
  );
}

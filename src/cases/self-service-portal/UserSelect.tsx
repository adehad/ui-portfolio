import type { FieldProps } from "formik";
import { useMemo } from "react";
import Select, { type MultiValue, type SingleValue } from "react-select";
import { getSelectStyles, selectClassNames } from "@/cases/self-service-portal/selectStyles";
import type { Option } from "@/cases/self-service-portal/types";

export type UserSelectProps = FieldProps & {
  options: Option[];
  isMulti?: boolean;
  className?: string;
  placeholder?: string;
  isDarkMode?: boolean;
  disabled?: boolean;
};

export function UserSelect({
  placeholder,
  field,
  form,
  options,
  isMulti = false,
  isDarkMode = false,
  disabled,
}: UserSelectProps) {
  const styles = useMemo(() => getSelectStyles(isDarkMode), [isDarkMode]);

  const onChange = (option: MultiValue<Option> | SingleValue<Option>) => {
    void form.setFieldValue(
      field.name,
      isMulti
        ? (option as MultiValue<Option>).map((item) => item.value)
        : ((option as SingleValue<Option>)?.value ?? ""),
    );
  };

  const getValue = () => {
    if (!options) return isMulti ? [] : null;

    if (isMulti) {
      const selected = (field.value as string[] | undefined) ?? [];
      return options.filter((option) => selected.includes(option.value));
    }

    return field.value === "" ? null : (options.find((o) => o.value === field.value) ?? null);
  };

  return (
    <Select<Option, boolean>
      classNames={selectClassNames}
      name={field.name}
      value={getValue()}
      onChange={onChange}
      placeholder={placeholder}
      options={options}
      isMulti={isMulti}
      isDisabled={disabled}
      styles={styles}
    />
  );
}

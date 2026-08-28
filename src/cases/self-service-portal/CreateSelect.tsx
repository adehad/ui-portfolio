import { type ReactNode, useId, useMemo, useState } from "react";
import type { FormatOptionLabelMeta } from "react-select";
import CreatableSelect from "react-select/creatable";
import { FieldErrors } from "@/cases/self-service-portal/FieldErrors";
import { getSelectClassNames, getSelectStyles } from "@/cases/self-service-portal/selectStyles";
import { SparklePen } from "@/cases/self-service-portal/SparklePen";
import { useFieldContext } from "@/cases/self-service-portal/useFormContext";

export type CreateSelectOption = {
  label: string;
  value: string | number;
};

export type CreateSelectProps = {
  label: string;
  options: CreateSelectOption[];
  placeholder?: string;
  isDarkMode?: boolean;
  disabled?: boolean;
  labelHelp?: ReactNode;
  onChangeCallback?: (option: CreateSelectOption | null, isNew: boolean) => void;
  formatOptionLabel?: (
    option: CreateSelectOption,
    meta: FormatOptionLabelMeta<CreateSelectOption>,
  ) => ReactNode;
};

/** A select whose value can be typed into existence. A value the user created
    rather than picked sparkles, because it does not exist upstream yet. */
export function CreateSelect({
  label,
  options,
  placeholder,
  isDarkMode,
  disabled,
  labelHelp,
  onChangeCallback,
  formatOptionLabel,
}: CreateSelectProps) {
  const field = useFieldContext<string>();
  // htmlFor/inputId rather than wrapping the control in the <label>, so the
  // react-select input stays the labelled element even with the help button
  // beside the label. A nested button would otherwise claim that role.
  const inputId = useId();

  // Parents rebuild their options array on every render, so a created option
  // held there would vanish. It lives here instead.
  const [createdOptions, setCreatedOptions] = useState<CreateSelectOption[]>([]);

  const allOptions = useMemo(() => [...options, ...createdOptions], [options, createdOptions]);
  const classNames = useMemo(() => getSelectClassNames<CreateSelectOption, false>(), []);
  const styles = useMemo(
    () => getSelectStyles<CreateSelectOption, false>(isDarkMode),
    [isDarkMode],
  );

  const value = field.state.value;
  // A created label that later turns up in the fetched options counts as
  // existing, so it stops sparkling.
  const isNewValue =
    !!value &&
    createdOptions.some((option) => option.label === value) &&
    !options.some((option) => option.label === value);

  const onChange = (option: CreateSelectOption | null) => {
    field.handleChange(option ? option.label : "");
    onChangeCallback?.(option, false);
  };

  // Matched by label so form.reset(), which clears the value to "", returns null
  // and empties the control.
  const selected = value ? (allOptions.find((option) => option.label === value) ?? null) : null;

  const handleCreateOption = (inputValue: string) => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const newOption: CreateSelectOption = { label: trimmed, value: trimmed };
    setCreatedOptions((prev) => [...prev, newOption]);
    field.handleChange(trimmed);
    onChangeCallback?.(newOption, true);
  };

  return (
    <div>
      <div className="ssp-mb-1 ssp-field-label">
        <label htmlFor={inputId}>{label}</label>
        {labelHelp}
      </div>
      <SparklePen active={isNewValue} seedKey={value}>
        <CreatableSelect<CreateSelectOption, false>
          inputId={inputId}
          classNames={classNames}
          value={selected}
          onChange={onChange}
          onCreateOption={handleCreateOption}
          placeholder={placeholder}
          options={allOptions}
          isMulti={false}
          isDisabled={disabled}
          {...(formatOptionLabel === undefined ? {} : { formatOptionLabel })}
          styles={styles}
        />
      </SparklePen>
      <FieldErrors />
    </div>
  );
}

import type { ChangeEvent } from "react";
import { FieldErrors } from "@/cases/self-service-portal/FieldErrors";
import { GitLabIcon } from "@/cases/self-service-portal/icons/GitLab";
import { JenkinsIcon } from "@/cases/self-service-portal/icons/Jenkins";
import { useFieldContext } from "@/cases/self-service-portal/useFormContext";

export type BuildTypeCheckboxProps = {
  label: string;
  type: "jenkins" | "gitlab";
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
};

const icons = {
  jenkins: JenkinsIcon,
  gitlab: GitLabIcon,
};

export function BuildTypeCheckbox({ label, type, disabled, onChange }: BuildTypeCheckboxProps) {
  const field = useFieldContext<boolean>();
  const Icon = icons[type];

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    field.handleChange(event.target.checked);
    onChange?.(event.target.checked);
  };

  return (
    <label htmlFor={type}>
      <input
        type="checkbox"
        id={type}
        checked={field.state.value}
        disabled={disabled}
        onChange={handleChange}
      />
      <Icon />
      <span>{label}</span>
      <FieldErrors />
    </label>
  );
}

import type { ClassNamesConfig, StylesConfig } from "react-select";

/** The source names a `user-select` class and two `border-*` colour utilities,
    none of which exist in its own stylesheets. Tailwind scans this case's .tsx, so
    leaving them would mint a real red-border utility and put a red border on a
    focused dropdown the source never had. */
export function getSelectClassNames<OptionType, IsMulti extends boolean>(): ClassNamesConfig<
  OptionType,
  IsMulti
> {
  return {
    control: (state) => {
      const focus = state.isFocused ? "ssp-user-select ssp-user-select-focused" : "ssp-user-select";
      const disabled = state.isDisabled ? "ssp-user-select-disabled" : "";
      return `${focus} ${disabled}`;
    },
  };
}

/** react-select emits its styles as inline style objects. A custom property
    reference survives that, so the whole control repaints on a theme change with
    no re-render. isDarkMode is only needed where a value is picked rather than
    referenced. */
export function getSelectStyles<OptionType, IsMulti extends boolean>(
  isDarkMode?: boolean,
): StylesConfig<OptionType, IsMulti> {
  return {
    menuList: (base) => ({
      ...base,
      backgroundColor: "var(--ssp-header-bkg)",
    }),
    input: (base) => ({
      ...base,
      color: "var(--ssp-font-color)",
    }),
    control: (styles, { isDisabled }) => ({
      ...styles,
      fontSize: "1rem",
      backgroundColor: "var(--ssp-header-bkg)",
      borderWidth: "2px",
      borderStyle: "solid",
      borderColor: "var(--ssp-input-border)",
      outlineColor: "var(--ssp-input-border)",
      color: "var(--ssp-font-color)",
      opacity: isDisabled ? 0.7 : 1,
    }),
    singleValue: (styles) => ({
      ...styles,
      color: "var(--ssp-font-color)",
      fontSize: "1rem",
      ":hover": {
        backgroundColor: isDarkMode ? "#22272b" : "green",
        color: "var(--ssp-font-color)",
      },
    }),
    multiValue: (styles) => ({
      ...styles,
      color: "#22272b",
      backgroundColor: "var(--ssp-chip-bkg)",
      borderColor: "var(--ssp-info-border)",
      ":hover": {
        backgroundColor: "var(--ssp-btn-bkg)",
        color: "var(--ssp-font-color)",
      },
    }),
    multiValueRemove: (styles) => ({
      ...styles,
      ":hover": {
        backgroundColor: "#9ec5fe",
      },
    }),
    option: (baseStyles) => ({
      ...baseStyles,
      backgroundColor: "var(--ssp-header-bkg)",
      color: "var(--ssp-font-color)",
      ":hover": {
        backgroundColor: "var(--ssp-info-bkg)",
        color: "var(--ssp-font-color)",
      },
    }),
  };
}

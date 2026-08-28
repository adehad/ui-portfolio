import { useContext } from "react";
import { DarkModeIcon } from "@/cases/self-service-portal/icons/DarkMode";
import { LightModeIcon } from "@/cases/self-service-portal/icons/LightMode";
import { ThemeContext } from "@/cases/self-service-portal/ThemeContext";

export function ThemePicker() {
  const { isDarkMode, changeTheme } = useContext(ThemeContext);

  return (
    <div>
      <button
        type="button"
        className="ssp-theme-icon"
        aria-label={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
        aria-pressed={isDarkMode}
        onClick={changeTheme}
      >
        {isDarkMode ? <DarkModeIcon /> : <LightModeIcon />}
      </button>
    </div>
  );
}

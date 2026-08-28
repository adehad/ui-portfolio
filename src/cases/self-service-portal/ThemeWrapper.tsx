import { type ReactNode, useMemo } from "react";
import { ThemeContext, themes } from "@/cases/self-service-portal/ThemeContext";
import { useDarkMode } from "@/cases/self-service-portal/useDarkMode";

/** Owns the theme class and the element it hangs off. Everything that needs to know
    whether the page is dark reads it from this context rather than re-reading
    localStorage, so one click repaints the whole subtree in a single render. */
export function ThemeWrapper({ children }: { children: ReactNode }) {
  const { isDarkMode, toggle } = useDarkMode();
  const theme = isDarkMode ? themes.dark : themes.light;

  const value = useMemo(
    () => ({ theme, isDarkMode, changeTheme: toggle }),
    [theme, isDarkMode, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className={`ssp-root ${theme}`}>{children}</div>
    </ThemeContext.Provider>
  );
}

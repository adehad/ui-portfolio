import { createContext } from "react";

export const themes = {
  dark: "ssp-dark-theme",
  light: "ssp-light-theme",
};

export type ThemeContextValue = {
  theme: string;
  isDarkMode: boolean;
  changeTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: themes.dark,
  isDarkMode: true,
  changeTheme: () => {},
});

import { useLocalStorage } from "@/cases/self-service-portal/useLocalStorage";

/** Namespaced away from the plain `dark-mode` the app uses, because every case in this
    Storybook shares one localStorage origin. */
export const DARK_MODE_KEY = "ssp-dark-mode";

export function useDarkMode(defaultValue = true) {
  const [isDarkMode, setDarkMode] = useLocalStorage<boolean>(DARK_MODE_KEY, defaultValue);

  return {
    isDarkMode,
    toggle: () => setDarkMode((prev) => !prev),
  };
}

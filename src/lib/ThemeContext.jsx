import { createContext, useContext, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "skillswap-theme";
const ThemeContext = createContext(null);

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return savedTheme === "light" || savedTheme === "system"
    ? savedTheme
    : "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    theme === "system" ? getSystemTheme() : theme,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const applyTheme = () => {
      const nextResolvedTheme = theme === "system" ? getSystemTheme() : theme;
      setResolvedTheme(nextResolvedTheme);
      document.documentElement.classList.toggle(
        "light",
        nextResolvedTheme === "light",
      );
      document.documentElement.classList.toggle(
        "dark",
        nextResolvedTheme === "dark",
      );
      document.documentElement.style.colorScheme = nextResolvedTheme;
    };

    applyTheme();
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);

    if (theme === "system") {
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }

    return undefined;
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme: () => setTheme((current) =>
          current === "light" ? "dark" : "light",
        ),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}

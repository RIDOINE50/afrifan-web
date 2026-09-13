"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export const DARK_THEME = {
  bg: "#0A0A0A",
  card: "#1A1A1A",
  cardHover: "#2A2A2A",
  border: "#2A2A2A",
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  primary: "#FFFFFF",
  primaryText: "#000000",
  hover: "rgba(255,255,255,0.08)",
  overlay: "rgba(0,0,0,0.85)",
};

export const LIGHT_THEME = {
  bg: "#FFFFFF",
  card: "#F3F4F6",
  cardHover: "#E5E7EB",
  border: "#E5E7EB",
  text: "#000000",
  textMuted: "#6B7280",
  primary: "#000000",
  primaryText: "#FFFFFF",
  hover: "rgba(0,0,0,0.05)",
  overlay: "rgba(0,0,0,0.5)",
};

type ThemeType = typeof DARK_THEME;

interface ThemeContextValue {
  isDark: boolean;
  theme: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  theme: DARK_THEME,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("afrifan-theme");
    if (saved === "light") setIsDark(false);
    else if (saved === "dark") setIsDark(true);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("afrifan-theme", next ? "dark" : "light");
      return next;
    });
  };

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
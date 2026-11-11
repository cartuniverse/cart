"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const readCurrent = (): Theme => {
      if (typeof window === "undefined") return "light";
      const stored = localStorage.getItem("cart_theme") as Theme | null;
      if (stored) return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    const current = readCurrent();
    setTheme(current);
    applyTheme(current);

    const handleThemeChange = (e: CustomEvent<Theme>) => {
      setTheme(e.detail);
      applyTheme(e.detail);
    };

    window.addEventListener("cart_theme_changed" as any, handleThemeChange);
    return () => {
      window.removeEventListener("cart_theme_changed" as any, handleThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("cart_theme", next);
        applyTheme(next);
        window.dispatchEvent(new CustomEvent("cart_theme_changed", { detail: next }));
      }
      return next;
    });
  };

  return { theme, toggleTheme };
}

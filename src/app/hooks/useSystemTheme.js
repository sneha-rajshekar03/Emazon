"use client";

import { useEffect } from "react";

export function useSystemTheme() {
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (e) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Run once at mount
    applyTheme(prefersDark);

    // Watch for changes
    prefersDark.addEventListener("change", applyTheme);

    return () => prefersDark.removeEventListener("change", applyTheme);
  }, []);
}

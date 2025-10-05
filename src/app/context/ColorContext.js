"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ColorContext = createContext();

// Light mode - muted, comfortable colors
const tailwindToHex = {
  "bg-blue-300": "#5B8EC4",
  "bg-purple-300": "#9A7BC4",
  "bg-emerald-300": "#5FB89B",
  "bg-orange-300": "#C99355",
  "bg-rose-300": "#C97B8E",
  "bg-sky-300": "#67A8C4",
  "bg-yellow-200": "#C9B764",
  "bg-cyan-300": "#5AB8BD",
  "bg-violet-300": "#8F7ABC",
  "bg-lime-300": "#99BD5A",
  "bg-amber-200": "#C9A955",
  "bg-gray-200": "#6B6B6B",
  "bg-slate-400": "#7B8A9D",
  "bg-neutral-300": "#6E6E6E",
  "bg-stone-200": "#7A746E",
  "bg-teal-300": "#4FB8AA",
  "bg-pink-300": "#C47B9D",
  "bg-sky-200": "#97BFD4",
  "bg-gray-100": "#5A5A5A",
  "bg-slate-500": "#5B6875",
};

// Dark mode - soft pastels
const tailwindToHexDark = {
  "bg-blue-300": "#BFDBFE",
  "bg-purple-300": "#DDD6FE",
  "bg-emerald-300": "#A7F3D0",
  "bg-orange-300": "#FED7AA",
  "bg-rose-300": "#FECDD3",
  "bg-sky-300": "#BAE6FD",
  "bg-yellow-200": "#FEF08A",
  "bg-cyan-300": "#A5F3FC",
  "bg-violet-300": "#DDD6FE",
  "bg-lime-300": "#D9F99D",
  "bg-amber-200": "#FDE68A",
  "bg-gray-200": "#F4F4F5",
  "bg-slate-400": "#CBD5E1",
  "bg-neutral-300": "#E5E5E5",
  "bg-stone-200": "#F5F5F4",
  "bg-teal-300": "#99F6E4",
  "bg-pink-300": "#FBCFE8",
  "bg-sky-200": "#E0F2FE",
  "bg-gray-100": "#FAFAFA",
  "bg-slate-500": "#94A3B8",
};

export function ColorProvider({ children }) {
  const [colorValue, setColorValue] = useState("bg-gray-200");
  const [hexColor, setHexColor] = useState("#4A4A4A");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const fetchUserColor = async () => {
    try {
      const res = await fetch("/api/userColor");

      if (!res.ok) {
        console.error("Failed to fetch color:", res.status);
        return;
      }

      const data = await res.json();
      console.log("🎨 Fetched color data:", data);

      const tailwindValue = data?.color;

      if (tailwindValue) {
        console.log("✅ Setting color value:", tailwindValue);
        setColorValue(tailwindValue);
        updateHexColor(tailwindValue, isDarkMode);
      }
    } catch (err) {
      console.error("❌ Error fetching color:", err);
    }
  };

  const updateHexColor = (tailwindValue, darkMode) => {
    const colorMap = darkMode ? tailwindToHexDark : tailwindToHex;
    const hex = colorMap[tailwindValue] || "#4A4A4A";
    setHexColor(hex);
    console.log(
      `🎨 Converted to hex (${darkMode ? "dark" : "light"} mode):`,
      hex
    );
  };

  useEffect(() => {
    fetchUserColor();
  }, []);

  // Update hex color when dark mode changes
  useEffect(() => {
    updateHexColor(colorValue, isDarkMode);
  }, [isDarkMode, colorValue]);

  const updateColor = (tailwindValue) => {
    setColorValue(tailwindValue);
    updateHexColor(tailwindValue, isDarkMode);
  };

  return (
    <ColorContext.Provider
      value={{
        colorValue,
        hexColor,
        isDarkMode,
        setColorValue,
        updateColor,
        refreshColor: fetchUserColor,
      }}
    >
      {children}
    </ColorContext.Provider>
  );
}

export const useColor = () => {
  const context = useContext(ColorContext);
  if (!context) {
    throw new Error("useColor must be used within a ColorProvider");
  }
  return context;
};

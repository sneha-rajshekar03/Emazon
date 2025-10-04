"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ColorContext = createContext();

const tailwindToHex = {
  "bg-blue-300": "#6EA8F7",
  "bg-purple-300": "#B08EF5",
  "bg-emerald-300": "#77D8A8",
  "bg-orange-300": "#F29C5B",
  "bg-rose-300": "#EF8BAA",
  "bg-sky-300": "#82CCF7",
  "bg-yellow-200": "#F3D86B",
  "bg-cyan-300": "#72DADB",
  "bg-violet-300": "#A28BF2",
  "bg-lime-300": "#B3E676",
  "bg-amber-200": "#F3C369",
  "bg-gray-200": "#CFCFD3",
  "bg-slate-400": "#7D8189",
  "bg-neutral-300": "#BFBFBF",
  "bg-stone-200": "#D7D3CD",
  "bg-teal-300": "#6FD4C8",
  "bg-pink-300": "#EA93B8",
  "bg-sky-200": "#A8D7FA",
  "bg-gray-100": "#E1E1E4",
  "bg-slate-500": "#5E6168",
};

export function ColorProvider({ children }) {
  const [colorValue, setColorValue] = useState("bg-gray-200");
  const [hexColor, setHexColor] = useState("#4A4A4A");

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
        const hex = tailwindToHex[tailwindValue] || "#4A4A4A";
        setHexColor(hex);
        console.log("🎨 Converted to hex:", hex);
      }
    } catch (err) {
      console.error("❌ Error fetching color:", err);
    }
  };

  useEffect(() => {
    fetchUserColor();
  }, []);

  // Add updateColor function to manually update the context
  const updateColor = (tailwindValue) => {
    setColorValue(tailwindValue);
    const hex = tailwindToHex[tailwindValue] || "#4A4A4A";
    setHexColor(hex);
  };

  return (
    <ColorContext.Provider
      value={{
        colorValue,
        hexColor,
        setColorValue,
        updateColor,
        refreshColor: fetchUserColor, // Add refresh function
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

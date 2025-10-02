// app/ThemeProvider.js
"use client";

import { useSystemTheme } from "@app/hooks/useSystemTheme";
export default function ThemeProvider({ children }) {
  useSystemTheme();
  return <>{children}</>;
}

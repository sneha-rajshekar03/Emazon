/** @type {import('tailwindcss').Config} */
module.exports = {
  // ✅ Use class-based dark mode (controlled by your ColorContext)
  darkMode: "class",

  // ✅ Include all source folders
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        cardForeground: "var(--card-foreground)",
        muted: "var(--muted)",
        mutedForeground: "var(--muted-foreground)",
      },
    },
  },

  // ✅ Keep all dynamic class variants Tailwind might otherwise purge
  safelist: [
    // Layout
    "flex",
    "flex-col",
    "grid",
    "md:grid-cols-12",
    "w-full",
    "sticky",
    "top-4",
    "transition-all",
    "duration-500",
    "rounded-3xl",
    "space-y-8",
    // Backgrounds
    "bg-white",
    "bg-black",
    "bg-gray-50",
    "bg-gray-100",
    "bg-gray-200",
    "bg-gray-800",
    "bg-gray-900",
    "bg-blue-50",
    "bg-blue-100",
    "bg-blue-400",
    "bg-blue-600",
    // Text colors
    "text-gray-900",
    "text-gray-800",
    "text-gray-700",
    "text-gray-300",
    "text-gray-100",
    "text-red-500",
    "text-red-400",
    "text-green-600",
    "text-blue-600",
    "text-blue-400",
    // Borders and shadows
    "border",
    "border-gray-300",
    "border-gray-600",
    "border-gray-800",
    "border-gray-200",
    "shadow-sm",
    "shadow-md",
    "shadow-lg",
  ],

  plugins: [],
};

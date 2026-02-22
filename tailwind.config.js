/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base Palette (keep these)
        "theme-red": "#A60204",
        "theme-orange": "#D96704",
        "theme-green": "#377303",
        "theme-blue": "#1B406D",
        "theme-dark": "#282A30",
        "theme-light": "#F5F5F5",
        "theme-dark-blue": "#0D3B66",
        "theme-deep-green": "#0A4F47",

        // Semantic Roles (NEW)
        "surface": "#FFFFFF",
        "surface-soft": "#F9FAFB",
        "border-soft": "#E5E7EB",
        "text-primary": "#282A30",
        "text-muted": "#6B7280",
      },

      boxShadow: {
        card: "0 4px 12px rgba(0,0,0,0.06)",
        soft: "0 2px 6px rgba(0,0,0,0.04)",
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },

      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
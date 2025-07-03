/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "theme-red": "#A60204",
        "theme-orange": "#D96704",
        "theme-green": "#377303",
        "theme-blue": "#1B406D",
        "theme-dark": "#282A30",
        "theme-light": "#F5F5F5",
        "theme-dark-blue": "#0D3B66",   // New dark blue
        "theme-deep-green": "#0A4F47",  // New deep green
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

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        wonder: {
          primary: "#051A24",
          accent: "#2563eb",
          bg: "#ffffff",
          surface: "#f6f9fc",
          muted: "#273C46",
        },
      },
      fontFamily: {
        sans: ['"PP Neue Montreal"', '"Space Grotesk"', "system-ui", "sans-serif"],
        serif: ['"PP Mondwest"', '"DM Serif Display"', "Georgia", "serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

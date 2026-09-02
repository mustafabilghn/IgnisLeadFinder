import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ignis: {
          50: "#fff4ed",
          100: "#ffe6d5",
          200: "#feccaa",
          300: "#fdad74",
          400: "#fb8a3c",
          500: "#f9691a",
          600: "#ea4f10",
          700: "#c23a0f",
          800: "#9a2f14",
          900: "#7c2913",
        },
      },
    },
  },
  plugins: [],
};

export default config;

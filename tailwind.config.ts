import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#0a0a0f",
          900: "#0f0f17",
          850: "#13131d",
          800: "#191925",
          700: "#232332",
          600: "#32324a",
          500: "#4a4a6a",
          400: "#6b6b8d",
          300: "#9797b3",
          200: "#c2c2d6",
          100: "#e5e5ee",
        },
        accent: {
          100: "#e6e0fd",
          300: "#af9df9",
          400: "#8b7cf6",
          500: "#7c5cf4",
          600: "#6d3ff0",
        },
        mint: {
          400: "#4ade80",
          500: "#22c55e",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
        coral: {
          400: "#fb7185",
          500: "#f43f5e",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,92,244,0.15), 0 8px 24px -8px rgba(124,92,244,0.35)",
        card: "0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -12px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 20% 0%, rgba(124,92,244,0.15), transparent 40%), radial-gradient(circle at 80% 100%, rgba(74,222,128,0.08), transparent 40%)",
      },
    },
  },
  plugins: [],
};
export default config;

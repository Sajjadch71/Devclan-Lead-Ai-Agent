import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Overrides Tailwind's built-in "white" so every existing `text-white`
        // (used throughout as "primary text") renders as dark charcoal in this
        // light theme, without touching every file that uses it. Raw CSS
        // `color: white` (e.g. .btn-primary label) is untouched by this and
        // stays literal white, which is what those spots need.
        white: "#111827",
        base: {
          950: "#F8FAFC", // page background
          900: "#FFFFFF", // input backgrounds / white surfaces
          850: "#FFFFFF", // card background
          800: "#F1F5F9", // hover backgrounds, subtle gridlines, chat bubble bg
          700: "#E5E7EB", // default borders, badge default background
          600: "#94A3B8", // hover borders, dimmer secondary text
          500: "#64748B", // secondary / muted text
          400: "#475569", // slightly stronger secondary text
          300: "#334155", // body copy
          200: "#1F2937", // text on light-tinted surfaces
          100: "#0F172A",
        },
        accent: {
          100: "#4C1D95",
          300: "#8B7CF6",
          400: "#7C5CF4",
          500: "#7C5CF4",
          600: "#6D3FF0",
        },
        mint: {
          400: "#15803D",
          500: "#22C55E",
        },
        amber: {
          400: "#92400E",
          500: "#F59E0B",
        },
        coral: {
          300: "#E11D48",
          400: "#9F1239",
          500: "#F43F5E",
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
        card: "0 1px 2px rgba(15,23,42,0.04), 0 4px 16px -4px rgba(15,23,42,0.08)",
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

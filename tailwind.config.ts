import type { Config } from "tailwindcss";

/**
 * Medical enterprise palette: white / blue / gray with clinical status accents.
 * Kept deliberately calm and dense — this is an internal hospital tool, not a
 * marketing site.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#bcd7ff",
          300: "#8ebeff",
          400: "#599aff",
          500: "#3577f5",
          600: "#1f57e0",
          700: "#1a44b4",
          800: "#1b3a8f",
          900: "#1c3473",
          950: "#152149",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d4d9e2",
          300: "#aeb7c8",
          400: "#8190a8",
          500: "#5f6f8c",
          600: "#4a5872",
          700: "#3d485d",
          800: "#353e4f",
          900: "#0f172a",
          950: "#0a0f1c",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "0.875rem" }],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 120ms ease-out",
        "slide-in-right": "slide-in-right 160ms ease-out",
        "scale-in": "scale-in 120ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

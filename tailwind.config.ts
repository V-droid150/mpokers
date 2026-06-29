import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        felt: {
          DEFAULT: "#0b6b3a",
          dark: "#064d29",
          deep: "#03361d",
        },
        vegas: {
          gold: "#f5c542",
          goldsoft: "#e0b13a",
          red: "#c0202e",
          purple: "#6d28d9",
          ink: "#0a0a0c",
          ink2: "#141418",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 18px rgba(245,197,66,0.45)",
        chip: "0 4px 10px rgba(0,0,0,0.45)",
        inset: "inset 0 2px 6px rgba(255,255,255,0.18), inset 0 -3px 8px rgba(0,0,0,0.35)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(245,197,66,0.55)" },
          "50%": { boxShadow: "0 0 0 8px rgba(245,197,66,0)" },
        },
      },
      animation: {
        shimmer: "shimmer 3.5s linear infinite",
        pulseGlow: "pulseGlow 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

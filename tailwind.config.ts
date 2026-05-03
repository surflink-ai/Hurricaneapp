import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#fdfdfb",
          dim: "#f4f2ec",
          deep: "#ebe7dc"
        },
        ink: {
          DEFAULT: "#0a0a08",
          soft: "#3a3a36",
          mute: "#6b6b65"
        },
        rule: "#1a1a17",
        accent: {
          DEFAULT: "#9a2a1f",
          soft: "#b35949"
        },
        cat: {
          ts: "#0e7490",
          c1: "#a16207",
          c2: "#ea580c",
          c3: "#dc2626",
          c4: "#991b1b",
          c5: "#6b21a8",
          sub: "#94a3b8"
        }
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      letterSpacing: {
        eyebrow: "0.18em"
      },
      boxShadow: {
        paper: "0 1px 0 rgba(10,10,8,0.06), 0 12px 28px -16px rgba(10,10,8,0.16)",
        rule: "inset 0 -1px 0 #1a1a17"
      }
    }
  },
  plugins: []
};

export default config;

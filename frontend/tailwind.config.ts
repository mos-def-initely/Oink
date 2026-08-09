import type { Config } from "tailwindcss";

/**
 * Oink design tokens — "Punch": clean structure, loud colour.
 *
 * The rule that keeps it from tipping back into cartoon territory: no black
 * outlines and no hard offset shadows anywhere. Separation comes from colour
 * and soft elevation. Two loud accents (coral, tangerine) plus teal support.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2B1B3D",
        "ink-soft": "#6A5A7A",
        apricot: "#FFE8D6",
        "apricot-deep": "#FFD7BC",
        cream: "#FFFDFB",
        coral: "#FF4D6D",
        "coral-deep": "#E63455",
        tangerine: "#FF8A00",
        teal: "#00B39F",
        "teal-pale": "#D6F5F1",
        "teal-ink": "#00776A",
        butter: "#FFC53D",
        grape: "#7B3FE4",
      },
      fontFamily: {
        display: ["var(--font-display)", "Avenir Next", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(43, 27, 61, 0.09)",
        lift: "0 4px 18px rgba(43, 27, 61, 0.12)",
        pop: "0 3px 12px rgba(255, 77, 109, 0.30)",
      },
      borderRadius: {
        card: "16px",
      },
      screens: {
        phone: "430px",
      },
    },
  },
  plugins: [],
};

export default config;

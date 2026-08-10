import type { Config } from "tailwindcss";

/**
 * Oink design tokens — "Damson".
 *
 * Built from the reference palettes: an oat ground, plum leading, gold and
 * lemon supporting, eggplant as ink. The structural rule taken from the layout
 * references is that containers are defined by **outlines, not shadows** —
 * there is deliberately no shadow scale here beyond a single soft lift used
 * only for overlays.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ink
        ink: "#4D303F",          // eggplant
        "ink-soft": "#7A6270",
        "ink-deep": "#2F2A35",   // blueberry, for the heaviest type

        // grounds
        oat: "#F4EEDC",
        "oat-deep": "#E8DFC4",
        cream: "#FFFDF6",

        // accents
        plum: "#914E56",
        "plum-deep": "#783E46",
        gold: "#CFA51F",
        "gold-pale": "#F6EDC8",
        lemon: "#E6D389",
        rust: "#A9503C",         // shame — distinct from plum, same family
        lilac: "#D8B5F7",
        "lilac-pale": "#EFE2FF",
        "lilac-ink": "#5B3E84",
      },
      fontFamily: {
        display: ["var(--font-display)", "Avenir Next", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Only for things floating above the page — sheets, dropdowns, the FAB.
        lift: "0 6px 20px rgba(77, 48, 63, 0.16)",
      },
      borderRadius: {
        card: "14px",
      },
      screens: {
        phone: "430px",
      },
    },
  },
  plugins: [],
};

export default config;

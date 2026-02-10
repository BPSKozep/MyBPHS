import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: '"Montserrat Variable"',
        serif: '"Roboto Slab Variable"',
        mono: '"Source Code Pro Variable"',
        handwriting: '"Lily Script One"',
      },
    },
  },
  plugins: [
    // @ts-expect-error
    ({ addBase, theme }) => {
      const allColors = flattenColorPalette(theme("colors"));
      const newVars = Object.fromEntries(
        Object.entries(allColors).map(([key, val]) => [`--${key}`, val]),
      );

      addBase({
        ":root": newVars,
      });
    },
    require("@tailwindcss/typography"),
  ],
};

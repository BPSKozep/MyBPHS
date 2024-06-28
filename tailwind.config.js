const flattenColorPalette =
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("tailwindcss/lib/util/flattenColorPalette").default;

function addVariablesForColors({ addBase, theme }) {
    let allColors = flattenColorPalette(theme("colors"));
    let newVars = Object.fromEntries(
        Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
    );

    addBase({
        ":root": newVars,
    });
}

/** @type {import('tailwindcss').Config} */
module.exports = {
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
    plugins: [addVariablesForColors],
};

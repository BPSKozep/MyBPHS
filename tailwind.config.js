/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
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
    plugins: [],
};

const path = require("path");

const buildEslintCommand = (filenames) =>
    `eslint --fix --max-warnings=0 ${filenames
        .map((f) => path.relative(process.cwd(), f))
        .join(" ")}`;

const buildPrettierCommand = (filenames) =>
    `prettier --write ${filenames
        .map((f) => path.relative(process.cwd(), f))
        .join(" ")}`;

module.exports = {
    "!(.*).{js,jsx,ts,tsx}": [buildEslintCommand, buildPrettierCommand],
};

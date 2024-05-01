/** @type {import("eslint").Linter.Config} */
const config = {
  extends: [
    "turbo",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "prettier",
  ],
  env: {
    es2022: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: { project: true },
  plugins: ["@typescript-eslint", "import"],
  ignorePatterns: [
    "**/*.config.js",
    "**/*.config.cjs",
    "**/.eslintrc.cjs",
    "dist",
  ],
  reportUnusedDisableDirectives: true,
};

module.exports = config;

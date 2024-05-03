/** @typedef {import("prettier").Config} PrettierConfig */
/** @typedef {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */

/** @type { PrettierConfig | SortImportsConfig } */
const config = {
  // plugins: ["@ianvs/prettier-plugin-sort-imports"],
  // importOrder: [
  //   "<TYPES>",
  //   "<THIRD_PARTY_MODULES>",
  //   "",
  //   "<TYPES>^@blaaah",
  //   "^@blaaah/(.*)$",
  //   "",
  //   "<TYPES>^[.|..|~]",
  //   "^~/",
  //   "^[../]",
  //   "^[./]",
  // ],
  // importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  // importOrderTypeScriptVersion: "4.4.0",
  printWidth: 250,
  singleQuote: true,
  tabWidth: 2,
  endOfLine: 'lf',
};

export default config;

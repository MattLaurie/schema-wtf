import type { Options } from "tsup";
import { defineConfig } from "tsup";

export default defineConfig((options: Options) => ({
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
  minify: true,
  format: ["esm"],
  ...options,
}));

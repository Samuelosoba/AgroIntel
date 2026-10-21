import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  target: "node20",
  clean: true,
  // Bundle the TS-source shared package; everything else stays in node_modules.
  noExternal: ["@agrointel/shared"],
});

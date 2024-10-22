// rollup.config.js
import typescript from "@rollup/plugin-typescript";

export default [
  {
    input: "src/openapi2zod.ts",
    output: [
      {
        file: "dist/lib/index.mjs",
        format: "es",
        sourcemap: false,
        exports: "named",
      },
      {
        file: "dist/lib/index.umd.js",
        name: "OpenAPI2Zod",
        format: "umd",
        sourcemap: false,
        exports: "named",
      },
    ],
    plugins: [
      typescript({
        tsconfig: "./configs/tsconfig.esm.json",
        sourceMap: false,
      }),
    ],
  },
];
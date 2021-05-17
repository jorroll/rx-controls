import typescript from "@rollup/plugin-typescript";

const external = [
  "rxjs",
  "rxjs/operators",
  "react",
  "rxjs-hooks",
  "rx-controls",
  "tslib",
  "ts-essentials",
];

export default [
  {
    input: "src/public-api.ts",
    output: {
      file: "./build/module.js",
      format: "esm",
    },
    external,
    // this is necessary because otherwise rollup removes
    // line 68 (const Component = options.component as any;) from
    // `with-control.tsx` which breaks the bundle
    // treeshake: false,
    plugins: [typescript()],
  },
  {
    input: "src/public-api.ts",
    output: {
      file: "./build/main.js",
      format: "cjs",
    },
    external,
    // treeshake: false,
    plugins: [typescript()],
  },
];

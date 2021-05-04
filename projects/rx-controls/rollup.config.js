import typescript from "@rollup/plugin-typescript";

export default [
  {
    input: "src/public-api.ts",
    output: {
      file: "./build/module.js",
      format: "esm",
    },
    external: ["rxjs", "rxjs/operators", "tslib"],
    plugins: [typescript()],
  },
  {
    input: "src/public-api.ts",
    output: {
      file: "./build/umd.js",
      name: "rxControls",
      format: "umd",
      globals: {
        rxjs: "rxjs",
        "rxjs/operators": "rxjs.operators",
        tslib: "tslib",
      },
    },
    external: ["rxjs", "rxjs/operators", "tslib"],
    plugins: [typescript()],
  },
];

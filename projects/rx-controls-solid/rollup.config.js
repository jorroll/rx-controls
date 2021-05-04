import typescript from "@rollup/plugin-typescript";
import jsx from "acorn-jsx";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";

export default [
  {
    input: "src/public-api.ts",
    output: {
      file: "./build/module.js",
      format: "esm",
    },
    external: [
      "rxjs",
      "rxjs/operators",
      "solid-js",
      "rx-controls",
      "tslib",
      "ts-essentials",
    ],
    acornInjectPlugins: [jsx()],
    plugins: [
      typescript(),
      getBabelOutputPlugin({
        presets: ["babel-preset-solid"],
      }),
    ],
  },
  {
    input: "src/public-api.ts",
    output: {
      file: "./build/main.js",
      format: "cjs",
    },
    external: [
      "rxjs",
      "rxjs/operators",
      "solid-js",
      "rx-controls",
      "tslib",
      "ts-essentials",
    ],
    acornInjectPlugins: [jsx()],
    plugins: [
      typescript(),
      getBabelOutputPlugin({
        presets: ["babel-preset-solid"],
      }),
    ],
  },
];

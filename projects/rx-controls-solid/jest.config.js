const config = require("../../jest.config");

module.exports = {
  ...config,
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.spec.json",
      babelConfig: {
        presets: ["babel-preset-solid", "@babel/preset-env"],
      },
    },
  },
  // preset: "solid-jest/preset/browser",
  // if using `ts-jest` the following is required
  // see https://github.com/solidui/solid/discussions/425#discussioncomment-686291
  moduleNameMapper: {
    "solid-js": "<rootDir>/../../node_modules/solid-js/dist/solid.cjs",
  },
};

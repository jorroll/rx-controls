const config = require("../../jest.config");

module.exports = {
  ...config,
  preset: "solid-jest/preset/browser",
  // if using `ts-jest` the following is required
  // see https://github.com/solidui/solid/discussions/425#discussioncomment-686291
  // moduleNameMapper: {
  //   "solid-js": "<rootDir>/../../node_modules/solid-js/dist/solid.cjs",
  // },
};

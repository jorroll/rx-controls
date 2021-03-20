const baseConfig = require("../../jest.config");

module.exports = {
  ...baseConfig,
  testMatch: ["<rootDir>/projects/demo/**/*.spec.ts"],
  globals: {
    "ts-jest": {
      tsConfig: "<rootDir>/projects/demo/tsconfig.spec.json",
    },
  },
};

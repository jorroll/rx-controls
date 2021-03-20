const baseConfig = require("../../jest.config");

module.exports = {
  ...baseConfig,
  testMatch: ["<rootDir>/projects/reactive-forms-two/**/*.spec.ts"],
  globals: {
    "ts-jest": {
      tsConfig: "<rootDir>/projects/reactive-forms-two/tsconfig.spec.json",
    },
  },
};

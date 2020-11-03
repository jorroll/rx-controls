const baseConfig = require("../../jest.config");

module.exports = {
  ...baseConfig,
  globals: {
    "ts-jest": {
      tsConfig: "<rootDir>/projects/reactive-forms-two/tsconfig.spec.json",
    },
  },
  setupFiles: ["<rootDir>/projects/reactive-forms-two/test-setup.ts"],
};

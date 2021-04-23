const baseConfig = require("../../jest.config");

module.exports = {
  ...baseConfig,
  globals: {
    "ts-jest": {
      tsConfig: "<rootDir>/projects/reactive-form-controls/tsconfig.spec.json",
    },
  },
};

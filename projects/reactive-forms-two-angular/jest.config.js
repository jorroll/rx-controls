const baseConfig = require("../../jest.config");

module.exports = {
  ...baseConfig,
  globals: {
    "ts-jest": {
      tsConfig:
        "<rootDir>/projects/reactive-forms-two-angular/tsconfig.spec.json",
    },
  },
};

const baseConfig = require("../../jest.config");

module.exports = {
  ...baseConfig,
  globals: {
    "ts-jest": {
      tsConfig:
        "<rootDir>/projects/reactive-form-controls-angular/tsconfig.spec.json",
    },
  },
};

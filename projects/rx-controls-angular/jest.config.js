const baseConfig = require("../../jest.config");

module.exports = {
  ...baseConfig,
  globals: {
    "ts-jest": {
      tsConfig: "<rootDir>/projects/rx-controls-angular/tsconfig.spec.json",
    },
  },
};

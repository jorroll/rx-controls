const baseConfig = require("../../jest.config");

/**
 * The directory you are in when you execute `npm run test` is
 * the root directory
 */

module.exports = {
  ...baseConfig,
  globals: {
    "ts-jest": {
      tsConfig:
        "<rootDir>/projects/reactive-forms-two-compat/tsconfig.spec.json",
    },
  },
};

const config = require("../../jest.config");

module.exports = {
  ...config,
  setupFilesAfterEnv: [...config.setupFilesAfterEnv, "<rootDir>/setup-jest.ts"],
};

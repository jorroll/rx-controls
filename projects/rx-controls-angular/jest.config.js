const config = require("../../jest.config");

module.exports = {
  ...config,
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
};

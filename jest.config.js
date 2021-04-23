module.exports = {
  // moduleNameMapper: {
  //   "@core/(.*)": "<rootDir>/src/app/core/$1",
  // },
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!lodash-es/.*)"],
  modulePathIgnorePatterns: [
    "<rootDir>/projects/reactive-form-controls/build/",
    "<rootDir>/projects/reactive-form-controls-angular/build/",
  ],
};

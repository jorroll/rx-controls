# Testing info

Because the `rx-controls-solid` package needs to use babel, it uses the babel-typescript transpiler whereas `rx-controls` uses `tsc` (for `namespace` support). This means that `rx-controls-solid` and `rx-controls-angular` use the built `rx-controls` package for testing rather than pulling in and building `rx-controls` from source. This means that, in order to test changes to `rx-controls` in the packages that depend on it, you must first build `rx-controls` before running the tests of `rx-controls-solid` or `rx-controls-angular`.

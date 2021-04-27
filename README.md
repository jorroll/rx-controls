# rx-controls

This library provides several javascript objects to make dealing with forms easier. The library can be used stand-alone via `rx-controls` or via one of the framework specific options. Documentation is still a WIP. You can play with a codesandbox for `rx-controls-solid` [here](https://codesandbox.io/s/rxcontrols-solid-blog-example-4sh0x?initialpath=index.tsx).

Both `rx-controls-solid` and `rx-controls-angular` are potentially feature complete and ready to be used in small projects. I'll wait for 3rd party feedback before considering a `1.0` release. At the moment, the biggest piece lacking is the documentation.

Also note, my background is mainly in Angular and I've had some growing pains setting up a monorepo that is framework agnostic. At the moment, the `rx-controls` and `rx-controls-solid` packages only have `main` (node) and `module` (es6) entry points, both of which target `es2015` transpilation (i.e. no `es5` or `UMD` build are currently provided). I hope to improve the published bundles in the future to make this repo more accessible, but for the time being your own build system should be able to downlevel the modules further if necessary.

Docs (nothing yet)

- Angular library
- Solidjs library
- Core library

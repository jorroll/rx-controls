# rx-controls

RxControls provides several javascript `FormControl` objects to make dealing with forms easier. The library can be used stand-alone via `rx-controls` or via one of the framework specific options (Angular and Solidjs). Documentation is still a WIP.

- _Sidenote, my background is mainly in Angular and I've had some growing pains setting up a monorepo that is framework agnostic. At the moment, the `rx-controls` and `rx-controls-solid` packages only have `main` (node) and `module` (es6) entry points, both of which target `es2015` transpilation (i.e. no `es5` or `UMD` builds are currently provided). I hope to improve the published bundles in the future to make this repo more accessible, but for the time being your own build system should be able to downlevel the modules further if necessary._

### Demos

- [Solidjs demo](https://codesandbox.io/s/rxcontrols-solid-blog-example-4sh0x?file=/index.tsx)

## Docs

The core library: `rx-controls`

#### FormControl

The most basic object provided by this library is a `FormControl` which implements the `AbstractControl` interface. Form controls are intended to model, well, a single form control like an `<input>` element. FormControls maintain their own `value`, statuses such as `touched`, `submitted`, `pending`, `invalid`, etc, as well as `errors` and arbitrary `data` and more. You can see the full `AbstractControl` interface documented [in the source](./projects/rx-controls/src/lib/abstract-control/abstract-control.ts) (beginning at line 265 at time of writing).

Some examples:

```ts
const control = new FormControl("", {
  validators: (c) =>
    typeof c.value === "string" && c.length > 0 ? null : { required: true },
});

control.valid; // false
control.invalid; // true
control.errors; // { required: true }
control.setValue("Hi");
control.valid; // true
control.errors; // null
control.touched; // false
control.markTouched(true);
control.touched; // true
```

Form controls can be synced with one another

```ts
import { concat } from "rxjs";

const controlA = new FormControl("Hi");
const controlB = new FormControl(null);

concat(controlA.replayState(), controlA.events).subscribe((e) =>
  controlB.processEvent(e)
);

controlB.value; // "Hi"

controlA.setValue("Hello");
controlA.value; // "Hello"
controlB.value; // "Hello"
```

Form controls can also be synced in both directions

```ts
concat(controlA.replayState(), controlA.events).subscribe((e) =>
  controlB.processEvent(e)
);

controlB.events.subscribe((e) => controlA.processEvent(e));

controlB.setValue("Oops");
controlA.value; // "Oops"
controlB.value; // "Oops"
controlA.setValue("Saved");
controlB.value; // "Saved"
// etc
```

You can also tranform values between form controls (e.g. take string values from one form control and sync them to another as `Date | null` values). Doc examples for this are WIP, but you can see it in the source.

You can subscribe to the value of any control prop via an rxjs observable

```ts
control.observe("value");
control.observeChanges("value");
control.observe("touched");
control.observeChanges("errors").subscribe((errors) => {
  // do stuff
});
```

#### FormGroup

To model a group of form elements, you can use `FormGroup` or `FormArray`, both of which implement `AbstractControlContainer` (see the full interface [in the source here](./projects/rx-controls/src/lib/abstract-control-container/abstract-control-container.ts) - line 159 at time of writing).

```ts
const control = new FormGroup({
  firstName: new FormControl("John"),
  lastName: new FormControl(""),
});

control.value; // { firstName: "John", lastName: "" }
control.patchValue({
  lastName: "Doe",
});
control.value; // { firstName: "John", lastName: "Doe" }

const lastNameControl = control.get("lastName");
lastNameControl.markTouched(true);
lastNameControl.touched; // true
control.touched; // true
control.selfTouched; // false
control.childTouched; // true
control.childrenTouched; // false
```

You can drill down into a form control when subscribing to property changes

```ts
control
  .observe("controls", "firstName", "pending")
  .subscribe((pendingState) => {
    // do stuff
  });

control = new FormGroup({
  address: new FormGroup({
    street: new FormControl(""),
  }),
});

control
  .observe("controls", "address", "controls", "street", "value")
  .subscribe((value) => {
    // do stuff
  });
```

### To be continued...

## About

This library was created by John Carroll with **_significant_** inspiration from Angular's `ReactiveFormsModule`. Anyone familiar with Angular will see many similarities in `rx-controls-angular` and getting started should be made much easier for it.

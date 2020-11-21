import 'jest-preset-angular';

/* global mocks for jsdom */
const mock = () => {
  let storage: { [key: string]: string } = {};
  return {
    getItem: (key: string) => (key in storage ? storage[key] : null),
    setItem: (key: string, value: string) => (storage[key] = value || ''),
    removeItem: (key: string) => delete storage[key],
    clear: () => (storage = {}),
  };
};

Object.defineProperty(window, 'localStorage', { value: mock() });
Object.defineProperty(window, 'sessionStorage', { value: mock() });
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ['-webkit-appearance'],
});

Object.defineProperty(document.body.style, 'transform', {
  value: () => {
    return {
      enumerable: true,
      configurable: true,
    };
  },
});

/* output shorter and more meaningful Zone error stack traces */
(Error as any).stackTraceLimit = 2;

import {
  AbstractControl,
  AbstractControlContainer,
  FormControl,
  FormGroup,
} from './projects/reactive-forms-two/src/lib/models';

expect.extend({
  toEqualControl(received, control, options = {}) {
    // `this` is undefined when this matcher is used like `expect.toEqualControl()`
    // as part of a `toEqual()` value
    // if (this.isNot) {
    //   throw new Error(
    //     `toEqualControl() custom matcher not ` +
    //       `configured to handle "expect.not"`
    //   );
    // }

    if (control === null || control === undefined) {
      expect(received).toBe(control);

      return {
        pass: true,
        message: () => '',
      };
    }

    if (!AbstractControl.isControl(control)) {
      return {
        pass: false,
        message: () =>
          `expected abstract control to match against but received ${control}`,
      };
    }

    if (!AbstractControl.isControl(received)) {
      return {
        pass: false,
        message: () => `expected abstract control but received ${received}`,
      };
    }

    function testControlEquality(args: {
      testablePublicProps: Array<string | { key: string; value: any }>;
      testablePrivateProps: Array<string | { key: string; value: any }>;
    }) {
      const { testablePublicProps, testablePrivateProps } = args;

      for (const prop of [...testablePublicProps, ...testablePrivateProps]) {
        const k = typeof prop === 'object' ? prop.key : prop;

        if (options.skip?.includes(k)) continue;

        let v: any;

        if ([null, undefined].includes((control as any)[k])) {
          v = (control as any)[k];
        } else if (typeof prop === 'object') {
          v = prop.value;
        } else {
          v = (control as any)[k];
        }

        expect(control).toHaveProperty(k);
        expect(received).toHaveProperty(k, v);
      }
    }

    if (control instanceof FormControl) {
      expect(received).toBeInstanceOf(FormControl);

      testControlEquality({
        testablePrivateProps: testablePublicFormControlProps,
        testablePublicProps: testablePrivateFormControlProps,
      });
    } else if (control instanceof FormGroup) {
      expect(
        AbstractControlContainer.isControlContainer(received)
      ).toBeTruthy();
      expect(received).toBeInstanceOf(FormGroup);

      testControlEquality({
        testablePrivateProps: testablePublicFormGroupProps,
        testablePublicProps: testablePrivateFormGroupProps,
      });

      const entries = Object.entries(control.controls).map(
        ([k, v]) => [k, expect.toEqualControl(v as any, options)] as const
      );

      expect((received as FormGroup).controls).toEqual(
        Object.fromEntries(entries)
      );

      expect((received as FormGroup).controlsStore).toEqual(new Map(entries));
    } else {
      throw new Error(`Unexpected control type: ${control.constructor}`);
    }

    if (!options.__parentsChecked) options.__parentsChecked = [];

    if (
      !options.skip?.includes('parent') &&
      !options.__parentsChecked.includes(received.parent) &&
      received.parent !== control.parent
    ) {
      options.__parentsChecked.push(received.parent);
      expect(received.parent).toEqualControl(control.parent, options);
    }

    // This point is reached when the above assertion was successful.
    // The test should therefore always pass, that means it needs to be
    // `true` when used normally, and `false` when `.not` was used.
    return { pass: true, message: () => 'this error message never used' };
  },
  toImplementObject(received, object) {
    if (typeof received !== 'object') {
      return {
        pass: false,
        message: () => `expected an object received ${received}`,
      };
    }

    for (const [k, v] of Object.entries(object)) {
      expect(received).toHaveProperty(k, v);
    }

    return { pass: true, message: () => 'this error message never used' };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toEqualControl(
        control?: AbstractControl | null,
        options?: { skip?: string[] }
      ): R;
      toImplementObject(object?: object): R;
    }

    interface Expect {
      toEqualControl(
        control?: AbstractControl | null,
        options?: { skip?: string[] }
      ): any;
      toImplementObject(object?: object): any;
    }
  }
}

// const publicAbstractControlProps: Array<keyof AbstractControl & string> = [
//   'asyncValidationService',
//   'clone',
//   'data',
//   'dirty',
//   'disabled',
//   'emitEvent',
//   'enabled',
//   'errors',
//   'errorsStore',
//   'events',
//   'id',
//   'invalid',
//   'markAsyncValidationComplete',
//   'markDirty',
//   'markDisabled',
//   'markPending',
//   'markReadonly',
//   'markSubmitted',
//   'markTouched',
//   'markValidationComplete',
//   'observe',
//   'observeChanges',
//   'parent',
//   'patchErrors',
//   'pending',
//   'pendingStore',
//   'readonly',
//   'replayState',
//   'setData',
//   'setErrors',
//   'setParent',
//   'setValue',
//   'source',
//   'status',
//   'submitted',
//   'touched',
//   'valid',
//   'validationService',
//   'validator',
//   'validatorStore',
//   'value',
//   // AbstractControl.INTERFACE,
// ];

// const privateAbstractControlProps: string[] = [
//   '_dirty',
//   '_disabled',
//   '_errors',
//   '_errorsStore',
//   '_parent',
//   '_pending',
//   '_pendingStore',
//   '_readonly',
//   '_registeredAsyncValidators',
//   '_registeredValidators',
//   '_runningAsyncValidation',
//   '_runningValidation',
//   '_status',
//   '_submitted',
//   '_touched',
//   '_validator',
//   '_validatorStore',
//   '_value',
//   'getControlStatus',
//   'processEvent_StateChange',
//   'processEvent',
//   'processStateChange_Data',
//   'processStateChange_Dirty',
//   'processStateChange_Disabled',
//   'processStateChange_ErrorsStore',
//   'processStateChange_Parent',
//   'processStateChange_PendingStore',
//   'processStateChange_Readonly',
//   'processStateChange_RegisteredAsyncValidators',
//   'processStateChange_RegisteredValidators',
//   'processStateChange_RunningAsyncValidation',
//   'processStateChange_RunningValidation',
//   'processStateChange_Submitted',
//   'processStateChange_Touched',
//   'processStateChange_ValidatorStore',
//   'processStateChange_Value',
//   'processStateChange',
//   'updateErrorsProp',
// ];

// const publicControlContainerProps: Array<keyof AbstractControlContainer & string> = [
//   ...publicAbstractControlProps,
//   'addControl',
//   'asyncValidationService',
//   'childDirty',
//   'childDisabled',
//   'childInvalid',
//   'childPending',
//   'childReadonly',
//   'childrenDirty',
//   'childrenDisabled',
//   'childrenErrors',
//   'childrenInvalid',
//   'childrenPending',
//   'childrenReadonly',
//   'childrenSubmitted',
//   'childrenTouched',
//   'childrenValid',
//   'childSubmitted',
//   'childTouched',
//   'childValid',
//   'containerDirty',
//   'containerDisabled',
//   'containerErrors',
//   'containerInvalid',
//   'containerPending',
//   'containerReadonly',
//   'containerSubmitted',
//   'containerTouched',
//   'containerValid',
//   'controls',
//   'controlsStore',
//   'enabledValue',
//   'get',
//   'markChildrenDirty',
//   'markChildrenDisabled',
//   'markChildrenPending',
//   'markChildrenReadonly',
//   'markChildrenSubmitted',
//   'markChildrenTouched',
//   'patchValue',
//   'removeControl',
//   'setControl',
//   'setControls',
//   'size',
//   // AbstractControlContainer.INTERFACE,
// ];

// const privateControlContainerProps: string[] = [
//   ...privateAbstractControlProps,
//   '_controls',
//   '_controlsStore',
//   '_enabledValue',
//   '_childInvalid',
//   '_childrenInvalid',
//   '_childDisabled',
//   '_childrenDisabled',
//   '_childReadonly',
//   '_childrenReadonly',
//   '_childSubmitted',
//   '_childrenSubmitted',
//   '_childTouched',
//   '_childrenTouched',
//   '_childDirty',
//   '_childrenDirty',
//   '_childPending',
//   '_childrenPending',
//   '_combinedErrors',
//   '_childrenErrors',
//   '_controlsSubscriptions',
//   'registerControl',
//   'unregisterControl',
//   'processEvent',
//   'processStateChange',
//   'processStateChange_ControlsStore',
//   'processChildEvent_StateChange',
//   'processChildStateChange',
//   'processChildStateChange_ChildStateChange',
//   'processChildStateChange_Value',
//   'processChildStateChange_Disabled',
//   'processChildStateChange_Touched',
//   'processChildStateChange_Dirty',
//   'processChildStateChange_Readonly',
//   'processChildStateChange_Submitted',
//   'processChildStateChange_ErrorsStore',
//   'processChildStateChange_ValidatorStore',
//   'processChildStateChange_PendingStore',
//   'processChildStateChange_ControlsStore',
//   'updateErrorsProp',
// ];

// const publicFormControlProps: Array<keyof FormControl & string> = [
//   ...publicAbstractControlProps,
// ];
// const privateFormControlProps: string[] = [...privateAbstractControlProps];

// const publicFormGroupProps: Array<keyof FormGroup & string> = [
//   ...publicControlContainerProps,
// ];
// const privateFormGroupProps: string[] = [...privateControlContainerProps];

/**
 * BEGIN TESTABLE PROPS LIST
 */

const testablePublicAbstractControlProps: Array<
  (keyof AbstractControl & string) | { key: string; value: any }
> = [
  'asyncValidationService',
  'clone',
  'data',
  'dirty',
  'disabled',
  'emitEvent',
  'enabled',
  'errors',
  'errorsStore',
  // 'events',
  // 'id',
  'invalid',
  'markAsyncValidationComplete',
  'markDirty',
  'markDisabled',
  'markPending',
  'markReadonly',
  'markSubmitted',
  'markTouched',
  'markValidationComplete',
  'observe',
  'observeChanges',
  // 'parent',
  'patchErrors',
  'pending',
  'pendingStore',
  'readonly',
  'replayState',
  'setData',
  'setErrors',
  'setParent',
  'setValue',
  // 'source',
  'status',
  'submitted',
  'touched',
  'valid',
  'validationService',
  { key: 'validator', value: expect.any(Function) },
  'validatorStore',
  'value',
  // AbstractControl.INTERFACE,
];

const testablePrivateAbstractControlProps: Array<
  string | { key: string; value: any }
> = [
  '_dirty',
  '_disabled',
  '_errors',
  '_errorsStore',
  // '_parent',
  '_pending',
  '_pendingStore',
  '_readonly',
  '_registeredAsyncValidators',
  '_registeredValidators',
  '_runningAsyncValidation',
  '_runningValidation',
  '_status',
  '_submitted',
  '_touched',
  { key: '_validator', value: expect.any(Function) },
  '_validatorStore',
  '_value',
  'getControlStatus',
  'processEvent_StateChange',
  'processEvent',
  'processStateChange_Data',
  'processStateChange_Dirty',
  'processStateChange_Disabled',
  'processStateChange_ErrorsStore',
  'processStateChange_Parent',
  'processStateChange_PendingStore',
  'processStateChange_Readonly',
  'processStateChange_RegisteredAsyncValidators',
  'processStateChange_RegisteredValidators',
  'processStateChange_RunningAsyncValidation',
  'processStateChange_RunningValidation',
  'processStateChange_Submitted',
  'processStateChange_Touched',
  'processStateChange_ValidatorStore',
  'processStateChange_Value',
  'processStateChange',
  'updateErrorsProp',
];

const testablePublicControlContainerProps: Array<
  (keyof AbstractControlContainer & string) | { key: string; value: any }
> = [
  ...testablePublicAbstractControlProps,
  'addControl',
  'asyncValidationService',
  'childDirty',
  'childDisabled',
  'childInvalid',
  'childPending',
  'childReadonly',
  'childrenDirty',
  'childrenDisabled',
  'childrenErrors',
  'childrenInvalid',
  'childrenPending',
  'childrenReadonly',
  'childrenSubmitted',
  'childrenTouched',
  'childrenValid',
  'childSubmitted',
  'childTouched',
  'childValid',
  'containerDirty',
  'containerDisabled',
  'containerErrors',
  'containerInvalid',
  'containerPending',
  'containerReadonly',
  'containerSubmitted',
  'containerTouched',
  'containerValid',
  // 'controls',
  // 'controlsStore',
  'enabledValue',
  'get',
  'markChildrenDirty',
  'markChildrenDisabled',
  'markChildrenPending',
  'markChildrenReadonly',
  'markChildrenSubmitted',
  'markChildrenTouched',
  'patchValue',
  'removeControl',
  'setControl',
  'setControls',
  'size',
  // AbstractControlContainer.INTERFACE,
];

const testablePrivateControlContainerProps: Array<
  string | { key: string; value: any }
> = [
  ...testablePrivateAbstractControlProps,
  // '_controls',
  // '_controlsStore',
  '_enabledValue',
  '_childInvalid',
  '_childrenInvalid',
  '_childDisabled',
  '_childrenDisabled',
  '_childReadonly',
  '_childrenReadonly',
  '_childSubmitted',
  '_childrenSubmitted',
  '_childTouched',
  '_childrenTouched',
  '_childDirty',
  '_childrenDirty',
  '_childPending',
  '_childrenPending',
  '_combinedErrors',
  '_childrenErrors',
  // '_controlsSubscriptions',
  'registerControl',
  'unregisterControl',
  'processEvent',
  'processStateChange',
  'processStateChange_ControlsStore',
  'processChildEvent_StateChange',
  'processChildStateChange',
  'processChildStateChange_ChildStateChange',
  'processChildStateChange_Value',
  'processChildStateChange_Disabled',
  'processChildStateChange_Touched',
  'processChildStateChange_Dirty',
  'processChildStateChange_Readonly',
  'processChildStateChange_Submitted',
  'processChildStateChange_ErrorsStore',
  'processChildStateChange_ValidatorStore',
  'processChildStateChange_PendingStore',
  'processChildStateChange_ControlsStore',
  'updateErrorsProp',
];

const testablePublicFormControlProps: Array<
  (keyof FormControl & string) | { key: string; value: any }
> = [...testablePublicAbstractControlProps];
const testablePrivateFormControlProps: Array<
  string | { key: string; value: any }
> = [...testablePrivateAbstractControlProps];

const testablePublicFormGroupProps: Array<
  (keyof FormGroup & string) | { key: string; value: any }
> = [...testablePublicControlContainerProps];
const testablePrivateFormGroupProps: Array<
  string | { key: string; value: any }
> = [...testablePrivateControlContainerProps];

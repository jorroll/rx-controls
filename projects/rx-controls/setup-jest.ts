import {
  AbstractControl,
  AbstractControlContainer,
  FormControl,
  FormGroup,
  FormArray,
} from './src/public-api';

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

        try {
          expect(control).toHaveProperty(k);
          expect(received).toHaveProperty(k, v);
        } catch (e) {
          return e.matcherResult;
        }
      }
    }

    if (control instanceof FormControl) {
      try {
        expect(received).toBeInstanceOf(FormControl);
      } catch (e) {
        return e.matcherResult;
      }

      const result = testControlEquality({
        testablePublicProps: testablePublicFormControlProps,
        testablePrivateProps: testablePrivateFormControlProps,
      });

      if (result) return result;
    } else if (control instanceof FormGroup) {
      try {
        expect(
          AbstractControlContainer.isControlContainer(received)
        ).toBeTruthy();
        expect(received).toBeInstanceOf(FormGroup);
      } catch (e) {
        return e.matcherResult;
      }

      const result = testControlEquality({
        testablePublicProps: testablePublicFormGroupProps,
        testablePrivateProps: testablePrivateFormGroupProps,
      });

      if (result) return result;

      const entries = Object.entries(control.controls).map(
        ([k, v]) => [k, expect.toEqualControl(v as any, options)] as const
      );

      try {
        expect((received as FormGroup).controls).toEqual(
          Object.fromEntries(entries)
        );

        expect((received as FormGroup).controlsStore).toEqual(new Map(entries));
      } catch (e) {
        return e.matcherResult;
      }
    } else if (control instanceof FormArray) {
      try {
        expect(
          AbstractControlContainer.isControlContainer(received)
        ).toBeTruthy();
        expect(received).toBeInstanceOf(FormArray);
      } catch (e) {
        return e.matcherResult;
      }

      const result = testControlEquality({
        testablePublicProps: testablePublicFormArrayProps,
        testablePrivateProps: testablePrivateFormArrayProps,
      });

      if (result) return result;

      const controls = control.controls.map((c: any) =>
        expect.toEqualControl(c as any, options)
      );

      try {
        expect((received as FormArray).controls).toEqual(controls);

        expect((received as FormArray).controlsStore).toEqual(
          new Map(controls.map((c: any, i: any) => [i, c]))
        );
      } catch (e) {
        return e.matcherResult;
      }
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
      try {
        expect(received).toHaveProperty(k, v);
      } catch (e) {
        return e.matcherResult;
      }
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
//   '_setParent',
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
  'clone',
  'data',
  'dirty',
  'selfDirty',
  'disabled',
  'selfDisabled',
  'enabled',
  'selfEnabled',
  'errors',
  'selfErrors',
  'errorsStore',
  // 'events',
  // 'id',
  'invalid',
  'selfInvalid',
  'markDirty',
  'markDisabled',
  'markPending',
  'markReadonly',
  'markSubmitted',
  'markTouched',
  'observe',
  'observeChanges',
  // 'parent',
  'patchErrors',
  'pending',
  'selfPending',
  'pendingStore',
  'processEvent',
  'readonly',
  'selfReadonly',
  'replayState',
  'setData',
  'setErrors',
  '_setParent',
  'setValue',
  // 'source',
  'status',
  'submitted',
  'selfSubmitted',
  'touched',
  'selfTouched',
  'valid',
  'selfValid',
  { key: 'validator', value: expect.any(Function) },
  'validatorStore',
  'value',
  'rawValue',
  // AbstractControl.INTERFACE,
];

const testablePrivateAbstractControlProps: Array<
  string | { key: string; value: any }
> = [
  '_selfDirty',
  '_selfDisabled',
  '_selfErrors',
  '_errorsStore',
  // '_parent',
  '_selfPending',
  '_pendingStore',
  '_selfReadonly',
  '_status',
  '_selfSubmitted',
  '_selfTouched',
  { key: '_validator', value: expect.any(Function) },
  '_validatorStore',
  '_rawValue',
  '_emitEvent',
  '_getControlStatus',
  '_processEvent_StateChange',
  '_validate',
  '_calculateErrors',
];

const testablePublicControlContainerProps: Array<
  (keyof AbstractControlContainer & string) | { key: string; value: any }
> = [
  ...testablePublicAbstractControlProps,
  'addControl',
  'childEnabled',
  'childDirty',
  'childDisabled',
  'childInvalid',
  'childPending',
  'childReadonly',
  'childrenEnabled',
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
  // 'controls',
  // 'controlsStore',
  'get',
  // 'markChildrenDirty',
  // 'markChildrenDisabled',
  // 'markChildrenPending',
  // 'markChildrenReadonly',
  // 'markChildrenSubmitted',
  // 'markChildrenTouched',
  'patchValue',
  'processEvent',
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
  '_value',
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
  '_errors',
  '_childrenErrors',
  // '_controlsSubscriptions',
  '_registerControl',
  '_unregisterControl',
  // 'processChildEffectingStateChangeResults',
  '_processEvent_ExternalChildStateChange',
  '_processInternalChildrenStateChanges',
  '_normalizeChildrenStateChanges',
  '_coerceControlStringKey',
  '_calculateChildProps',
  '_calculateChildrenErrors',
  '_shallowCloneValue',
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

const testablePublicFormArrayProps: Array<
  (keyof FormArray & string) | { key: string; value: any }
> = [...testablePublicControlContainerProps, 'push', 'unshift'];
const testablePrivateFormArrayProps: Array<
  string | { key: string; value: any }
> = [...testablePrivateControlContainerProps];

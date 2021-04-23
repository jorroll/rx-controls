import 'core-js/features/object';

// import {
//   AbstractControl,
//   ControlContainer,
//   FormControl,
//   FormGroup,
// } from './src/lib/models';

// expect.extend({
//   toEqualControl(received, control) {
//     if (this.isNot) {
//       throw new Error(
//         `toEqualControl() custom matcher not ` +
//           `configured to handle "expect.not"`
//       );
//     }

//     if (control === null || control === undefined) {
//       expect(received).toBe(control);

//       return {
//         pass: true,
//         message: () => '',
//       };
//     }

//     if (!AbstractControl.isAbstractControl(control)) {
//       return {
//         pass: false,
//         message: () => `expected ${control} to be an abstract control`,
//       };
//     }

//     if (!AbstractControl.isAbstractControl(received)) {
//       return {
//         pass: false,
//         message: () => `expected ${received} to be an abstract control`,
//       };
//     }

//     function testControlEquality(args: {
//       publicProps: string[];
//       privateProps: string[];
//       testablePublicProps: string[];
//       testablePrivateProps: string[];
//     }) {
//       const {
//         publicProps,
//         privateProps,
//         testablePublicProps,
//         testablePrivateProps,
//       } = args;

//       try {
//         expect(Object.keys(control)).toContain(publicProps);
//       } catch (e) {
//         console.error(
//           `The provided cononical control doesn't ` +
//             `have the expected public props`
//         );

//         throw e;
//       }

//       try {
//         expect(Object.keys(control)).toContain(privateProps);
//       } catch (e) {
//         console.error(
//           `The provided cononical control doesn't ` +
//             `have the expected private props`
//         );

//         throw e;
//       }

//       expect(Object.keys(received)).toContain(publicProps);
//       expect(Object.keys(received)).toContain(privateProps);

//       for (const prop of testablePublicProps) {
//         expect(control).toHaveProperty(prop as string);
//         expect(received).toHaveProperty(prop as string, control[prop]);
//       }

//       for (const prop of testablePrivateProps) {
//         expect(control).toHaveProperty(prop as string);
//         expect(received).toHaveProperty(prop as string, (control as any)[prop]);
//       }
//     }

//     if (control instanceof FormControl) {
//       expect(received).toBeInstanceOf(FormControl);

//       testControlEquality({
//         publicProps: publicFormControlProps,
//         privateProps: privateFormControlProps,
//         testablePrivateProps: testablePublicFormControlProps,
//         testablePublicProps: testablePrivateFormControlProps,
//       });
//     } else if (control instanceof FormGroup) {
//       expect(received).toBeInstanceOf(FormGroup);

//       testControlEquality({
//         publicProps: publicFormGroupProps,
//         privateProps: privateFormGroupProps,
//         testablePrivateProps: testablePublicFormGroupProps,
//         testablePublicProps: testablePrivateFormGroupProps,
//       });

//       const entries = Object.entries(control.controls).map(
//         ([k, v]) => [k, expect.toEqualControl(v as any)] as const
//       );

//       expect((received as FormGroup).controls).toEqual(
//         Object.fromEntries(entries)
//       );

//       expect((received as FormGroup).controlsStore).toEqual(new Map(entries));
//     } else {
//       throw new Error(`Unexpected control type: ${control.constructor}`);
//     }

//     expect(received.parent).toEqualControl(control.parent);

//     // This point is reached when the above assertion was successful.
//     // The test should therefore always pass, that means it needs to be
//     // `true` when used normally, and `false` when `.not` was used.
//     return { pass: true, message: () => 'this error message never used' };
//   },
// });

// declare global {
//   namespace jest {
//     interface Matchers<R> {
//       toEqualControl(control?: AbstractControl | null): R;
//     }

//     interface Expect {
//       toEqualControl(control?: AbstractControl | null): any;
//     }
//   }
// }

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

// const publicControlContainerProps: Array<keyof ControlContainer & string> = [
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
//   // ControlContainer.INTERFACE,
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

// /**
//  * BEGIN TESTABLE PROPS LIST
//  */

// const testablePublicAbstractControlProps: Array<
//   keyof AbstractControl & string
// > = [
//   'asyncValidationService',
//   'clone',
//   'data',
//   'dirty',
//   'disabled',
//   'emitEvent',
//   'enabled',
//   'errors',
//   'errorsStore',
//   // 'events',
//   // 'id',
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
//   // 'parent',
//   'patchErrors',
//   'pending',
//   'pendingStore',
//   'readonly',
//   'replayState',
//   'setData',
//   'setErrors',
//   'setParent',
//   'setValue',
//   // 'source',
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

// const testablePrivateAbstractControlProps: string[] = [
//   '_dirty',
//   '_disabled',
//   '_errors',
//   '_errorsStore',
//   // '_parent',
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

// const testablePublicControlContainerProps: Array<
//   keyof ControlContainer & string
// > = [
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
//   // 'controls',
//   // 'controlsStore',
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
//   // ControlContainer.INTERFACE,
// ];

// const testablePrivateControlContainerProps: string[] = [
//   ...privateAbstractControlProps,
//   // '_controls',
//   // '_controlsStore',
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
//   // '_controlsSubscriptions',
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

// const testablePublicFormControlProps: Array<keyof FormControl & string> = [
//   ...testablePublicAbstractControlProps,
// ];
// const testablePrivateFormControlProps: string[] = [
//   ...testablePrivateAbstractControlProps,
// ];

// const testablePublicFormGroupProps: Array<keyof FormGroup & string> = [
//   ...testablePublicControlContainerProps,
// ];
// const testablePrivateFormGroupProps: string[] = [
//   ...testablePrivateControlContainerProps,
// ];

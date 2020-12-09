import {
  AbstractControl,
  IControlEvent,
  IControlEventOptions,
  IStateChange,
  ValidationErrors,
  IControlStateChange,
  IControlStateChangeEvent,
} from '../abstract-control/abstract-control';
import { FormControl } from '../form-control';

// UTILITY TYPES

type PickUndefinedKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];

type PickRequiredKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? never : K;
}[keyof T];

type ObjectControlsOptionalValue<
  T extends { [key: string]: AbstractControl | undefined }
> = {
  [P in Exclude<PickUndefinedKeys<T>, undefined>]?: NonNullable<T[P]>['value'];
};

type ObjectControlsRequiredValue<
  T extends { [key: string]: AbstractControl | undefined }
> = {
  [P in Exclude<PickRequiredKeys<T>, undefined>]: NonNullable<T[P]>['value'];
};

type ArrayControlsValue<
  T extends ReadonlyArray<AbstractControl>
> = T extends ReadonlyArray<infer C>
  ? C extends AbstractControl
    ? C['value']
    : never
  : never;

type ObjectControlsOptionalEnabledValue<
  T extends { [key: string]: AbstractControl | undefined }
> = {
  [P in Exclude<PickUndefinedKeys<T>, undefined>]?: NonNullable<
    T[P]
  > extends AbstractControlContainer
    ? NonNullable<T[P]>['enabledValue']
    : NonNullable<T[P]>['value'];
};

type ObjectControlsRequiredEnabledValue<
  T extends { [key: string]: AbstractControl | undefined }
> = {
  [P in Exclude<PickRequiredKeys<T>, undefined>]: NonNullable<
    T[P]
  > extends AbstractControlContainer
    ? NonNullable<T[P]>['enabledValue']
    : NonNullable<T[P]>['value'];
};

type ArrayControlsEnabledValue<
  T extends ReadonlyArray<AbstractControl>
> = T extends ReadonlyArray<infer C>
  ? C extends AbstractControlContainer
    ? C['enabledValue']
    : C extends AbstractControl
    ? C['value']
    : never
  : never;

// END UTILITY TYPES

export type GenericControlsObject =
  | {
      readonly [key: string]: AbstractControl | undefined;
    }
  | ReadonlyArray<AbstractControl>;

export type ControlsKey<
  Controls extends GenericControlsObject
> = Controls extends ReadonlyArray<any>
  ? keyof Controls & number
  : Controls extends object
  ? // the `& string` is needed or else
    // ControlsKey<{[key: string]: AbstractControl}> is type string | number
    keyof Controls & string
  : any;

export type ControlsValue<
  Controls extends GenericControlsObject
> = Controls extends ReadonlyArray<AbstractControl>
  ? ArrayControlsValue<Controls>
  : Controls extends { readonly [key: string]: AbstractControl | undefined }
  ? ObjectControlsRequiredValue<Controls> &
      ObjectControlsOptionalValue<Controls>
  : never;

export type ControlsEnabledValue<
  Controls extends GenericControlsObject
> = Controls extends ReadonlyArray<AbstractControl>
  ? ArrayControlsEnabledValue<Controls>
  : Controls extends { readonly [key: string]: AbstractControl | undefined }
  ? Partial<
      ObjectControlsRequiredEnabledValue<Controls> &
        ObjectControlsOptionalEnabledValue<Controls>
    >
  : never;

export type ContainerControls<C> = C extends AbstractControlContainer<
  infer Controls
>
  ? Controls
  : unknown;

export interface IControlContainerStateChange<
  Controls extends GenericControlsObject,
  D
> extends IControlStateChange<ControlsValue<Controls>, D> {
  controlsStore?: IStateChange<
    ReadonlyMap<ControlsKey<Controls>, Controls[ControlsKey<Controls>]>
  >;
}

export interface IControlContainerStateChangeEvent<
  Controls extends GenericControlsObject,
  D
> extends IControlStateChangeEvent<ControlsValue<Controls>, D> {
  change: IControlContainerStateChange<Controls, D>;
}

export interface IChildControlEvent<Controls extends GenericControlsObject>
  extends IControlEvent {
  key: ControlsKey<Controls>;
  childEvent: IControlEvent;
}

export interface IChildControlStateChangeEvent<
  Controls extends GenericControlsObject,
  D
> extends IChildControlEvent<Controls> {
  type: 'ChildStateChange';
  childEvent:
    | IControlStateChangeEvent<
        ControlsValue<Controls>[ControlsKey<Controls>],
        D
      >
    | IChildControlStateChangeEvent<Controls, D>;
  changedProps: string[];
}

export namespace AbstractControlContainer {
  export const INTERFACE = Symbol('@@AbstractControlContainerInterface');

  export function isControlContainer(
    object?: any
  ): object is AbstractControlContainer {
    return (
      AbstractControl.isControl(object) &&
      typeof (object as any)[AbstractControlContainer.INTERFACE] ===
        'function' &&
      (object as any)[AbstractControlContainer.INTERFACE]() === object
    );
  }
}

export interface AbstractControlContainer<
  Controls extends GenericControlsObject = any,
  Data = any
> extends AbstractControl<ControlsValue<Controls>, Data> {
  readonly controls: Controls;
  readonly controlsStore: ReadonlyMap<
    ControlsKey<Controls>,
    NonNullable<Controls[ControlsKey<Controls>]>
  >;
  readonly size: number;

  /**
   * Only returns values for `enabled` child controls. If a
   * child control is itself a `ControlContainer`, it will return
   * the `enabledValue` for that child.
   */
  readonly enabledValue: ControlsEnabledValue<Controls>;

  /** Will return true if `containerValid` and `childrenValid` */
  readonly valid: boolean;
  /** Will return true if the `ControlContainer` has no errors. */
  readonly containerValid: boolean;
  /** Will return true if *any* enabled child control is valid */
  readonly childValid: boolean;
  /** Will return true if *all* enabled child control's are valid */
  readonly childrenValid: boolean;

  /** Will return true if `containerInvalid` or `childInvalid` */
  readonly invalid: boolean;
  /** Will return true if the `ControlContainer` has any errors. */
  readonly containerInvalid: boolean;
  /** Will return true if *any* enabled child control is invalid */
  readonly childInvalid: boolean;
  /** Will return true if *all* enabled child control's are invalid */
  readonly childrenInvalid: boolean;

  /** Will return true if `containerEnabled` and `childEnabled` */
  readonly enabled: boolean;
  /** Will return true if the `ControlContainer` is enabled. */
  readonly containerEnabled: boolean;
  /** Will return true if *any* child control is enabled */
  readonly childEnabled: boolean;
  /** Will return true if *all* child control's are enabled */
  readonly childrenEnabled: boolean;

  /** Will return true if `containerDisabled` or `childrenDisabled` */
  readonly disabled: boolean;
  /** Will return true if the `ControlContainer` is disabled. */
  readonly containerDisabled: boolean;
  /** Will return true if *any* child control is disabled */
  readonly childDisabled: boolean;
  /** Will return true if *all* child control's are disabled */
  readonly childrenDisabled: boolean;

  /** Will return true if `containerReadonly` or `childrenReadonly` */
  readonly readonly: boolean;
  /** Will return true if the `ControlContainer` is readonly. */
  readonly containerReadonly: boolean;
  /** Will return true if *any* enabled child control is readonly */
  readonly childReadonly: boolean;
  /** Will return true if *all* enabled child control's are readonly */
  readonly childrenReadonly: boolean;

  /** Will return true if `containerPending` or `childPending` */
  readonly pending: boolean;
  /** Will return true if the `ControlContainer` is pending. */
  readonly containerPending: boolean;
  /** Will return true if *any* enabled child control is pending */
  readonly childPending: boolean;
  /** Will return true if *all* enabled child control's are pending */
  readonly childrenPending: boolean;

  /** Will return true if `containerTouched` or `childTouched` */
  readonly touched: boolean;
  /** Will return true if the `ControlContainer` is touched. */
  readonly containerTouched: boolean;
  /** Will return true if *any* enabled child control is touched */
  readonly childTouched: boolean;
  /** Will return true if *all* enabled child control's are touched */
  readonly childrenTouched: boolean;

  /** Will return true if `containerDirty` or `childDirty` */
  readonly dirty: boolean;
  /** Will return true if the `ControlContainer` is dirty. */
  readonly containerDirty: boolean;
  /** Will return true if *any* enabled child control is dirty */
  readonly childDirty: boolean;
  /** Will return true if *all* enabled child control's are dirty */
  readonly childrenDirty: boolean;

  /** Will return true if `containerSubmitted` or `childrenSubmitted` */
  readonly submitted: boolean;
  /** Will return true if the `ControlContainer` is submitted. */
  readonly containerSubmitted: boolean;
  /** Will return true if *any* enabled child control is submitted */
  readonly childSubmitted: boolean;
  /** Will return true if *all* enabled child control's are submitted */
  readonly childrenSubmitted: boolean;

  /** Contains `{ ...childrenErrors, ...containerErrors }` or `null` if there are none */
  readonly errors: ValidationErrors | null;
  /** Contains this AbstractControlContainer's errors or `null` if there are none */
  readonly containerErrors: ValidationErrors | null;
  /** Contains *all* enabled child control errors or `null` if there are none */
  readonly childrenErrors: ValidationErrors | null;

  [AbstractControlContainer.INTERFACE](): this;

  get<A extends ControlsKey<Controls>>(a: A): Controls[A];
  get<
    A extends ControlsKey<Controls>,
    B extends keyof ContainerControls<Controls[A]>
  >(
    a: A,
    b: B
  ): ContainerControls<Controls[A]>[B];
  get<
    A extends ControlsKey<Controls>,
    B extends keyof ContainerControls<Controls[A]>,
    C extends keyof ContainerControls<ContainerControls<Controls[A]>[B]>
  >(
    a: A,
    b: B,
    c: C
  ): ContainerControls<ContainerControls<Controls[A]>[B]>[C];
  get<
    A extends ControlsKey<Controls>,
    B extends keyof ContainerControls<Controls[A]>,
    C extends keyof ContainerControls<ContainerControls<Controls[A]>[B]>,
    D extends keyof ContainerControls<
      ContainerControls<ContainerControls<Controls[A]>[B]>[C]
    >
  >(
    a: A,
    b: B,
    c: C,
    d: D
  ): ContainerControls<
    ContainerControls<ContainerControls<Controls[A]>[B]>[C]
  >[D];
  get<
    A extends ControlsKey<Controls>,
    B extends keyof ContainerControls<Controls[A]>,
    C extends keyof ContainerControls<ContainerControls<Controls[A]>[B]>,
    D extends keyof ContainerControls<
      ContainerControls<ContainerControls<Controls[A]>[B]>[C]
    >,
    E extends keyof ContainerControls<
      ContainerControls<
        ContainerControls<ContainerControls<Controls[A]>[B]>[C]
      >[D]
    >
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E
  ): ContainerControls<
    ContainerControls<
      ContainerControls<ContainerControls<Controls[A]>[B]>[C]
    >[D]
  >[E];
  get<A extends AbstractControl = AbstractControl>(...args: any[]): A | null;

  patchValue(value: unknown, options?: IControlEventOptions): void;

  setControls(controls: Controls, options?: IControlEventOptions): void;
  // setControl<N extends ControlsKey<Controls>>(
  //   name: N,
  //   control: Controls[N] | null,
  //   options?: IControlEventOptions
  // ): void;
  // addControl<N extends ControlsKey<Controls>>(
  //   name: N,
  //   control: Controls[N],
  //   options?: IControlEventOptions
  // ): void;
  // removeControl(
  //   name: ControlsKey<Controls>,
  //   options?: IControlEventOptions
  // ): void;

  setControl(
    name: unknown,
    control: unknown,
    options?: IControlEventOptions
  ): void;
  addControl(
    name: unknown,
    control: unknown,
    options?: IControlEventOptions
  ): void;
  removeControl(name: unknown, options?: IControlEventOptions): void;

  markChildrenDisabled(value: boolean, options?: IControlEventOptions): void;
  markChildrenTouched(value: boolean, options?: IControlEventOptions): void;
  markChildrenDirty(value: boolean, options?: IControlEventOptions): void;
  markChildrenReadonly(value: boolean, options?: IControlEventOptions): void;
  markChildrenSubmitted(value: boolean, options?: IControlEventOptions): void;
  markChildrenPending(value: boolean, options?: IControlEventOptions): void;

  clone(): AbstractControlContainer<Controls, Data>;
}

/**
 * This exists because of limitations in typescript. It lets the "real"
 * AbstractControlContainer interface be less type safe while still
 * retaining the correct type information in FormArray and FormGroup. If
 * AbstractControlContainer looked like this (and it should), then
 * FormArray<AbstractControl[]> could not be assigned to AbstractControlContainer<any>
 * (and it should be able to be assigned to that).
 *
 * I think the issue arrises because Typescript doesn't seem to recognize that
 * Controls[ControlsKey<Controls>] is an AbstractControl.
 */
export interface PrivateAbstractControlContainer<
  Controls extends GenericControlsObject = any,
  Data = any
> extends AbstractControlContainer<Controls, Data> {
  // setControls(controls: Controls, options?: IControlEventOptions): void;
  setControl<N extends ControlsKey<Controls>>(
    name: N,
    control: Controls[N] | null,
    options?: IControlEventOptions
  ): void;
  addControl<N extends ControlsKey<Controls>>(
    name: N,
    control: Controls[N],
    options?: IControlEventOptions
  ): void;
  removeControl(
    name: ControlsKey<Controls>,
    options?: IControlEventOptions
  ): void;
}

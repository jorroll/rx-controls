import {
  AbstractControl,
  ControlId,
  IControlEvent,
  IControlEventOptions,
  IStateChange,
  ValidationErrors,
} from './abstract-control';
import { IControlStateChange, IControlStateChangeEvent } from './control-base';

export type ContainerControls<C> = C extends ControlContainer<infer Controls>
  ? Controls
  : unknown;

export type GenericControlsObject =
  | {
      readonly [key: string]: AbstractControl;
    }
  | {
      readonly [key: number]: AbstractControl;
    };

export interface IControlContainerStateChange<
  Controls extends GenericControlsObject,
  D
> extends IControlStateChange<ControlsValue<Controls>, D> {
  controlsStore?: IStateChange<
    ReadonlyMap<keyof Controls, Controls[keyof Controls]>
  >;
}

export interface IControlContainerStateChangeEvent<
  Controls extends GenericControlsObject,
  D
> extends IControlStateChangeEvent<ControlsValue<Controls>, D> {
  change: IControlContainerStateChange<Controls, D>;
}

export interface IChildControlEvent extends IControlEvent {
  key: string | number;
  childEvent: IControlEvent;
}

export interface IChildControlStateChangeEvent<
  Controls extends
    | {
        readonly [key: string]: AbstractControl;
      }
    | {
        readonly [key: number]: AbstractControl;
      },
  D
> extends IChildControlEvent {
  type: 'ChildStateChange';
  childEvent:
    | IControlStateChangeEvent<ControlsValue<Controls>[keyof Controls], D>
    | IChildControlStateChangeEvent<Controls, D>;
  sideEffects: string[];
}

export type ControlsValue<
  Controls extends
    | {
        readonly [key: string]: AbstractControl;
      }
    | {
        readonly [key: number]: AbstractControl;
      }
> = {
  readonly [Key in keyof Controls]: Controls[Key] extends AbstractControl
    ? Controls[Key]['value']
    : never;
};

export type ControlsEnabledValue<
  Controls extends
    | {
        readonly [key: string]: AbstractControl;
      }
    | {
        readonly [key: number]: AbstractControl;
      }
> = Controls extends ReadonlyArray<any>
  ? {
      readonly [Key in keyof Controls]: Controls[Key] extends ControlContainer
        ? Controls[Key]['enabledValue']
        : Controls[Key] extends AbstractControl
        ? Controls[Key]['value']
        : never;
    }
  : Partial<
      {
        readonly [Key in keyof Controls]: Controls[Key] extends ControlContainer
          ? Controls[Key]['enabledValue']
          : Controls[Key] extends AbstractControl
          ? Controls[Key]['value']
          : never;
      }
    >;

export namespace ControlContainer {
  export const INTERFACE = Symbol('@@ControlContainerInterface');

  export function isControlContainer(object?: any): object is ControlContainer {
    return (
      AbstractControl.isAbstractControl(object) &&
      typeof (object as any)[ControlContainer.INTERFACE] === 'function' &&
      (object as any)[ControlContainer.INTERFACE]() === object
    );
  }
}

export interface ControlContainer<
  Controls extends
    | {
        readonly [key: string]: AbstractControl;
      }
    | {
        readonly [key: number]: AbstractControl;
      } = any,
  Data = any
> extends AbstractControl<ControlsValue<Controls>, Data> {
  readonly controls: Controls;
  readonly controlsStore: ReadonlyMap<keyof Controls, Controls[keyof Controls]>;
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

  /**
   * If both containerErrors and childrenErrors are null, is null.
   * Else contains `{ ...childrenErrors, ...containerErrors }`.
   */
  readonly errors: ValidationErrors | null;
  /** Contains errors specific to this ControlContainer */
  readonly containerErrors: ValidationErrors | null;
  /** Contains a merged object with all the child control errors or null */
  readonly childrenErrors: ValidationErrors | null;

  [ControlContainer.INTERFACE](): this;

  get<A extends keyof Controls>(a: A): Controls[A];
  get<A extends keyof Controls, B extends keyof ContainerControls<Controls[A]>>(
    a: A,
    b: B
  ): ContainerControls<Controls[A]>[B];
  get<
    A extends keyof Controls,
    B extends keyof ContainerControls<Controls[A]>,
    C extends keyof ContainerControls<ContainerControls<Controls[A]>[B]>
  >(
    a: A,
    b: B,
    c: C
  ): ContainerControls<ContainerControls<Controls[A]>[B]>[C];
  get<
    A extends keyof Controls,
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
    A extends keyof Controls,
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
  setControl<N extends keyof Controls>(
    name: N,
    control: Controls[N] | null,
    options?: IControlEventOptions
  ): void;
  addControl<N extends keyof Controls>(
    name: N,
    control: Controls[N],
    options?: IControlEventOptions
  ): void;
  removeControl(name: keyof Controls, options?: IControlEventOptions): void;

  markChildrenDisabled(value: boolean, options?: IControlEventOptions): void;
  markChildrenTouched(value: boolean, options?: IControlEventOptions): void;
  markChildrenDirty(value: boolean, options?: IControlEventOptions): void;
  markChildrenReadonly(value: boolean, options?: IControlEventOptions): void;
  markChildrenSubmitted(value: boolean, options?: IControlEventOptions): void;
  markChildrenPending(value: boolean, options?: IControlEventOptions): void;

  clone(): ControlContainer<Controls, Data>;
}

import { AbstractControl, IControlEventOptions } from './abstract-control';
import { IControlStateChangeEvent, IControlStateChanges } from './control-base';

// export type ControlContainerControls<T> = T extends ControlContainer<infer C>
//   ? C
//   : never;

export interface IStateChange<V = unknown> {
  value: V;
  // changes: Array<{ type: 'SET' | 'PATCH' | 'ADD' | 'REMOVE'; value: unknown }>;
}

export interface IControlContainerStateChanges extends IControlStateChanges {
  controlsStore?: IStateChange<ReadonlyMap<any, AbstractControl>>;
}

export interface IControlContainerStateChangeEvent
  extends IControlStateChangeEvent {
  type: 'StateChange';
  changes: IControlContainerStateChanges;
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
      (object as any)[ControlContainer.INTERFACE]?.() === object
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
  readonly controlsStore: ReadonlyMap<any, AbstractControl>;
  readonly size: number;
  // readonly value: { [Key in keyof Controls]: Controls[Key]['value'] };
  readonly enabledValue: ControlsEnabledValue<Controls>;

  [ControlContainer.INTERFACE](): this;

  // equalValue(value: any, options?: { assertShape?: boolean }): value is Value;

  patchValue(value: unknown, options?: IControlEventOptions): void;

  get<A extends AbstractControl = AbstractControl>(...args: any[]): A | null;

  setControls(...args: any[]): void;

  setControl(...args: any[]): void;

  addControl(...args: any[]): void;

  removeControl(...args: any[]): void;

  clone(): ControlContainer<Controls, Data>;
}

// type One = ControlContainer<{
//   one: AbstractControl<string>;
//   two: AbstractControl<symbol>;
//   three: AbstractControl<{
//     sleven: string;
//     sleight: number;
//   }>;
// }>;

// type Two = AbstractControl<number>;

// type Three = ControlContainer<Array<AbstractControl<string>>>;

// type Four = ControlContainer<{
//   one: One;
//   two: Two;
//   three: Three;
//   four: AbstractControl<object>;
// }>;

// type V = Four['value'];
// type EV = Four['enabledValue'];

// function fda() {
//   let one: One;
//   let two: Two;
//   let three: Three;
//   let four: Four;

//   const value = four!.value;
//   const enabledValue = four!.enabledValue;

//   const test = enabledValue?.three?.[0];
// }

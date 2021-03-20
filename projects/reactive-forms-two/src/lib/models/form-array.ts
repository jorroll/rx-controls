import {
  AbstractControl,
  IControlEventOptions,
  IControlStateChangeEvent,
} from './abstract-control/abstract-control';
import {
  AbstractControlContainerBase,
  IAbstractControlContainerBaseArgs,
} from './abstract-control-container/abstract-control-container-base';
import {
  ControlsValue,
  ControlsRawValue,
  ControlsKey,
} from './abstract-control-container/abstract-control-container';
import { getSimpleStateChangeEventArgs } from './util';
import { isEqual } from '../util';

export type IFormArrayArgs<
  Data = any,
  RawValue = unknown,
  Value = unknown
> = IAbstractControlContainerBaseArgs<Data, RawValue, Value>;

export class FormArray<
  Controls extends ReadonlyArray<AbstractControl> = ReadonlyArray<AbstractControl>,
  Data = any
> extends AbstractControlContainerBase<Controls, Data> {
  static id = 0;

  constructor(
    controls: Controls = ([] as unknown) as Controls,
    options: IFormArrayArgs<
      Data,
      ControlsRawValue<Controls>,
      ControlsValue<Controls>
    > = {}
  ) {
    super(
      options.id || Symbol(`FormArray-${FormArray.id++}`),
      controls,
      options
    );

    // The constructor's call to "setControls" will only actually fire
    // if a non-default value is provided. In the case of a default value,
    // the following properties need be manually set.
    if (!this._controls) this._controls = ([] as unknown) as Controls;
    if (!this._rawValue) {
      this._rawValue = ([] as unknown) as ControlsRawValue<Controls>;
    }
    if (!this._value) {
      this._value = ([] as unknown) as ControlsValue<Controls>;
    }
  }

  push(control: Controls[number], options?: IControlEventOptions) {
    if (((control as unknown) as AbstractControl)?.parent) {
      throw new Error('AbstractControl can only have one parent');
    }

    const controlsStore = new Map(this.controlsStore).set(
      this.controlsStore.size as ControlsKey<Controls>,
      control as NonNullable<Controls[ControlsKey<Controls>]>
    );

    return this.setControls(controlsStore, options);
  }

  unshift(control: Controls[number], options?: IControlEventOptions) {
    if (((control as unknown) as AbstractControl)?.parent) {
      throw new Error('AbstractControl can only have one parent');
    }

    const controlsStore = new Map([[0 as ControlsKey<Controls>, control]]);

    for (const [k, v] of this.controlsStore) {
      controlsStore.set(((k as number) + 1) as ControlsKey<Controls>, v);
    }

    return this.setControls(controlsStore, options);
  }

  setControls(
    value:
      | Controls
      | ReadonlyMap<ControlsKey<Controls>, Controls[ControlsKey<Controls>]>,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    const controlsStore =
      value instanceof Map
        ? new Map<ControlsKey<Controls>, Controls[ControlsKey<Controls>]>(value)
        : new Map(
            (value as Controls).map(
              (c, i) =>
                [i, c as unknown] as [
                  ControlsKey<Controls>,
                  Controls[ControlsKey<Controls>]
                ]
            )
          );

    if (isEqual(this._controlsStore, controlsStore)) return [];

    const normOptions = this._normalizeOptions('setControls', options);

    // controls that need to be removed
    for (const [key, control] of this._controlsStore) {
      if (controlsStore.get(key) === control) {
        continue;
      }

      this._unregisterControl(control, normOptions);
    }

    const controls: Array<Controls[ControlsKey<Controls>]> = [];
    const newRawValue: Array<this['rawValue'][ControlsKey<Controls>]> = [];
    const newValue: Array<this['value'][ControlsKey<Controls>]> = [];

    // controls that need to be added
    for (const [key, control] of controlsStore) {
      controls.push(control);
      newRawValue.push(control.rawValue);

      if (control.enabled) {
        newValue.push(control.value);
      }

      if (this._controlsStore.get(key) === control) {
        continue;
      }

      // This is needed because the call to "registerControl" can clone
      // the provided control (returning a new one);
      controlsStore.set(key, this._registerControl(key, control, normOptions));
    }

    this._controls = (controls as unknown) as Controls;
    // This is needed because the call to "registerControl" can clone
    // the provided control (returning a new one);
    this._controlsStore = (controlsStore as unknown) as this['controlsStore'];

    const changedProps: Array<keyof this & string> = [
      'controls',
      'controlsStore',
    ];

    if (!isEqual(newRawValue, this._rawValue)) {
      this._rawValue = newRawValue as this['rawValue'];
      changedProps.push('rawValue');
    }

    if (!isEqual(newValue, this._value)) {
      this._value = newValue as this['value'];
      changedProps.push('value');
    }

    changedProps.push(
      ...this._validate(normOptions),
      ...this._calculateChildProps(),
      ...this._calculateChildrenErrors()
    );

    if (!normOptions[AbstractControl.NO_EVENT]) {
      this._emitEvent<IControlStateChangeEvent>(
        getSimpleStateChangeEventArgs(this, changedProps),
        normOptions
      );
    }

    return changedProps;
  }

  protected _shallowCloneValue<T extends this['rawValue'] | this['value']>(
    value: T
  ) {
    return (value as any).slice() as T;
  }

  protected _coerceControlStringKey(key: string) {
    return parseInt(key, 10) as ControlsKey<Controls>;
  }
}

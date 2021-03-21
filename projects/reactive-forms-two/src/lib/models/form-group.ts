import {
  AbstractControl,
  ControlId,
  IControlEventOptions,
  IControlStateChangeEvent,
} from './abstract-control/abstract-control';
import {
  AbstractControlContainerBase,
  IAbstractControlContainerBaseArgs,
} from './abstract-control-container/abstract-control-container-base';
import {
  AbstractControlContainer,
  ContainerControls,
  ControlsValue,
  ControlsRawValue,
  ControlsKey,
} from './abstract-control-container/abstract-control-container';
import { getSimpleStateChangeEventArgs, Mutable } from './util';

export type IFormGroupArgs<
  Data = any,
  RawValue = unknown,
  Value = unknown
> = IAbstractControlContainerBaseArgs<Data, RawValue, Value>;

export class FormGroup<
  Controls extends { [key: string]: AbstractControl | undefined } = {
    [key: string]: AbstractControl;
  },
  Data = any
> extends AbstractControlContainerBase<Controls, Data> {
  static id = 0;

  constructor(
    controls: Controls = {} as Controls,
    options: IFormGroupArgs<
      Data,
      ControlsRawValue<Controls>,
      ControlsValue<Controls>
    > = {}
  ) {
    super(
      options.id || Symbol(`FormGroup-${FormGroup.id++}`),
      controls,
      options
    );

    // The constructor's call to "setControls" will only actually fire
    // if a non-default value is provided. In the case of a default value,
    // the following properties need be manually set.
    if (!this._controls) this._controls = {} as Controls;
    if (!this._rawValue) this._rawValue = {} as ControlsRawValue<Controls>;
    if (!this._value) {
      this._value = {} as ControlsValue<Controls>;
    }
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
            Object.entries(value) as Array<
              [ControlsKey<Controls>, Controls[ControlsKey<Controls>]]
            >
          );

    if (AbstractControl._isEqual(this._controlsStore, controlsStore)) return [];

    const normOptions = this._normalizeOptions('setControls', options);
    const controls = (Object.fromEntries(controlsStore) as unknown) as Controls;
    const newRawValue = { ...this._rawValue } as Mutable<this['rawValue']>;
    const newValue = { ...this._value } as Mutable<this['value']>;

    // controls that need to be removed
    for (const [key, control] of this._controlsStore) {
      if (
        controlsStore.get(key) === control ||
        (normOptions[AbstractControl.NO_EVENT] &&
          AbstractControl._isEqual(controlsStore.get(key), control))
      ) {
        continue;
      }

      this._unregisterControl(control, normOptions);
      delete newRawValue[key];
      delete newValue[key as keyof this['value']];
    }

    // controls that need to be added
    for (const [key, _control] of controlsStore) {
      const control = _control as AbstractControl;

      if (
        this._controlsStore.get(key) === control ||
        (normOptions[AbstractControl.NO_EVENT] &&
          AbstractControl._isEqual(this._controlsStore.get(key), control))
      ) {
        continue;
      }

      // This is needed because the call to "registerControl" can clone
      // the provided control (returning a new one);
      controls[key] = this._registerControl(key, _control, normOptions);
      newRawValue[key] = control.rawValue;

      if (control.enabled) {
        newValue[key as keyof this['value']] = control.value;
      }
    }

    this._controls = controls;
    // This is needed because the call to "registerControl" can clone
    // the provided control (returning a new one);
    this._controlsStore = new Map(Object.entries(controls)) as any;

    const changedProps: Array<keyof this & string> = [
      'controls',
      'controlsStore',
    ];

    if (!AbstractControl._isEqual(newRawValue, this._rawValue)) {
      this._rawValue = newRawValue as this['rawValue'];
      changedProps.push('rawValue');
    }

    if (!AbstractControl._isEqual(newValue, this._value)) {
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
    return { ...value };
  }

  protected _coerceControlStringKey(key: string) {
    return key as ControlsKey<Controls>;
  }
}

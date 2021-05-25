import type {
  IControlEventOptions,
  IControlStateChangeEvent,
} from './abstract-control/abstract-control';

import { AbstractControl } from './abstract-control/abstract-control';

import type { IAbstractControlContainerBaseArgs } from './abstract-control-container/abstract-control-container-base';

import { AbstractControlContainerBase } from './abstract-control-container/abstract-control-container-base';

import type {
  ControlsValue,
  ControlsRawValue,
  ControlsKey,
} from './abstract-control-container/abstract-control-container';

import { getSimpleStateChangeEventArgs } from './util';

import type { Mutable } from './util';

export type IFormGroupArgs<Data = any> =
  IAbstractControlContainerBaseArgs<Data>;

export class FormGroup<
  Controls extends { [key: string]: AbstractControl | undefined } = {
    [key: string]: AbstractControl | undefined;
  },
  Data = any
> extends AbstractControlContainerBase<Controls, Data> {
  static id = 0;

  constructor(
    controls: Controls = {} as Controls,
    options: IFormGroupArgs<Data> = {}
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
    const controls = Object.fromEntries(controlsStore) as unknown as Controls;
    const newRawValue = { ...this._rawValue } as Mutable<this['rawValue']>;
    const newValue = { ...this._value } as Mutable<this['value']>;

    // controls that need to be removed
    for (const [key, control] of this._controlsStore) {
      if (
        controlsStore.get(key) === control
        // Unfortunately, I don't remember why I needed to add this check in
        // (should have documented it...) and it is causing an integration
        // test to break. All tests seem to pass without this check, so I'm
        // going to remove it. If something breaks in the future and this
        // needs to be uncommented, make sure to document why...
        // ||
        // (normOptions[AbstractControl.NO_EVENT] &&
        //   AbstractControl._isEqual(controlsStore.get(key), control))
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
        this._controlsStore.get(key) === control
        // Unfortunately, I don't remember why I needed to add this check in
        // (should have documented it...) and it is causing an integration
        // test to break. All tests seem to pass without this check, so I'm
        // going to remove it. If something breaks in the future and this
        // needs to be uncommented, make sure to document why...
        // ||
        // (normOptions[AbstractControl.NO_EVENT] &&
        //   AbstractControl._isEqual(this._controlsStore.get(key), control))
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

  setControl<N extends ControlsKey<Controls>>(
    name: N,
    control: Controls[N] | null,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    if ((control as unknown as AbstractControl)?.parent) {
      throw new Error(
        `Attempted to add AbstractControl to AbstractControlContainer, ` +
          `but AbstractControl already has a parent.`
      );
    }

    const controlsStore = new Map(this._controlsStore);

    if (control) {
      controlsStore.set(name, control as any);
    } else {
      controlsStore.delete(name);
    }

    return this.setControls(controlsStore, options);
  }

  /**
   * Adds a control with the specified name/key. If a control
   * already exists with that name/key, this does nothing.
   */
  addControl<N extends ControlsKey<Controls>>(
    name: N,
    control: Controls[N],
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    if ((control as unknown as AbstractControl)?.parent) {
      throw new Error(
        `Attempted to add AbstractControl to AbstractControlContainer, ` +
          `but AbstractControl already has a parent.`
      );
    } else if (this._controlsStore.has(name)) return [];

    const controlsStore = new Map(this._controlsStore).set(
      name,
      control as any
    );

    return this.setControls(controlsStore, options);
  }

  /**
   * If a control key is provided, this removes the control with the specified name/key
   * if one exists. If a control is provided, that control is removed from this FormGroup
   * if it is a child of this FormGroup.
   */
  removeControl(
    name: ControlsKey<Controls> | Controls[ControlsKey<Controls>],
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    let key!: ControlsKey<Controls>;

    if (AbstractControl.isControl(name)) {
      for (const [k, c] of this.controlsStore) {
        if (c !== name) continue;

        key = k;
        break;
      }
    } else {
      key = name as ControlsKey<Controls>;
    }

    if (!this._controlsStore.has(key)) return [];

    const controlsStore = new Map(this._controlsStore);
    controlsStore.delete(key);

    return this.setControls(controlsStore, options);
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

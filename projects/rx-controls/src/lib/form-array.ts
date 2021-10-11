import type {
  IControlEventOptions,
  IControlStateChangeEvent,
} from './abstract-control/abstract-control';
import { AbstractControl } from './abstract-control/abstract-control';
import { AbstractControlContainerBase } from './abstract-control-container/abstract-control-container-base';
import type { IAbstractControlContainerBaseArgs } from './abstract-control-container/abstract-control-container-base';
import type {
  ControlsValue,
  ControlsRawValue,
  ControlsKey,
} from './abstract-control-container/abstract-control-container';
import { getSimpleStateChangeEventArgs } from './util';

export type IFormArrayArgs<Data = any> =
  IAbstractControlContainerBaseArgs<Data>;

export class FormArray<
  Controls extends ReadonlyArray<AbstractControl> = ReadonlyArray<AbstractControl>,
  Data = any
> extends AbstractControlContainerBase<Controls, Data> {
  static id = 0;

  constructor(
    controls: Controls = [] as unknown as Controls,
    options: IFormArrayArgs<Data> = {}
  ) {
    super(
      options.id || Symbol(`FormArray-${FormArray.id++}`),
      controls,
      options
    );

    // The constructor's call to "setControls" will only actually fire
    // if a non-default value is provided. In the case of a default value,
    // the following properties need be manually set.
    if (!this._controls) this._controls = [] as unknown as Controls;
    if (!this._rawValue) {
      this._rawValue = [] as unknown as ControlsRawValue<Controls>;
    }
    if (!this._value) {
      this._value = [] as unknown as ControlsValue<Controls>;
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
            (value as Controls).map(
              (c, i) =>
                [i, c as unknown] as [
                  ControlsKey<Controls>,
                  Controls[ControlsKey<Controls>]
                ]
            )
          );

    // see if new controlStore is equal to the old one
    if (AbstractControl._isEqual(this._controlsStore, controlsStore)) {
      // if it is, do nothing
      return [];
    }

    const normOptions = this._normalizeOptions('setControls', options);

    // controls that need to be removed
    for (const [key, control] of this._controlsStore) {
      // For each `key: control` pair in the old controlStore, see if
      // the new controlStore has the same `key: control` pair.
      if (controlsStore.get(key) === control) {
        // if the new controlStore does, do nothing
        continue;
      }

      // if the new controlStore does not, unregister the old control
      this._unregisterControl(control, normOptions);
    }

    const controls: Array<Controls[ControlsKey<Controls>]> = [];
    const newRawValue: Array<this['rawValue'][ControlsKey<Controls>]> = [];
    const newValue: Array<this['value'][ControlsKey<Controls>]> = [];

    // controls that need to be added
    for (const [key, _control] of controlsStore) {
      // For each `key: control` pair in the new controlStore,

      // If the control is new, register it.
      // Because `_registerControl()` can clone the provided control (returning a new one),
      // we need to use the return of `_registerControl()` as the new control.
      const control =
        this._controlsStore.get(key) === _control
          ? _control
          : this._registerControl(key, _control, normOptions);

      // In case `_registerControl()` returned a new control, re-add it to the controlsStore
      controlsStore.set(key, control);
      controls.push(control);
      newRawValue.push(control.rawValue);

      if (control.enabled) {
        newValue.push(control.value);
      }
    }

    this._controls = controls as unknown as Controls;
    // This is needed because the call to "registerControl" can clone
    // the provided control (returning a new one);
    this._controlsStore = controlsStore as unknown as this['controlsStore'];

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

  /**
   * Sets the specified index to be equal to the provided control.
   * If `null` is provided for the control, this is the same as
   * `removeControl(name)`.
   */
  setControl<N extends ControlsKey<Controls>>(
    name: N,
    control: Controls[N] | null,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    if ((control as unknown as AbstractControl)?.parent) {
      throw new Error(
        `Attempted to add AbstractControl to FormArray, ` +
          `but AbstractControl already has a parent.`
      );
    } else if (!Number.isInteger(name)) {
      throw new Error('FormArray#setControl(name) must be an integer');
    } else if (this.controlsStore.size < name) {
      throw new Error(
        'FormArray#setControl(name) must be <= the size of the FormArray'
      );
    }

    const controlsStore = new Map(this._controlsStore);

    if (control) {
      return this.setControls(controlsStore.set(name, control as any), options);
    } else {
      return this.removeControl(name, options);
    }
  }

  /**
   * Adds a control at the specified index. If you insert a control in the
   * middle of the FormArray, then all the controls after the added control
   * will have their index increased by 1.
   */
  addControl<N extends ControlsKey<Controls>>(
    name: N,
    control: Controls[N],
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    if ((control as unknown as AbstractControl)?.parent) {
      throw new Error(
        `Attempted to add AbstractControl to FormArray, ` +
          `but AbstractControl already has a parent.`
      );
    } else if (!Number.isInteger(name)) {
      throw new Error('FormArray#addControl(name) must be an integer');
    } else if (this.controlsStore.size < name) {
      throw new Error(
        'FormArray#addControl(name) must be <= the size of the FormArray'
      );
    }

    const part1 = this.controls.slice(0, name);
    const part2 = this.controls.slice(name);

    const controlsStore = new Map(
      [...part1, control, ...part2].map(
        (p, i) => [i as ControlsKey<Controls>, p] as const
      )
    );

    return this.setControls(controlsStore, options);
  }

  /**
   * If an index is provided, removes a control at the specified index.
   * If a control is provided, and if that control is a child of this
   * FormArray, that control is removed from this FormArray.
   *
   * If a control is removed in the middle of the FormArray, all the
   * controls that come after it will have their index reduced by 1.
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

    const newControls = this.controls.slice();
    newControls.splice(key, 1);

    const controlsStore = new Map(
      newControls.map((c, i) => [i as ControlsKey<Controls>, c] as const)
    );

    return this.setControls(controlsStore, options);
  }

  /**
   * Adds a control at the end of the FormArray.
   */
  push(control: Controls[number], options?: IControlEventOptions) {
    if ((control as unknown as AbstractControl)?.parent) {
      throw new Error('AbstractControl can only have one parent');
    }

    const controlsStore = new Map(this.controlsStore).set(
      this.controlsStore.size as ControlsKey<Controls>,
      control as NonNullable<Controls[ControlsKey<Controls>]>
    );

    return this.setControls(controlsStore, options);
  }

  /**
   * Adds a control at the beginning of the FormArray
   */
  unshift(control: Controls[number], options?: IControlEventOptions) {
    if ((control as unknown as AbstractControl)?.parent) {
      throw new Error('AbstractControl can only have one parent');
    }

    const controlsStore = new Map([[0 as ControlsKey<Controls>, control]]);

    for (const [k, v] of this.controlsStore) {
      controlsStore.set(((k as number) + 1) as ControlsKey<Controls>, v);
    }

    return this.setControls(controlsStore, options);
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

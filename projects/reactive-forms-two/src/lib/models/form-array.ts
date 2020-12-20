import {
  AbstractControl,
  IControlEventOptions,
} from './abstract-control/abstract-control';
import {
  AbstractControlContainerBase,
  IAbstractControlContainerBaseArgs,
} from './abstract-control-container/abstract-control-container-base';
import {
  ControlsValue,
  ControlsRawValue,
  IControlContainerStateChange,
  ControlsKey,
  AbstractControlContainer,
  IControlContainerSelfStateChangeEvent,
} from './abstract-control-container/abstract-control-container';
import { getSimpleContainerStateChangeEventArgs } from './util';
import { isEqual } from '../util';

export type IFormArrayArgs<D> = IAbstractControlContainerBaseArgs<D>;

export class FormArray<
  Controls extends ReadonlyArray<AbstractControl> = ReadonlyArray<AbstractControl>,
  Data = any
> extends AbstractControlContainerBase<Controls, Data> {
  static id = 0;

  constructor(
    controls: Controls = ([] as unknown) as Controls,
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

    this.emitEvent<IControlContainerSelfStateChangeEvent<Controls, Data>>(
      getSimpleContainerStateChangeEventArgs({
        controlsStore: (old) =>
          new Map(old).set(old.size as ControlsKey<Controls>, control),
      }),
      options
    );
  }

  unshift(control: Controls[number], options?: IControlEventOptions) {
    if (((control as unknown) as AbstractControl)?.parent) {
      throw new Error('AbstractControl can only have one parent');
    }

    this.emitEvent<IControlContainerSelfStateChangeEvent<Controls, Data>>(
      getSimpleContainerStateChangeEventArgs({
        controlsStore: (old) => {
          const controlsStore = new Map([
            [0 as ControlsKey<Controls>, control],
          ]);

          for (const [k, v] of old) {
            controlsStore.set(((k as number) + 1) as ControlsKey<Controls>, v);
          }

          return controlsStore;
        },
      }),
      options
    );
  }

  protected processStateChange_ControlsStore(
    event: IControlContainerSelfStateChangeEvent<Controls, Data>
  ): IControlContainerSelfStateChangeEvent<Controls, Data> | null {
    const change = event.change.controlsStore as NonNullable<
      IControlContainerStateChange<Controls, Data>['controlsStore']
    >;

    const controlsStore = change(this._controlsStore) as Map<
      ControlsKey<Controls>,
      Controls[ControlsKey<Controls>]
    >;

    if (isEqual(this._controlsStore, controlsStore)) return null;

    // controls that need to be removed
    for (const [key, control] of this._controlsStore) {
      if (controlsStore.get(key) === control) continue;
      this.unregisterControl(control);
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

      if (this._controlsStore.get(key) === control) continue;
      // This is needed because the call to "registerControl" can clone
      // the provided control (returning a new one);
      controlsStore.set(key, this.registerControl(key, control));
    }

    this._controls = (controls as unknown) as Controls;
    // This is needed because the call to "registerControl" can clone
    // the provided control (returning a new one);
    this._controlsStore = (controlsStore as unknown) as this['controlsStore'];
    this._rawValue = newRawValue as this['rawValue'];
    this._value = (newValue as unknown) as this['value'];

    return {
      ...event,
      change: { controlsStore: change },
      changedProps: [
        'controlsStore',
        'value',
        'rawValue',
        ...this.runValidation(event),
      ],
    };
  }

  protected shallowCloneValue<T extends this['rawValue'] | this['value']>(
    value: T
  ) {
    return (value as any).slice() as T;
  }

  protected coerceControlStringKey(key: string) {
    return parseInt(key, 10) as ControlsKey<Controls>;
  }
}

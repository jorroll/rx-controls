import { AbstractControl, IControlEventOptions } from './abstract-control';
import { IControlBaseArgs } from './control-base';
import { ControlContainerBase } from './control-container-base';
import {
  ControlContainer,
  ControlsEnabledValue,
  ControlsValue,
  IControlContainerStateChangeEvent,
  IControlContainerStateChange,
  ControlsKey,
  IControlContainerArgs,
} from './control-container';
import { getSimpleContainerStateChangeEventArgs } from './util';
import isEqual from 'lodash-es/isEqual';

export type IFormArrayArgs<D> = IControlContainerArgs<D>;

export class FormArray<
  Controls extends ReadonlyArray<AbstractControl> = ReadonlyArray<
    AbstractControl
  >,
  Data = any
> extends ControlContainerBase<Controls, Data> {
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
    if (!this._value) this._value = ([] as unknown) as ControlsValue<Controls>;
    if (!this._enabledValue) {
      this._enabledValue = ([] as unknown) as ControlsEnabledValue<Controls>;
    }
  }

  push(control: Controls[number], options?: IControlEventOptions) {
    if (((control as unknown) as AbstractControl)?.parent) {
      throw new Error('AbstractControl can only have one parent');
    }

    this.emitEvent<IControlContainerStateChangeEvent<Controls, Data>>(
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

    this.emitEvent<IControlContainerStateChangeEvent<Controls, Data>>(
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
    event: IControlContainerStateChangeEvent<Controls, Data>
  ): IControlContainerStateChangeEvent<Controls, Data> | null {
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
    const newValue: Array<this['value'][ControlsKey<Controls>]> = [];
    const newEnabledValue: Array<
      this['enabledValue'][ControlsKey<Controls>]
    > = [];

    // controls that need to be added
    for (const [key, control] of controlsStore) {
      controls.push(control);
      newValue.push(control.value);

      if (control.enabled) {
        const controlEnabledValue = ControlContainer.isControlContainer(control)
          ? control.enabledValue
          : control.value;

        newEnabledValue.push(controlEnabledValue);
      }

      if (this._controlsStore.get(key) === control) continue;
      // This is needed because the call to "registerControl" can clone
      // the provided control (returning a new one);
      controlsStore.set(key, this.registerControl(key, control));
    }

    this._controls = (controls as unknown) as Controls;
    // This is needed because the call to "registerControl" can clone
    // the provided control (returning a new one);
    this._controlsStore = controlsStore;
    this._value = newValue as this['value'];
    this._enabledValue = (newEnabledValue as unknown) as this['enabledValue'];

    return {
      ...event,
      change: { controlsStore: change },
      sideEffects: ['value', 'enabledValue', ...this.runValidation(event)],
    };
  }

  protected shallowCloneValue<T extends this['value'] | this['enabledValue']>(
    value: T
  ) {
    return (value as any).slice() as T;
  }
}

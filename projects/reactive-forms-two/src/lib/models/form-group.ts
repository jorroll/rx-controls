import { AbstractControl } from './abstract-control/abstract-control';
import {
  AbstractControlContainerBase,
  IAbstractControlContainerBaseArgs,
} from './abstract-control-container/abstract-control-container-base';
import {
  AbstractControlContainer,
  ContainerControls,
  ControlsEnabledValue,
  ControlsValue,
  IControlContainerStateChange,
  IControlContainerSelfStateChangeEvent,
  ControlsKey,
} from './abstract-control-container/abstract-control-container';
import { Mutable } from './util';
import { isEqual } from '../util';

export type IFormGroupArgs<D> = IAbstractControlContainerBaseArgs<D>;

export class FormGroup<
  Controls extends { [key: string]: AbstractControl | undefined } = {
    [key: string]: AbstractControl;
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
    if (!this._value) this._value = {} as ControlsValue<Controls>;
    if (!this._enabledValue) {
      this._enabledValue = {} as ControlsEnabledValue<Controls>;
    }
  }

  protected processStateChange_ControlsStore(
    event: IControlContainerSelfStateChangeEvent<Controls, Data>
  ): IControlContainerSelfStateChangeEvent<Controls, Data> | null {
    const change = event.change.controlsStore as NonNullable<
      IControlContainerStateChange<Controls, Data>['controlsStore']
    >;

    const controlsStore = change(this._controlsStore) as this['controlsStore'];

    if (isEqual(this._controlsStore, controlsStore)) return null;

    const controls = (Object.fromEntries(controlsStore) as unknown) as Controls;
    const newValue = { ...this._value } as Mutable<this['value']>;
    const newEnabledValue = { ...this._enabledValue } as Mutable<
      this['enabledValue']
    >;

    // controls that need to be removed
    for (const [key, control] of this._controlsStore) {
      if (controlsStore.get(key) === control) continue;
      this.unregisterControl(control);
      delete newValue[key];
      delete newEnabledValue[key as keyof this['enabledValue']];
    }

    // controls that need to be added
    for (const [key, _control] of controlsStore) {
      const control = _control as AbstractControl;

      if (this._controlsStore.get(key) === control) continue;
      // This is needed because the call to "registerControl" can clone
      // the provided control (returning a new one);
      controls[key] = this.registerControl(key, _control);
      newValue[key] = control.value;

      if (control.enabled) {
        newEnabledValue[
          key as keyof this['enabledValue']
        ] = AbstractControlContainer.isControlContainer(control)
          ? control.enabledValue
          : control.value;
      }
    }

    this._controls = controls;
    // This is needed because the call to "registerControl" can clone
    // the provided control (returning a new one);
    this._controlsStore = new Map(Object.entries(controls)) as any;
    this._value = newValue as this['value'];
    this._enabledValue = newEnabledValue as this['enabledValue'];

    return {
      ...event,
      change: { controlsStore: change },
      changedProps: [
        'controlsStore',
        'value',
        'enabledValue',
        ...this.runValidation(event),
      ],
    };
  }

  protected shallowCloneValue<T extends this['value'] | this['enabledValue']>(
    value: T
  ) {
    return { ...value };
  }

  protected coerceControlStringKey(key: string) {
    return key as ControlsKey<Controls>;
  }
}

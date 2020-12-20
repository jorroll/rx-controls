import { AbstractControl } from './abstract-control/abstract-control';
import {
  AbstractControlContainerBase,
  IAbstractControlContainerBaseArgs,
} from './abstract-control-container/abstract-control-container-base';
import {
  AbstractControlContainer,
  ContainerControls,
  ControlsValue,
  ControlsRawValue,
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
    if (!this._rawValue) this._rawValue = {} as ControlsRawValue<Controls>;
    if (!this._value) {
      this._value = {} as ControlsValue<Controls>;
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
    const newRawValue = { ...this._rawValue } as Mutable<this['rawValue']>;
    const newValue = { ...this._value } as Mutable<this['value']>;

    // controls that need to be removed
    for (const [key, control] of this._controlsStore) {
      if (controlsStore.get(key) === control) continue;
      this.unregisterControl(control);
      delete newRawValue[key];
      delete newValue[key as keyof this['value']];
    }

    // controls that need to be added
    for (const [key, _control] of controlsStore) {
      const control = _control as AbstractControl;

      if (this._controlsStore.get(key) === control) continue;
      // This is needed because the call to "registerControl" can clone
      // the provided control (returning a new one);
      controls[key] = this.registerControl(key, _control);
      newRawValue[key] = control.rawValue;

      if (control.enabled) {
        newValue[key as keyof this['value']] = control.value;
      }
    }

    this._controls = controls;
    // This is needed because the call to "registerControl" can clone
    // the provided control (returning a new one);
    this._controlsStore = new Map(Object.entries(controls)) as any;
    this._rawValue = newRawValue as this['rawValue'];
    this._value = newValue as this['value'];

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
    return { ...value };
  }

  protected coerceControlStringKey(key: string) {
    return key as ControlsKey<Controls>;
  }
}

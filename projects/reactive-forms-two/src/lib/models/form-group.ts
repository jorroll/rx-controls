import { map, filter } from 'rxjs/operators';
import {
  AbstractControl,
  IControlEventOptions,
  IControlEvent,
  ControlId,
  IStateChange,
} from './abstract-control';
import {
  IControlBaseArgs,
  IControlStateChange,
  IControlStateChangeEvent,
} from './control-base';
import { ControlContainerBase } from './control-container-base';
import {
  ControlContainer,
  ControlsEnabledValue,
  ControlsValue,
  IChildControlStateChangeEvent,
  IControlContainerStateChange,
  IControlContainerStateChangeEvent,
} from './control-container';
import { pluckOptions, Mutable, isEqual } from './util';

export type IFormGroupArgs<D> = IControlBaseArgs<D>;

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export class FormGroup<
  Controls extends { readonly [key: string]: AbstractControl } = {
    readonly [key: string]: AbstractControl;
  },
  Data = any
> extends ControlContainerBase<Controls, Data> {
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

  // patchValue(
  //   value: DeepPartial<ControlsValue<Controls>>,
  //   options?: IControlEventOptions
  // ) {
  //   super.patchValue(value, options);
  // }

  protected processStateChange_ControlsStore(
    event: IControlContainerStateChangeEvent<Controls, Data>
  ): IControlContainerStateChangeEvent<Controls, Data> | null {
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
    for (const [key, control] of controlsStore) {
      if (this._controlsStore.get(key) === control) continue;
      // This is needed because the call to "registerControl" can clone
      // the provided control (returning a new one);
      controls[key] = this.registerControl(key, control);
      newValue[key] = control.value;

      if (control.enabled) {
        newEnabledValue[
          key as keyof this['enabledValue']
        ] = ControlContainer.isControlContainer(control)
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
      sideEffects: ['value', 'enabledValue', ...this.runValidation(event)],
    };
  }

  protected processStateChange_Value(
    event: IControlContainerStateChangeEvent<Controls, Data> & {
      controlContainerValueChange?: {
        id: ControlId;
        originalValue: ControlsValue<Controls>;
        originalEnabledValue: ControlsEnabledValue<Controls>;
      };
    }
  ): IControlContainerStateChangeEvent<Controls, Data> | null {
    if (event.controlContainerValueChange?.id === this.id) {
      const sideEffects = this.runValidation(pluckOptions(event));

      if (
        !isEqual(
          this.enabledValue,
          event.controlContainerValueChange.originalEnabledValue
        )
      ) {
        sideEffects.push('enabledValue');
      }

      const newEvent = { ...event, sideEffects };

      delete newEvent.controlContainerValueChange;

      return newEvent;
    }

    const change = event.change.value as NonNullable<
      IControlContainerStateChange<Controls, Data>['value']
    >;

    const newValue = change(this._value);

    if (isEqual(this._value, newValue)) return null;

    for (const [key, value] of Object.entries(newValue)) {
      const control = this._controls[key];

      if (!control) {
        throw new Error(`Invalid control key: "${key}"`);
      }

      /**
       * We want the FormGroup value StateChange to only emit after the FormGroup's
       * value has actually finished being updated. Because of the queue schedule
       * that ControlSource events are emitted with, this is the order of operations
       * of these emissions:
       *
       * 1. This FormGroup sends a value StateChange to child controls. Each of
       *    these state changes are put in the queue.
       * 2. The FormGroup adds it's value StateChange to the queue with delay 1.
       * 3. A child control StateChange is removed from the queue and the state
       *    change is processed, resulting in the child emitting a new StateChange.
       * 4. This new StateChange triggers a ChildControlEvent on the FormGroup which
       *    is added to the queue.
       * 5. Steps 3 and 4 repeat for each child control.
       * 6. The FormGroup value StateChange is removed from the queue and then
       *    re-queued because it has a delay. The delay of the new event is 0.
       * 7. The FormGroup's ChildControlEvent's are popped from the queue and
       *    processed one by one. These result in the FormControl's value being
       *    updated.
       * 8. The FormGroup value StateChange is removed from the queue and
       *    processed, emitting normally and also triggering validation for the
       *    FormGroup.
       */

      control.emitEvent<
        IControlStateChangeEvent<this['value'][typeof key], Data> & {
          controlContainerValueChangeId: ControlId;
        }
      >(
        {
          type: 'StateChange',
          change: {
            value: () => value,
          },
          sideEffects: [],
          controlContainerValueChangeId: this.id,
        },
        event
      );
    }

    this.emitEvent({
      ...event,
      delay: 1,
      controlContainerValueChange: {
        id: this.id,
        originalEnabledValue: this.enabledValue,
      },
    });

    return null;
  }

  protected processChildStateChange_Value(
    control: Controls[keyof Controls],
    event: IChildControlStateChangeEvent<Controls, Data> & {
      childEvent: IControlStateChangeEvent<
        ControlsValue<Controls>[keyof Controls],
        Data
      > & { controlContainerValueChangeId?: ControlId };
    }
  ): IControlContainerStateChangeEvent<Controls, Data> | null {
    const { key } = event;

    const change = event.childEvent.change.value as NonNullable<
      IControlStateChange<
        this['value'][typeof key],
        Controls[keyof Controls]['data']
      >['value']
    >;

    const newValue = { ...this._value, [key]: control.value };

    if (isEqual(this._value, newValue)) return null;

    this._value = newValue;

    const sideEffects: string[] = [];

    if (control.enabled) {
      const childEnabledValue = ControlContainer.isControlContainer(control)
        ? control.enabledValue
        : control.value;

      this._enabledValue = { ...this._enabledValue, [key]: childEnabledValue };

      sideEffects.push('enabledValue');
    }

    if (event.childEvent.controlContainerValueChangeId === this.id) {
      // if controlContainerId is present and equals this FormGroup's ID,
      // that means we should suppress this child event.
      return null;
    }

    sideEffects.push(...this.runValidation(event.childEvent));

    return {
      ...event.childEvent,
      change: {
        value: (old) => ({ ...old, [key]: change(old[key]) }),
      },
      sideEffects,
    };
  }

  protected processChildStateChange_ControlsStore(
    control: Controls[keyof Controls],
    event: IChildControlStateChangeEvent<Controls, Data> & {
      childEvent: IControlStateChangeEvent<
        ControlsValue<Controls>[keyof Controls],
        Data
      >;
    }
  ): IControlContainerStateChangeEvent<Controls, Data> | null {
    const childSideEffects = event.childEvent.sideEffects;

    if (
      !(
        childSideEffects.includes('value') ||
        (childSideEffects.includes('enabledValue') && control.enabled)
      )
    ) {
      return null;
    }

    const { key } = event;
    const newControlValue = control.value;

    const change: IStateChange<ControlsValue<Controls>> = (old) => ({
      ...old,
      [key]: newControlValue,
    });

    const newValue = change(this._value);

    if (isEqual(this._value, newValue)) return null;

    this._value = newValue;

    const sideEffects: string[] = [];

    if (control.enabled) {
      const childEnabledValue = ControlContainer.isControlContainer(control)
        ? control.enabledValue
        : control.value;

      this._enabledValue = { ...this._enabledValue, [key]: childEnabledValue };

      sideEffects.push('enabledValue');
    }

    sideEffects.push(...this.runValidation(event.childEvent));

    return {
      ...event.childEvent,
      change: { value: change },
      sideEffects,
    };
  }
}

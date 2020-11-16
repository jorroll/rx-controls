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

  patchValue(
    value: DeepPartial<ControlsValue<Controls>>,
    options?: IControlEventOptions
  ) {
    super.patchValue(value, options);
  }

  protected processEvent(
    event: IControlEvent
  ): IControlEvent | null | undefined {
    switch (event.type) {
      case 'ChildStateChange': {
        return this.processChildEvent_StateChange(
          event as IChildControlStateChangeEvent<Controls, Data>
        );
      }
      default: {
        return super.processEvent(event);
      }
    }
  }

  /**
   * Processes a control event. If the event is recognized by this control,
   * `processEvent()` will return `true`. Otherwise, `false` is returned.
   *
   * In general, ControlEvents should not emit additional ControlEvents
   */
  protected processStateChange(
    changeType: string,
    event: IControlContainerStateChangeEvent<Controls, Data>
  ): IControlEvent | null {
    switch (changeType) {
      case 'controlsStore': {
        return this.processStateChange_ControlsStore(event);
      }
      case 'value': {
        return this.processStateChange_Value(event);
      }
      default: {
        return super.processStateChange(changeType, event);
      }
    }
  }

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

  protected processChildEvent_StateChange(
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IControlEvent | null | undefined {
    const control = this.controlsStore.get(event.key);

    if (!control) {
      // It's unclear if this should throw an error or simply return null.
      // For now we're throwing an error and we'll see what happens.
      throw new Error(
        `FormGroup received a ChildControlEvent for a control it doesn't have`
      );
    }

    if (
      event.childEvent.type === 'ChildStateChange' ||
      (event.childEvent.type === 'StateChange' && event.source !== this.id)
    ) {
      // In this case, this control doesn't need to process the event itself.
      // It just needs to pass it along.
      return this.processChildStateChange_ChildStateChange(control, event);
    }

    const keys = Object.keys(event.childEvent.change);

    if (keys.length !== 1) {
      throw new Error(
        `You can only provide a single change per state change event`
      );
    }

    // If this code is reached, it means that a "StateChange" bubbled up
    // from a direct child of this parent and hasn't been processed yet.
    return this.processChildStateChange(keys[0], control, event);
  }

  protected processChildStateChange(
    changeType: string,
    control: Controls[keyof Controls],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IControlEvent | null {
    switch (changeType) {
      case 'value': {
        return this.processChildStateChange_Value(
          control,
          event as IChildControlStateChangeEvent<Controls, Data> & {
            childEvent: IControlStateChangeEvent<
              ControlsValue<Controls>[keyof Controls],
              Data
            > & { controlContainerId?: ControlId };
          }
        );
      }
      case 'disabled': {
        return this.processChildStateChange_Disabled(control, event);
      }
      case 'touched': {
        return this.processChildStateChange_Touched(control, event);
      }
      case 'dirty': {
        return this.processChildStateChange_Dirty(control, event);
      }
      case 'readonly': {
        return this.processChildStateChange_Readonly(control, event);
      }
      case 'submitted': {
        return this.processChildStateChange_Submitted(control, event);
      }
      case 'errorsStore': {
        return this.processChildStateChange_ErrorsStore(control, event);
      }
      case 'validatorStore': {
        return this.processChildStateChange_ValidatorStore(control, event);
      }
      case 'pendingStore': {
        return this.processChildStateChange_PendingStore(control, event);
      }
      case 'controlsStore': {
        return this.processChildStateChange_ControlsStore(
          control,
          event as IChildControlStateChangeEvent<Controls, Data> & {
            childEvent: IControlStateChangeEvent<
              ControlsValue<Controls>[keyof Controls],
              Data
            >;
          }
        );
      }
      default: {
        // In this case we don't know what the change is but we'll re-emit
        // it so that it will spread to other controls
        return event;
      }
    }
  }

  protected processChildStateChange_ChildStateChange(
    control: Controls[keyof Controls],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    // If the event was created by a child of this control
    // bubbling up, simply re-emit it
    if (event.source === this.id) return event;

    // Else, just pass the wrapped event downward
    control.emitEvent(event.childEvent);

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

  protected processChildStateChange_Disabled(
    _control: Controls[keyof Controls],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    // this._childrenDisabled =
    //   this.size > 0 &&
    //   Array.from(this._controlsStore.values()).every((c) => c.disabled);

    // if (this._childrenDisabled) {
    //   this._childDisabled = true;
    // } else {
    //   this._childDisabled = Array.from(this._controlsStore.values()).some(
    //     (c) => c.disabled
    //   );
    // }

    return {
      ...event,
      sideEffects: updateProps(this, 'Disabled'),
    };
  }

  protected processChildStateChange_Touched(
    _control: Controls[keyof Controls],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    // this._childrenTouched =
    //   this.size > 0 &&
    //   Array.from(this._controlsStore.values()).every((c) => c.touched);

    // if (this._childrenTouched) {
    //   this._childTouched = true;
    // } else {
    //   this._childTouched = Array.from(this._controlsStore.values()).some(
    //     (c) => c.touched
    //   );
    // }

    return {
      ...event,
      sideEffects: updateProps(this, 'Touched'),
    };
  }

  protected processChildStateChange_Dirty(
    _control: Controls[keyof Controls],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    // this._childrenDirty =
    //   this.size > 0 &&
    //   Array.from(this._controlsStore.values()).every((c) => c.dirty);

    // if (this._childrenDirty) {
    //   this._childDirty = true;
    // } else {
    //   this._childDirty = Array.from(this._controlsStore.values()).some(
    //     (c) => c.dirty
    //   );
    // }

    return {
      ...event,
      sideEffects: updateProps(this, 'Dirty'),
    };
  }

  protected processChildStateChange_Readonly(
    _control: Controls[keyof Controls],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    // this._childrenReadonly =
    //   this.size > 0 &&
    //   Array.from(this._controlsStore.values()).every((c) => c.readonly);

    // if (this._childrenReadonly) {
    //   this._childReadonly = true;
    // } else {
    //   this._childReadonly = Array.from(this._controlsStore.values()).some(
    //     (c) => c.readonly
    //   );
    // }

    return {
      ...event,
      sideEffects: updateProps(this, 'Readonly'),
    };
  }

  protected processChildStateChange_Submitted(
    _control: Controls[keyof Controls],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    return {
      ...event,
      sideEffects: updateProps(this, 'Submitted'),
    };
  }

  protected processChildStateChange_ErrorsStore(
    _control: Controls[keyof Controls],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    return {
      ...event,
      sideEffects: updateProps(this, 'Invalid'),
    };
  }

  protected processChildStateChange_ValidatorStore(
    _control: Controls[keyof Controls],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    return {
      ...event,
      sideEffects: updateProps(this, 'Invalid'),
    };
  }

  protected processChildStateChange_PendingStore(
    _control: Controls[keyof Controls],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    // this._childrenPending =
    //   this.size > 0 &&
    //   Array.from(this._controlsStore.values()).every((c) => c.pending);

    // if (this._childrenPending) {
    //   this._childPending = true;
    // } else {
    //   this._childPending = Array.from(this._controlsStore.values()).some(
    //     (c) => c.pending
    //   );
    // }

    return {
      ...event,
      sideEffects: updateProps(this, 'Pending'),
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

function updateProps<C extends { readonly [key: string]: AbstractControl }, D>(
  self: FormGroup<C, D>,
  prop: string
) {
  const sideEffects: string[] = [];
  const that = self as any;
  const regProp = prop.toLowerCase();
  const childrenProp = `_children${prop}`;
  const childProp = `_child${prop}`;

  const prevChildren = that[childrenProp];
  const prevChild = that[childProp];
  const prevCombined = that[regProp];

  that[childrenProp] =
    that.size > 0 &&
    Array.from(that._controlsStore.values()).every((c: any) => c[regProp]);

  if (that[childrenProp]) {
    that[childProp] = true;
  } else {
    that[childProp] = Array.from(that._controlsStore.values()).some(
      (c: any) => c[regProp]
    );
  }

  if (that[childrenProp] !== prevChildren) {
    sideEffects.push(childrenProp.slice(1));
  }

  if (that[childProp] !== prevChild) {
    sideEffects.push(childProp.slice(1));
  }

  if (that[regProp] !== prevCombined) {
    sideEffects.push(regProp);
  }

  return sideEffects;
}

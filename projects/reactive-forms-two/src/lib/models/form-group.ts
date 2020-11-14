import { map, filter } from 'rxjs/operators';
import {
  AbstractControl,
  IControlEventOptions,
  IControlEvent,
  ControlId,
} from './abstract-control';
import {
  IControlBaseArgs,
  IControlStateChange,
  IControlStateChangeEvent,
  IProcessStateChangeFnArgs,
} from './control-base';
import {
  ControlContainerBase,
  IProcessChildStateChangeFnArgs,
  IProcessContainerStateChangeFnArgs,
} from './control-container-base';
import {
  ControlContainer,
  ControlsEnabledValue,
  ControlsValue,
  IChildControlEvent,
  IChildControlStateChangeEvent,
  IControlContainerStateChange,
  IControlContainerStateChangeEvent,
} from './control-container';
import { pluckOptions, isTruthy, Mutable } from './util';

export type IFormGroupArgs<D> = IControlBaseArgs<D>;

export class FormGroup<
  Controls extends { readonly [key: string]: AbstractControl } = {
    readonly [key: string]: AbstractControl;
  },
  Data = any
> extends ControlContainerBase<Controls, Data> {
  static id = 0;

  protected _controlsStore: ReadonlyMap<
    keyof Controls,
    Controls[keyof Controls]
  > = new Map();
  get controlsStore() {
    return this._controlsStore;
  }

  protected _controls!: Controls;

  protected _enabledValue!: ControlsEnabledValue<Controls>;
  get enabledValue() {
    return this._enabledValue;
  }

  constructor(
    controls: Controls = {} as Controls,
    options: IFormGroupArgs<Data> = {}
  ) {
    super(options.id || Symbol(`FormGroup-${FormGroup.id++}`));

    this.data = options.data!;

    this.setControls(controls);

    if (options.errors) {
      this.setErrors(options.errors);
    }
  }

  get<A extends keyof Controls>(a: A): Controls[A];
  get<A extends AbstractControl = AbstractControl>(...args: any[]): A | null;
  get<A extends AbstractControl = AbstractControl>(...args: any[]): A | null {
    return super.get(...args);
  }

  clone() {
    const control = new FormGroup<Controls, Data>();
    this.replayState().subscribe(control.source);
    return control;
  }

  patchValue(
    value: Partial<ControlsValue<Controls>>,
    options: IControlEventOptions = {}
  ) {
    Object.entries(value).forEach(([key, val]) => {
      const c = this.controls[key];

      if (!c) {
        throw new Error(`FormGroup: Invalid patchValue key "${key}".`);
      }

      ControlContainer.isControlContainer(c)
        ? c.patchValue(val, options)
        : c.setValue(val, options);
    });
  }

  setControls(controls: Controls, options?: IControlEventOptions) {
    const controlsStore = new Map(Object.entries(controls));

    this.emitEvent<IControlContainerStateChangeEvent<this['value']>>({
      ...pluckOptions(options),
      type: 'StateChange',
      change: {
        controlsStore: () => controlsStore,
      },
      sideEffects: [],
    });
  }

  setControl<N extends keyof Controls>(
    name: N,
    control: Controls[N] | null,
    options?: IControlEventOptions
  ) {
    if (control?.parent) {
      throw new Error('AbstractControl can only have one parent');
    }

    this.emitEvent<IControlContainerStateChangeEvent<this['value']>>({
      ...pluckOptions(options),
      type: 'StateChange',
      change: {
        controlsStore: (old) => {
          const controls = new Map(old);

          if (control) {
            controls.set(name, control);
          } else {
            controls.delete(name);
          }

          return controls;
        },
      },
      sideEffects: [],
    });
  }

  addControl<N extends keyof Controls>(
    name: N,
    control: Controls[N],
    options?: IControlEventOptions
  ) {
    if (control?.parent) {
      throw new Error('AbstractControl can only have one parent');
    }

    this.emitEvent<IControlContainerStateChangeEvent<this['value']>>({
      ...pluckOptions(options),
      type: 'StateChange',
      change: {
        controlsStore: (old) => {
          if (old.has(name)) return old;

          return new Map(old).set(name, control);
        },
      },
      sideEffects: [],
    });
  }

  removeControl(name: keyof Controls, options?: IControlEventOptions) {
    this.emitEvent<IControlContainerStateChangeEvent<this['value']>>({
      ...pluckOptions(options),
      type: 'StateChange',
      change: {
        controlsStore: (old) => {
          if (!old.has(name)) return old;

          const controls = new Map(old);
          controls.delete(name);
          return controls;
        },
      },
      sideEffects: [],
    });
  }

  protected registerControl(
    key: keyof Controls,
    control: Controls[keyof Controls],
    options: IControlEventOptions = {}
  ) {
    if (control.parent) {
      control = control.clone() as Controls[keyof Controls];
      // throw new Error('AbstractControl can only have one parent');
    }

    control.setParent(this, options);

    const sub = control.events
      .pipe(
        map<IControlEvent, IChildControlEvent>((event) => {
          return {
            type: 'ChildControlEvent',
            eventId: AbstractControl.eventId(),
            idOfOriginatingEvent: event.idOfOriginatingEvent,
            source: this.id,
            processed: [],
            key: key as string | number,
            control,
            event,
            meta: {},
          };
        }),
        filter(isTruthy)
      )
      .subscribe(this.source);

    this._controlsSubscriptions.set(control, sub);

    return control;
  }

  protected unregisterControl(
    control: AbstractControl,
    options?: IControlEventOptions
  ) {
    const sub = this._controlsSubscriptions.get(control);

    if (!sub) {
      throw new Error('Control was not registered to begin with');
    }

    sub.unsubscribe();

    this._controlsSubscriptions.delete(control);

    control.setParent(null, options);
  }

  protected processEvent(
    event: IControlEvent
  ): IControlEvent | null | undefined {
    switch (event.type) {
      case 'ChildControlEvent': {
        return this.processChildEvent(event as IChildControlEvent);
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
    args: IProcessStateChangeFnArgs<this['value']>
  ): IControlEvent | null | undefined {
    switch (args.changeType) {
      case 'controlsStore': {
        return this.processStateChange_ControlsStore(args);
      }
      case 'value': {
        return this.processStateChange_Value(args);
      }
      // case 'parent': {
      //   return this.processStateChange_Parent(args);
      // }
      // case 'errorsStore': {
      //   return this.processStateChange_ErrorsStore(args);
      // }
      // case 'validatorStore': {
      //   return this.processStateChange_ValidatorStore(args);
      // }
      // case 'registeredValidators': {
      //   return this.processStateChange_RegisteredValidators(args);
      // }
      // case 'registeredAsyncValidators': {
      //   return this.processStateChange_RegisteredAsyncValidators(args);
      // }
      // case 'runningValidation': {
      //   return this.processStateChange_RunningValidation(args);
      // }
      // case 'runningAsyncValidation': {
      //   return this.processStateChange_RunningAsyncValidation(args);
      // }
      default: {
        return super.processStateChange(args);
      }
    }
  }

  protected processStateChange_Value(
    args: IProcessStateChangeFnArgs<this['value']> & {
      event: { controlContainerId?: ControlId };
    }
  ): IControlContainerStateChangeEvent<this['value']> | null {
    const options = pluckOptions(args.event);

    if (args.event.controlContainerId === this.id) {
      const newEvent = {
        ...args.event,
        sideEffects: [
          ...args.event.sideEffects,
          ...this.runValidation(options),
        ],
      };

      delete newEvent.controlContainerId;

      return newEvent;
    }

    const change = args.event.change.value as NonNullable<
      IControlContainerStateChange<this['value']>['value']
    >;

    for (const [key, value] of Object.entries(change(this._value))) {
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
        IControlStateChangeEvent<this['value'][typeof key]> & {
          controlContainerId: ControlId;
        }
      >({
        ...options,
        type: 'StateChange',
        change: {
          value: () => value,
        },
        sideEffects: [],
        controlContainerId: this.id,
      });
    }

    this.emitEvent({ ...args.event, controlContainerId: this.id, delay: 1 });

    return null;
  }

  protected processStateChange_ControlsStore(
    args: IProcessContainerStateChangeFnArgs<this['value']>
  ): IControlContainerStateChangeEvent<this['value']> | null {
    const change = args.event.change.controlsStore as NonNullable<
      IControlContainerStateChange<this['value']>['controlsStore']
    >;

    const controlsStore = change(this._controlsStore) as this['controlsStore'];
    const controls = (Object.fromEntries(controlsStore) as unknown) as Controls;
    const newValue = { ...this._value } as Mutable<this['value']>;
    const newEnabledValue = { ...this._enabledValue } as Mutable<
      this['enabledValue']
    >;

    // controls that need to be removed
    for (const [key, control] of this._controlsStore) {
      if (controlsStore.get(key) === control) continue;
      this.unregisterControl(control);
      delete controls[key];
      delete newValue[key];
      delete newEnabledValue[key as keyof this['enabledValue']];
    }

    // controls that need to be added
    for (const [key, control] of controlsStore) {
      if (this._controlsStore.get(key) === control) continue;
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
    this._controlsStore = new Map(Object.entries(controls)) as Map<
      keyof Controls,
      Controls[keyof Controls]
    >;

    this._value = newValue as this['value'];
    this._enabledValue = newEnabledValue as this['enabledValue'];

    return {
      ...args.event,
      change: { controlsStore: change },
      sideEffects: ['value', 'enabledValue', ...this.runValidation(args.event)],
    };
  }

  protected processChildEvent(
    args: IChildControlEvent
  ): IControlEvent | null | undefined {
    if (args.event.processed.includes(this.id)) {
      return null;
    } else {
      args.event.processed.push(this.id);
    }

    switch (args.event.type) {
      case 'StateChange': {
        return this.processChildEvent_StateChange(
          args as IChildControlStateChangeEvent<Controls>
        );
      }
      case 'ValidationStart':
      case 'AsyncValidationStart':
      case 'ValidationComplete': {
        return null;
      }
      default: {
        return;
      }
    }
  }

  protected processChildEvent_StateChange(
    event: IChildControlStateChangeEvent<Controls>
  ): IControlContainerStateChangeEvent<this['value']> | null {
    const keys = Object.keys(event.event.change);

    if (keys.length !== 1) {
      throw new Error(
        `You can only provide a single change per state change event`
      );
    }

    return (
      this.processChildStateChange({
        ...event,
        changeType: keys[0],
      }) || null
    );
  }

  /**
   * Processes a control event. If the event is recognized by this control,
   * `processEvent()` will return `true`. Otherwise, `false` is returned.
   *
   * In general, ControlEvents should not emit additional ControlEvents
   */
  protected processChildStateChange(
    args: IProcessChildStateChangeFnArgs<Controls>
  ): IControlContainerStateChangeEvent<this['value']> | null | undefined {
    switch (args.changeType) {
      case 'value': {
        return this.processChildStateChange_Value(args);
      }
      // case 'errorsStore': {
      //   return this.processChildStateChange_ErrorsStore(args);
      // }
      default: {
        return;
      }
    }
  }

  protected processChildStateChange_Value(
    args: IProcessChildStateChangeFnArgs<Controls> & {
      event: { controlContainerId?: ControlId };
    }
  ): IControlContainerStateChangeEvent<this['value']> | null {
    const { key, control } = args;

    const change = args.event.change.value as NonNullable<
      IControlStateChange<this['value'][typeof key]>['value']
    >;

    this._value = { ...this._value, [key]: control.value };

    if (control.enabled) {
      const childEnabledValue = ControlContainer.isControlContainer(control)
        ? control.enabledValue
        : control.value;

      this._enabledValue = { ...this._enabledValue, [key]: childEnabledValue };
    }

    if (args.event.controlContainerId === this.id) {
      // if controlContainerId is present and equals this FormGroup's ID,
      // that means we should suppress this child event.
      return null;
    }

    return {
      ...args.event,
      change: {
        value: (old) => ({ ...old, [key]: change(old[key]) }),
      },
      sideEffects: ['enabledValue', ...this.runValidation(args.event)],
    };
  }

  // protected processChildStateChange_ErrorsStore(
  //   args: IProcessChildStateChangeFnArgs<Controls>
  // ) {
  //   // const change = args.change as NonNullable<
  //   //   IControlStateChanges<this['value'][keyof Controls]>['value']
  //   // >;
  //   const { control, key, changes } = args;

  //   const childValue = control.value;
  //   const childEnabledValue = ControlContainer.isControlContainer(control)
  //     ? control.enabledValue
  //     : control.value;

  //   changes.value = (old) => ({ ...old, [key]: childValue });

  //   this._value = changes.value(this._value);

  //   if (control.enabled) {
  //     this._enabledValue = { ...this._enabledValue, [key]: childEnabledValue };
  //   }

  //   this.runValidation(changes);

  //   return true;
  // }
}

function extractEnabledValue<T extends { [key: string]: AbstractControl }>(
  obj: T
) {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, ctrl]) => ctrl.enabled)
      .map(([key, ctrl]) => [
        key,
        ControlContainer.isControlContainer(ctrl)
          ? ctrl.enabledValue
          : ctrl.value,
      ])
  ) as ControlsEnabledValue<T>;
}

function extractValue<T extends { [key: string]: AbstractControl }>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, ctrl]) => [key, ctrl.value])
  ) as ControlsValue<T>;
}

import { Subscription, concat, Observable, of, from } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import {
  AbstractControl,
  ControlId,
  IControlEvent,
  IControlEventOptions,
  IStateChange,
  ValidationErrors,
  IControlStateChange,
  IControlStateChangeEvent,
} from '../abstract-control/abstract-control';
import {
  AbstractControlContainer,
  ControlsValue,
  ControlsEnabledValue,
  IControlContainerStateChangeEvent,
  IControlContainerStateChange,
  IChildControlStateChangeEvent,
  GenericControlsObject,
  ContainerControls,
  IChildControlEvent,
  ControlsKey,
  // IChildControlEvent,
} from './abstract-control-container';
import {
  AbstractControlBase,
  IAbstractControlBaseArgs,
} from '../abstract-control/abstract-control-base';
import {
  getSimpleContainerStateChangeEventArgs,
  isTruthy,
  Mutable,
  pluckOptions,
} from '../util';
import isEqual from 'lodash-es/isEqual';

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type IAbstractControlContainerBaseArgs<D> = IAbstractControlBaseArgs<D>;

export abstract class AbstractControlContainerBase<
    Controls extends GenericControlsObject = any,
    Data = any
  >
  extends AbstractControlBase<ControlsValue<Controls>, Data>
  implements AbstractControlContainer<Controls, Data> {
  protected _controls!: Controls;
  get controls() {
    return this._controls;
  }

  protected _controlsStore: ReadonlyMap<
    ControlsKey<Controls>,
    Controls[ControlsKey<Controls>]
  > = new Map();
  get controlsStore() {
    return this._controlsStore;
  }

  get size() {
    return this.controlsStore.size;
  }

  protected _enabledValue!: ControlsEnabledValue<Controls>;
  get enabledValue() {
    return this._enabledValue;
  }

  // VALID

  get valid() {
    return !this.invalid;
  }

  get containerValid() {
    return !this.containerErrors;
  }

  get childValid() {
    return !this.childrenInvalid;
  }

  get childrenValid() {
    return !this.childInvalid;
  }

  // INVALID

  get invalid() {
    return this.containerInvalid || this.childInvalid;
  }

  get containerInvalid() {
    return !!this.containerErrors;
  }

  protected _childInvalid = false;
  get childInvalid() {
    return this._childInvalid;
  }

  protected _childrenInvalid = false;
  get childrenInvalid() {
    return this._childrenInvalid;
  }

  // ENABLED

  get enabled() {
    return !this.disabled;
  }

  get containerEnabled() {
    return !this.containerDisabled;
  }

  get childEnabled() {
    return !this.childrenDisabled;
  }

  get childrenEnabled() {
    return !this.childDisabled;
  }

  // DISABLED

  get disabled() {
    return this.containerDisabled || this.childrenDisabled;
  }

  get containerDisabled() {
    return this._disabled;
  }

  protected _childDisabled = false;
  get childDisabled() {
    return this._childDisabled;
  }

  protected _childrenDisabled = false;
  get childrenDisabled() {
    return this._childrenDisabled;
  }

  // READONLY

  get readonly() {
    return this.containerReadonly || this.childrenReadonly;
  }

  get containerReadonly() {
    return this._readonly;
  }

  protected _childReadonly = false;
  get childReadonly() {
    return this._childReadonly;
  }

  protected _childrenReadonly = false;
  get childrenReadonly() {
    return this._childrenReadonly;
  }

  // SUBMITTED

  get submitted() {
    return this.containerSubmitted || this.childrenSubmitted;
  }

  get containerSubmitted() {
    return this._submitted;
  }

  protected _childSubmitted = false;
  get childSubmitted() {
    return this._childSubmitted;
  }

  protected _childrenSubmitted = false;
  get childrenSubmitted() {
    return this._childrenSubmitted;
  }

  // TOUCHED

  get touched() {
    return this.containerTouched || this.childTouched;
  }

  get containerTouched() {
    return this._touched;
  }

  protected _childTouched = false;
  get childTouched() {
    return this._childTouched;
  }

  protected _childrenTouched = false;
  get childrenTouched() {
    return this._childrenTouched;
  }

  // DIRTY

  get dirty() {
    return this.containerDirty || this.childDirty;
  }

  get containerDirty() {
    return this._dirty;
  }

  protected _childDirty = false;
  get childDirty() {
    return this._childDirty;
  }

  protected _childrenDirty = false;
  get childrenDirty() {
    return this._childrenDirty;
  }

  // PENDING

  get pending() {
    return this.containerPending || this.childPending;
  }

  get containerPending() {
    return this._pending;
  }

  protected _childPending = false;
  get childPending() {
    return this._childPending;
  }

  protected _childrenPending = false;
  get childrenPending() {
    return this._childrenPending;
  }

  // ERRORS

  protected _combinedErrors: ValidationErrors | null = null;
  get errors() {
    return this._combinedErrors;
  }

  get containerErrors() {
    return this._errors;
  }

  protected _childrenErrors: ValidationErrors | null = null;
  get childrenErrors() {
    return this._childrenErrors;
  }

  // MISC

  protected _controlsSubscriptions = new Map<
    Controls[ControlsKey<Controls>],
    Subscription
  >();

  constructor(
    controlId: ControlId,
    controls: Controls,
    options: IAbstractControlBaseArgs<Data> = {}
  ) {
    super(controlId);

    this.data = options.data!;
    this.setControls(controls);
    if (options.disabled) this.markDisabled(options.disabled);
    if (options.touched) this.markTouched(options.touched);
    if (options.dirty) this.markDirty(options.dirty);
    if (options.readonly) this.markReadonly(options.readonly);
    if (options.submitted) this.markSubmitted(options.submitted);
    if (options.errors) this.setErrors(options.errors);
    if (options.validators) this.setValidators(options.validators);
    if (options.pending) this.markPending(options.pending);
  }

  [AbstractControlContainer.INTERFACE]() {
    return this;
  }

  get<A extends ControlsKey<Controls>>(a: A): Controls[A];
  get<
    A extends ControlsKey<Controls>,
    B extends keyof ContainerControls<Controls[A]>
  >(a: A, b: B): ContainerControls<Controls[A]>[B];
  get<
    A extends ControlsKey<Controls>,
    B extends keyof ContainerControls<Controls[A]>,
    C extends keyof ContainerControls<ContainerControls<Controls[A]>[B]>
  >(a: A, b: B, c: C): ContainerControls<ContainerControls<Controls[A]>[B]>[C];
  get<
    A extends ControlsKey<Controls>,
    B extends keyof ContainerControls<Controls[A]>,
    C extends keyof ContainerControls<ContainerControls<Controls[A]>[B]>,
    D extends keyof ContainerControls<
      ContainerControls<ContainerControls<Controls[A]>[B]>[C]
    >
  >(
    a: A,
    b: B,
    c: C,
    d: D
  ): ContainerControls<
    ContainerControls<ContainerControls<Controls[A]>[B]>[C]
  >[D];
  get<
    A extends ControlsKey<Controls>,
    B extends keyof ContainerControls<Controls[A]>,
    C extends keyof ContainerControls<ContainerControls<Controls[A]>[B]>,
    D extends keyof ContainerControls<
      ContainerControls<ContainerControls<Controls[A]>[B]>[C]
    >,
    E extends keyof ContainerControls<
      ContainerControls<
        ContainerControls<ContainerControls<Controls[A]>[B]>[C]
      >[D]
    >
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E
  ): ContainerControls<
    ContainerControls<
      ContainerControls<ContainerControls<Controls[A]>[B]>[C]
    >[D]
  >[E];
  get<A extends AbstractControl = AbstractControl>(...args: any[]): A | null;
  get<A extends AbstractControl = AbstractControl>(...args: any[]): A | null {
    if (args.length === 0) return null;
    else if (args.length === 1) return (this.controls as any)[args[0]];

    return args.reduce((prev: AbstractControl | null, curr) => {
      if (AbstractControlContainer.isControlContainer(prev)) {
        return prev.get(curr);
      }

      return null;
    }, this as AbstractControl | null);
  }

  patchValue(
    value: DeepPartial<ControlsValue<Controls>>,
    options?: IControlEventOptions
  ) {
    Object.entries(value).forEach(([key, val]) => {
      const c = this.controls[key as ControlsKey<Controls>];

      if (!c) {
        throw new Error(`Invalid patchValue key "${key}".`);
      }

      AbstractControlContainer.isControlContainer(c)
        ? c.patchValue(val, options)
        : ((c as unknown) as AbstractControl).setValue(val, options);
    });
  }

  setControls(controls: Controls, options?: IControlEventOptions) {
    const controlsStore = new Map(
      (Object.entries(controls) as unknown) as Array<
        [ControlsKey<Controls>, Controls[ControlsKey<Controls>]]
      >
    );

    this.emitEvent<IControlContainerStateChangeEvent<Controls, Data>>(
      getSimpleContainerStateChangeEventArgs({
        controlsStore: () => controlsStore,
      }),
      options
    );
  }

  setControl<N extends ControlsKey<Controls>>(
    name: N,
    control: Controls[N] | null,
    options?: IControlEventOptions
  ) {
    if (((control as unknown) as AbstractControl)?.parent) {
      throw new Error('AbstractControl can only have one parent');
    }

    this.emitEvent<IControlContainerStateChangeEvent<Controls, Data>>(
      getSimpleContainerStateChangeEventArgs({
        controlsStore: (old) => {
          const controls = new Map(old);

          if (control) {
            controls.set(name, control);
          } else {
            controls.delete(name);
          }

          return controls;
        },
      }),
      options
    );
  }

  addControl<N extends ControlsKey<Controls>>(
    name: N,
    control: Controls[N],
    options?: IControlEventOptions
  ) {
    if (((control as unknown) as AbstractControl)?.parent) {
      throw new Error('AbstractControl can only have one parent');
    }

    this.emitEvent<IControlContainerStateChangeEvent<Controls, Data>>(
      getSimpleContainerStateChangeEventArgs({
        controlsStore: (old) => {
          if (old.has(name)) return old;

          return new Map(old).set(name, control);
        },
      }),
      options
    );
  }

  // cannot accept an AbstractControl as a param because that wouldn't work for
  // synced controls that were cloned.

  removeControl(
    name: ControlsKey<Controls> | Controls[ControlsKey<Controls>],
    options?: IControlEventOptions
  ) {
    let key: ControlsKey<Controls>;

    if (AbstractControl.isControl(name)) {
      for (const [k, c] of this.controlsStore) {
        if (c !== name) continue;

        key = k;
        break;
      }
    } else {
      key = name as ControlsKey<Controls>;
    }

    this.emitEvent<IControlContainerStateChangeEvent<Controls, Data>>(
      getSimpleContainerStateChangeEventArgs({
        controlsStore: (old) => {
          if (!old.has(key)) return old;

          const controls = new Map(old);
          controls.delete(key);
          return controls;
        },
      }),
      options
    );
  }

  markChildrenDisabled(value: boolean, options?: IControlEventOptions) {
    this.controlsStore.forEach((c) => {
      ((c as unknown) as AbstractControl).markDisabled(value, options);
    });
  }

  markChildrenTouched(value: boolean, options?: IControlEventOptions) {
    this.controlsStore.forEach((c) => {
      ((c as unknown) as AbstractControl).markTouched(value, options);
    });
  }

  markChildrenDirty(value: boolean, options?: IControlEventOptions) {
    this.controlsStore.forEach((c) => {
      ((c as unknown) as AbstractControl).markDirty(value, options);
    });
  }

  markChildrenReadonly(value: boolean, options?: IControlEventOptions) {
    this.controlsStore.forEach((c) => {
      ((c as unknown) as AbstractControl).markReadonly(value, options);
    });
  }

  markChildrenSubmitted(value: boolean, options?: IControlEventOptions) {
    this.controlsStore.forEach((c) => {
      ((c as unknown) as AbstractControl).markSubmitted(value, options);
    });
  }

  markChildrenPending(value: boolean, options?: IControlEventOptions) {
    this.controlsStore.forEach((c) => {
      ((c as unknown) as AbstractControl).markPending(value, options);
    });
  }

  replayState(
    options: Omit<IControlEventOptions, 'idOfOriginatingEvent'> = {}
  ): Observable<IControlContainerStateChangeEvent<Controls, Data>> {
    const { _controlsStore } = this;

    const changes: Array<IControlContainerStateChange<Controls, Data>> = [
      { controlsStore: () => _controlsStore },
    ];

    let eventId: number;

    return concat(
      from(
        changes.map<IControlContainerStateChangeEvent<Controls, Data>>(
          (change) => ({
            source: this.id,
            meta: {},
            ...pluckOptions(options),
            type: 'StateChange',
            eventId: eventId = AbstractControl.eventId(),
            idOfOriginatingEvent: eventId,
            change,
            sideEffects: [],
          })
        )
      ),
      super.replayState(options)
    );
  }

  protected registerControl(
    key: ControlsKey<Controls>,
    control: Controls[ControlsKey<Controls>],
    options?: IControlEventOptions
  ) {
    // This clone might problems when unregistering controls...

    if (((control as unknown) as AbstractControl).parent) {
      control = (((control as unknown) as AbstractControl).clone() as unknown) as Controls[ControlsKey<
        Controls
      >];
      // throw new Error('AbstractControl can only have one parent');
    }

    ((control as unknown) as AbstractControl).setParent(this, options);

    const sub = ((control as unknown) as AbstractControl).events
      .pipe(
        filter(
          (e) => e.type === 'StateChange' || e.type === 'ChildStateChange'
        ),
        map((event) => {
          const newEvent: IChildControlStateChangeEvent<Controls, Data> = {
            type: `ChildStateChange`,
            eventId: AbstractControl.eventId(),
            idOfOriginatingEvent: event.idOfOriginatingEvent,
            source: this.id,
            key,
            childEvent: event as IControlStateChangeEvent<
              this['value'][ControlsKey<Controls>],
              Data
            >,
            sideEffects: [],
            meta: {},
          };

          return newEvent;
        }),
        filter(isTruthy)
      )
      .subscribe(this.source);

    this._controlsSubscriptions.set(control, sub);

    return control;
  }

  protected unregisterControl(
    control: Controls[ControlsKey<Controls>],
    options?: IControlEventOptions
  ) {
    const sub = this._controlsSubscriptions.get(control);

    if (!sub) {
      throw new Error('Control was not registered to begin with');
    }

    sub.unsubscribe();

    this._controlsSubscriptions.delete(control);

    ((control as unknown) as AbstractControl).setParent(null, options);
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

  protected processStateChange(
    changeType: string,
    event: IControlContainerStateChangeEvent<Controls, Data>
  ): IControlEvent | null {
    switch (changeType) {
      case 'controlsStore': {
        return this.processStateChange_ControlsStore(event);
      }
      default: {
        return super.processStateChange(changeType, event);
      }
    }
  }

  protected abstract processStateChange_ControlsStore(
    event: IControlContainerStateChangeEvent<Controls, Data>
  ): IControlContainerStateChangeEvent<Controls, Data> | null;

  protected processStateChange_Value(
    event: IControlContainerStateChangeEvent<Controls, Data> & {
      controlContainerValueChange?: {
        id: ControlId;
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

    for (const [key, value] of Object.entries<
      this['value'][ControlsKey<Controls>]
    >(newValue)) {
      const control = (this._controls[
        key as ControlsKey<Controls>
      ] as unknown) as AbstractControl;

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
        IControlStateChangeEvent<this['value'][ControlsKey<Controls>], Data> & {
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

  protected processStateChange_Disabled(
    event: IControlContainerStateChangeEvent<Controls, Data>
  ): IControlContainerStateChangeEvent<Controls, Data> | null {
    return updateContainerProp(this, 'containerDisabled', () =>
      super.processStateChange_Disabled(event)
    );
  }

  protected processStateChange_Touched(
    event: IControlContainerStateChangeEvent<Controls, Data>
  ): IControlContainerStateChangeEvent<Controls, Data> | null {
    return updateContainerProp(this, 'containerTouched', () =>
      super.processStateChange_Touched(event)
    );
  }

  protected processStateChange_Dirty(
    event: IControlContainerStateChangeEvent<Controls, Data>
  ): IControlContainerStateChangeEvent<Controls, Data> | null {
    return updateContainerProp(this, 'containerDirty', () =>
      super.processStateChange_Dirty(event)
    );
  }

  protected processStateChange_Readonly(
    event: IControlContainerStateChangeEvent<Controls, Data>
  ): IControlContainerStateChangeEvent<Controls, Data> | null {
    return updateContainerProp(this, 'containerReadonly', () =>
      super.processStateChange_Readonly(event)
    );
  }

  protected processStateChange_Submitted(
    event: IControlContainerStateChangeEvent<Controls, Data>
  ): IControlContainerStateChangeEvent<Controls, Data> | null {
    return updateContainerProp(this, 'containerSubmitted', () =>
      super.processStateChange_Submitted(event)
    );
  }

  protected processStateChange_PendingStore(
    event: IControlContainerStateChangeEvent<Controls, Data>
  ): IControlContainerStateChangeEvent<Controls, Data> | null {
    return updateContainerProp(this, 'containerPending', () =>
      super.processStateChange_PendingStore(event)
    );
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
    control: Controls[ControlsKey<Controls>],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IControlEvent | null {
    switch (changeType) {
      case 'value': {
        return this.processChildStateChange_Value(
          control,
          event as IChildControlStateChangeEvent<Controls, Data> & {
            childEvent: IControlStateChangeEvent<
              ControlsValue<Controls>[ControlsKey<Controls>],
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
              ControlsValue<Controls>[ControlsKey<Controls>],
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
    control: Controls[ControlsKey<Controls>],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    // If the event was created by a child of this control
    // bubbling up, re-emit it after handling side effects
    if (event.source === this.id) {
      const sideEffects: string[] = [];
      const cse = event.childEvent.sideEffects;

      if (cse.includes('disabled')) {
        sideEffects.push(...updateChildrenProps(this, 'Disabled'));
      }

      if (cse.includes('readonly')) {
        sideEffects.push(...updateChildrenProps(this, 'Readonly'));
      }

      if (cse.includes('pending')) {
        sideEffects.push(...updateChildrenProps(this, 'Pending'));
      }

      if (cse.includes('touched')) {
        sideEffects.push(...updateChildrenProps(this, 'Touched'));
      }

      if (cse.includes('dirty')) {
        sideEffects.push(...updateChildrenProps(this, 'Dirty'));
      }

      if (cse.includes('submitted')) {
        sideEffects.push(...updateChildrenProps(this, 'Submitted'));
      }

      if (cse.includes('errors')) {
        this.updateChildrenErrors(sideEffects);
      }

      return { ...event, sideEffects };
    }

    // Else, just pass the wrapped event downward
    ((control as unknown) as AbstractControl).emitEvent(event.childEvent);

    return null;
  }

  protected processChildStateChange_Value(
    _control: Controls[ControlsKey<Controls>],
    event: IChildControlStateChangeEvent<Controls, Data> & {
      childEvent: IControlStateChangeEvent<
        ControlsValue<Controls>[ControlsKey<Controls>],
        Data
      > & { controlContainerValueChangeId?: ControlId };
    }
  ): IControlContainerStateChangeEvent<Controls, Data> | null {
    const { key } = event;
    const control = (_control as unknown) as AbstractControl;

    const change = event.childEvent.change.value as NonNullable<
      IControlStateChange<this['value'][typeof key], unknown>['value']
    >;

    const newChange: IStateChange<this['value']> = (old) => {
      const v = this.shallowCloneValue(old);
      (v as Mutable<typeof v>)[key] = change(old[key]);
      return v;
    };

    const newValue = newChange(this._value);

    if (isEqual(this._value, newValue)) return null;

    this._value = newValue as ControlsValue<Controls>;

    const sideEffects: string[] = [];

    if (control.enabled) {
      const childEnabledValue = AbstractControlContainer.isControlContainer(
        control
      )
        ? control.enabledValue
        : control.value;

      const enabledValue = this.shallowCloneValue(this._enabledValue);

      ((enabledValue as unknown) as Mutable<typeof enabledValue>)[
        (key as unknown) as keyof this['enabledValue']
      ] = childEnabledValue;

      this._enabledValue = enabledValue;

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
        value: newChange,
      },
      sideEffects,
    };
  }

  protected processChildStateChange_Disabled(
    _control: Controls[ControlsKey<Controls>],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    return {
      ...event,
      sideEffects: updateChildrenProps(this, 'Disabled'),
    };
  }

  protected processChildStateChange_Touched(
    _control: Controls[ControlsKey<Controls>],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    return {
      ...event,
      sideEffects: updateChildrenProps(this, 'Touched'),
    };
  }

  protected processChildStateChange_Dirty(
    _control: Controls[ControlsKey<Controls>],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    return {
      ...event,
      sideEffects: updateChildrenProps(this, 'Dirty'),
    };
  }

  protected processChildStateChange_Readonly(
    _control: Controls[ControlsKey<Controls>],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    return {
      ...event,
      sideEffects: updateChildrenProps(this, 'Readonly'),
    };
  }

  protected processChildStateChange_Submitted(
    _control: Controls[ControlsKey<Controls>],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    return {
      ...event,
      sideEffects: updateChildrenProps(this, 'Submitted'),
    };
  }

  protected processChildStateChange_ErrorsStore(
    _control: Controls[ControlsKey<Controls>],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    const sideEffects: string[] = [];

    this.updateChildrenErrors(sideEffects);

    return {
      ...event,
      sideEffects,
    };
  }

  protected processChildStateChange_ValidatorStore(
    _control: Controls[ControlsKey<Controls>],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    return {
      ...event,
      sideEffects: updateChildrenProps(this, 'Invalid'),
    };
  }

  protected processChildStateChange_PendingStore(
    _control: Controls[ControlsKey<Controls>],
    event: IChildControlStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent<Controls, Data> | null {
    return {
      ...event,
      sideEffects: updateChildrenProps(this, 'Pending'),
    };
  }

  protected processChildStateChange_ControlsStore(
    _control: Controls[ControlsKey<Controls>],
    event: IChildControlStateChangeEvent<Controls, Data> & {
      childEvent: IControlStateChangeEvent<
        ControlsValue<Controls>[ControlsKey<Controls>],
        Data
      >;
    }
  ): IControlContainerStateChangeEvent<Controls, Data> | null {
    const childSideEffects = event.childEvent.sideEffects;
    const control = (_control as unknown) as AbstractControl;

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

    const change: IStateChange<ControlsValue<Controls>> = (old) => {
      const nv = this.shallowCloneValue(old);
      (nv as Mutable<typeof nv>)[key] = newControlValue;
      return nv;
    };

    const newValue = change(this._value);

    if (isEqual(this._value, newValue)) return null;

    this._value = newValue;

    const sideEffects: string[] = [];

    if (control.enabled) {
      const childEnabledValue = AbstractControlContainer.isControlContainer(
        control
      )
        ? control.enabledValue
        : control.value;

      const newEnabledValue = this.shallowCloneValue(this._enabledValue);

      ((newEnabledValue as unknown) as Mutable<typeof newEnabledValue>)[
        (key as unknown) as keyof this['enabledValue']
      ] = childEnabledValue;

      this._enabledValue = newEnabledValue;

      sideEffects.push('enabledValue');
    }

    sideEffects.push(...this.runValidation(event.childEvent));

    return {
      ...event.childEvent,
      change: { value: change },
      sideEffects,
    };
  }

  protected updateChildrenErrors(sideEffects: string[]) {
    const prevChildrenErrors = this._childrenErrors;
    const prevCombinedErrors = this._combinedErrors;

    this._childrenErrors = Array.from(this.controlsStore.values()).reduce(
      (prev, curr) => {
        return { ...prev, ...((curr as unknown) as AbstractControl).errors };
      },
      {}
    );

    if (Object.keys(this._childrenErrors).length === 0) {
      this._childrenErrors = null;
    }

    if (!this._childrenErrors && !this._errors) {
      this._combinedErrors = null;
    } else {
      this._combinedErrors = { ...this._childrenErrors, ...this._errors };
    }

    sideEffects.push(...updateChildrenProps(this, 'Invalid'));

    if (!isEqual(this._childrenErrors, prevChildrenErrors)) {
      sideEffects.push('childrenErrors');
    }

    if (!isEqual(this._combinedErrors, prevCombinedErrors)) {
      sideEffects.push('errors');

      const oldStatus = this.status;
      this._status = this.getControlStatus();

      if (!isEqual(oldStatus, this._status)) {
        sideEffects.push('status');
      }
    }
  }

  protected abstract shallowCloneValue<
    T extends this['value'] | this['enabledValue']
  >(value: T): T;

  protected updateErrorsProp(sideEffects: string[]) {
    super.updateErrorsProp(sideEffects);

    if (this._childrenErrors || this._errors) {
      this._combinedErrors = { ...this._childrenErrors, ...this._errors };
    } else {
      this._combinedErrors = null;
    }

    sideEffects.push('containerErrors');
  }
}

function updateContainerProp<
  T extends IControlStateChangeEvent<any, any> | null
>(that: any, prop: string, event: () => T) {
  const oldVal = that[prop];

  const newEvent = event();

  if (that[prop] !== oldVal) {
    newEvent?.sideEffects.push(prop);
  }

  return newEvent;
}

function updateChildrenProps(that: any, prop: string) {
  const sideEffects: string[] = [];
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

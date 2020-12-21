import {
  Subscription,
  concat,
  Observable,
  of,
  from,
  queueScheduler,
} from 'rxjs';
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
  IControlSelfStateChangeEvent,
} from '../abstract-control/abstract-control';
import {
  AbstractControlContainer,
  ControlsRawValue,
  ControlsValue,
  IControlContainerSelfStateChangeEvent,
  IControlContainerStateChange,
  IChildControlStateChangeEvent,
  GenericControlsObject,
  ContainerControls,
  IChildControlEvent,
  ControlsKey,
  PrivateAbstractControlContainer,
  // IChildControlEvent,
} from './abstract-control-container';
import {
  AbstractControlBase,
  IAbstractControlBaseArgs,
} from '../abstract-control/abstract-control-base';
import {
  getSimpleContainerStateChangeEventArgs,
  isStateChange,
  isTruthy,
  Mutable,
  pluckOptions,
} from '../util';
import { isEqual } from '../../util';

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type IAbstractControlContainerBaseArgs<D> = IAbstractControlBaseArgs<D>;

const CONTROL_CONTAINER_META_PROPS = [
  // 'enabled',
  'disabled',
  // 'valid',
  'invalid',
  'readonly',
  'pending',
  'touched',
  'dirty',
  'submitted',
  // 'childEnabled',
  // 'childDisabled',
  // 'childValid',
  // 'childReadonly',
  // 'childSubmitted',
];

export abstract class AbstractControlContainerBase<
    Controls extends GenericControlsObject = any,
    Data = any
  >
  extends AbstractControlBase<
    ControlsRawValue<Controls>,
    Data,
    ControlsValue<Controls>
  >
  implements PrivateAbstractControlContainer<Controls, Data> {
  protected _controls!: Controls;
  get controls() {
    return this._controls;
  }

  protected _controlsStore: ReadonlyMap<
    ControlsKey<Controls>,
    NonNullable<Controls[ControlsKey<Controls>]>
  > = new Map<
    ControlsKey<Controls>,
    NonNullable<Controls[ControlsKey<Controls>]>
  >();
  get controlsStore() {
    return this._controlsStore;
  }

  get size() {
    return this.controlsStore.size;
  }

  protected _value!: ControlsValue<Controls>;
  get value() {
    return this._value;
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
    if (options.validators) this.setValidators(options.validators);
    if (options.pending) this.markPending(options.pending);
    // this needs to be last to ensure that the errors aren't overwritten
    if (options.errors) this.patchErrors(options.errors);

    this.processMetaProps();
    // updateDisabledProp(this);
    // updateChildrenProps(this, 'Readonly');
    // updateChildrenProps(this, 'Pending');
    // updateChildrenProps(this, 'Touched');
    // updateChildrenProps(this, 'Dirty');
    // updateChildrenProps(this, 'Submitted');
    this.updateChildrenErrors([]);
    // updateInvalidProp(this);
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
    value: DeepPartial<ControlsRawValue<Controls>>,
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
      Object.entries(controls).map(
        ([k, c]) =>
          [this.coerceControlStringKey(k), c as unknown] as [
            ControlsKey<Controls>,
            Controls[ControlsKey<Controls>]
          ]
      )
    );

    this.emitEvent<IControlContainerSelfStateChangeEvent<Controls, Data>>(
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

    this.emitEvent<IControlContainerSelfStateChangeEvent<Controls, Data>>(
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

    this.emitEvent<IControlContainerSelfStateChangeEvent<Controls, Data>>(
      getSimpleContainerStateChangeEventArgs({
        controlsStore: (old) => {
          if (old.has(name)) return old;

          return new Map(old).set(name, control);
        },
      }),
      options
    );
  }

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

    this.emitEvent<IControlContainerSelfStateChangeEvent<Controls, Data>>(
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

  markChildrenDisabled(
    value: boolean,
    options?: IControlEventOptions & { deep?: boolean }
  ) {
    this.controlsStore.forEach((c) => {
      if (options?.deep && AbstractControlContainer.isControlContainer(c)) {
        ((c as unknown) as AbstractControlContainer).markChildrenDisabled(
          value,
          options
        );
      }

      ((c as unknown) as AbstractControl).markDisabled(value, options);
    });
  }

  markChildrenTouched(
    value: boolean,
    options?: IControlEventOptions & { deep?: boolean }
  ) {
    this.controlsStore.forEach((c) => {
      if (options?.deep && AbstractControlContainer.isControlContainer(c)) {
        ((c as unknown) as AbstractControlContainer).markChildrenTouched(
          value,
          options
        );
      }

      ((c as unknown) as AbstractControl).markTouched(value, options);
    });
  }

  markChildrenDirty(
    value: boolean,
    options?: IControlEventOptions & { deep?: boolean }
  ) {
    this.controlsStore.forEach((c) => {
      if (options?.deep && AbstractControlContainer.isControlContainer(c)) {
        ((c as unknown) as AbstractControlContainer).markChildrenDirty(
          value,
          options
        );
      }

      ((c as unknown) as AbstractControl).markDirty(value, options);
    });
  }

  markChildrenReadonly(
    value: boolean,
    options?: IControlEventOptions & { deep?: boolean }
  ) {
    this.controlsStore.forEach((c) => {
      if (options?.deep && AbstractControlContainer.isControlContainer(c)) {
        ((c as unknown) as AbstractControlContainer).markChildrenReadonly(
          value,
          options
        );
      }

      ((c as unknown) as AbstractControl).markReadonly(value, options);
    });
  }

  markChildrenSubmitted(
    value: boolean,
    options?: IControlEventOptions & { deep?: boolean }
  ) {
    this.controlsStore.forEach((c) => {
      if (options?.deep && AbstractControlContainer.isControlContainer(c)) {
        ((c as unknown) as AbstractControlContainer).markChildrenSubmitted(
          value,
          options
        );
      }

      ((c as unknown) as AbstractControl).markSubmitted(value, options);
    });
  }

  markChildrenPending(
    value: boolean,
    options?: IControlEventOptions & { deep?: boolean }
  ) {
    this.controlsStore.forEach((c) => {
      if (options?.deep && AbstractControlContainer.isControlContainer(c)) {
        ((c as unknown) as AbstractControlContainer).markChildrenPending(
          value,
          options
        );
      }

      ((c as unknown) as AbstractControl).markPending(value, options);
    });
  }

  replayState(
    options: Omit<IControlEventOptions, 'idOfOriginatingEvent'> & {
      /**
       * By default, the controls will be cloned so that
       * mutations to them do not affect the replayState snapshot.
       * Pass the `preserveControls: true` option to disable this.
       */
      preserveControls?: boolean;
    } = {}
  ): Observable<IControlContainerSelfStateChangeEvent<Controls, Data>> {
    const controlsStore = options.preserveControls
      ? this._controlsStore
      : new Map(
          Array.from(this._controlsStore).map(([k, c]) => [
            k,
            (c as AbstractControl).clone() as typeof c,
          ])
        );

    const changes: Array<{
      change: IControlContainerStateChange<Controls, Data>;
      changedProps: string[];
    }> = [
      {
        change: { controlsStore: () => controlsStore },
        changedProps: ['controlsStore', 'rawValue', 'value'],
      },
    ];

    let eventId: number;

    return concat(
      from(
        changes.map<IControlContainerSelfStateChangeEvent<Controls, Data>>(
          (change) => ({
            source: this.id,
            meta: {},
            ...pluckOptions(options),
            type: 'StateChange',
            subtype: 'Self',
            eventId: (eventId = AbstractControl.eventId()),
            idOfOriginatingEvent: eventId,
            ...change,
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
    let focusSub: Subscription | undefined;

    if (((control as unknown) as AbstractControl).parent) {
      const _control = ((control as unknown) as AbstractControl).clone();

      // Focus events are ordinarily ignored by linked controls. This would mean
      // that this clone control would not trigger a focus event when the original
      // triggers a focus event. To solve this, we subscribe the clone to the
      // original's focus events and we cause the clone to trigger it's own
      // focus event
      focusSub = ((control as unknown) as AbstractControl).events
        .pipe(
          filter((e) => e.type === 'Focus'),
          map((event) => ({
            ...event,
            eventId: AbstractControl.eventId(),
            source: _control.id,
          }))
        )
        .subscribe(_control.source);

      control = (_control as unknown) as Controls[ControlsKey<Controls>];
    }

    ((control as unknown) as AbstractControl).setParent(this, options);

    const sub = ((control as unknown) as AbstractControl).events
      .pipe(
        filter(isStateChange),
        filter((e) => (e as any).onEventProcessedId !== this.id),
        map((childEvent) => {
          const newEvent: IChildControlStateChangeEvent = {
            type: `StateChange`,
            subtype: 'Child',
            eventId: AbstractControl.eventId(),
            idOfOriginatingEvent: childEvent.idOfOriginatingEvent,
            source: this.id,
            childEvents: {
              [key]: childEvent,
            },
            changedProps: [],
            meta: childEvent.meta,
          };

          if (childEvent.noEmit !== undefined) {
            newEvent.noEmit = childEvent.noEmit;
          }

          return newEvent;
        }),
        filter(isTruthy)
      )
      .subscribe(this.source);

    if (focusSub) sub.add(focusSub);

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
      case 'StateChange': {
        if ((event as IControlStateChangeEvent).subtype === 'Child') {
          return this.processChildEvent_StateChange(
            event as IChildControlStateChangeEvent
          );
        }

        return super.processEvent(event);
      }
      default: {
        return super.processEvent(event);
      }
    }
  }

  protected processStateChange(
    changeType: string,
    event: IControlContainerSelfStateChangeEvent<Controls, Data>
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
    event: IControlContainerSelfStateChangeEvent<Controls, Data>
  ): IControlContainerSelfStateChangeEvent<Controls, Data> | null;

  protected processStateChange_RawValue(
    event: IControlContainerSelfStateChangeEvent<Controls, Data>
  ): IChildControlStateChangeEvent | null {
    const change = event.change.rawValue as NonNullable<
      IControlContainerStateChange<Controls, Data>['rawValue']
    >;

    const newValue = change(this._rawValue);

    if (isEqual(this._rawValue, newValue)) return null;

    const newEvent: IChildControlStateChangeEvent = {
      ...event,
      type: 'StateChange',
      subtype: 'Child',
      childEvents: Object.fromEntries(
        Object.entries(newValue).map(([key, _rawValue]) => {
          const rawValue = _rawValue as this['rawValue'][ControlsKey<Controls>];

          return [
            key,
            {
              ...event,
              type: 'StateChange',
              subtype: 'Self',
              change: { rawValue: () => rawValue },
              changedProps: [],
              eventId: AbstractControl.eventId(),
            } as IControlSelfStateChangeEvent<any, any>,
          ];
        })
      ),
    };

    delete (newEvent as any).change;

    return this.processExternalChildStateChange(newEvent);
  }

  protected processStateChange_Disabled(
    event: IControlContainerSelfStateChangeEvent<Controls, Data>
  ): IControlStateChangeEvent | null {
    const newEvent = updateContainerProp(this, 'containerDisabled', () =>
      super.processStateChange_Disabled(event)
    );

    if (newEvent?.changedProps.includes('containerDisabled')) {
      newEvent.changedProps.push('containerEnabled');
    }

    return newEvent;
  }

  protected processStateChange_Touched(
    event: IControlContainerSelfStateChangeEvent<Controls, Data>
  ): IControlStateChangeEvent | null {
    return updateContainerProp(this, 'containerTouched', () =>
      super.processStateChange_Touched(event)
    );
  }

  protected processStateChange_Dirty(
    event: IControlContainerSelfStateChangeEvent<Controls, Data>
  ): IControlStateChangeEvent | null {
    return updateContainerProp(this, 'containerDirty', () =>
      super.processStateChange_Dirty(event)
    );
  }

  protected processStateChange_Readonly(
    event: IControlContainerSelfStateChangeEvent<Controls, Data>
  ): IControlStateChangeEvent | null {
    return updateContainerProp(this, 'containerReadonly', () =>
      super.processStateChange_Readonly(event)
    );
  }

  protected processStateChange_Submitted(
    event: IControlContainerSelfStateChangeEvent<Controls, Data>
  ): IControlStateChangeEvent | null {
    return updateContainerProp(this, 'containerSubmitted', () =>
      super.processStateChange_Submitted(event)
    );
  }

  protected processStateChange_PendingStore(
    event: IControlContainerSelfStateChangeEvent<Controls, Data>
  ): IControlStateChangeEvent | null {
    return updateContainerProp(this, 'containerPending', () =>
      super.processStateChange_PendingStore(event)
    );
  }

  protected processChildEvent_StateChange(
    event: IChildControlStateChangeEvent
  ): IControlStateChangeEvent | null | undefined {
    if (event.source !== this.id) {
      // Here we know the event did not originate from a child
      // of this control container so we pass the event downward
      // to be handled by the appropriate child
      return this.processExternalChildStateChange(event);
    }

    return this.processInternalChildStateChange(event);
  }

  protected processExternalChildStateChange(
    event: IChildControlStateChangeEvent & {
      onEventProcessedResults?: { [key: string]: IControlStateChangeEvent };
    }
  ): IChildControlStateChangeEvent | null {
    if (event.onEventProcessedResults) {
      return this.processOnEventProcessedResults(
        event as IChildControlStateChangeEvent & {
          onEventProcessedResults: { [key: string]: IControlStateChangeEvent };
        }
      );
    }

    const dependencies: number[] = [];
    const onEventProcessedResults: {
      [key: string]: IControlStateChangeEvent;
    } = {};

    for (const [key, childEvent] of Object.entries(event.childEvents)) {
      const control = (this._controls[
        key as ControlsKey<Controls>
      ] as unknown) as AbstractControl;

      if (!control) {
        throw new Error(`Invalid control key: "${key}"`);
      }

      const eventId = control.emitEvent(
        {
          ...childEvent,
          onEventProcessedId: this.id,
          onEventProcessedFn: (result?: IControlStateChangeEvent | null) => {
            dependencies.splice(dependencies.indexOf(eventId), 1);

            if (result) onEventProcessedResults[key] = result;
            if (dependencies.length > 0) return;

            this.emitEvent({ ...event, onEventProcessedResults });
          },
        },
        event
      );

      dependencies.push(eventId);
    }

    return null;
  }

  protected processInternalChildStateChange(
    event: IChildControlStateChangeEvent & {
      onEventProcessedResults?: { [key: string]: IControlStateChangeEvent };
    }
  ): IChildControlStateChangeEvent | null {
    if (event.onEventProcessedResults) {
      // This indicates that internal logic passed state changes to this control
      // container's children that contained onEventProcessedFn callbacks. For
      // example, a setValue state change would cause this.
      return this.processOnEventProcessedResults(
        event as IChildControlStateChangeEvent & {
          onEventProcessedResults: { [key: string]: IControlStateChangeEvent };
        }
      );
    }

    return {
      ...event,
      changedProps: this.processChildStateChangeChanges(event),
    };
  }

  protected processOnEventProcessedResults(
    event: IChildControlStateChangeEvent & {
      onEventProcessedResults: { [key: string]: IControlStateChangeEvent };
    }
  ) {
    const changedProps: string[] = [];

    const newEvent: IChildControlStateChangeEvent = {
      ...event,
      childEvents: event.onEventProcessedResults,
      changedProps,
    };

    changedProps.push(...this.processChildStateChangeChanges(newEvent));

    delete (newEvent as any).onEventProcessedResults;

    return newEvent;
  }

  protected processChildStateChangeChanges(
    event: IChildControlStateChangeEvent
  ): string[] {
    const changesMap = this.normalizeChildStateChangeChanges(event.childEvents);

    const changedProps: string[] = [];

    if (changesMap.has('rawValue')) {
      changedProps.push(
        ...this.processChildStateChange_RawValue(
          event,
          changesMap.get('rawValue')!
        )
      );
    }

    if (changesMap.has('value')) {
      changedProps.push(
        ...this.processChildStateChange_Value(event, changesMap.get('value')!)
      );
    }

    if (CONTROL_CONTAINER_META_PROPS.some((p) => changesMap.has(p))) {
      changedProps.push(...this.processMetaProps());
    }

    if (changesMap.has('errors')) {
      this.updateChildrenErrors(changedProps);
    }

    return changedProps;
  }

  // Because the child event key of a IChildControlStateChangeEvent
  // is stored as an object prop, it will aways be a
  // string. Unfortunately, the ControlKey of a FormArray is a number
  // so this method coerces the string key into the proper type.
  protected abstract coerceControlStringKey(key: string): ControlsKey<Controls>;

  protected normalizeChildStateChangeChanges(
    childEvents: IChildControlStateChangeEvent['childEvents']
  ) {
    // This maps changed props to the keys that experienced
    // those changes
    const normalizedChanges = new Map<string, Set<ControlsKey<Controls>>>();

    function addChange(prop: string, key: ControlsKey<Controls>) {
      if (!normalizedChanges.has(prop)) normalizedChanges.set(prop, new Set());

      normalizedChanges.get(prop)!.add(key);
    }

    Object.entries(childEvents).forEach(([_key, childEvent]) => {
      const key = this.coerceControlStringKey(_key);

      const control = this.controlsStore.get(
        key as ControlsKey<Controls>
      ) as AbstractControl;

      if (!control) {
        throw new Error(
          `AbstractControlContainer received a child control ` +
            `event associated with an unknown key: ${JSON.stringify(key)}`
        );
      }

      if (
        control.disabled &&
        !childEvent.changedProps.some(
          (p) => p === 'disabled' || p === 'rawValue'
        )
      ) {
        return;
      }

      childEvent.changedProps.forEach((prop) => {
        if (prop === 'rawValue' || prop === 'disabled') {
          addChange('value', key as ControlsKey<Controls>);
        }

        addChange(prop, key as ControlsKey<Controls>);
      });
    });

    return normalizedChanges;
  }

  protected processChildStateChange_RawValue(
    event: IChildControlStateChangeEvent,
    changedKeys: Set<ControlsKey<Controls>>
  ): string[] {
    const newRawValue = this.shallowCloneValue(this.rawValue);

    for (const key of changedKeys) {
      const control = this.controlsStore.get(key) as AbstractControl;

      newRawValue[
        key
      ] = control.rawValue as ControlsRawValue<Controls>[ControlsKey<Controls>];
    }

    if (isEqual(this._rawValue, newRawValue)) return [];

    this._rawValue = newRawValue;

    return ['rawValue', ...this.runValidation(event)];
  }

  protected processChildStateChange_Value(
    _event: IChildControlStateChangeEvent,
    changedKeys: Set<ControlsKey<Controls>>
  ): string[] {
    const newValue = this.shallowCloneValue(this.value);

    for (const key of changedKeys) {
      const control = this.controlsStore.get(key) as AbstractControl;

      if (control.disabled) {
        delete newValue[key];
        continue;
      }

      newValue[
        key
      ] = control.value as ControlsValue<Controls>[ControlsKey<Controls>];
    }

    if (isEqual(this.value, newValue)) return [];

    this._value = newValue;

    return ['value'];
  }

  protected processMetaProps() {
    const changedProps: string[] = [];
    // const childEnabled = new AnyValue(true);
    // const childrenEnabled = new AllValues(true);
    const childDisabled = new AnyValue(false);
    const childrenDisabled = new AllValues(false);

    // const childValid = new AnyValue(true);
    // const childrenValid = new AllValues(true);
    const childInvalid = new AnyValue(false);
    const childrenInvalid = new AllValues(false);
    const childReadonly = new AnyValue(false);
    const childrenReadonly = new AllValues(false);
    const childPending = new AnyValue(false);
    const childrenPending = new AllValues(false);
    const childTouched = new AnyValue(false);
    const childrenTouched = new AllValues(false);
    const childDirty = new AnyValue(false);
    const childrenDirty = new AllValues(false);
    const childSubmitted = new AnyValue(false);
    const childrenSubmitted = new AllValues(false);
    const oldStatus = this._status;

    const controls = Array.from<AbstractControl>(this.controlsStore.values());

    for (const c of controls) {
      // childEnabled.add(c.enabled);
      // childrenEnabled.add(c.enabled);
      childDisabled.add(c.disabled);
      childrenDisabled.add(c.disabled);

      if (c.disabled) continue;

      // childValid.add(c.valid);
      // childrenValid.add(c.valid);

      childInvalid.add(c.invalid);
      childrenInvalid.add(c.invalid);

      childReadonly.add(c.readonly);
      childrenReadonly.add(c.readonly);

      childPending.add(c.pending);
      childrenPending.add(c.pending);

      childTouched.add(c.touched);
      childrenTouched.add(c.touched);

      childDirty.add(c.dirty);
      childrenDirty.add(c.dirty);

      childSubmitted.add(c.submitted);
      childrenSubmitted.add(c.submitted);
    }

    const {
      invalid,
      disabled,
      readonly,
      submitted,
      touched,
      dirty,
      pending,
    } = this;

    // if (this._childEnabled !== childEnabled.value) {
    //   this._childEnabled = childEnabled.value;
    //   changedProps.push('childEnabled');
    // }

    // if (this._childrenEnabled !== childrenEnabled.value) {
    //   this._childrenEnabled = childrenEnabled.value;
    //   changedProps.push('childrenEnabled');
    // }

    if (this._childDisabled !== childDisabled.value) {
      this._childDisabled = childDisabled.value;
      changedProps.push('childDisabled', 'childrenEnabled');
    }

    if (this._childrenDisabled !== childrenDisabled.value) {
      this._childrenDisabled = childrenDisabled.value;
      changedProps.push('childrenDisabled', 'childEnabled');
    }

    // if (this._childValid !== childValid.value) {
    //   this._childValid = childValid.value;
    //   changedProps.push('childValid');
    // }

    // if (this._childrenValid !== childrenValid.value) {
    //   this._childrenValid = childrenValid.value;
    //   changedProps.push('childrenValid');
    // }

    if (this._childInvalid !== childInvalid.value) {
      this._childInvalid = childInvalid.value;
      changedProps.push('childInvalid', 'childrenValid');
    }

    if (this._childrenInvalid !== childrenInvalid.value) {
      this._childrenInvalid = childrenInvalid.value;
      changedProps.push('childrenInvalid', 'childValid');
    }

    if (this._childReadonly !== childReadonly.value) {
      this._childReadonly = childReadonly.value;
      changedProps.push('childReadonly');
    }

    if (this._childrenReadonly !== childrenReadonly.value) {
      this._childrenReadonly = childrenReadonly.value;
      changedProps.push('childrenReadonly');
    }

    if (this._childPending !== childPending.value) {
      this._childPending = childPending.value;
      changedProps.push('childPending');
    }

    if (this._childrenPending !== childrenPending.value) {
      this._childrenPending = childrenPending.value;
      changedProps.push('childrenPending');
    }

    if (this._childTouched !== childTouched.value) {
      this._childTouched = childTouched.value;
      changedProps.push('childTouched');
    }

    if (this._childrenTouched !== childrenTouched.value) {
      this._childrenTouched = childrenTouched.value;
      changedProps.push('childrenTouched');
    }

    if (this._childDirty !== childDirty.value) {
      this._childDirty = childDirty.value;
      changedProps.push('childDirty');
    }

    if (this._childrenDirty !== childrenDirty.value) {
      this._childrenDirty = childrenDirty.value;
      changedProps.push('childrenDirty');
    }

    if (this._childSubmitted !== childSubmitted.value) {
      this._childSubmitted = childSubmitted.value;
      changedProps.push('childSubmitted');
    }

    if (this._childrenSubmitted !== childrenSubmitted.value) {
      this._childrenSubmitted = childrenSubmitted.value;
      changedProps.push('childrenSubmitted');
    }

    if (this.invalid !== invalid) {
      changedProps.push('valid', 'invalid');
    }

    if (this.disabled !== disabled) {
      changedProps.push('disabled', 'enabled');
    }

    if (this.readonly !== readonly) {
      changedProps.push('readonly');
    }

    if (this.submitted !== submitted) {
      changedProps.push('submitted');
    }

    if (this.touched !== touched) {
      changedProps.push('touched');
    }

    if (this.dirty !== dirty) {
      changedProps.push('dirty');
    }

    if (this.pending !== pending) {
      changedProps.push('pending');
    }

    this._status = this.getControlStatus();

    if (oldStatus !== this._status) {
      changedProps.push('status');
    }

    return changedProps;
  }

  protected updateChildrenErrors(changedProps: string[]) {
    const prevChildrenErrors = this._childrenErrors;
    const prevCombinedErrors = this._combinedErrors;

    this._childrenErrors = Array.from(this.controlsStore.values()).reduce(
      (prev, curr) => {
        const c = (curr as unknown) as AbstractControl;

        if (c.disabled) return prev;

        return { ...prev, ...c.errors };
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

    // changedProps.push(...updateInvalidProp(this));

    if (!isEqual(this._childrenErrors, prevChildrenErrors)) {
      changedProps.push('childrenErrors');
    }

    if (!isEqual(this._combinedErrors, prevCombinedErrors)) {
      changedProps.push('errors');

      const oldStatus = this.status;
      this._status = this.getControlStatus();

      if (!isEqual(oldStatus, this._status)) {
        changedProps.push('status');
      }
    }
  }

  protected abstract shallowCloneValue<
    T extends this['rawValue'] | this['value']
  >(value: T): T;

  protected updateErrorsProp(changedProps: string[]) {
    const oldInvalid = this.invalid;
    const oldContainerInvalid = this.containerInvalid;

    if (this._errorsStore.size === 0) {
      this._errors = null;
    } else {
      this._errors = Array.from(this._errorsStore).reduce<ValidationErrors>(
        (p, [, v]) => ({
          ...p,
          ...v,
        }),
        {}
      );
    }

    if (this._childrenErrors || this._errors) {
      this._combinedErrors = { ...this._childrenErrors, ...this._errors };
    } else {
      this._combinedErrors = null;
    }

    changedProps.push('errors', 'containerErrors');

    if (oldInvalid !== this.invalid) {
      changedProps.push('valid', 'invalid');
    }

    if (oldContainerInvalid !== this.containerInvalid) {
      changedProps.push('containerValid', 'containerInvalid');
    }

    const newStatus = this.getControlStatus();

    if (newStatus !== this._status) {
      changedProps.push('status');
      this._status = newStatus;
    }
  }
}

function updateContainerProp(
  that: any,
  prop: string,
  event: () => IControlStateChangeEvent | null
) {
  const oldVal = that[prop];

  const newEvent = event();

  if (that[prop] !== oldVal) {
    newEvent?.changedProps.push(prop);
  }

  return newEvent;
}

class AllValues {
  protected _value?: boolean;

  get value() {
    return this._value ?? this.defaultValue;
  }

  constructor(public defaultValue: boolean) {}

  add(value: boolean) {
    if (this._value === false) return;
    this._value = value;
  }
}

class AnyValue extends AllValues {
  add(value: boolean) {
    if (this._value === true) return;
    this._value = value;
  }
}

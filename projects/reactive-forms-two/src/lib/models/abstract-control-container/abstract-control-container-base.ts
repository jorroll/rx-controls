import { Subscription, Observable, of } from 'rxjs';

import { filter, map } from 'rxjs/operators';

import {
  AbstractControl,
  ControlId,
  IControlEvent,
  IControlEventOptions,
  ValidationErrors,
  IControlStateChangeEvent,
  IProcessedEvent,
  IControlFocusEvent,
} from '../abstract-control/abstract-control';

import {
  AbstractControlContainer,
  ControlsRawValue,
  ControlsValue,
  GenericControlsObject,
  ContainerControls,
  ControlsKey,
  PrivateAbstractControlContainer,
} from './abstract-control-container';

import {
  AbstractControlBase,
  CONTROL_SELF_ID,
  IAbstractControlBaseArgs,
  INormControlEventOptions,
} from '../abstract-control/abstract-control-base';

import {
  getSimpleChildStateChangeEventArgs,
  getSimpleStateChangeEventArgs,
  isStateChange,
  pluckOptions,
} from '../util';

import { isEqual } from '../../util';

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type IAbstractControlContainerBaseArgs<
  D,
  R,
  V
> = IAbstractControlBaseArgs<D, R, V>;

const CONTROL_CONTAINER_WATCHED_CHILD_PROPS = [
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

const CONTROL_CONTAINER_CHILD_STATE_CHANGE = Symbol(
  'CONTROL_CONTAINER_CHILD_STATE_CHANGE'
);

interface IControlContainerChildStateChangeMeta {
  [key: string]: unknown;
  [CONTROL_CONTAINER_CHILD_STATE_CHANGE]: {
    containerId: ControlId;
    results: {
      [key: string]: IControlStateChangeEvent;
    };
  };
}

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

  get childValid() {
    return !this.childrenInvalid;
  }

  get childrenValid() {
    return !this.childInvalid;
  }

  // INVALID

  get invalid() {
    return this.selfInvalid || this.childInvalid;
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

  get childEnabled() {
    return !this.childrenDisabled;
  }

  get childrenEnabled() {
    return !this.childDisabled;
  }

  // DISABLED

  get disabled() {
    return this.selfDisabled || this.childrenDisabled;
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
    return this.selfReadonly || this.childrenReadonly;
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
    return this.selfSubmitted || this.childrenSubmitted;
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
    return this.selfTouched || this.childTouched;
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
    return this.selfDirty || this.childDirty;
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
    return this.selfPending || this.childPending;
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

  protected _errors: ValidationErrors | null = null;
  get errors() {
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
    options: IAbstractControlBaseArgs<
      Data,
      ControlsRawValue<Controls>,
      ControlsValue<Controls>
    > = {}
  ) {
    super(controlId);

    const o = { trigger: { label: 'constructor', source: controlId } };
    this.data = options.data!;
    this.setControls(controls, o);
    if (options.disabled) this.markDisabled(options.disabled, o);
    if (options.touched) this.markTouched(options.touched, o);
    if (options.dirty) this.markDirty(options.dirty, o);
    if (options.readonly) this.markReadonly(options.readonly, o);
    if (options.submitted) this.markSubmitted(options.submitted, o);
    if (options.validators) this.setValidators(options.validators, o);
    if (options.pending) this.markPending(options.pending, o);
    // this needs to be last to ensure that the errors aren't overwritten
    if (options.errors) this.patchErrors(options.errors, o);

    this._calculateChildProps();
    this._calculateChildrenErrors();
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
    if (args.length === 0) {
      throw new Error('Missing arguments for AbstractControlContainer#get()');
    } else if (args.length === 1) return (this.controls as any)[args[0]];

    return args.reduce((prev: AbstractControl | null, curr) => {
      if (AbstractControlContainer.isControlContainer(prev)) {
        return prev.get(curr);
      }

      return null;
    }, this as AbstractControl | null);
  }

  setValue(
    rawValue: ControlsRawValue<Controls>,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    if (isEqual(this._rawValue, rawValue)) return [];

    const entries = Object.entries(rawValue);

    if (entries.length !== this.size) {
      throw new Error(
        `The value you provide to AbstractControlContainer#setValue ` +
          `must include a value for each of the container's controls`
      );
    }

    return this.processValueChange('setValue', rawValue, options);
  }

  patchValue(
    value: DeepPartial<ControlsRawValue<Controls>>,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    return this.processValueChange('patchValue', value, options);
  }

  protected processValueChange(
    methodName: 'setValue' | 'patchValue',
    value: DeepPartial<ControlsRawValue<Controls>>,
    options?: IControlEventOptions
  ) {
    const normOptions = this._normalizeOptions(methodName, options);
    const childOptions = this._normalizeChildOptions(normOptions);

    for (const [key, val] of Object.entries(value)) {
      const c = (this.controls[
        key as ControlsKey<Controls>
      ] as unknown) as AbstractControl;

      if (!c) {
        throw new Error(`Invalid ${methodName} value key "${key}".`);
      }

      AbstractControlContainer.isControlContainer(c)
        ? c[methodName](val, childOptions)
        : ((c as unknown) as AbstractControl).setValue(val, childOptions);
    }

    return this._processChildResults(childOptions, normOptions);
  }

  abstract setControls(
    controls:
      | Controls
      | ReadonlyMap<ControlsKey<Controls>, Controls[ControlsKey<Controls>]>,
    options?: IControlEventOptions
  ): Array<keyof this & string>;

  setControl<N extends ControlsKey<Controls>>(
    name: N,
    control: Controls[N] | null,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    if (((control as unknown) as AbstractControl)?.parent) {
      throw new Error(
        `Attempted to add AbstractControl to AbstractControlContainer, ` +
          `but AbstractControl already has a parent.`
      );
    }

    const controlsStore = new Map(this._controlsStore);

    if (control) {
      controlsStore.set(name, control as any);
    } else {
      controlsStore.delete(name);
    }

    return this.setControls(controlsStore, options);
  }

  addControl<N extends ControlsKey<Controls>>(
    name: N,
    control: Controls[N],
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    if (((control as unknown) as AbstractControl)?.parent) {
      throw new Error(
        `Attempted to add AbstractControl to AbstractControlContainer, ` +
          `but AbstractControl already has a parent.`
      );
    } else if (this._controlsStore.has(name)) return [];

    const controlsStore = new Map(this._controlsStore).set(
      name,
      control as any
    );

    return this.setControls(controlsStore, options);
  }

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

    if (!key) return [];
    if (!this._controlsStore.has(key)) return [];

    const controlsStore = new Map(this._controlsStore);
    controlsStore.delete(key);

    return this.setControls(controlsStore, options);
  }

  markChildrenDisabled(
    value: boolean,
    options?: IControlEventOptions & { deep?: boolean }
  ): Array<keyof this & string> {
    return this._markChildrenX(
      'markChildrenDisabled',
      'Disabled',
      value,
      options
    );
  }

  markChildrenTouched(
    value: boolean,
    options?: IControlEventOptions & { deep?: boolean }
  ): Array<keyof this & string> {
    return this._markChildrenX(
      'markChildrenTouched',
      'Touched',
      value,
      options
    );
  }

  markChildrenDirty(
    value: boolean,
    options?: IControlEventOptions & { deep?: boolean }
  ): Array<keyof this & string> {
    return this._markChildrenX('markChildrenDirty', 'Dirty', value, options);
  }

  markChildrenReadonly(
    value: boolean,
    options?: IControlEventOptions & { deep?: boolean }
  ): Array<keyof this & string> {
    return this._markChildrenX(
      'markChildrenReadonly',
      'Readonly',
      value,
      options
    );
  }

  markChildrenSubmitted(
    value: boolean,
    options?: IControlEventOptions & { deep?: boolean }
  ): Array<keyof this & string> {
    return this._markChildrenX(
      'markChildrenSubmitted',
      'Submitted',
      value,
      options
    );
  }

  markChildrenPending(
    value: boolean,
    options?: IControlEventOptions & { deep?: boolean }
  ): Array<keyof this & string> {
    return this._markChildrenX(
      'markChildrenPending',
      'Pending',
      value,
      options
    );
  }

  private _markChildrenX(
    methodName: string,
    prop:
      | 'Pending'
      | 'Submitted'
      | 'Disabled'
      | 'Touched'
      | 'Dirty'
      | 'Readonly',
    value: boolean,
    options?: IControlEventOptions & { deep?: boolean }
  ) {
    const normOptions = this._normalizeOptions(methodName, options);
    const childOptions = this._normalizeChildOptions(normOptions);

    if (options?.deep) {
      (childOptions as any).deep = true;
    }

    this.controlsStore.forEach((c, key) => {
      if (!options?.deep || !AbstractControlContainer.isControlContainer(c)) {
        ((c as unknown) as any)[`mark${prop}`](value, childOptions);
        return;
      }

      const { results } = childOptions.meta[
        CONTROL_CONTAINER_CHILD_STATE_CHANGE
      ];

      // first mark the child itself as X (e.g. disabled)
      ((c as unknown) as any)[`mark${prop}`](value, childOptions);

      // get the `event.changes` object that results from this
      const markChanges = results[key].changes;

      // next, deeply mark this child's children as X (e.g. disabled)
      ((c as unknown) as any)[`markChildren${prop}`](value, childOptions);

      // get the `event.changes` object that results from this
      const markChildrenChanges = results[key].changes;

      // Merge the two `event.changes` objects together, favoring the second
      // round of results in case of conflicts, and then overwrite the
      // saved result changes
      (results[key] as any).changes = new Map([
        ...markChanges,
        ...markChildrenChanges,
      ]);
    });

    return this._processChildResults(childOptions, normOptions);
  }

  replayState(
    options: IControlEventOptions & {
      /**
       * By default, the child controls will be cloned so that
       * mutations to them do not affect the replayState snapshot.
       * Pass the `preserveControls: true` option to disable this.
       */
      preserveControls?: boolean;
    } = {}
  ): Observable<IControlStateChangeEvent> {
    const controlsStore = options.preserveControls
      ? this._controlsStore
      : new Map(
          Array.from(this._controlsStore).map(([k, c]) => [
            k,
            (c as AbstractControl).clone() as typeof c,
          ])
        );

    const event: IControlStateChangeEvent = {
      type: 'StateChange',
      source: this.id,
      meta: {},
      ...this._normalizeOptions('replayState', options),
      // the order of these changes matters
      changes: new Map<string, unknown>(
        AbstractControlContainer.PUBLIC_PROPERTIES.map((p) => {
          if (p === 'controlsStore') {
            return [p, controlsStore];
          } else if (p === 'controls') {
            const controls = options.preserveControls
              ? this._controls
              : // prettier-ignore
              Array.isArray(this._controls)
                ? Array.from(controlsStore.values())
                : Object.fromEntries(controlsStore);

            return [p, controls];
          }

          return [p, this[p]];
        })
      ),
    };

    // when we aren't preserving the controls, then we want to return
    // a new controlsStore & child controls each time
    return options.preserveControls
      ? of(event)
      : of(event).pipe(
          map((e) => {
            const changes = new Map(e.changes);

            const controlsStore = new Map(
              Array.from(
                changes.get('controlsStore') as Map<
                  ControlsKey<Controls>,
                  NonNullable<Controls[ControlsKey<Controls>]>
                >
              ).map(([k, c]) => [k, (c as AbstractControl).clone() as typeof c])
            );

            changes.set('controlsStore', controlsStore);

            const controls = Array.isArray(changes.get('controls'))
              ? Array.from(controlsStore.values())
              : Object.fromEntries(controlsStore);

            changes.set('controls', controls);

            return {
              ...e,
              changes,
            };
          })
        );
  }

  clone(
    options?: IControlEventOptions & {
      /**
       * By default, the child controls will be also cloned.
       * Pass the `preserveControls: true` option to disable this.
       */
      preserveControls?: boolean;
    }
  ) {
    return super.clone(options);
  }

  processEvent<T extends IControlEvent>(
    event: T,
    options?: IControlEventOptions
  ): IProcessedEvent<T> {
    if (isChildStateChangeEvent(event)) {
      return this._processEvent_ExternalChildStateChange(event, options);
    }

    return super.processEvent(event, options);
  }

  protected _processIndividualStateChange(
    options: IControlEventOptions,
    prop: string,
    value: any
  ): Array<keyof this & string> {
    switch (prop) {
      case 'controlsStore': {
        return this.setControls(value, options);
      }
    }

    return super._processIndividualStateChange(options, prop, value);
  }

  protected _registerControl(
    key: ControlsKey<Controls>,
    control: Controls[ControlsKey<Controls>],
    options?: IControlEventOptions
  ) {
    if (((control as unknown) as AbstractControl).parent === this) {
      throw new Error(
        `You have tried to add a control to a ControlContainer but ` +
          `the control is already a child of the ControlContainer.`
      );
    }

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
          filter(isFocusEvent),
          filter(
            (e) =>
              e.trigger.source === ((control as unknown) as AbstractControl).id
          )
        )
        .subscribe((e) => {
          _control.focus(e.focus, e);
          // _control.processEvent({ ...e, source: _control.id });
        });

      control = (_control as unknown) as Controls[ControlsKey<Controls>];
    }

    ((control as unknown) as AbstractControl)._setParent(this, options);

    const sub = ((control as unknown) as AbstractControl).events
      .pipe(
        filter(isStateChange),
        filter((e) => {
          const changeOriginatedFromThisContainer =
            (e.meta as IControlContainerChildStateChangeMeta)[
              CONTROL_CONTAINER_CHILD_STATE_CHANGE
            ]?.containerId === this.id;

          if (changeOriginatedFromThisContainer) {
            (e.meta as IControlContainerChildStateChangeMeta)[
              CONTROL_CONTAINER_CHILD_STATE_CHANGE
            ].results[key] = e;
          }

          return !changeOriginatedFromThisContainer;
        })
      )
      .subscribe((childEvent) => {
        const normOptions = this._normalizeOptions(
          childEvent.trigger.label,
          childEvent
        );

        const childEvents = { [key]: childEvent };

        const changedProps = this._processInternalChildrenStateChanges(
          childEvents,
          normOptions
        );

        this._emitEvent(
          getSimpleChildStateChangeEventArgs(this, childEvents, changedProps),
          normOptions
        );
      });

    if (focusSub) sub.add(focusSub);

    this._controlsSubscriptions.set(control, sub);

    return control;
  }

  protected _unregisterControl(
    control: Controls[ControlsKey<Controls>],
    options?: IControlEventOptions
  ) {
    const sub = this._controlsSubscriptions.get(control);

    if (!sub) {
      throw new Error('Control was not registered to begin with');
    }

    sub.unsubscribe();

    this._controlsSubscriptions.delete(control);

    ((control as unknown) as AbstractControl)._setParent(null, options);
  }

  protected _processChildResults(
    childOptions: IChildOptions,
    options: INormControlEventOptions
  ) {
    // we want to remove the `[CONTROL_CONTAINER_CHILD_STATE_CHANGE]` prop
    // from the `meta` object on the childEvents
    const results = Object.fromEntries(
      Object.entries(
        childOptions.meta[CONTROL_CONTAINER_CHILD_STATE_CHANGE].results
      ).map(([k, v]) => {
        const meta = { ...v.meta };

        delete (meta as any)[CONTROL_CONTAINER_CHILD_STATE_CHANGE];

        return [k, { ...v, meta }];
      })
    );

    const changedProps = this._processInternalChildrenStateChanges(
      results,
      options
    );

    if (changedProps.length === 0) return [];

    if (!options[AbstractControl.NO_EVENT]) {
      this._emitEvent<IControlStateChangeEvent>(
        getSimpleChildStateChangeEventArgs(this, results, changedProps),
        options
      );
    }

    return changedProps;
  }

  protected _processEvent_ExternalChildStateChange<
    T extends IControlStateChangeEvent
  >(event: T, options?: IControlEventOptions): IProcessedEvent<T> {
    const normOptions = this._normalizeOptions(event.trigger.label, {
      ...event,
      options,
    });

    const childOptions = this._normalizeChildOptions(normOptions);

    // First process `event.childEvents`
    for (const [_key, childEvent] of Object.entries(event.childEvents!)) {
      const key = this._coerceControlStringKey(_key);

      const control = this.controlsStore.get(key) as AbstractControl;

      control.processEvent(childEvent, childOptions);
    }

    let changedProps = this._processInternalChildrenStateChanges(
      childOptions.meta[CONTROL_CONTAINER_CHILD_STATE_CHANGE].results,
      normOptions
    );

    // Second process `event.changes`. Most of the time,
    // all of the changes will have already been handled by the childEvents
    // and this will be a noop. But there might be additional
    // changes specific to this control container that we still need to
    // process
    // START PROCESSING `event.changes`
    const _options: IControlEventOptions = {
      ...normOptions,
      [AbstractControl.NO_EVENT]: true,
    };

    const otherChangedProps: Array<keyof this & string> = Array.from(
      event.changes
    ).flatMap(
      ([prop, value]: [string, any]): Array<keyof this & string> => {
        if (changedProps.includes(prop as keyof this & string)) return [];

        return this._processIndividualStateChange(_options, prop, value);
      }
    );

    changedProps = Array.from(new Set([...changedProps, ...otherChangedProps]));
    // END PROCESSING `event.changes`

    if (changedProps.length === 0) return { status: 'PROCESSED' };

    const processedEvent: IProcessedEvent<T> = {
      status: 'PROCESSED',
      result: {
        ...event,
        ...getSimpleChildStateChangeEventArgs(
          this,
          childOptions.meta[CONTROL_CONTAINER_CHILD_STATE_CHANGE].results,
          changedProps
        ),
        ...normOptions,
      },
    };

    if (processedEvent.result && !normOptions[AbstractControl.NO_EVENT]) {
      this._emitEvent(processedEvent.result, normOptions);
    }

    return processedEvent;
  }

  protected _processInternalChildrenStateChanges(
    events: { [key: string]: IControlStateChangeEvent },
    options: INormControlEventOptions
  ): Array<keyof this & string> {
    const normalizedChanges = this._normalizeChildrenStateChanges(events);

    const changedProps: Array<keyof this & string> = [];

    if (normalizedChanges.has('rawValue')) {
      const newRawValue = this._shallowCloneValue(this.rawValue);

      normalizedChanges.get('rawValue')!.forEach((key) => {
        newRawValue[key] = events[key].changes.get(
          'rawValue'
        ) as ControlsRawValue<Controls>[typeof key];
      });

      this._rawValue = newRawValue;

      changedProps.push('rawValue');
    }

    if (normalizedChanges.has('value')) {
      const newValue = this._shallowCloneValue(this.value);

      normalizedChanges.get('value')!.forEach((key) => {
        if (
          ((this.controls[key] as unknown) as AbstractControl | undefined)
            ?.disabled
        ) {
          delete newValue[key];
        } else {
          newValue[key] = events[key].changes.get(
            'value'
          ) as ControlsValue<Controls>[typeof key];
        }
      });

      this._value = newValue;

      changedProps.push('value');
    }

    if (
      CONTROL_CONTAINER_WATCHED_CHILD_PROPS.some((p) =>
        normalizedChanges.has(p)
      )
    ) {
      changedProps.push(...this._calculateChildProps());
    }

    if (normalizedChanges.has('errors')) {
      changedProps.push(...this._calculateChildrenErrors());
    }

    if (changedProps.includes('rawValue')) {
      changedProps.push(...this._validate(options));
    }

    return changedProps;
  }

  protected _normalizeChildrenStateChanges(events: {
    [key: string]: IControlStateChangeEvent;
  }) {
    // This maps changed props to the keys that experienced
    // those changes
    const normalizedChanges = new Map<string, Set<ControlsKey<Controls>>>();

    function addChange(prop: string, key: ControlsKey<Controls>) {
      if (!normalizedChanges.has(prop)) normalizedChanges.set(prop, new Set());

      normalizedChanges.get(prop)!.add(key);
    }

    Object.entries(events).forEach(([_key, childEvent]) => {
      const key = this._coerceControlStringKey(_key);

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
        !(
          childEvent.changes.has('disabled') ||
          childEvent.changes.has('rawValue')
        )
      ) {
        return;
      }

      childEvent.changes.forEach((_, prop) => {
        if (prop === 'rawValue' || prop === 'disabled') {
          addChange('value', key as ControlsKey<Controls>);
        }

        addChange(prop, key as ControlsKey<Controls>);
      });
    });

    return normalizedChanges;
  }

  // Because the child event key of a IChildControlStateChangeEvent
  // is stored as an object prop, it will aways be a
  // string. Unfortunately, the ControlKey of a FormArray is a number
  // so this method coerces the string key into the proper type.
  protected abstract _coerceControlStringKey(
    key: string
  ): ControlsKey<Controls>;

  protected _calculateChildProps(): Array<keyof this & string> {
    const changedProps: Array<keyof this & string> = [];
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

    this._status = this._getControlStatus();

    if (oldStatus !== this._status) {
      changedProps.push('status');
    }

    return changedProps;
  }

  protected _calculateChildrenErrors(): Array<keyof this & string> {
    const changedProps: Array<keyof this & string> = [];
    const prevChildrenErrors = this._childrenErrors;
    const prevCombinedErrors = this._errors;

    this._childrenErrors = Array.from(this.controlsStore).reduce(
      (prev, [key, control]) => {
        const c = (control as unknown) as AbstractControl;

        if (c.disabled) return prev;

        if (c.errors?.[CONTROL_SELF_ID]) {
          const e = { ...c.errors };

          delete e[CONTROL_SELF_ID];

          return {
            ...prev,
            ...e,
            [`${CONTROL_SELF_ID}__${key}`]: c.errors[CONTROL_SELF_ID],
          };
        }

        return { ...prev, ...c.errors };
      },
      {}
    );

    if (Object.keys(this._childrenErrors).length === 0) {
      this._childrenErrors = null;
    }

    if (!this._childrenErrors && !this._selfErrors) {
      this._errors = null;
    } else {
      this._errors = { ...this._childrenErrors, ...this._selfErrors };
    }

    // changedProps.push(...updateInvalidProp(this));

    if (!isEqual(this._childrenErrors, prevChildrenErrors)) {
      changedProps.push('childrenErrors');
    }

    if (!isEqual(this._errors, prevCombinedErrors)) {
      changedProps.push('errors');

      const oldStatus = this.status;
      this._status = this._getControlStatus();

      if (!isEqual(oldStatus, this._status)) {
        changedProps.push('status');
      }
    }

    return changedProps;
  }

  protected abstract _shallowCloneValue<
    T extends this['rawValue'] | this['value']
  >(value: T): T;

  protected _calculateErrors(): Array<keyof this & string> {
    const changedProps: Array<keyof this & string> = [];
    const oldInvalid = this.invalid;
    const oldSelfInvalid = this.selfInvalid;

    if (this._errorsStore.size === 0) {
      this._selfErrors = null;
    } else {
      this._selfErrors = Array.from(this._errorsStore).reduce<ValidationErrors>(
        (p, [, v]) => ({
          ...p,
          ...v,
        }),
        {}
      );
    }

    if (this._childrenErrors || this._selfErrors) {
      this._errors = { ...this._childrenErrors, ...this._selfErrors };
    } else {
      this._errors = null;
    }

    changedProps.push('selfErrors', 'errors');

    if (oldSelfInvalid !== this.selfInvalid) {
      changedProps.push('selfValid', 'selfInvalid');
    }

    if (oldInvalid !== this.invalid) {
      changedProps.push('valid', 'invalid');
    }

    const newStatus = this._getControlStatus();

    if (newStatus !== this._status) {
      changedProps.push('status');
      this._status = newStatus;
    }

    return changedProps;
  }

  protected _normalizeChildOptions(
    options: INormControlEventOptions
  ): IChildOptions {
    return {
      source: this.id,
      ...options,
      meta: {
        ...options.meta,
        [CONTROL_CONTAINER_CHILD_STATE_CHANGE]: {
          containerId: this.id,
          results: {},
        },
      },
    };
  }
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

function isFocusEvent<T extends IControlEvent>(
  event: T
): event is T & IControlFocusEvent {
  return event.type === 'Focus';
}

function isChildStateChangeEvent<T extends IControlEvent>(
  event: T
): event is T & IControlStateChangeEvent {
  return (
    event.type === 'StateChange' &&
    !!(event as T & IControlStateChangeEvent).childEvents
  );
}

type IChildOptions = INormControlEventOptions & {
  meta: IControlContainerChildStateChangeMeta;
};

// function buildChildOptions<T extends AbstractControlContainer>(
//   control: T,
//   initialTrigger: string,
//   options?: IControlEventOptions
// ) {
//   return {
//     source: control.id,
//     initialTrigger,
//     ...options,
//     meta: {
//       ...options?.meta,
//       [CONTROL_CONTAINER_CHILD_STATE_CHANGE]: {
//         count: count++,
//         source: control.id,
//         results: {} as { [key: string]: IControlStateChangeEvent },
//       },
//     },
//   };
// }

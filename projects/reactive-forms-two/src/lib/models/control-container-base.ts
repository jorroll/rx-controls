import { Subscription, concat, Observable, of, from } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import {
  AbstractControl,
  ControlId,
  IControlEvent,
  IControlEventOptions,
  ValidationErrors,
} from './abstract-control';
import {
  ControlContainer,
  ControlsValue,
  ControlsEnabledValue,
  IControlContainerStateChangeEvent,
  IControlContainerStateChange,
  IChildControlStateChangeEvent,
  GenericControlsObject,
  ContainerControls,
  IChildControlEvent,
  // IChildControlEvent,
} from './control-container';
import {
  ControlBase,
  IControlBaseArgs,
  IControlStateChangeEvent,
} from './control-base';
import {
  getSimpleContainerStateChangeEventArgs,
  isTruthy,
  pluckOptions,
} from './util';

// export interface IProcessContainerStateChangeFnArgs<
//   Controls extends GenericControlsObject,
//   D
// > extends IProcessStateChangeFnArgs<ControlsValue<Controls>, D> {
//   event: IControlContainerStateChangeEvent<Controls, D>;
//   changes?: {
//     change: IControlContainerStateChange<Controls, D>;
//     sideEffects: string[];
//   };
// }

// export interface IProcessChildStateChangeFnArgs<
//   Controls extends GenericControlsObject,
//   D
// > extends IChildControlStateChangeEvent<Controls, D> {
//   changeType: string;
//   control: Controls[keyof Controls];
//   changes?: {
//     change: IControlContainerStateChange<ControlsValue<Controls>, D>;
//     sideEffects: string[];
//   };
// }

export abstract class ControlContainerBase<
    Controls extends GenericControlsObject = any,
    Data = any
  >
  extends ControlBase<ControlsValue<Controls>, Data>
  implements ControlContainer<Controls, Data> {
  protected _controls!: Controls;
  get controls() {
    return this._controls;
  }

  protected _controlsStore: ReadonlyMap<
    keyof Controls,
    Controls[keyof Controls]
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
    return !this.errors;
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
    return !!this.errors;
  }

  protected _childInvalid = false;
  get childInvalid() {
    return this._childInvalid;
  }

  protected _childrenInvalid = false;
  get childrenInvalid() {
    return this._childrenInvalid;
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
    Controls[keyof Controls],
    Subscription
  >();

  constructor(
    controlId: ControlId,
    controls: Controls,
    options: IControlBaseArgs<Data> = {}
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

  [ControlContainer.INTERFACE]() {
    return this;
  }

  get<A extends keyof Controls>(a: A): Controls[A];
  get<A extends keyof Controls, B extends keyof ContainerControls<Controls[A]>>(
    a: A,
    b: B
  ): ContainerControls<Controls[A]>[B];
  get<
    A extends keyof Controls,
    B extends keyof ContainerControls<Controls[A]>,
    C extends keyof ContainerControls<ContainerControls<Controls[A]>[B]>
  >(a: A, b: B, c: C): ContainerControls<ContainerControls<Controls[A]>[B]>[C];
  get<
    A extends keyof Controls,
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
    A extends keyof Controls,
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
      if (ControlContainer.isControlContainer(prev)) {
        return prev.get(curr);
      }

      return null;
    }, this as AbstractControl | null);
  }

  patchValue(value: object, options?: IControlEventOptions) {
    Object.entries(value).forEach(([key, val]) => {
      const c = this.controls[key as keyof Controls];

      if (!c) {
        throw new Error(`Invalid patchValue key "${key}".`);
      }

      ControlContainer.isControlContainer(c)
        ? c.patchValue(val, options)
        : ((c as unknown) as AbstractControl).setValue(val, options);
    });
  }

  setControls(controls: Controls, options?: IControlEventOptions) {
    const controlsStore = new Map(
      (Object.entries(controls) as unknown) as Array<
        [keyof Controls, Controls[keyof Controls]]
      >
    );

    this.emitEvent<IControlContainerStateChangeEvent<Controls, Data>>(
      getSimpleContainerStateChangeEventArgs({
        controlsStore: () => controlsStore,
      }),
      options
    );
  }

  setControl<N extends keyof Controls>(
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

  addControl<N extends keyof Controls>(
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
    name: keyof Controls | Controls[keyof Controls],
    options?: IControlEventOptions
  ) {
    let key: keyof Controls;

    if (AbstractControl.isAbstractControl(name)) {
      for (const [k, c] of this.controlsStore) {
        if (c !== name) continue;

        key = k;
        break;
      }
    } else {
      key = name as keyof Controls;
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
    key: keyof Controls,
    control: Controls[keyof Controls],
    options?: IControlEventOptions
  ) {
    // This clone might problems when unregistering controls...

    if (((control as unknown) as AbstractControl).parent) {
      control = (((control as unknown) as AbstractControl).clone() as unknown) as Controls[keyof Controls];
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
            key: key as string | number,
            childEvent: event as IControlStateChangeEvent<
              this['value'][keyof Controls],
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
    control: Controls[keyof Controls],
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

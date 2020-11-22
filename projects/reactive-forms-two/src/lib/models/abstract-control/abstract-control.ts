import { Observable, Subject, queueScheduler } from 'rxjs';

// *****************************
// Misc Types
// *****************************

export type ControlId = string | symbol;

export type ValidatorFn = (control: AbstractControl) => ValidationErrors | null;

export interface ValidationErrors {
  [key: string]: any;
}

// *****************************
// ControlEvent interfaces
// *****************************

export interface IControlEventArgs {
  eventId?: number;
  idOfOriginatingEvent?: number;
  source: ControlId;
  type: string;
  meta?: { [key: string]: unknown };
  noEmit?: boolean;
  /**
   * Advanced option which can be used to control the timing of
   * an emitted ControlEvent.
   */
  delay?: number;
}

export interface IControlEvent extends IControlEventArgs {
  eventId: number;
  idOfOriginatingEvent: number;
  meta: { [key: string]: unknown };
}

export interface IControlEventOptions {
  noEmit?: boolean;
  meta?: { [key: string]: unknown };
  // eventId?: number;
  idOfOriginatingEvent?: number;
  source?: ControlId;
}

export interface IControlValidationEvent<V> extends IControlEvent {
  type: 'ValidationStart' | 'AsyncValidationStart' | 'ValidationComplete';
  value: V;
}

export type IStateChange<V = unknown> = (old: V) => V;

export interface IControlStateChange<V, D> {
  value?: IStateChange<V>;
  disabled?: IStateChange<boolean>;
  touched?: IStateChange<boolean>;
  dirty?: IStateChange<boolean>;
  readonly?: IStateChange<boolean>;
  submitted?: IStateChange<boolean>;
  errorsStore?: IStateChange<ReadonlyMap<ControlId, ValidationErrors>>;
  validatorStore?: IStateChange<ReadonlyMap<ControlId, ValidatorFn>>;
  registeredValidators?: IStateChange<ReadonlySet<ControlId>>;
  registeredAsyncValidators?: IStateChange<ReadonlySet<ControlId>>;
  runningValidation?: IStateChange<ReadonlySet<ControlId>>;
  runningAsyncValidation?: IStateChange<ReadonlySet<ControlId>>;
  pendingStore?: IStateChange<ReadonlySet<ControlId>>;
  parent?: IStateChange<AbstractControl | null>;
  data?: IStateChange<D>;
  [key: string]: unknown;
}

export interface IControlStateChangeEvent<V, D> extends IControlEvent {
  type: 'StateChange';
  change: IControlStateChange<V, D>;
  changedProps: string[]; // array of other props that have changed;
}

// *****************************
// AbstractControl interface
// *****************************

/**
 * ControlSource is a special rxjs Subject which never
 * completes.
 */
export class ControlSource<T> extends Subject<T> {
  /** NOOP: Complete does nothing */
  complete() {}

  next(value?: T) {
    queueScheduler.schedule((state) => super.next(state), 0, value);
  }
}

export namespace AbstractControl {
  export const INTERFACE = Symbol('@@AbstractControlInterface');

  let _eventId = 0;
  export function eventId(
    /**
     * A passed value will reset the "current" eventId number.
     * Only intended for use in tests.
     */
    reset?: number
  ) {
    return (_eventId = reset ?? _eventId + 1);
  }

  export function isControl(object?: unknown): object is AbstractControl {
    return (
      typeof object === 'object' &&
      typeof (object as any)?.[AbstractControl.INTERFACE] === 'function' &&
      (object as any)[AbstractControl.INTERFACE]() === object
    );
  }
}

export interface AbstractControl<Value = any, Data = any> {
  /**
   * The ID is used to determine where StateChanges originated,
   * and to ensure that a given AbstractControl only processes
   * values one time.
   */
  readonly id: ControlId;

  data: Data;

  /**
   * **Warning!** Do not use this property unless you know what you are doing.
   *
   * A control's `source` is the source of truth for the control. Events emitted
   * by the source are used to update the control's values. By passing events to
   * this control's source, you can programmatically control every aspect of
   * of this control.
   *
   * Never subscribe to the source directly. If you want to receive events for
   * this control, subscribe to the `events` observable.
   */
  source: ControlSource<
    IControlEvent | (IControlEvent & { [key: string]: unknown })
  >;

  /** An observable of all events for this AbstractControl */
  events: Observable<
    IControlEvent | (IControlEvent & { [key: string]: unknown })
  >;

  readonly value: Value;
  readonly enabled: boolean;
  readonly disabled: boolean;
  readonly touched: boolean;
  readonly dirty: boolean;
  readonly readonly: boolean;
  readonly submitted: boolean;

  readonly errors: ValidationErrors | null;
  readonly errorsStore: ReadonlyMap<ControlId, ValidationErrors>;

  readonly validator: ValidatorFn | null;
  readonly validatorStore: ReadonlyMap<ControlId, ValidatorFn>;

  readonly pending: boolean;
  readonly pendingStore: ReadonlySet<ControlId>;

  readonly valid: boolean;
  readonly invalid: boolean;
  readonly status: 'DISABLED' | 'PENDING' | 'VALID' | 'INVALID';

  readonly parent: AbstractControl | null;

  [AbstractControl.INTERFACE](): this;

  observe<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C],
    E extends keyof this[A][B][C][D],
    F extends keyof this[A][B][C][D][E],
    G extends keyof this[A][B][C][D][E][F],
    H extends keyof this[A][B][C][D][E][F][G],
    I extends keyof this[A][B][C][D][E][F][G][H],
    J extends keyof this[A][B][C][D][E][F][G][H][I],
    K extends keyof this[A][B][C][D][E][F][G][H][I][J]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
    g: G,
    h: H,
    i: I,
    j: J,
    k: K,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D][E][F][G][H][I][J][K] | undefined>;
  observe<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C],
    E extends keyof this[A][B][C][D],
    F extends keyof this[A][B][C][D][E],
    G extends keyof this[A][B][C][D][E][F],
    H extends keyof this[A][B][C][D][E][F][G],
    I extends keyof this[A][B][C][D][E][F][G][H],
    J extends keyof this[A][B][C][D][E][F][G][H][I]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
    g: G,
    h: H,
    i: I,
    j: J,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D][E][F][G][H][I][J] | undefined>;
  observe<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C],
    E extends keyof this[A][B][C][D],
    F extends keyof this[A][B][C][D][E],
    G extends keyof this[A][B][C][D][E][F],
    H extends keyof this[A][B][C][D][E][F][G],
    I extends keyof this[A][B][C][D][E][F][G][H]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
    g: G,
    h: H,
    i: I,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D][E][F][G][H][I] | undefined>;
  observe<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C],
    E extends keyof this[A][B][C][D],
    F extends keyof this[A][B][C][D][E],
    G extends keyof this[A][B][C][D][E][F],
    H extends keyof this[A][B][C][D][E][F][G]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
    g: G,
    h: H,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D][E][F][G][H] | undefined>;
  observe<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C],
    E extends keyof this[A][B][C][D],
    F extends keyof this[A][B][C][D][E],
    G extends keyof this[A][B][C][D][E][F]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
    g: G,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D][E][F][G] | undefined>;
  observe<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C],
    E extends keyof this[A][B][C][D],
    F extends keyof this[A][B][C][D][E]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D][E][F] | undefined>;
  observe<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C],
    E extends keyof this[A][B][C][D]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D][E] | undefined>;
  observe<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D] | undefined>;
  observe<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B]
  >(
    a: A,
    b: B,
    c: C,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C] | undefined>;
  observe<A extends keyof this, B extends keyof this[A]>(
    a: A,
    b: B,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B] | undefined>;
  observe<A extends keyof this>(
    a: A,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A]>;
  observe<T = any>(
    props: string[],
    options?: { ignoreNoEmit?: boolean }
  ): Observable<T>;

  observeChanges<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C],
    E extends keyof this[A][B][C][D],
    F extends keyof this[A][B][C][D][E],
    G extends keyof this[A][B][C][D][E][F],
    H extends keyof this[A][B][C][D][E][F][G],
    I extends keyof this[A][B][C][D][E][F][G][H],
    J extends keyof this[A][B][C][D][E][F][G][H][I],
    K extends keyof this[A][B][C][D][E][F][G][H][I][J]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
    g: G,
    h: H,
    i: I,
    j: J,
    k: K,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D][E][F][G][H][I][J][K] | undefined>;
  observeChanges<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C],
    E extends keyof this[A][B][C][D],
    F extends keyof this[A][B][C][D][E],
    G extends keyof this[A][B][C][D][E][F],
    H extends keyof this[A][B][C][D][E][F][G],
    I extends keyof this[A][B][C][D][E][F][G][H],
    J extends keyof this[A][B][C][D][E][F][G][H][I]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
    g: G,
    h: H,
    i: I,
    j: J,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D][E][F][G][H][I][J] | undefined>;
  observeChanges<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C],
    E extends keyof this[A][B][C][D],
    F extends keyof this[A][B][C][D][E],
    G extends keyof this[A][B][C][D][E][F],
    H extends keyof this[A][B][C][D][E][F][G],
    I extends keyof this[A][B][C][D][E][F][G][H]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
    g: G,
    h: H,
    i: I,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D][E][F][G][H][I] | undefined>;
  observeChanges<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C],
    E extends keyof this[A][B][C][D],
    F extends keyof this[A][B][C][D][E],
    G extends keyof this[A][B][C][D][E][F],
    H extends keyof this[A][B][C][D][E][F][G]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
    g: G,
    h: H,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D][E][F][G][H] | undefined>;
  observeChanges<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C],
    E extends keyof this[A][B][C][D],
    F extends keyof this[A][B][C][D][E],
    G extends keyof this[A][B][C][D][E][F]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
    g: G,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D][E][F][G] | undefined>;
  observeChanges<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C],
    E extends keyof this[A][B][C][D],
    F extends keyof this[A][B][C][D][E]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    f: F,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D][E][F] | undefined>;
  observeChanges<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C],
    E extends keyof this[A][B][C][D]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D][E] | undefined>;
  observeChanges<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B],
    D extends keyof this[A][B][C]
  >(
    a: A,
    b: B,
    c: C,
    d: D,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C][D] | undefined>;
  observeChanges<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B]
  >(
    a: A,
    b: B,
    c: C,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B][C] | undefined>;
  observeChanges<A extends keyof this, B extends keyof this[A]>(
    a: A,
    b: B,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A][B] | undefined>;
  observeChanges<A extends keyof this>(
    a: A,
    options?: { ignoreNoEmit?: boolean }
  ): Observable<this[A]>;
  observeChanges<T = any>(
    props: string[],
    options?: { ignoreNoEmit?: boolean }
  ): Observable<T>;

  setValue(value: Value, options?: IControlEventOptions): void;
  // patchValue(value: any, options?: IControlEventOptions): void;

  /**
   * If provided a `ValidationErrors` object or `null`, replaces the errors
   * associated with the source ID.
   *
   * If provided a `Map` object containing `ValidationErrors` keyed to source IDs,
   * uses it to replace the `errorsStore` associated with this control.
   */
  setErrors(
    value: ValidationErrors | null | ReadonlyMap<ControlId, ValidationErrors>,
    options?: IControlEventOptions
  ): void;

  /**
   * If provided a `ValidationErrors` object, that object is merged with the
   * existing errors associated with the source ID. If the error object has
   * properties = `null`, errors associated with those keys are deleted
   * from the `errorsStore`.
   *
   * If provided a `Map` object containing `ValidationErrors` keyed to source IDs,
   * that object is merged with the existing `errorsStore`.
   */
  patchErrors(
    value: ValidationErrors | ReadonlyMap<ControlId, ValidationErrors>,
    options?: IControlEventOptions
  ): void;

  markTouched(value: boolean, options?: IControlEventOptions): void;
  markDirty(value: boolean, options?: IControlEventOptions): void;
  markReadonly(value: boolean, options?: IControlEventOptions): void;
  markDisabled(value: boolean, options?: IControlEventOptions): void;
  markSubmitted(value: boolean, options?: IControlEventOptions): void;
  markPending(
    value: boolean | ReadonlySet<ControlId>,
    options?: IControlEventOptions
  ): void;

  setParent(
    parent: AbstractControl | null,
    options?: IControlEventOptions
  ): void;

  setValidators(
    value:
      | ValidatorFn
      | ValidatorFn[]
      | ReadonlyMap<ControlId, ValidatorFn>
      | null,
    options?: IControlEventOptions
  ): void;

  validationService(
    source: ControlId,
    options?: IControlEventOptions
  ): Observable<
    IControlValidationEvent<Value> & {
      type: 'ValidationStart';
    }
  >;

  markValidationComplete(
    source: ControlId,
    options?: IControlEventOptions
  ): void;

  asyncValidationService(
    source: ControlId,
    options?: IControlEventOptions
  ): Observable<
    IControlValidationEvent<Value> & {
      type: 'AsyncValidationStart';
    }
  >;

  markAsyncValidationComplete(
    source: ControlId,
    options?: IControlEventOptions
  ): void;

  /**
   * Unlike other AbstractControl properties, the `data` property can be set directly.
   * i.e. `control.data = newValue`.
   *
   * As an alternative to setting data this way,
   * you can use `setData()` which uses the standard ControlEvent API and emits a `data`
   * StateChange that can be observed. Data values are compared with strict equality
   * (`===`). If it doesn't look like the data has changed, the event will be ignored.
   *
   * You can also pass a change function instead. This function will be passed the old data
   * value and is expected to return a new data value.
   */
  setData(
    data: Data | ((data: Data) => Data),
    options?: IControlEventOptions
  ): void;

  /**
   * Returns an observable of this control's state in the form of
   * StateChange objects which can be used to make another control
   * identical to this one. This observable will complete upon
   * replaying the necessary state changes.
   */
  replayState(options?: IControlEventOptions): Observable<IControlEvent>;

  clone(): AbstractControl<Value, Data>;

  /**
   * A convenience method for emitting an arbitrary control event.
   */
  emitEvent<
    T extends IControlEventArgs = IControlEventArgs & { [key: string]: any }
  >(
    event: Partial<
      Pick<T, 'source' | 'idOfOriginatingEvent' | 'noEmit' | 'meta'>
    > &
      Omit<
        T,
        'eventId' | 'source' | 'idOfOriginatingEvent' | 'noEmit' | 'meta'
      > & {
        type: string;
      },
    options?: IControlEventOptions
  ): void;
}

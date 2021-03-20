import { Observable } from 'rxjs';

// *****************************
// Misc Types
// *****************************

export type ControlId = string | symbol;

// Passing a whole `AbstractControl` to validator functions could create
// unexpected bugs in ControlDirectives if the control type changes in
// a way the developer didn't expect (e.g. from FormControl to FormGroup).
// Because validator services are now an option, I don't think it's necessary
// for ValidatorFn to receive the control. Instead they can just receive the
// rawValue and value.
export type ValidatorFn<RawValue = any, Value = any> = (obj: {
  rawValue: RawValue;
  value: Value;
}) => ValidationErrors | null;

export interface ValidationErrors {
  [key: string]: any;
}

// *****************************
// ControlEvent interfaces
// *****************************

export interface IEventTrigger {
  readonly label: string;
  readonly source: ControlId;
  // controlId: ControlId;
}

export interface IControlEvent {
  readonly trigger: IEventTrigger;
  // controlId: ControlId;
  readonly source: ControlId;
  readonly type: string;
  readonly meta: { [key: string]: unknown };
  readonly noObserve?: boolean;
}

export interface IControlEventOptions {
  /**
   * Contains information on what originally triggered this event. The
   * `label` generally contains the name of the triggering method
   * and the `source` contains the `ControlId` of the triggering
   * AbstractControl.
   */
  trigger?: IEventTrigger;
  /** The ControlId of the thing which emitted this event */
  source?: ControlId;
  /** Allows attaching arbitrary metadata to a ControlEvent */
  meta?: { [key: string]: unknown };
  /** Prevents `observe` and `observeChanges` subscriptions from triggering */
  noObserve?: boolean;
  /**
   * **ADVANCED USE ONLY**
   *
   * Prevents any ControlEvents from being emitted. The primary use case
   * for this is if you are performing many small changes to a control
   * that you want to manually bundle together into a single ControlEvent.
   */
  [AbstractControl.NO_EVENT]?: boolean;
}

export interface IControlValidationEvent<RawValue, Value = RawValue>
  extends IControlEvent {
  readonly type: 'ValidationStart' | 'AsyncValidationStart';
  readonly rawValue: RawValue;
  readonly value: Value;
}

export interface IControlStateChangeEvent extends IControlEvent {
  readonly type: 'StateChange';
  readonly changes: ReadonlyMap<string, unknown>;
  readonly childEvents?: { [key: string]: IControlStateChangeEvent };
}

export interface IControlFocusEvent extends IControlEvent {
  readonly type: 'Focus';
  readonly focus: boolean;
}

export interface IProcessedEvent<T extends IControlEvent = IControlEvent> {
  readonly status: 'PROCESSED' | 'UNKNOWN';
  readonly result?: T;
}

// *****************************
// AbstractControl interface
// *****************************

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

  /**
   * If not undefined, this callback will be called whenever an AbstractControl
   * `source` emits. It can be used for printing all control events to
   * the console.
   */
  export let debugCallback:
    | undefined
    | ((this: AbstractControl, event: IControlEvent) => void);

  export let throwInfiniteLoopErrorAfterEventCount = 500;

  export const NO_EVENT = Symbol('NO_EVENT');

  export const PUBLIC_PROPERTIES = [
    // The order is important since it defines the order of the `replayState`
    // changes. Here we establish the convension of placing derived properties
    // before "real" properties.
    'enabled',
    'selfEnabled',
    'disabled',
    'selfDisabled',
    'touched',
    'selfTouched',
    'dirty',
    'selfDirty',
    'readonly',
    'selfReadonly',
    'submitted',
    'selfSubmitted',
    'data',
    'value',
    'rawValue',
    'validator',
    'validatorStore',
    'pending',
    'selfPending',
    'pendingStore',
    'valid',
    'selfValid',
    'invalid',
    'selfInvalid',
    'status',
    'errors',
    'selfErrors',
    'errorsStore',
  ] as const;
}

export interface AbstractControl<RawValue = any, Data = any, Value = RawValue> {
  /**
   * The ID is used to determine where StateChanges originated,
   * and to ensure that a given AbstractControl only processes
   * values one time.
   */
  readonly id: ControlId;

  data: Data;

  /** An observable of all events for this AbstractControl */
  events: Observable<
    IControlEvent | (IControlEvent & { [key: string]: unknown })
  >;

  /**
   * The value of the AbstractControl. This is an alias for `rawValue`.
   */
  readonly value: Value;
  /** The value of the AbstractControl. */
  readonly rawValue: RawValue;
  /**
   * `true` if this control is not disabled, false otherwise.
   * This is an alias for `selfEnabled`.
   */
  readonly enabled: boolean;
  /** `true` if this control is not disabled, false otherwise. */
  readonly selfEnabled: boolean;
  /**
   * `true` if this control is disabled, false otherwise.
   * This is an alias for `selfDisabled`.
   */
  readonly disabled: boolean;
  /** `true` if this control is disabled, false otherwise. */
  readonly selfDisabled: boolean;
  /**
   * `true` if this control is touched, false otherwise.
   * This is an alias for `selfTouched`.
   */
  readonly touched: boolean;
  /** `true` if this control is touched, false otherwise. */
  readonly selfTouched: boolean;
  /**
   * `true` if this control is dirty, false otherwise.
   * This is an alias for `selfDirty`.
   */
  readonly dirty: boolean;
  /** `true` if this control is dirty, false otherwise. */
  readonly selfDirty: boolean;
  /**
   * `true` if this control is readonly, false otherwise.
   * This is an alias for `selfReadonly`.
   */
  readonly readonly: boolean;
  /** `true` if this control is readonly, false otherwise. */
  readonly selfReadonly: boolean;
  /**
   * `true` if this control is submitted, false otherwise.
   * This is an alias for `selfSubmitted`.
   */
  readonly submitted: boolean;
  /** `true` if this control is submitted, false otherwise. */
  readonly selfSubmitted: boolean;

  /**
   * Contains a `ValidationErrors` object if this control
   * has any errors. Otherwise contains `null`.
   *
   * An alias for `selfErrors`.
   */
  readonly errors: ValidationErrors | null;
  /**
   * Contains a `ValidationErrors` object if this control
   * has any errors. Otherwise contains `null`.
   */
  readonly selfErrors: ValidationErrors | null;
  readonly errorsStore: ReadonlyMap<ControlId, ValidationErrors>;

  readonly validator: ValidatorFn | null;
  readonly validatorStore: ReadonlyMap<ControlId, ValidatorFn>;

  /**
   * `true` if this control is pending, false otherwise.
   * This is an alias for `selfPending`.
   */
  readonly pending: boolean;
  /** `true` if this control is pending, false otherwise. */
  readonly selfPending: boolean;
  readonly pendingStore: ReadonlySet<ControlId>;

  /**
   * `true` if `selfErrors` is `null`, `false` otherwise.
   * This is an alias for `selfValid`.
   */
  readonly valid: boolean;
  /** `true` if `selfErrors` is `null`, `false` otherwise. */
  readonly selfValid: boolean;

  /**
   * `true` if `selfErrors` contains errors, `false` otherwise.
   * This is an alias for `selfInvalid`.
   */
  readonly invalid: boolean;
  /** `true` if `selfErrors` contains errors, `false` otherwise. */
  readonly selfInvalid: boolean;
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
    options?: { ignoreNoObserve?: boolean }
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
    options?: { ignoreNoObserve?: boolean }
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
    options?: { ignoreNoObserve?: boolean }
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
    options?: { ignoreNoObserve?: boolean }
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
    options?: { ignoreNoObserve?: boolean }
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
    options?: { ignoreNoObserve?: boolean }
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
    options?: { ignoreNoObserve?: boolean }
  ): Observable<this[A][B][C][D] | undefined>;
  observe<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B]
  >(
    a: A,
    b: B,
    c: C,
    options?: { ignoreNoObserve?: boolean }
  ): Observable<this[A][B][C] | undefined>;
  observe<A extends keyof this, B extends keyof this[A]>(
    a: A,
    b: B,
    options?: { ignoreNoObserve?: boolean }
  ): Observable<this[A][B] | undefined>;
  observe<A extends keyof this>(
    a: A,
    options?: { ignoreNoObserve?: boolean }
  ): Observable<this[A]>;
  observe<T = any>(
    props: string[],
    options?: { ignoreNoObserve?: boolean }
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
    options?: { ignoreNoObserve?: boolean }
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
    options?: { ignoreNoObserve?: boolean }
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
    options?: { ignoreNoObserve?: boolean }
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
    options?: { ignoreNoObserve?: boolean }
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
    options?: { ignoreNoObserve?: boolean }
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
    options?: { ignoreNoObserve?: boolean }
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
    options?: { ignoreNoObserve?: boolean }
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
    options?: { ignoreNoObserve?: boolean }
  ): Observable<this[A][B][C][D] | undefined>;
  observeChanges<
    A extends keyof this,
    B extends keyof this[A],
    C extends keyof this[A][B]
  >(
    a: A,
    b: B,
    c: C,
    options?: { ignoreNoObserve?: boolean }
  ): Observable<this[A][B][C] | undefined>;
  observeChanges<A extends keyof this, B extends keyof this[A]>(
    a: A,
    b: B,
    options?: { ignoreNoObserve?: boolean }
  ): Observable<this[A][B] | undefined>;
  observeChanges<A extends keyof this>(
    a: A,
    options?: { ignoreNoObserve?: boolean }
  ): Observable<this[A]>;
  observeChanges<T = any>(
    props: string[],
    options?: { ignoreNoObserve?: boolean }
  ): Observable<T>;

  setValue(value: RawValue, options?: IControlEventOptions): string[];

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
  ): string[];

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
  ): string[];

  markTouched(value: boolean, options?: IControlEventOptions): string[];
  markDirty(value: boolean, options?: IControlEventOptions): string[];
  markReadonly(value: boolean, options?: IControlEventOptions): string[];
  markDisabled(value: boolean, options?: IControlEventOptions): string[];
  markSubmitted(value: boolean, options?: IControlEventOptions): string[];
  markPending(
    value: boolean | ReadonlySet<ControlId>,
    options?: IControlEventOptions
  ): string[];

  setValidators(
    value:
      | ValidatorFn
      | ValidatorFn[]
      | ReadonlyMap<ControlId, ValidatorFn>
      | null,
    options?: IControlEventOptions
  ): string[];

  /**
   * Unlike other AbstractControl properties, the `data` property can be set directly.
   * i.e. `control.data = newValue`.
   *
   * As an alternative to setting data this way,
   * you can use `setData()` which uses the standard ControlEvent API and emits a `data`
   * StateChange that can be observed. Data values are compared with strict equality
   * (`===`). If it doesn't look like the data has changed, the event will be ignored.
   */
  setData(data: Data, options?: IControlEventOptions): string[];

  focus(value?: boolean, options?: Omit<IControlEventOptions, 'noEmit'>): void;

  /**
   * Returns an observable of this control's state in the form of
   * StateChange objects which can be used to make another control
   * identical to this one. This observable will complete upon
   * replaying the necessary state changes.
   */
  replayState(options?: IControlEventOptions): Observable<IControlEvent>;

  /**
   * Returns a new AbstractControl which is identical to this one except
   * for the `id` and `parent` properties.
   */
  clone(options?: IControlEventOptions): AbstractControl<RawValue, Data, Value>;

  processEvent<T extends IControlEvent>(
    event: T,
    options?: IControlEventOptions
  ): IProcessedEvent<T>;

  /**
   * *INTERNAL USE*
   *
   * Sets the `parent` property of an AbstractControl. Generally,
   * you shouldn't use this directly. The parent will be automatically
   * set when you add or remove a control from an AbstractControlContainer.
   */
  _setParent(
    parent: AbstractControl | null,
    options?: IControlEventOptions
  ): string[];

  // /**
  //  * A convenience method for emitting an arbitrary control event.
  //  *
  //  * @returns the `eventId` of the emitted event
  //  */
  // emitEvent<T extends IControlEvent = IControlEvent & { [key: string]: any }>(
  //   event: Partial<Pick<T, 'source' | 'noEmit' | 'meta'>> &
  //     Omit<T, 'source' | 'noEmit' | 'meta'> & {
  //       type: string;
  //     },
  //   options?: IControlEventOptions
  // ): void;
}

// this `isEqual` implementation is adapted from the `fast-deep-equal` library
export function isEqual<T>(a: T, b: T): boolean;
export function isEqual(a: unknown, b: unknown): boolean;
export function isEqual(a: any, b: any) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    if (a.constructor !== b.constructor) return false;

    let length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0; ) if (!isEqual(a[i], b[i])) return false;
      return true;
    }

    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false;
      for (i of a.entries()) if (!b.has(i[0])) return false;
      for (i of a.entries()) if (!isEqual(i[1], b.get(i[0]))) return false;
      return true;
    }

    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      for (i of a.entries()) if (!b.has(i[0])) return false;
      return true;
    }

    if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
      length = (a as any).length;
      if (length != (b as any).length) return false;
      for (i = length; i-- !== 0; )
        if ((a as any)[i] !== (b as any)[i]) return false;
      return true;
    }

    if (a.constructor === RegExp)
      return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf)
      return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString)
      return a.toString() === b.toString();

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    const isControl = AbstractControl.isControl(a);
    const omit = isControl && [
      'events',
      '_source',
      'id',
      '_parent',
      '_validator',
    ];

    for (i = length; i-- !== 0; ) {
      var key = keys[i];

      if (
        !(isControl && (omit as string[]).includes(key)) &&
        !isEqual(a[key], b[key])
      ) {
        return false;
      }
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a !== a && b !== b;
}

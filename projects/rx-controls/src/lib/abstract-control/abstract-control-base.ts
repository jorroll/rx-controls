import type {
  ValidatorFn,
  ValidationErrors,
  ControlId,
  IControlEvent,
  IControlEventOptions,
  IControlValidationEvent,
  IControlFocusEvent,
  IControlStateChangeEvent,
  IProcessedEvent,
} from './abstract-control';
import { AbstractControl } from './abstract-control';
import { Observable, of, queueScheduler, Subject } from 'rxjs';
import { getSimpleStateChangeEventArgs, getSortedChanges } from '../util';
import {
  map,
  filter,
  startWith,
  distinctUntilChanged,
  skip,
  shareReplay,
  observeOn,
} from 'rxjs/operators';

export const CONTROL_SELF_ID = '__CONTROL_SELF_ID';

export type INormControlEventOptions = Omit<
  IControlEventOptions,
  'debugPath'
> & {
  debugPath: Exclude<IControlEventOptions['debugPath'], undefined>;
};

export interface IAbstractControlBaseArgs<Data = any> {
  data?: Data;
  id?: ControlId;
  disabled?: boolean;
  touched?: boolean;
  dirty?: boolean;
  readonly?: boolean;
  submitted?: boolean;
  errors?: null | ValidationErrors | ReadonlyMap<ControlId, ValidationErrors>;
  validators?:
    | null
    | ValidatorFn
    | ValidatorFn[]
    | ReadonlyMap<ControlId, ValidatorFn>;
  pending?: boolean | ReadonlySet<ControlId>;
}

export function composeValidators(
  validators: undefined | null | ValidatorFn | ValidatorFn[]
): null | ValidatorFn {
  if (!validators || (Array.isArray(validators) && validators.length === 0)) {
    return null;
  }

  if (Array.isArray(validators)) {
    return (control) =>
      validators.reduce((prev: ValidationErrors | null, curr: ValidatorFn) => {
        const errors = curr(control);
        return errors ? { ...prev, ...errors } : prev;
      }, null);
  }

  return validators;
}

export abstract class AbstractControlBase<RawValue, Data, Value>
  implements AbstractControl<RawValue, Data, Value>
{
  static readonly PUBLIC_PROPERTIES =
    AbstractControl.PUBLIC_PROPERTIES as readonly string[];
  static readonly PUBLIC_PROPERTIES_INDEX =
    AbstractControl._PUBLIC_PROPERTIES_INDEX;

  id: ControlId;

  data!: Data;

  protected _source = new Subject<
    IControlEvent | (IControlEvent & { [key: string]: unknown })
  >();

  events = this._source.asObservable();

  abstract readonly value: Value;

  protected _rawValue!: RawValue;
  get rawValue() {
    return this._rawValue as RawValue;
  }

  get enabled() {
    return this.selfEnabled;
  }
  get disabled() {
    return this.selfDisabled;
  }

  protected _selfDisabled = false;
  get selfEnabled() {
    return !this._selfDisabled;
  }
  get selfDisabled() {
    return this._selfDisabled;
  }

  get touched() {
    return this.selfTouched;
  }

  protected _selfTouched = false;
  get selfTouched() {
    return this._selfTouched;
  }

  get dirty() {
    return this.selfDirty;
  }

  protected _selfDirty = false;
  get selfDirty() {
    return this._selfDirty;
  }

  get readonly() {
    return this.selfReadonly;
  }

  protected _selfReadonly = false;
  get selfReadonly() {
    return this._selfReadonly;
  }

  get submitted() {
    return this.selfSubmitted;
  }

  protected _selfSubmitted = false;
  get selfSubmitted() {
    return this._selfSubmitted;
  }

  get errors() {
    return this.selfErrors;
  }

  protected _selfErrors: ValidationErrors | null = null;
  get selfErrors() {
    return this._selfErrors;
  }

  protected _errorsStore: ReadonlyMap<ControlId, ValidationErrors> = new Map<
    ControlId,
    ValidationErrors
  >();
  get errorsStore() {
    return this._errorsStore;
  }

  protected _validator: ValidatorFn | null = null;
  get validator() {
    return this._validator;
  }

  protected _validatorStore: ReadonlyMap<ControlId, ValidatorFn> = new Map<
    ControlId,
    ValidatorFn
  >();
  get validatorStore() {
    return this._validatorStore;
  }

  get pending() {
    return this.selfPending;
  }

  protected _selfPending = false;
  get selfPending() {
    return this._selfPending;
  }

  protected _pendingStore: ReadonlySet<ControlId> = new Set<ControlId>();
  get pendingStore() {
    return this._pendingStore;
  }

  get valid() {
    return this.selfValid;
  }
  get invalid() {
    return this.selfInvalid;
  }

  get selfValid() {
    return !this.selfErrors;
  }
  get selfInvalid() {
    return !!this.selfErrors;
  }

  protected _status: 'DISABLED' | 'PENDING' | 'VALID' | 'INVALID' = 'VALID';
  get status() {
    return this._status;
  }

  protected _parent: AbstractControl | null = null;
  get parent() {
    return this._parent;
  }

  constructor(controlId: ControlId) {
    // need to provide ControlId in constructor otherwise
    // initial errors will have incorrect source ID
    this.id = controlId;

    if (AbstractControl.debugCallback) {
      AbstractControl.debugCallback.call(this, {
        type: `DEBUG`,
        debugPath: 'constructor',
        source: controlId,
        controlId,
        meta: {},
      });
    }
  }

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
    options?: { ignoreNoObserve?: boolean }
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
  observe(
    a: string | string[],
    b?: string | { ignoreNoObserve?: boolean },
    c?: string | { ignoreNoObserve?: boolean },
    d?: string | { ignoreNoObserve?: boolean },
    e?: string | { ignoreNoObserve?: boolean },
    f?: string | { ignoreNoObserve?: boolean },
    g?: string | { ignoreNoObserve?: boolean },
    h?: string | { ignoreNoObserve?: boolean },
    i?: string | { ignoreNoObserve?: boolean },
    j?: string | { ignoreNoObserve?: boolean },
    k?: string | { ignoreNoObserve?: boolean },
    o?: { ignoreNoObserve?: boolean }
  ) {
    const props: string[] = [];

    if (Array.isArray(a)) {
      props.push(...a);
    } else {
      props.push(a);
    }

    const args = [b, c, d, e, f, g, h, i, j, k, o].filter(
      (v) => v !== undefined
    );

    const options =
      typeof args[args.length - 1] === 'object'
        ? (args.pop() as { ignoreNoObserve?: boolean })
        : {};

    props.push(...(args as string[]));

    return this.events.pipe(
      observeOn(queueScheduler),
      filter(
        (event) =>
          event.type === 'StateChange' &&
          (options.ignoreNoObserve || !event.noObserve)
      ),
      startWith({}),
      map(() =>
        props.reduce((prev, curr) => {
          if (typeof prev === 'object' && curr in prev) {
            return prev[curr];
          }

          return undefined;
        }, this as any)
      ),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

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
  observeChanges(...args: [any, ...any[]]) {
    return this.observe(...args).pipe(skip(1));
  }

  _setParent(
    value: AbstractControl | null,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    if (this._parent === value) return [];

    this._parent = value;
    const changedProps: Array<keyof this & string> = ['parent'];

    if (!options?.[AbstractControl.NO_EVENT]) {
      this._emitEvent<IControlStateChangeEvent>(
        getSimpleStateChangeEventArgs(this, changedProps),
        this._normalizeOptions('setParent', options)
      );
    }

    return changedProps;
  }

  setValue(
    rawValue: RawValue,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    if (AbstractControl._isEqual(this._rawValue, rawValue)) return [];

    const normOptions = this._normalizeOptions('setValue', options);

    this._rawValue = rawValue;
    const changedProps: Array<keyof this & string> = [
      'rawValue',
      'value',
      ...this._validate(normOptions),
    ];

    if (!options?.[AbstractControl.NO_EVENT]) {
      this._emitEvent<IControlStateChangeEvent>(
        getSimpleStateChangeEventArgs(this, changedProps),
        normOptions
      );
    }

    return changedProps;
  }

  setErrors(
    value: ValidationErrors | null | ReadonlyMap<ControlId, ValidationErrors>,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    const source = options?.source || CONTROL_SELF_ID;

    let newValue: Map<ControlId, ValidationErrors>;

    if (value instanceof Map) {
      newValue = value;
    } else if (value === null || Object.keys(value).length === 0) {
      newValue = new Map(this._errorsStore);
      newValue.delete(source);
    } else {
      newValue = new Map(this._errorsStore).set(source, value);
    }

    if (AbstractControl._isEqual(this._errorsStore, newValue)) return [];

    this._errorsStore = newValue;

    const changedProps: Array<keyof this & string> = [
      'errorsStore',
      ...this._calculateErrors(),
    ];

    if (!options?.[AbstractControl.NO_EVENT]) {
      this._emitEvent<IControlStateChangeEvent>(
        getSimpleStateChangeEventArgs(this, changedProps),
        this._normalizeOptions('setErrors', options)
      );
    }

    return changedProps;
  }

  patchErrors(
    value: ValidationErrors | ReadonlyMap<ControlId, ValidationErrors>,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    const source = options?.source || CONTROL_SELF_ID;

    let newValue: Map<ControlId, ValidationErrors>;

    if (value instanceof Map) {
      if (value.size === 0) return [];

      newValue = new Map<ControlId, ValidationErrors>([
        ...this._errorsStore,
        ...value,
      ]);
    } else {
      if (Object.keys(value).length === 0) return [];

      let newErrors: ValidationErrors = value;

      let existingValue = this._errorsStore.get(source);

      if (existingValue) {
        existingValue = { ...existingValue };

        for (const [key, err] of Object.entries(newErrors)) {
          if (err === null) {
            delete existingValue![key];
          } else {
            existingValue![key] = err;
          }
        }

        newErrors = existingValue;
      } else {
        const entries = Object.entries(newErrors).filter(([, v]) => v !== null);

        if (entries.length === 0) return [];

        newErrors = Object.fromEntries(entries);
      }

      newValue = new Map(this._errorsStore);

      if (Object.keys(newErrors).length === 0) {
        newValue.delete(source);
      } else {
        newValue.set(source, newErrors);
      }
    }

    if (AbstractControl._isEqual(this._errorsStore, newValue)) return [];

    this._errorsStore = newValue;

    const changedProps: Array<keyof this & string> = [
      'errorsStore',
      ...this._calculateErrors(),
    ];

    if (!options?.[AbstractControl.NO_EVENT]) {
      this._emitEvent<IControlStateChangeEvent>(
        getSimpleStateChangeEventArgs(this, changedProps),
        this._normalizeOptions('patchErrors', options)
      );
    }

    return changedProps;
  }

  markTouched(
    value: boolean,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    if (AbstractControl._isEqual(this._selfTouched, value)) return [];

    const oldTouched = this.touched;
    const changedProps: Array<keyof this & string> = ['selfTouched'];

    this._selfTouched = value;

    if (!AbstractControl._isEqual(oldTouched, this.touched)) {
      changedProps.push('touched');
    }

    if (!options?.[AbstractControl.NO_EVENT]) {
      this._emitEvent<IControlStateChangeEvent>(
        getSimpleStateChangeEventArgs(this, changedProps),
        this._normalizeOptions('markTouched', options)
      );
    }

    return changedProps;
  }

  markDirty(
    value: boolean,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    if (AbstractControl._isEqual(this._selfDirty, value)) return [];

    const oldDirty = this.dirty;
    const changedProps: Array<keyof this & string> = ['selfDirty'];

    this._selfDirty = value;

    if (!AbstractControl._isEqual(oldDirty, this.dirty)) {
      changedProps.push('dirty');
    }

    if (!options?.[AbstractControl.NO_EVENT]) {
      this._emitEvent<IControlStateChangeEvent>(
        getSimpleStateChangeEventArgs(this, changedProps),
        this._normalizeOptions('markDirty', options)
      );
    }

    return changedProps;
  }

  markReadonly(
    value: boolean,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    if (AbstractControl._isEqual(this._selfReadonly, value)) return [];

    const oldReadonly = this.readonly;
    const changedProps: Array<keyof this & string> = ['selfReadonly'];

    this._selfReadonly = value;

    if (!AbstractControl._isEqual(oldReadonly, this.readonly)) {
      changedProps.push('readonly');
    }

    if (!options?.[AbstractControl.NO_EVENT]) {
      this._emitEvent<IControlStateChangeEvent>(
        getSimpleStateChangeEventArgs(this, changedProps),
        this._normalizeOptions('markReadonly', options)
      );
    }

    return changedProps;
  }

  markDisabled(
    value: boolean,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    if (AbstractControl._isEqual(this._selfDisabled, value)) return [];

    const oldDisabled = this.disabled;
    const oldStatus = this.status;
    const changedProps: Array<keyof this & string> = [
      'selfDisabled',
      'selfEnabled',
    ];

    this._selfDisabled = value;

    if (!AbstractControl._isEqual(oldDisabled, this.disabled)) {
      changedProps.push('disabled', 'enabled');
    }

    this._status = this._getControlStatus();

    if (!AbstractControl._isEqual(oldStatus, this.status)) {
      changedProps.push('status');
    }

    if (!options?.[AbstractControl.NO_EVENT]) {
      this._emitEvent<IControlStateChangeEvent>(
        getSimpleStateChangeEventArgs(this, changedProps),
        this._normalizeOptions('markDisabled', options)
      );
    }

    return changedProps;
  }

  markSubmitted(
    value: boolean,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    if (AbstractControl._isEqual(this._selfSubmitted, value)) return [];

    const oldSubmitted = this.submitted;
    const changedProps: Array<keyof this & string> = ['selfSubmitted'];

    this._selfSubmitted = value;

    if (!AbstractControl._isEqual(oldSubmitted, this.submitted)) {
      changedProps.push('submitted');
    }

    if (!options?.[AbstractControl.NO_EVENT]) {
      this._emitEvent<IControlStateChangeEvent>(
        getSimpleStateChangeEventArgs(this, changedProps),
        this._normalizeOptions('markSubmitted', options)
      );
    }

    return changedProps;
  }

  markPending(
    value: boolean | ReadonlySet<ControlId>,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    const source = options?.source || CONTROL_SELF_ID;

    let newValue: Set<ControlId>;

    if (value instanceof Set) {
      newValue = value;
    } else if (value) {
      newValue = new Set(this._pendingStore).add(source);
    } else {
      newValue = new Set(this._pendingStore);
      newValue.delete(source);
    }

    if (AbstractControl._isEqual(this._pendingStore, newValue)) return [];

    const oldPending = this.pending;
    const oldSelfPending = this._selfPending;
    const oldStatus = this._status;
    const changedProps: Array<keyof this & string> = ['pendingStore'];

    this._pendingStore = newValue;
    this._selfPending = newValue.size > 0;
    this._status = this._getControlStatus();

    if (!AbstractControl._isEqual(oldSelfPending, this._selfPending)) {
      changedProps.push('selfPending');
    }

    if (!AbstractControl._isEqual(oldPending, this.pending)) {
      changedProps.push('pending');
    }

    if (!AbstractControl._isEqual(oldStatus, this._status)) {
      changedProps.push('status');
    }

    if (!options?.[AbstractControl.NO_EVENT]) {
      this._emitEvent<IControlStateChangeEvent>(
        getSimpleStateChangeEventArgs(this, changedProps),
        this._normalizeOptions('markPending', options)
      );
    }

    return changedProps;
  }

  setValidators(
    value:
      | ValidatorFn
      | ValidatorFn[]
      | ReadonlyMap<ControlId, ValidatorFn>
      | null,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    const source = options?.source || CONTROL_SELF_ID;

    let newValue: Map<ControlId, ValidatorFn>;

    if (value instanceof Map) {
      newValue = value;
    } else {
      newValue = new Map(this._validatorStore);

      const newValidator = composeValidators(
        value as Exclude<typeof value, ReadonlyMap<any, any>>
      );

      if (newValidator) {
        newValue.set(source, newValidator);
      } else {
        newValue.delete(source);
      }
    }

    if (AbstractControl._isEqual(this._validatorStore, newValue)) return [];

    this._validatorStore = newValue;
    const oldErrorsStore = this._errorsStore;
    const changedProps: Array<keyof this & string> = [
      'validatorStore',
      'validator',
    ];

    if (this._validatorStore.size === 0) {
      this._validator = null;

      if (this._errorsStore.has(CONTROL_SELF_ID)) {
        const errorsStore = new Map(this._errorsStore);
        errorsStore.delete(CONTROL_SELF_ID);
        this._errorsStore = errorsStore;
      }
    } else {
      const validators = Array.from(this._validatorStore.values());

      this._validator = (control) => {
        const e = validators.reduce<ValidationErrors>((err, v) => {
          return { ...err, ...v(control) };
        }, {});

        return Object.keys(e).length === 0 ? null : e;
      };

      const errors = this._validator(this);
      const errorsStore = new Map(this._errorsStore);

      if (errors) {
        errorsStore.set(CONTROL_SELF_ID, errors);
      } else {
        errorsStore.delete(CONTROL_SELF_ID);
      }

      this._errorsStore = errorsStore;
    }

    if (!AbstractControl._isEqual(this._errorsStore, oldErrorsStore)) {
      changedProps.push('errorsStore');
      changedProps.push(...this._calculateErrors());
    }

    if (!options?.[AbstractControl.NO_EVENT]) {
      this._emitEvent<IControlStateChangeEvent>(
        getSimpleStateChangeEventArgs(this, changedProps),
        this._normalizeOptions('setValidators', options)
      );
    }

    return changedProps;
  }

  setData(
    data: Data,
    options?: IControlEventOptions
  ): Array<keyof this & string> {
    if (Object.is(this.data, data)) return [];

    this.data = data;

    const changedProps: Array<keyof this & string> = ['data'];

    if (!options?.[AbstractControl.NO_EVENT]) {
      this._emitEvent<IControlStateChangeEvent>(
        getSimpleStateChangeEventArgs(this, changedProps),
        this._normalizeOptions('setData', options)
      );
    }

    return changedProps;
  }

  [AbstractControl.INTERFACE]() {
    return this;
  }

  focus(focus = true, options?: Omit<IControlEventOptions, 'noObserve'>) {
    this._emitEvent<IControlFocusEvent>(
      { type: 'Focus', focus },
      this._normalizeOptions('focus', options)
    );
  }

  replayState(
    options?: IControlEventOptions
  ): Observable<IControlStateChangeEvent> {
    const event: IControlStateChangeEvent = {
      type: 'StateChange',
      source: this.id,
      controlId: this.id,
      meta: {},
      ...this._normalizeOptions('replayState', options),
      // the order of these changes matters
      changes: Object.fromEntries(
        (this.constructor as any).PUBLIC_PROPERTIES.map(
          (p: string & keyof this) => [p, this[p]]
        )
      ),
    };

    // replay state should not include the "parent" prop
    delete (event.changes as any).parent;

    return of(event);
  }

  clone(options?: IControlEventOptions): this {
    const control: this = new (this.constructor as any)();

    this.replayState(this._normalizeOptions('clone', options)).subscribe((e) =>
      control.processEvent(e)
    );

    return control;
  }

  processEvent<T extends IControlEvent>(
    event: T,
    options?: IControlEventOptions
  ): IProcessedEvent<T> {
    // const source = options?.source || event.source;
    const _options = this._normalizeOptions('processEvent', {
      ...event,
      ...options,
    });

    let processedEvent: IProcessedEvent;

    switch (event.type) {
      case 'StateChange': {
        processedEvent = this._processEvent_StateChange(
          event as unknown as IControlStateChangeEvent,
          _options
        );
        break;
      }
      case 'ValidationStart':
      case 'AsyncValidationStart':
      case 'Focus': {
        processedEvent =
          event.controlId !== this.id
            ? { status: 'PROCESSED' }
            : {
                status: 'PROCESSED',
                result: this._prepareEventForEmit(event, _options),
              };

        break;
      }
      default: {
        processedEvent = { status: 'UNKNOWN' };
        break;
      }
    }

    if (processedEvent.result && !_options[AbstractControl.NO_EVENT]) {
      this._emitEvent(processedEvent.result, _options);
    }

    return processedEvent as IProcessedEvent<T>;
  }

  protected _validate(
    options: INormControlEventOptions
  ): Array<keyof this & string> {
    const changedProps: Array<keyof this & string> = [];

    if (this._validator) {
      const oldErrorsStore = this._errorsStore;
      const errors = this._validator(this);

      if (errors) {
        this._errorsStore = new Map([
          ...this._errorsStore,
          [CONTROL_SELF_ID, errors],
        ]);
      } else if (this._errorsStore.has(CONTROL_SELF_ID)) {
        const errorsStore = new Map(this._errorsStore);
        errorsStore.delete(CONTROL_SELF_ID);
        this._errorsStore = errorsStore;
      }

      if (!AbstractControl._isEqual(oldErrorsStore, this._errorsStore)) {
        changedProps.push('errorsStore');
        changedProps.push(...this._calculateErrors());
      }
    }

    if (!options[AbstractControl?.NO_EVENT]) {
      this._emitValidationEvents(options);
    }

    return changedProps;
  }

  protected _emitValidationEvents(options: INormControlEventOptions) {
    this._emitEvent<IControlValidationEvent<RawValue, Value>>(
      {
        type: 'ValidationStart',
        rawValue: this.rawValue,
        value: this.value,
      },
      options
    );

    this._emitEvent<IControlValidationEvent<RawValue, Value>>(
      {
        type: 'AsyncValidationStart',
        rawValue: this.rawValue,
        value: this.value,
      },
      options
    );
  }

  protected _prepareEventForEmit<T extends IControlEvent>(
    event: Partial<
      Pick<T, 'source' | 'noObserve' | 'meta' | 'debugPath' | 'controlId'>
    > &
      Omit<T, 'source' | 'noObserve' | 'meta' | 'debugPath' | 'controlId'> & {
        type: string;
      },
    options: INormControlEventOptions
  ): T {
    const newEvent: IControlEvent = {
      source: this.id,
      meta: {},
      ...event,
      ...options,
      controlId: this.id,
    };

    return newEvent as T;
  }

  /**
   * A convenience method for emitting an arbitrary control event.
   */
  protected _emitEvent<T extends IControlEvent>(
    event: Partial<
      Pick<T, 'source' | 'noObserve' | 'meta' | 'debugPath' | 'controlId'>
    > &
      Omit<T, 'source' | 'noObserve' | 'meta' | 'debugPath' | 'controlId'> & {
        type: string;
      },
    options: INormControlEventOptions
  ) {
    if (options[AbstractControl.NO_EVENT]) {
      throw new Error('tried to emit NO_EVENT');
    }

    const normEvent = this._prepareEventForEmit(event, options);

    if (AbstractControl.debugCallback) {
      AbstractControl.debugCallback.call(this, normEvent);
    }

    this._source.next(normEvent);
  }

  protected _normalizeOptions(
    triggerLabel: string,
    o?: IControlEventOptions
  ): INormControlEventOptions {
    const options: INormControlEventOptions = {
      debugPath:
        (o?.debugPath ? `${o.debugPath} > ` : '') +
        `${this.id.toString()}.${triggerLabel}`,
    };

    if (!o) return options;
    if (o.source) options.source = o.source;
    if (o.meta) options.meta = o.meta;
    if (o.noObserve) options.noObserve = o.noObserve;
    if (o[AbstractControl.NO_EVENT]) {
      options[AbstractControl.NO_EVENT] = o[AbstractControl.NO_EVENT];
    }

    return options;
  }

  protected _processEvent_StateChange(
    event: IControlStateChangeEvent,
    options: INormControlEventOptions
  ): IProcessedEvent {
    const _options: IControlEventOptions = {
      ...event,
      ...options,
      [AbstractControl.NO_EVENT]: true,
    };

    const changes: Array<keyof this & string> = getSortedChanges(
      (this.constructor as any).PUBLIC_PROPERTIES_INDEX,
      event.changes
    ).flatMap(([prop, value]: [string, any]): Array<keyof this & string> => {
      return this._processIndividualStateChange(_options, prop, value);
    });

    if (changes.length === 0) return { status: 'PROCESSED' };

    const processedEvent: IProcessedEvent<IControlStateChangeEvent> = {
      status: 'PROCESSED',
      result: this._prepareEventForEmit<IControlStateChangeEvent>(
        {
          ...event,
          type: 'StateChange',
          changes: Object.fromEntries(
            Array.from(new Set(changes)).map((p) => [p, this[p]])
          ),
        },
        options
      ),
    };

    if (
      !options[AbstractControl.NO_EVENT] &&
      processedEvent.result!.changes.value !== undefined
    ) {
      this._emitValidationEvents(options);
    }

    return processedEvent;
  }

  protected _processIndividualStateChange(
    options: IControlEventOptions,
    prop: string,
    value: any
  ): Array<keyof this & string> {
    switch (prop) {
      case 'rawValue': {
        return this.setValue(value, options);
      }
      case 'selfDisabled': {
        return this.markDisabled(value, options);
      }
      case 'selfTouched': {
        return this.markTouched(value, options);
      }
      case 'selfDirty': {
        return this.markDirty(value, options);
      }
      case 'selfReadonly': {
        return this.markReadonly(value, options);
      }
      case 'selfSubmitted': {
        return this.markSubmitted(value, options);
      }
      case 'errorsStore': {
        return this.setErrors(value, options);
      }
      case 'validatorStore': {
        return this.setValidators(value, options);
      }
      case 'pendingStore': {
        return this.markPending(value, options);
      }
      case 'parent': {
        return this._setParent(value, options);
      }
      case 'data': {
        return this.setData(value, options);
      }
    }

    return [];
  }

  protected _calculateErrors(): Array<keyof this & string> {
    const changedProps: Array<keyof this & string> = [];
    const oldInvalid = this.invalid;

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

    changedProps.push('selfErrors', 'errors');

    if (oldInvalid !== this.invalid) {
      changedProps.push('valid', 'selfValid', 'invalid', 'selfInvalid');
    }

    const newStatus = this._getControlStatus();

    if (newStatus !== this._status) {
      changedProps.push('status');
      this._status = newStatus;
    }

    return changedProps;
  }

  protected _getControlStatus() {
    if (this.disabled) return 'DISABLED';
    if (this.pending) return 'PENDING';
    if (this.invalid) return 'INVALID';
    return 'VALID';
  }
}

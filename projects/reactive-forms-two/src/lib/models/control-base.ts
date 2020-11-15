import {
  AbstractControl,
  ControlId,
  ControlSource,
  IControlEventArgs,
  IControlEventOptions,
  IControlEvent,
  ValidatorFn,
  IStateChange,
  IControlValidationEvent,
} from './abstract-control';
import {
  defer,
  from,
  merge,
  Observable,
  of,
  queueScheduler,
  Subscriber,
  Subscription,
} from 'rxjs';
import { pluckOptions, isTruthy, isEqual } from './util';
import {
  map,
  take,
  filter,
  share,
  finalize,
  startWith,
  distinctUntilChanged,
  skip,
  shareReplay,
  tap,
} from 'rxjs/operators';
import { ValidationErrors } from '@angular/forms';

export interface IControlStateChange<V> {
  value?: IStateChange<V>;
  errorsStore?: IStateChange<ReadonlyMap<ControlId, ValidationErrors>>;
  parent?: IStateChange<AbstractControl | null>;
  // enabled?: IStateChange<boolean>;
  validatorStore?: IStateChange<ReadonlyMap<ControlId, ValidatorFn>>;
  registeredValidators?: IStateChange<ReadonlySet<ControlId>>;
  registeredAsyncValidators?: IStateChange<ReadonlySet<ControlId>>;
  runningValidation?: IStateChange<ReadonlySet<ControlId>>;
  runningAsyncValidation?: IStateChange<ReadonlySet<ControlId>>;
  [key: string]: unknown;
}

export interface IControlStateChangeEvent<V> extends IControlEvent {
  type: 'StateChange';
  change: IControlStateChange<V>;
  sideEffects: string[]; // array of other props that have changed;
}

export interface IControlBaseArgs<Data = any> {
  data?: Data;
  id?: ControlId;
  // disabled?: boolean;
  errors?: null | ValidationErrors | ReadonlyMap<ControlId, ValidationErrors>;
  // parent?: null | AbstractControl;
  // validator?: null | ValidatorFn | ReadonlyMap<ControlId, ValidatorFn>;
}

export interface IProcessStateChangeFnArgs<Value> {
  event: IControlStateChangeEvent<Value>;
  changeType: string;
  changes?: {
    change: IControlStateChange<Value>;
    sideEffects: string[];
  };
}

export type IProcessStateChangeFnReturn<Value> =
  | IProcessStateChangeFnArgs<Value> // returned when a state change happens
  | null // returned when the function
  | undefined;

function replacer(key: string, value: unknown) {
  if (
    value instanceof Subscriber ||
    value instanceof Subscription ||
    value instanceof Observable
  ) {
    return value.constructor.name;
  } else if (key === '_parent' && AbstractControl.isAbstractControl(value)) {
    return value.constructor.name;
  } else if (typeof value === 'symbol') {
    return value.toString();
  } else if (typeof value === 'function') {
    return value.toString();
  }

  return value;
}

let errorEventLog: IControlEvent[] = [];

export abstract class ControlBase<Value = any, Data = any>
  implements AbstractControl<Value, Data> {
  id: ControlId;

  data!: Data;

  source = new ControlSource<
    IControlEvent | (IControlEvent & { [key: string]: unknown })
  >();

  events: Observable<
    IControlEvent | (IControlEvent & { [key: string]: unknown })
  > = this.source.pipe(
    map((event) => {
      // Here we provide the user with an error message in case of an
      // infinite loop
      if (event.eventId - event.idOfOriginatingEvent > 90) {
        errorEventLog.push(event);

        if (event.eventId - event.idOfOriginatingEvent > 100) {
          const message =
            `AbstractControl "${this.id.toString()}" appears to be caught ` +
            `in an infinite event loop. Most recent 10 events: ` +
            JSON.stringify(errorEventLog, replacer, 4);

          errorEventLog = [];

          throw new Error(message);
        }
      }

      if (Number.isInteger(event.delay)) {
        if (event.delay! > 0) {
          this.emitEvent({ ...event, delay: event.delay! - 1 });
          return null;
        }

        delete event.delay;
      }

      return this.processEvent(event);
    }),
    filter(isTruthy),
    share()
  );

  protected _parent: AbstractControl | null = null;
  get parent() {
    return this._parent;
  }

  protected _value!: Value;
  get value() {
    return this._value as Value;
  }

  protected _errors: ValidationErrors | null = null;
  get errors() {
    return this._errors;
  }

  protected _errorsStore: ReadonlyMap<ControlId, ValidationErrors> = new Map<
    ControlId,
    ValidationErrors
  >();
  get errorsStore() {
    return this._errorsStore;
  }

  protected _validatorStore: ReadonlyMap<ControlId, ValidatorFn> = new Map<
    ControlId,
    ValidatorFn
  >();
  get validatorStore() {
    return this._validatorStore;
  }

  protected _validator: ValidatorFn | null = null;
  get validator() {
    return this._validator;
  }

  protected _registeredValidators: ReadonlySet<ControlId> = new Set<
    ControlId
  >();
  protected _runningValidation: ReadonlySet<ControlId> = new Set<ControlId>();
  protected _registeredAsyncValidators: ReadonlySet<ControlId> = new Set<
    ControlId
  >();
  protected _runningAsyncValidation: ReadonlySet<ControlId> = new Set<
    ControlId
  >();

  protected _pendingStore: ReadonlyMap<ControlId, boolean> = new Map<
    ControlId,
    boolean
  >();
  get pendingStore() {
    return this._pendingStore;
  }

  protected _pending = false;
  get pending() {
    return this._pending;
  }

  protected _enabled = true;
  get enabled() {
    return this._enabled;
  }
  get disabled() {
    return !this._enabled;
  }

  constructor(controlId: ControlId) {
    // need to maintain one subscription for the events to process
    this.events.subscribe();

    // need to provide ControlId in constructor otherwise
    // initial errors will have incorrect source ID
    this.id = controlId;
    // this.data = options.data as Data;

    // this.setValue(value!);

    // if (options.errors) {
    //   this.setErrors(options.errors);
    // }

    // if (options.parent) {
    //   this.setParent(options.parent);
    // }
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
  observe(
    a: string | string[],
    b?: string | { ignoreNoEmit?: boolean },
    c?: string | { ignoreNoEmit?: boolean },
    d?: string | { ignoreNoEmit?: boolean },
    e?: string | { ignoreNoEmit?: boolean },
    f?: string | { ignoreNoEmit?: boolean },
    g?: string | { ignoreNoEmit?: boolean },
    h?: string | { ignoreNoEmit?: boolean },
    i?: string | { ignoreNoEmit?: boolean },
    j?: string | { ignoreNoEmit?: boolean },
    k?: string | { ignoreNoEmit?: boolean },
    o?: { ignoreNoEmit?: boolean }
  ) {
    const props: string[] = [];

    if (Array.isArray(a)) {
      props.push(...a);
    } else {
      props.push(a);
    }

    const args = [b, c, d, e, f, g, h, i, j, k, o].filter((v) => !!v);

    const options =
      typeof args[args.length - 1] === 'object'
        ? (args.pop() as { ignoreNoEmit?: boolean })
        : {};

    props.push(...(args as string[]));

    // if we're subscribing to the "value" prop, we want to
    // wait until after synchronous validation has completed
    const eventFilterFn =
      props[props.length - 1] === 'value'
        ? (event: IControlEvent) =>
            event.type === 'AsyncValidationStart' &&
            (options.ignoreNoEmit || !event.noEmit)
        : (event: IControlEvent) =>
            event.type === 'StateChange' &&
            (options.ignoreNoEmit || !event.noEmit);

    return this.events.pipe(
      filter(eventFilterFn),
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
  observeChanges(...args: [any, ...any[]]) {
    return this.observe(...args).pipe(skip(1));
  }

  setParent(value: AbstractControl | null, options?: IControlEventOptions) {
    this.emitEvent<IControlStateChangeEvent<Value>>(
      {
        type: 'StateChange',
        change: {
          parent: () => value,
        },
        sideEffects: [],
      },
      options
    );
  }

  setValue(value: Value, options?: IControlEventOptions) {
    this.emitEvent<IControlStateChangeEvent<Value>>(
      {
        type: 'StateChange',
        change: {
          value: () => value,
        },
        sideEffects: [],
      },
      options
    );
  }

  setErrors(
    value: ValidationErrors | null | ReadonlyMap<ControlId, ValidationErrors>,
    options?: IControlEventOptions
  ) {
    const source = options?.source || this.id;

    let changeFn: IControlStateChange<Value>['errorsStore'];

    if (value instanceof Map) {
      changeFn = () => value;
    } else if (value === null) {
      changeFn = (old: ReadonlyMap<ControlId, ValidationErrors>) => {
        const errorsStore = new Map(old);
        errorsStore.delete(source);
        return errorsStore;
      };
    } else {
      changeFn = (old: ReadonlyMap<ControlId, ValidationErrors>) => {
        const errorsStore = new Map(old);
        return errorsStore.set(source, value);
      };
    }

    this.emitEvent<IControlStateChangeEvent<Value>>(
      {
        type: 'StateChange',
        change: {
          errorsStore: changeFn,
        },
        sideEffects: [],
      },
      options
    );
  }

  patchErrors(
    value: ValidationErrors | ReadonlyMap<ControlId, ValidationErrors>,
    options?: IControlEventOptions
  ) {
    const source = options?.source || this.id;

    let changeFn: IControlStateChange<Value>['errorsStore'];

    if (value instanceof Map) {
      changeFn = (old: ReadonlyMap<ControlId, ValidationErrors>) => {
        return new Map<ControlId, ValidationErrors>([...old, ...value]);
      };
    } else {
      changeFn = (old: ReadonlyMap<ControlId, ValidationErrors>) => {
        let newValue: ValidationErrors = value;

        if (Object.entries(newValue).length === 0) return old;

        let existingValue = old.get(source);

        if (existingValue) {
          existingValue = { ...existingValue };

          for (const [key, err] of Object.entries(newValue)) {
            if (err === null) {
              delete existingValue![key];
            } else {
              existingValue![key] = err;
            }
          }

          newValue = existingValue;
        }

        return new Map(old).set(source, newValue);
      };
    }

    this.emitEvent<IControlStateChangeEvent<Value>>(
      {
        type: 'StateChange',
        change: {
          errorsStore: changeFn,
        },
        sideEffects: [],
      },
      options
    );
  }

  validationService(
    source: ControlId,
    options?: IControlEventOptions
  ): Observable<
    IControlValidationEvent<Value> & {
      type: 'ValidationStart';
    }
  > {
    return defer(() => {
      this.emitEvent<IControlStateChangeEvent<Value>>(
        {
          type: 'StateChange',
          change: {
            registeredValidators: (old) => {
              return new Set(old).add(source);
            },
          },
          sideEffects: [],
        },
        options
      );

      return this.events;
    }).pipe(
      filter(
        ((e) => e.type === 'ValidationStart') as (
          e: IControlEvent
        ) => e is IControlValidationEvent<Value> & {
          type: 'ValidationStart';
        }
      ),
      finalize(() => {
        this.emitEvent<IControlStateChangeEvent<Value>>(
          {
            type: 'StateChange',
            change: {
              registeredValidators: (old) => {
                const newValue = new Set(old);
                newValue.delete(source);
                return newValue;
              },
            },
            sideEffects: [],
          },
          options
        );
      }),
      share()
    );
  }

  markValidationComplete(
    source: ControlId,
    options?: IControlEventOptions
  ): void {
    this.emitEvent<IControlStateChangeEvent<Value>>(
      {
        type: 'StateChange',
        change: {
          runningValidation: (old) => {
            const newValue = new Set(old);
            newValue.delete(source);
            return newValue;
          },
        },
        sideEffects: [],
      },
      options
    );
  }

  asyncValidationService(
    source: ControlId,
    options?: IControlEventOptions
  ): Observable<
    IControlValidationEvent<Value> & {
      type: 'AsyncValidationStart';
    }
  > {
    return defer(() => {
      this.emitEvent<IControlStateChangeEvent<Value>>(
        {
          type: 'StateChange',
          change: {
            registeredAsyncValidators: (old) => {
              return new Set(old).add(source);
            },
          },
          sideEffects: [],
        },
        options
      );

      return this.events;
    }).pipe(
      filter(
        ((e) => e.type === 'AsyncValidationStart') as (
          e: IControlEvent
        ) => e is IControlValidationEvent<Value> & {
          type: 'AsyncValidationStart';
        }
      ),
      finalize(() => {
        this.emitEvent<IControlStateChangeEvent<Value>>(
          {
            type: 'StateChange',
            change: {
              registeredAsyncValidators: (old: ReadonlySet<ControlId>) => {
                const newValue = new Set(old);
                newValue.delete(source);
                return newValue;
              },
            },
            sideEffects: [],
          },
          options
        );
      }),
      share()
    );
  }

  markAsyncValidationComplete(
    source: ControlId,
    options?: IControlEventOptions
  ): void {
    this.emitEvent<IControlStateChangeEvent<Value>>(
      {
        type: 'StateChange',
        change: {
          runningAsyncValidation: (old: ReadonlySet<ControlId>) => {
            const newValue = new Set(old);
            newValue.delete(source);
            return newValue;
          },
        },
        sideEffects: [],
      },
      options
    );
  }

  [AbstractControl.INTERFACE]() {
    return this;
  }

  replayState(
    options: Omit<IControlEventOptions, 'idOfOriginatingEvent'> = {}
  ): Observable<IControlStateChangeEvent<Value>> {
    const value = this._value;
    const errorsStore = this._errorsStore;
    const parent = this._parent;
    const validatorStore = this._validatorStore;

    const changes: Array<IControlStateChange<Value>> = [
      {
        value: () => value,
      },
      {
        errorsStore: () => errorsStore,
      },
      {
        parent: () => parent,
      },
      {
        validatorStore: () => validatorStore,
      },
    ];

    let eventId: number;

    return from(
      changes.map<IControlStateChangeEvent<Value>>((change) => ({
        source: this.id,
        meta: {},
        ...pluckOptions(options),
        eventId: eventId = AbstractControl.eventId(),
        idOfOriginatingEvent: eventId,
        type: 'StateChange',
        change,
        sideEffects: [],
      }))
    );
  }

  abstract clone(): ControlBase<Value, Data>;

  /**
   * A convenience method for emitting an arbitrary control event.
   */
  emitEvent<
    T extends IControlEventArgs = IControlEventArgs & { [key: string]: unknown }
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
  ): void {
    const normEvent = {
      ...pluckOptions(options),
      ...event,
      eventId: AbstractControl.eventId(),
    };

    if (!normEvent.source) normEvent.source = this.id;
    if (!normEvent.meta) normEvent.meta = {};
    if (!normEvent.idOfOriginatingEvent) {
      normEvent.idOfOriginatingEvent = normEvent.eventId;
    }

    this.source.next(normEvent as IControlEvent);
  }

  protected runValidation(options?: IControlEventOptions): string[] {
    const sideEffects: string[] = [];

    if (this._validator) {
      sideEffects.push('errorsStore');

      const errors = this._validator(this);

      if (errors) {
        this._errorsStore = new Map([...this._errorsStore, [this.id, errors]]);
      } else if (this._errorsStore.has(this.id)) {
        const errorsStore = new Map(this._errorsStore);
        errorsStore.delete(this.id);
        this._errorsStore = errorsStore;
      }
    }

    if (this._registeredValidators.size > 0) {
      this._runningValidation = new Set([
        ...this._runningValidation,
        ...this._registeredValidators,
      ]);

      this.emitEvent(
        {
          type: 'ValidationStart',
          value: this.value,
        },
        options
      );
    } else if (this._registeredAsyncValidators.size > 0) {
      this._runningAsyncValidation = new Set([
        ...this._runningAsyncValidation,
        ...this._registeredAsyncValidators,
      ]);

      this.emitEvent(
        {
          type: 'AsyncValidationStart',
          value: this.value,
        },
        options
      );
    } else {
      // This is needed so that subscribers can consistently detect when
      // synchronous validation is complete
      this.emitEvent(
        {
          type: 'AsyncValidationStart',
          value: this.value,
        },
        options
      );

      this.emitEvent(
        {
          type: 'ValidationComplete',
          value: this.value,
        },
        options
      );
    }

    return sideEffects;
  }

  protected processEvent(
    event: IControlEvent
  ): IControlEvent | null | undefined {
    switch (event.type) {
      case 'StateChange': {
        return this.processEvent_StateChange(
          event as IControlStateChangeEvent<Value>
        );
      }
      case 'ValidationStart':
      case 'AsyncValidationStart':
      case 'ValidationComplete': {
        if (event.source !== this.id) return null;
        return event;
      }
      default: {
        return;
      }
    }
  }

  protected processEvent_StateChange(
    event: IControlStateChangeEvent<Value>
  ): IControlEvent | null {
    const keys = Object.keys(event.change);

    if (keys.length !== 1) {
      throw new Error(
        `You can only provide a single change per state change event`
      );
    }

    return (
      this.processStateChange({
        event,
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
  protected processStateChange(
    args: IProcessStateChangeFnArgs<Value>
  ): IControlEvent | null | undefined {
    switch (args.changeType) {
      case 'value': {
        return this.processStateChange_Value(args);
      }
      case 'parent': {
        return this.processStateChange_Parent(args);
      }
      case 'errorsStore': {
        return this.processStateChange_ErrorsStore(args);
      }
      case 'validatorStore': {
        return this.processStateChange_ValidatorStore(args);
      }
      case 'registeredValidators': {
        return this.processStateChange_RegisteredValidators(args);
      }
      case 'registeredAsyncValidators': {
        return this.processStateChange_RegisteredAsyncValidators(args);
      }
      case 'runningValidation': {
        return this.processStateChange_RunningValidation(args);
      }
      case 'runningAsyncValidation': {
        return this.processStateChange_RunningAsyncValidation(args);
      }
      default: {
        return;
      }
    }
  }

  protected processStateChange_Value(
    args: IProcessStateChangeFnArgs<Value>
  ): IControlStateChangeEvent<this['value']> | null {
    const change = args.event.change.value as NonNullable<
      IControlStateChange<Value>['value']
    >;

    const newValue = change(this._value);

    if (isEqual(this._value, newValue)) return null;

    this._value = newValue;

    return {
      ...args.event,
      change: { value: change },
      sideEffects: this.runValidation(args.event),
    };
  }

  protected processStateChange_Parent(
    args: IProcessStateChangeFnArgs<Value>
  ): IControlStateChangeEvent<this['value']> | null {
    // ignore the parent state changes of linked controls
    if (args.event.source !== this.id) return null;

    const change = args.event.change.parent as NonNullable<
      IControlStateChange<Value>['parent']
    >;

    const newParent = change(this._parent);

    if (isEqual(this._parent, newParent)) return null;

    this._parent = newParent;

    return {
      ...args.event,
      change: { parent: change },
      sideEffects: [],
    };
  }

  protected processStateChange_ErrorsStore(
    args: IProcessStateChangeFnArgs<Value>
  ): IControlStateChangeEvent<this['value']> | null {
    const change = args.event.change.errorsStore as NonNullable<
      IControlStateChange<Value>['errorsStore']
    >;

    const newErrorsStore = change(this._errorsStore);

    if (isEqual(this._errorsStore, newErrorsStore)) return null;

    this._errorsStore = newErrorsStore;

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

    return {
      ...args.event,
      change: { errorsStore: change },
      sideEffects: ['errors'],
    };
  }

  protected processStateChange_ValidatorStore(
    args: IProcessStateChangeFnArgs<Value>
  ): IControlStateChangeEvent<this['value']> | null {
    const change = args.event.change.validatorStore as NonNullable<
      IControlStateChange<Value>['validatorStore']
    >;

    const newValidatorStore = change(this._validatorStore);

    if (isEqual(this._validatorStore, newValidatorStore)) return null;

    this._validatorStore = newValidatorStore;

    const oldErrorsStore = this._errorsStore;
    const sideEffects = ['validator', 'errorsStore'];

    if (this._validatorStore.size === 0) {
      this._validator = null;

      if (this._errorsStore.has(this.id)) {
        const errorsStore = new Map(this._errorsStore);
        errorsStore.delete(this.id);
        this._errorsStore = errorsStore;
      }
    } else {
      const validators = Array.from(this._validatorStore.values());

      this._validator = (control) => {
        const e = validators.reduce<ValidationErrors>((p, c) => {
          return { ...p, ...c(control) };
        }, {});

        return Object.keys(e).length === 0 ? null : e;
      };

      const errors = this._validator(this);
      const errorsStore = new Map(this._errorsStore);

      if (errors) {
        errorsStore.set(this.id, errors);
      } else {
        errorsStore.delete(this.id);
      }

      this._errorsStore = errorsStore;
    }

    if (this._errorsStore !== oldErrorsStore) {
      this._errors =
        this._errorsStore.size === 0
          ? null
          : Array.from(this._errorsStore.values()).reduce((prev, curr) => {
              return {
                ...prev,
                ...curr,
              };
            }, {} as ValidationErrors);

      sideEffects.push('errors');
    }

    return {
      ...args.event,
      change: { validatorStore: change },
      sideEffects,
    };
  }

  protected processStateChange_RegisteredValidators(
    args: IProcessStateChangeFnArgs<Value>
  ): IControlStateChangeEvent<this['value']> | null {
    const change = args.event.change.registeredValidators as NonNullable<
      IControlStateChange<Value>['registeredValidators']
    >;

    const newRegisteredValidators = change(this._registeredValidators);

    if (isEqual(this._registeredValidators, newRegisteredValidators)) {
      return null;
    }

    this._registeredValidators = newRegisteredValidators;
    return null;
  }

  protected processStateChange_RegisteredAsyncValidators(
    args: IProcessStateChangeFnArgs<Value>
  ): IControlStateChangeEvent<this['value']> | null {
    const change = args.event.change.registeredAsyncValidators as NonNullable<
      IControlStateChange<Value>['registeredAsyncValidators']
    >;

    const newRegisteredAsyncValidators = change(
      this._registeredAsyncValidators
    );

    if (
      isEqual(this._registeredAsyncValidators, newRegisteredAsyncValidators)
    ) {
      return null;
    }

    this._registeredAsyncValidators = newRegisteredAsyncValidators;
    return null;
  }

  protected processStateChange_RunningValidation(
    args: IProcessStateChangeFnArgs<Value>
  ): IControlStateChangeEvent<this['value']> | null {
    const change = args.event.change.runningValidation as NonNullable<
      IControlStateChange<Value>['runningValidation']
    >;

    const newRunningValidation = change(this._runningValidation);

    if (isEqual(this._runningValidation, newRunningValidation)) return null;

    const prevSize = this._runningValidation.size;

    this._runningValidation = newRunningValidation;

    const size = this._runningValidation.size;

    if (prevSize === 0 && size === 0) return null;
    else if (prevSize > 0 && size === 0) {
      if (this._registeredAsyncValidators.size > 0) {
        this._runningAsyncValidation = new Set(this._registeredAsyncValidators);
        this.emitEvent({
          type: 'AsyncValidationStart',
          value: this.value,
          idOfOriginatingEvent: args.event.idOfOriginatingEvent,
        });
      } else {
        // This is needed so that subscribers can always tell
        // when synchronous validation is complete
        this.emitEvent({
          type: 'AsyncValidationStart',
          value: this.value,
          idOfOriginatingEvent: args.event.idOfOriginatingEvent,
        });

        this.emitEvent({
          type: 'ValidationComplete',
          value: this.value,
          idOfOriginatingEvent: args.event.idOfOriginatingEvent,
        });
      }
    }

    return null;
  }

  protected processStateChange_RunningAsyncValidation(
    args: IProcessStateChangeFnArgs<Value>
  ): IControlStateChangeEvent<this['value']> | null {
    const change = args.event.change.runningAsyncValidation as NonNullable<
      IControlStateChange<Value>['runningAsyncValidation']
    >;

    const newRunningAsyncValidation = change(this._runningAsyncValidation);

    if (isEqual(this._runningAsyncValidation, newRunningAsyncValidation)) {
      return null;
    }

    const prevSize = this._runningAsyncValidation.size;

    this._runningAsyncValidation = newRunningAsyncValidation;

    const size = this._runningAsyncValidation.size;

    if (prevSize === 0 && size === 0) return null;
    else if (prevSize > 0 && size === 0) {
      this.emitEvent({
        type: 'ValidationComplete',
        value: this.value,
        idOfOriginatingEvent: args.event.idOfOriginatingEvent,
      });
    }

    return null;
  }
}

// function isControlEvent(
//   type: 'StateChange',
//   event: IControlEvent
// ): event is IControlStateChangeEvent<Value>;
// function isControlEvent(type: 'ValidationStart', event: IControlEvent): boolean;
// function isControlEvent<T extends IControlEvent['type']>(
//   type: T,
//   event: IControlEvent
// ) {
//   return type === event.type;
// }

// function isStateChange<T extends 'SET' | 'MERGE', V>(
//   type: 'value',
//   prop: string,
//   change: IStateChange<T, V>
// ): change is IStateChange<T, V>;
// function isStateChange<
//   C extends IControlStateChanges<unknown>,
//   T extends keyof C
// >(type: T, prop: string, change: IStateChange): change is Required<C>[T];
// function isStateChange<T extends keyof IControlStateChanges>(
//   type: T,
//   prop: string,
//   change: IStateChange
// ): change is Required<IControlStateChanges>[T] {
//   return prop === type;
// }

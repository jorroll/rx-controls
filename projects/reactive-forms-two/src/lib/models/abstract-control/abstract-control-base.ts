import {
  AbstractControl,
  ControlSource,
  ValidatorFn,
  ValidationErrors,
  ControlId,
  IControlEvent,
  IControlEventOptions,
  IControlStateChange,
  IControlValidationEvent,
  IControlEventArgs,
  IControlFocusEvent,
  IControlSelfStateChangeEvent,
  IControlStateChangeEvent,
} from './abstract-control';
import {
  defer,
  from,
  Observable,
  queueScheduler,
  Subscriber,
  Subscription,
} from 'rxjs';
import { pluckOptions, isTruthy, getSimpleStateChangeEventArgs } from '../util';
import {
  map,
  filter,
  share,
  finalize,
  startWith,
  distinctUntilChanged,
  skip,
  shareReplay,
} from 'rxjs/operators';
import { isEqual } from '../../util';

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

// function replacer(key: string, value: unknown) {
//   if (
//     value instanceof Subscriber ||
//     value instanceof Subscription ||
//     value instanceof Observable
//   ) {
//     return value.constructor.name;
//   } else if (key === '_parent' && AbstractControl.isControl(value)) {
//     return value.constructor.name;
//   } else if (typeof value === 'symbol') {
//     return value.toString();
//   } else if (typeof value === 'function') {
//     return value.toString();
//   }

//   return value;
// }

export abstract class AbstractControlBase<RawValue, Data, Value>
  implements AbstractControl<RawValue, Data, Value> {
  id: ControlId;

  data!: Data;

  source = new ControlSource();

  events: Observable<
    IControlEvent | (IControlEvent & { [key: string]: unknown })
  > = this.source.pipe(
    map((event) => {
      if (AbstractControl.debugCallback) {
        AbstractControl.debugCallback.call(this, {
          type: 'INPUT',
          event,
        });
      }

      // Here we provide the user with an error message in case of an
      // infinite loop
      if (event.eventId - event.idOfOriginatingEvent > 500) {
        throw new Error(
          `AbstractControl "${this.id.toString()}" appears to be caught ` +
            `in an infinite event loop. You can register a debugCallback ` +
            `with AbstractControl.debugCallback to help diagnose the issue.`
        );
      }

      const newEvent = this.processEvent(event);

      if (typeof (event as any)?.onEventProcessedFn === 'function') {
        queueScheduler.schedule((event as any).onEventProcessedFn, 0, newEvent);
        delete (newEvent as any)?.onEventProcessedFn;
      }

      if (AbstractControl.debugCallback) {
        AbstractControl.debugCallback.call(this, {
          type: 'OUTPUT',
          event: newEvent,
        });
      }

      return newEvent;
    }),
    filter(isTruthy),
    share()
  );

  abstract readonly value: Value;

  protected _rawValue!: RawValue;
  get rawValue() {
    return this._rawValue as RawValue;
  }

  protected _disabled = false;
  get enabled() {
    return !this._disabled;
  }
  get disabled() {
    return this._disabled;
  }

  protected _touched = false;
  get touched() {
    return this._touched;
  }

  protected _dirty = false;
  get dirty() {
    return this._dirty;
  }

  protected _readonly = false;
  get readonly() {
    return this._readonly;
  }

  protected _submitted = false;
  get submitted() {
    return this._submitted;
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

  protected _registeredValidators: ReadonlySet<ControlId> = new Set<ControlId>();
  protected _runningValidation: ReadonlySet<ControlId> = new Set<ControlId>();
  protected _registeredAsyncValidators: ReadonlySet<ControlId> = new Set<ControlId>();
  protected _runningAsyncValidation: ReadonlySet<ControlId> = new Set<ControlId>();

  protected _pending = false;
  get pending() {
    return this._pending;
  }

  protected _pendingStore: ReadonlySet<ControlId> = new Set<ControlId>();
  get pendingStore() {
    return this._pendingStore;
  }

  get valid() {
    return !this.errors;
  }
  get invalid() {
    return !!this.errors;
  }

  protected _status: 'DISABLED' | 'PENDING' | 'VALID' | 'INVALID' = 'VALID';
  get status() {
    return this._status;
  }

  protected _parent: AbstractControl | null = null;
  get parent() {
    return this._parent;
  }

  // get parentContainerDisabled() {
  //   if (!this.parent) return false;

  //   return (
  //     (this.parent as any).containerDisabled ||
  //     this.parent.parentContainerDisabled
  //   );
  // }

  // get parentContainerTouched() {
  //   if (!this.parent) return false;

  //   return (
  //     (this.parent as any).containerTouched ||
  //     this.parent.parentContainerTouched
  //   );
  // }

  // get parentContainerDirty() {
  //   if (!this.parent) return false;

  //   return (
  //     (this.parent as any).containerDirty || this.parent.parentContainerDirty
  //   );
  // }

  // get parentContainerReadonly() {
  //   if (!this.parent) return false;

  //   return (
  //     (this.parent as any).containerReadonly ||
  //     this.parent.parentContainerReadonly
  //   );
  // }

  // get parentContainerSubmitted() {
  //   if (!this.parent) return false;

  //   return (
  //     (this.parent as any).containerSubmitted ||
  //     this.parent.parentContainerSubmitted
  //   );
  // }

  constructor(controlId: ControlId) {
    // need to maintain one subscription for the events to process
    this.events.subscribe();

    // need to provide ControlId in constructor otherwise
    // initial errors will have incorrect source ID
    this.id = controlId;
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
      props[props.length - 1] === 'value' ||
      props[props.length - 1] === 'rawValue'
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
    this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
      getSimpleStateChangeEventArgs({ parent: () => value }),
      options
    );
  }

  setValue(rawValue: RawValue, options?: IControlEventOptions) {
    this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
      getSimpleStateChangeEventArgs({ rawValue: () => rawValue }),
      options
    );
  }

  setErrors(
    value: ValidationErrors | null | ReadonlyMap<ControlId, ValidationErrors>,
    options?: IControlEventOptions
  ) {
    const source = options?.source || this.id;

    let changeFn: IControlStateChange<RawValue, Data>['errorsStore'];

    if (value instanceof Map) {
      changeFn = () => value;
    } else if (value === null || Object.keys(value).length === 0) {
      changeFn = (old) => {
        const errorsStore = new Map(old);
        errorsStore.delete(source);
        return errorsStore;
      };
    } else {
      changeFn = (old) => new Map(old).set(source, value);
    }

    this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
      getSimpleStateChangeEventArgs({ errorsStore: changeFn }),
      options
    );
  }

  patchErrors(
    value: ValidationErrors | ReadonlyMap<ControlId, ValidationErrors>,
    options?: IControlEventOptions
  ) {
    const source = options?.source || this.id;

    let changeFn: IControlStateChange<RawValue, Data>['errorsStore'];

    if (value instanceof Map) {
      if (value.size === 0) return;

      changeFn = (old) =>
        new Map<ControlId, ValidationErrors>([...old, ...value]);
    } else {
      if (Object.keys(value).length === 0) return;

      changeFn = (old) => {
        let newValue: ValidationErrors = value;

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
        } else {
          const entries = Object.entries(newValue).filter(
            ([, v]) => v !== null
          );

          if (entries.length === 0) return old;

          newValue = Object.fromEntries(entries);
        }

        const errorsStore = new Map(old);

        if (Object.keys(newValue).length === 0) {
          errorsStore.delete(source);
        } else {
          errorsStore.set(source, newValue);
        }

        return errorsStore;
      };
    }

    this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
      getSimpleStateChangeEventArgs({ errorsStore: changeFn }),
      options
    );
  }

  markTouched(value: boolean, options?: IControlEventOptions) {
    this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
      getSimpleStateChangeEventArgs({ touched: () => value }),
      options
    );
  }

  markDirty(value: boolean, options?: IControlEventOptions) {
    this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
      getSimpleStateChangeEventArgs({ dirty: () => value }),
      options
    );
  }

  markReadonly(value: boolean, options?: IControlEventOptions) {
    this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
      getSimpleStateChangeEventArgs({ readonly: () => value }),
      options
    );
  }

  markDisabled(value: boolean, options?: IControlEventOptions) {
    this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
      getSimpleStateChangeEventArgs({ disabled: () => value }),
      options
    );
  }

  markSubmitted(value: boolean, options?: IControlEventOptions) {
    this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
      getSimpleStateChangeEventArgs({ submitted: () => value }),
      options
    );
  }

  markPending(
    value: boolean | ReadonlySet<ControlId>,
    options?: IControlEventOptions
  ) {
    const source = options?.source || this.id;

    let changeFn: IControlStateChange<RawValue, Data>['pendingStore'];

    if (value instanceof Set) {
      changeFn = () => value;
    } else if (value) {
      changeFn = (old) => new Set(old).add(source);
    } else {
      changeFn = (old) => {
        const pendingStore = new Set(old);
        pendingStore.delete(source);
        return pendingStore;
      };
    }

    this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
      getSimpleStateChangeEventArgs({ pendingStore: changeFn }),
      options
    );
  }

  setValidators(
    value:
      | ValidatorFn
      | ValidatorFn[]
      | ReadonlyMap<ControlId, ValidatorFn>
      | null,
    options?: IControlEventOptions
  ) {
    const source = options?.source || this.id;

    let changeFn: IControlStateChange<RawValue, Data>['validatorStore'];

    if (value instanceof Map) {
      changeFn = () => value as ReadonlyMap<ControlId, ValidatorFn>;
    } else {
      const newValue = composeValidators(
        value as Exclude<typeof value, ReadonlyMap<any, any>>
      );

      if (newValue) {
        changeFn = (old) => new Map(old).set(source, newValue);
      } else {
        changeFn = (old) => {
          const validatorStore = new Map(old);
          validatorStore.delete(source);
          return validatorStore;
        };
      }
    }

    this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
      getSimpleStateChangeEventArgs({ validatorStore: changeFn }),
      options
    );
  }

  validationService(
    source: ControlId,
    options?: IControlEventOptions
  ): Observable<
    IControlValidationEvent<RawValue> & {
      type: 'ValidationStart';
    }
  > {
    return defer(() => {
      this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
        getSimpleStateChangeEventArgs({
          registeredValidators: (old) => {
            return new Set(old).add(source);
          },
        }),
        options
      );

      return this.events;
    }).pipe(
      filter(
        ((e) => e.type === 'ValidationStart') as (
          e: IControlEvent
        ) => e is IControlValidationEvent<RawValue> & {
          type: 'ValidationStart';
        }
      ),
      finalize(() => {
        this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
          getSimpleStateChangeEventArgs({
            registeredValidators: (old) => {
              const newValue = new Set(old);
              newValue.delete(source);
              return newValue;
            },
          }),
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
    this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
      getSimpleStateChangeEventArgs({
        runningValidation: (old) => {
          const newValue = new Set(old);
          newValue.delete(source);
          return newValue;
        },
      }),
      options
    );
  }

  asyncValidationService(
    source: ControlId,
    options?: IControlEventOptions
  ): Observable<
    IControlValidationEvent<RawValue> & {
      type: 'AsyncValidationStart';
    }
  > {
    return defer(() => {
      this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
        getSimpleStateChangeEventArgs({
          registeredAsyncValidators: (old) => {
            return new Set(old).add(source);
          },
        }),
        options
      );

      return this.events;
    }).pipe(
      filter(
        ((e) => e.type === 'AsyncValidationStart') as (
          e: IControlEvent
        ) => e is IControlValidationEvent<RawValue> & {
          type: 'AsyncValidationStart';
        }
      ),
      finalize(() => {
        this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
          getSimpleStateChangeEventArgs({
            registeredAsyncValidators: (old: ReadonlySet<ControlId>) => {
              const newValue = new Set(old);
              newValue.delete(source);
              return newValue;
            },
          }),
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
    this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
      getSimpleStateChangeEventArgs({
        runningAsyncValidation: (old: ReadonlySet<ControlId>) => {
          const newValue = new Set(old);
          newValue.delete(source);
          return newValue;
        },
      }),
      options
    );
  }

  setData(data: Data | ((data: Data) => Data), options?: IControlEventOptions) {
    this.emitEvent<IControlSelfStateChangeEvent<RawValue, Data>>(
      getSimpleStateChangeEventArgs({
        data:
          typeof data === 'function'
            ? (data as (data: Data) => Data)
            : () => data as Data,
      }),
      options
    );
  }

  [AbstractControl.INTERFACE]() {
    return this;
  }

  focus(focus = true, options?: Omit<IControlEventOptions, 'noEmit'>) {
    this.emitEvent<IControlFocusEvent>({ type: 'Focus', focus }, options);
  }

  replayState(
    options: Omit<IControlEventOptions, 'idOfOriginatingEvent'> = {}
  ): Observable<IControlSelfStateChangeEvent<RawValue, Data>> {
    const {
      _rawValue,
      _disabled,
      _touched,
      _dirty,
      _readonly,
      _submitted,
      _validatorStore,
      _errorsStore,
      _pendingStore,
      data,
    } = this;

    const changes: Array<{
      change: IControlStateChange<RawValue, Data>;
      changedProps: string[];
    }> = [
      {
        change: { rawValue: () => _rawValue },
        changedProps: ['value', 'rawValue'],
      },
      {
        change: { disabled: () => _disabled },
        changedProps: ['disabled', 'enabled'],
      },
      { change: { touched: () => _touched }, changedProps: ['touched'] },
      { change: { dirty: () => _dirty }, changedProps: ['dirty'] },
      { change: { readonly: () => _readonly }, changedProps: ['readonly'] },
      { change: { submitted: () => _submitted }, changedProps: ['submitted'] },
      { change: { data: () => data }, changedProps: ['data'] },
      {
        change: { validatorStore: () => _validatorStore },
        changedProps: ['validatorStore'],
      },
      {
        change: { pendingStore: () => _pendingStore },
        changedProps: ['pendingStore'],
      },
      // important for errorsStore to come at the end because otherwise
      // the value/validatorStore state change would overwrite the errors
      {
        change: { errorsStore: () => _errorsStore },
        changedProps: ['errorsStore'],
      },
    ];

    let eventId: number;

    return from(
      changes.map<IControlSelfStateChangeEvent<RawValue, Data>>((change) => ({
        source: this.id,
        meta: {},
        ...pluckOptions(options),
        eventId: (eventId = AbstractControl.eventId()),
        idOfOriginatingEvent: eventId,
        type: 'StateChange',
        subtype: 'Self',
        ...change,
      }))
    );
  }

  clone(): this {
    const control = new (this.constructor as any)();
    this.replayState().subscribe(control.source);
    return control;
  }

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
  ): number {
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

    return normEvent.eventId;
  }

  protected runValidation(_options?: IControlEventOptions): string[] {
    const changedProps: string[] = [];
    const options = { ..._options, source: this.id };

    if (this._validator) {
      const oldErrorsStore = this._errorsStore;
      const errors = this._validator(this);

      if (errors) {
        this._errorsStore = new Map([...this._errorsStore, [this.id, errors]]);
      } else if (this._errorsStore.has(this.id)) {
        const errorsStore = new Map(this._errorsStore);
        errorsStore.delete(this.id);
        this._errorsStore = errorsStore;
      }

      if (!isEqual(oldErrorsStore, this._errorsStore)) {
        changedProps.push('errorsStore');

        this.updateErrorsProp(changedProps);
      }
    }

    if (this._registeredValidators.size > 0) {
      this._runningValidation = new Set([
        ...this._runningValidation,
        ...this._registeredValidators,
      ]);

      this.emitEvent<IControlValidationEvent<RawValue>>(
        {
          type: 'ValidationStart',
          rawValue: this.rawValue,
        },
        options
      );
    } else if (this._registeredAsyncValidators.size > 0) {
      this._runningAsyncValidation = new Set([
        ...this._runningAsyncValidation,
        ...this._registeredAsyncValidators,
      ]);

      this.emitEvent<IControlValidationEvent<RawValue>>(
        {
          type: 'AsyncValidationStart',
          rawValue: this.rawValue,
        },
        options
      );
    } else {
      // This is needed so that subscribers can consistently detect when
      // synchronous validation is complete
      this.emitEvent<IControlValidationEvent<RawValue>>(
        {
          type: 'AsyncValidationStart',
          rawValue: this.rawValue,
        },
        options
      );

      this.emitEvent<IControlValidationEvent<RawValue>>(
        {
          type: 'ValidationComplete',
          rawValue: this.rawValue,
        },
        options
      );
    }

    return changedProps;
  }

  protected processEvent(
    event: IControlEvent
  ): IControlEvent | null | undefined {
    switch (event.type) {
      case 'StateChange': {
        return this.processEvent_StateChange(
          event as IControlSelfStateChangeEvent<RawValue, Data>
        );
      }
      case 'ValidationStart':
      case 'AsyncValidationStart':
      case 'ValidationComplete':
      case 'Focus': {
        if (event.source !== this.id) return null;
        return event;
      }
      default: {
        return;
      }
    }
  }

  protected processEvent_StateChange(
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlEvent | null {
    const keys = Object.keys(event.change);

    if (keys.length !== 1) {
      throw new Error(
        `You can only provide a single change per state change event`
      );
    }

    return this.processStateChange(keys[0], event);
  }

  protected processStateChange(
    changeType: string,
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlEvent | null {
    switch (changeType) {
      case 'rawValue': {
        return this.processStateChange_RawValue(event);
      }
      case 'disabled': {
        return this.processStateChange_Disabled(event);
      }
      case 'touched': {
        return this.processStateChange_Touched(event);
      }
      case 'dirty': {
        return this.processStateChange_Dirty(event);
      }
      case 'readonly': {
        return this.processStateChange_Readonly(event);
      }
      case 'submitted': {
        return this.processStateChange_Submitted(event);
      }
      case 'errorsStore': {
        return this.processStateChange_ErrorsStore(event);
      }
      case 'validatorStore': {
        return this.processStateChange_ValidatorStore(event);
      }
      case 'registeredValidators': {
        return this.processStateChange_RegisteredValidators(event);
      }
      case 'registeredAsyncValidators': {
        return this.processStateChange_RegisteredAsyncValidators(event);
      }
      case 'runningValidation': {
        return this.processStateChange_RunningValidation(event);
      }
      case 'runningAsyncValidation': {
        return this.processStateChange_RunningAsyncValidation(event);
      }
      case 'pendingStore': {
        return this.processStateChange_PendingStore(event);
      }
      case 'parent': {
        return this.processStateChange_Parent(event);
      }
      case 'data': {
        return this.processStateChange_Data(event);
      }
      default: {
        return null;
      }
    }
  }

  protected processStateChange_RawValue(
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlStateChangeEvent | null {
    const change = event.change.rawValue as NonNullable<
      IControlStateChange<RawValue, Data>['rawValue']
    >;

    const newValue = change(this._rawValue);

    if (isEqual(this._rawValue, newValue)) return null;

    this._rawValue = newValue;

    const newEvent: IControlSelfStateChangeEvent<RawValue, Data> = {
      ...event,
      change: { rawValue: change },
      changedProps: ['value', 'rawValue', ...this.runValidation(event)],
    };

    return newEvent;
  }

  protected processStateChange_Disabled(
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlStateChangeEvent | null {
    const change = event.change.disabled as NonNullable<
      IControlStateChange<RawValue, Data>['disabled']
    >;

    const newDisabled = change(this._disabled);

    if (isEqual(this._disabled, newDisabled)) return null;

    this._disabled = newDisabled;
    this._status = this.getControlStatus();

    const newEvent: IControlSelfStateChangeEvent<RawValue, Data> = {
      ...event,
      change: { disabled: change },
      changedProps: ['disabled', 'enabled', 'status'],
    };

    return newEvent;
  }

  protected processStateChange_Touched(
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlStateChangeEvent | null {
    const change = event.change.touched as NonNullable<
      IControlStateChange<RawValue, Data>['touched']
    >;

    const newTouched = change(this._touched);

    if (isEqual(this._touched, newTouched)) return null;

    this._touched = newTouched;

    const newEvent: IControlSelfStateChangeEvent<RawValue, Data> = {
      ...event,
      change: { touched: change },
      changedProps: ['touched'],
    };

    return newEvent;
  }

  protected processStateChange_Dirty(
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlStateChangeEvent | null {
    const change = event.change.dirty as NonNullable<
      IControlStateChange<RawValue, Data>['dirty']
    >;

    const newDirty = change(this._dirty);

    if (isEqual(this._dirty, newDirty)) return null;

    this._dirty = newDirty;

    const newEvent: IControlSelfStateChangeEvent<RawValue, Data> = {
      ...event,
      change: { dirty: change },
      changedProps: ['dirty'],
    };

    return newEvent;
  }

  protected processStateChange_Readonly(
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlStateChangeEvent | null {
    const change = event.change.readonly as NonNullable<
      IControlStateChange<RawValue, Data>['readonly']
    >;

    const newReadonly = change(this._readonly);

    if (isEqual(this._readonly, newReadonly)) return null;

    this._readonly = newReadonly;

    const newEvent: IControlSelfStateChangeEvent<RawValue, Data> = {
      ...event,
      change: { readonly: change },
      changedProps: ['readonly'],
    };

    return newEvent;
  }

  protected processStateChange_Submitted(
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlStateChangeEvent | null {
    const change = event.change.submitted as NonNullable<
      IControlStateChange<RawValue, Data>['submitted']
    >;

    const newSubmitted = change(this._submitted);

    if (isEqual(this._submitted, newSubmitted)) return null;

    this._submitted = newSubmitted;

    const newEvent: IControlSelfStateChangeEvent<RawValue, Data> = {
      ...event,
      change: { submitted: change },
      changedProps: ['submitted'],
    };

    return newEvent;
  }

  protected processStateChange_ErrorsStore(
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlStateChangeEvent | null {
    const change = event.change.errorsStore as NonNullable<
      IControlStateChange<RawValue, Data>['errorsStore']
    >;

    const newErrorsStore = change(this._errorsStore);

    if (isEqual(this._errorsStore, newErrorsStore)) return null;

    this._errorsStore = newErrorsStore;

    const changedProps = ['errorsStore'];

    this.updateErrorsProp(changedProps);

    const newEvent: IControlSelfStateChangeEvent<RawValue, Data> = {
      ...event,
      change: { errorsStore: change },
      changedProps,
    };

    return newEvent;
  }

  protected processStateChange_ValidatorStore(
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlStateChangeEvent | null {
    const change = event.change.validatorStore as NonNullable<
      IControlStateChange<RawValue, Data>['validatorStore']
    >;

    const newValidatorStore = change(this._validatorStore);

    if (isEqual(this._validatorStore, newValidatorStore)) return null;

    this._validatorStore = newValidatorStore;

    const oldErrorsStore = this._errorsStore;
    const changedProps = ['validatorStore', 'validator', 'errorsStore'];

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
      this.updateErrorsProp(changedProps);
    }

    const newEvent: IControlSelfStateChangeEvent<RawValue, Data> = {
      ...event,
      change: { validatorStore: change },
      changedProps,
    };

    return newEvent;
  }

  protected processStateChange_RegisteredValidators(
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlStateChangeEvent | null {
    const change = event.change.registeredValidators as NonNullable<
      IControlStateChange<RawValue, Data>['registeredValidators']
    >;

    const newRegisteredValidators = change(this._registeredValidators);

    if (isEqual(this._registeredValidators, newRegisteredValidators)) {
      return null;
    }

    this._registeredValidators = newRegisteredValidators;
    return null;
  }

  protected processStateChange_RegisteredAsyncValidators(
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlStateChangeEvent | null {
    const change = event.change.registeredAsyncValidators as NonNullable<
      IControlStateChange<RawValue, Data>['registeredAsyncValidators']
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
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlStateChangeEvent | null {
    const change = event.change.runningValidation as NonNullable<
      IControlStateChange<RawValue, Data>['runningValidation']
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
          value: this.rawValue,
          idOfOriginatingEvent: event.idOfOriginatingEvent,
        });
      } else {
        // This is needed so that subscribers can always tell
        // when synchronous validation is complete
        this.emitEvent({
          type: 'AsyncValidationStart',
          value: this.rawValue,
          idOfOriginatingEvent: event.idOfOriginatingEvent,
        });

        this.emitEvent({
          type: 'ValidationComplete',
          value: this.rawValue,
          idOfOriginatingEvent: event.idOfOriginatingEvent,
        });
      }
    }

    return null;
  }

  protected processStateChange_RunningAsyncValidation(
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlStateChangeEvent | null {
    const change = event.change.runningAsyncValidation as NonNullable<
      IControlStateChange<RawValue, Data>['runningAsyncValidation']
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
        value: this.rawValue,
        idOfOriginatingEvent: event.idOfOriginatingEvent,
      });
    }

    return null;
  }

  protected processStateChange_PendingStore(
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlStateChangeEvent | null {
    const change = event.change.pendingStore as NonNullable<
      IControlStateChange<RawValue, Data>['pendingStore']
    >;

    const newPendingStore = change(this._pendingStore);

    if (isEqual(this._pendingStore, newPendingStore)) return null;

    const newPending = newPendingStore.size > 0;

    const changedProps = ['pendingStore'];

    if (newPending !== this._pending) {
      changedProps.push('pending');
    }

    this._pendingStore = newPendingStore;
    this._pending = newPending;

    const newStatus = this.getControlStatus();

    if (newStatus !== this._status) {
      changedProps.push('status');
      this._status = newStatus;
    }

    const newEvent: IControlSelfStateChangeEvent<RawValue, Data> = {
      ...event,
      change: { pendingStore: change },
      changedProps,
    };

    return newEvent;
  }

  protected processStateChange_Parent(
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlStateChangeEvent | null {
    // ignore the parent state changes of linked controls
    if (event.source !== this.id) return null;

    const change = event.change.parent as NonNullable<
      IControlStateChange<RawValue, Data>['parent']
    >;

    const newParent = change(this._parent);

    if (isEqual(this._parent, newParent)) return null;

    this._parent = newParent;

    const newEvent: IControlSelfStateChangeEvent<RawValue, Data> = {
      ...event,
      change: { parent: change },
      changedProps: ['parent'],
    };

    return newEvent;
  }

  protected processStateChange_Data(
    event: IControlSelfStateChangeEvent<RawValue, Data>
  ): IControlStateChangeEvent | null {
    const change = event.change.data as NonNullable<
      IControlStateChange<RawValue, Data>['data']
    >;

    const newData = change(this.data);

    if (Number.isNaN(newData)) {
      throw new Error('Cannot use "setData" with a NaN value');
    }

    if (this.data === newData) return null;

    this.data = newData;

    const newEvent: IControlSelfStateChangeEvent<RawValue, Data> = {
      ...event,
      change: { data: change },
      changedProps: ['data'],
    };

    return newEvent;
  }

  protected updateErrorsProp(changedProps: string[]) {
    const oldInvalid = this.invalid;

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

    changedProps.push('errors');

    if (oldInvalid !== this.invalid) {
      changedProps.push('valid', 'invalid');
    }

    const newStatus = this.getControlStatus();

    if (newStatus !== this._status) {
      changedProps.push('status');
      this._status = newStatus;
    }
  }

  protected getControlStatus() {
    if (this.disabled) return 'DISABLED';
    if (this.pending) return 'PENDING';
    if (this.invalid) return 'INVALID';
    return 'VALID';
  }
}

// function isControlEvent(
//   type: 'StateChange',
//   event: IControlEvent
// ): event is IControlStateChangeEvent<Value, Data>;
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

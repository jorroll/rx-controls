import {
  AbstractControl,
  ControlId,
  ControlSource,
  IControlEventArgs,
  IControlEventOptions,
  IControlEvent,
  ValidatorFn,
  IStateChange,
} from './abstract-control';
import { defer, from, merge, Observable, of, queueScheduler } from 'rxjs';
import { pluckOptions, isTruthy, isMapEqual } from './util';
import { map, take, filter, share, finalize } from 'rxjs/operators';
import { ValidationErrors } from '@angular/forms';

// export type ControlBaseValue<T> = T extends ControlBase<infer V, any> ? V : any;
// export type ControlBaseData<T> = T extends ControlBase<any, infer D> ? D : any;

// export interface IControlStateChanges<V> {
//   value?: IStateChange<V>;
//   errorsStore?: IStateChange<ReadonlyMap<ControlId, ValidationErrors>>;
//   parent?: IStateChange<AbstractControl | null>;
//   // enabled?: IStateChange<boolean>;
//   validatorStore?: IStateChange<ReadonlyMap<ControlId, ValidatorFn>>;
//   registeredValidators?: IStateChange<ReadonlySet<ControlId>>;
//   registeredAsyncValidators?: IStateChange<ReadonlySet<ControlId>>;
//   runningValidation?: IStateChange<ReadonlySet<ControlId>>;
//   runningAsyncValidation?: IStateChange<ReadonlySet<ControlId>>;
// }

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

export interface IControlValidationEvent<V> extends IControlEvent {
  type: 'ValidationStart' | 'AsyncValidationStart' | 'ValidationComplete';
  value: V;
}

export interface IControlBaseArgs<Data = any> {
  data?: Data;
  id?: ControlId;
  disabled?: boolean;
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

export abstract class ControlBase<Value = any, Data = any>
  implements AbstractControl<Value, Data> {
  id: ControlId;

  data: Data;

  source = new ControlSource<
    IControlEvent | (IControlEvent & { [key: string]: unknown })
  >();

  events = this.source.pipe(
    map((event) => {
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

  protected _value: Value;
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

  constructor(
    controlId: ControlId,
    value?: Value,
    options: IControlBaseArgs<Data> = {}
  ) {
    // need to maintain one subscription for the events to process
    this.events.subscribe();

    // need to provide ControlId in constructor otherwise
    // initial errors will have incorrect source ID
    this.id = controlId;
    this.data = options.data as Data;
    this._value = value!;
    this._enabled = !options.disabled;
  }

  setParent(value: AbstractControl | null, options?: IControlEventOptions) {
    this.emitEvent<IControlStateChangeEvent<Value>>({
      ...pluckOptions(options),
      type: 'StateChange',
      change: {
        parent: () => value,
      },
      sideEffects: [],
    });
  }

  setValue(value: Value, options?: IControlEventOptions) {
    this.emitEvent<IControlStateChangeEvent<Value>>({
      ...pluckOptions(options),
      type: 'StateChange',
      change: {
        value: () => value,
      },
      sideEffects: [],
    });
  }

  setErrors(
    value: ValidationErrors | null | ReadonlyMap<ControlId, ValidationErrors>,
    options: IControlEventOptions = {}
  ) {
    const source = options.source || this.id;

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

    this.emitEvent<IControlStateChangeEvent<Value>>({
      ...pluckOptions(options),
      type: 'StateChange',
      change: {
        errorsStore: changeFn,
      },
      sideEffects: [],
    });
  }

  patchErrors(
    value: ValidationErrors | ReadonlyMap<ControlId, ValidationErrors>,
    options: IControlEventOptions = {}
  ) {
    const source = options.source || this.id;

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

    this.emitEvent<IControlStateChangeEvent<Value>>({
      ...pluckOptions(options),
      type: 'StateChange',
      change: {
        errorsStore: changeFn,
      },
      sideEffects: [],
    });
  }

  validationService(source: ControlId, options: IControlEventOptions = {}) {
    return defer(() => {
      this.emitEvent<IControlStateChangeEvent<Value>>({
        ...pluckOptions(options),
        type: 'StateChange',
        change: {
          registeredValidators: (old) => {
            return new Set(old).add(source);
          },
        },
        sideEffects: [],
      });

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
        this.emitEvent<IControlStateChangeEvent<Value>>({
          ...pluckOptions(options),
          type: 'StateChange',
          change: {
            registeredValidators: (old) => {
              const newValue = new Set(old);
              newValue.delete(source);
              return newValue;
            },
          },
          sideEffects: [],
        });
      }),
      share()
    );
  }

  markValidationComplete(
    source: ControlId,
    options: IControlEventOptions = {}
  ) {
    this.emitEvent<IControlStateChangeEvent<Value>>({
      ...pluckOptions(options),
      type: 'StateChange',
      change: {
        runningValidation: (old) => {
          const newValue = new Set(old);
          newValue.delete(source);
          return newValue;
        },
      },
      sideEffects: [],
    });
  }

  asyncValidationService(
    source: ControlId,
    options: IControlEventOptions = {}
  ) {
    return defer(() => {
      this.emitEvent<IControlStateChangeEvent<Value>>({
        ...pluckOptions(options),
        type: 'StateChange',
        change: {
          registeredAsyncValidators: (old) => {
            return new Set(old).add(source);
          },
        },
        sideEffects: [],
      });

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
        this.emitEvent<IControlStateChangeEvent<Value>>({
          ...pluckOptions(options),
          type: 'StateChange',
          change: {
            registeredAsyncValidators: (old: ReadonlySet<ControlId>) => {
              const newValue = new Set(old);
              newValue.delete(source);
              return newValue;
            },
          },
          sideEffects: [],
        });
      }),
      share()
    );
  }

  markAsyncValidationComplete(
    source: ControlId,
    options: IControlEventOptions = {}
  ) {
    this.emitEvent<IControlStateChangeEvent<Value>>({
      ...pluckOptions(options),
      type: 'StateChange',
      change: {
        runningAsyncValidation: (old: ReadonlySet<ControlId>) => {
          const newValue = new Set(old);
          newValue.delete(source);
          return newValue;
        },
      },
      sideEffects: [],
    });
  }

  // equalValue(value: Value): value is Value {
  //   return this._value === value;
  // }

  [AbstractControl.INTERFACE]() {
    return this;
  }

  replayState(
    options: Omit<IControlEventOptions, 'eventId'> = {}
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
        eventId: eventId = AbstractControl.eventId(),
        idOfOriginatingEvent: eventId,
        source: options.source || this.id,
        type: 'StateChange',
        change,
        sideEffects: [],
        noEmit: options.noEmit,
        meta: options.meta || {},
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
    args: Partial<
      Pick<T, 'eventId' | 'source' | 'idOfOriginatingEvent' | 'noEmit' | 'meta'>
    > &
      Omit<
        T,
        'eventId' | 'source' | 'idOfOriginatingEvent' | 'noEmit' | 'meta'
      > & {
        type: string;
      }
  ): void {
    const event = { ...args };

    if (!event.source) event.source = this.id;
    if (!event.meta) event.meta = {};
    if (!event.eventId) event.eventId = AbstractControl.eventId();
    if (!event.idOfOriginatingEvent) {
      event.idOfOriginatingEvent = event.eventId;
    }

    this.source.next(event as IControlEvent);
  }

  protected runValidation(options: IControlEventOptions = {}): string[] {
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

      this.emitEvent({
        ...pluckOptions(options),
        type: 'ValidationStart',
        value: this.value,
      });
    } else if (this._registeredAsyncValidators.size > 0) {
      this._runningAsyncValidation = new Set([
        ...this._runningAsyncValidation,
        ...this._registeredAsyncValidators,
      ]);

      this.emitEvent({
        ...pluckOptions(options),
        type: 'AsyncValidationStart',
        value: this.value,
      });
    } else {
      this.emitEvent({
        ...pluckOptions(options),
        type: 'ValidationComplete',
        value: this.value,
      });
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

    this._value = change(this._value);

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

    this._parent = change(this._parent);

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

    this._errorsStore = change(this._errorsStore);

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

    this._validatorStore = change(this._validatorStore);

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

    this._registeredValidators = change(this._registeredValidators);
    return null;
  }

  protected processStateChange_RegisteredAsyncValidators(
    args: IProcessStateChangeFnArgs<Value>
  ): IControlStateChangeEvent<this['value']> | null {
    const change = args.event.change.registeredAsyncValidators as NonNullable<
      IControlStateChange<Value>['registeredAsyncValidators']
    >;

    this._registeredAsyncValidators = change(this._registeredAsyncValidators);
    return null;
  }

  protected processStateChange_RunningValidation(
    args: IProcessStateChangeFnArgs<Value>
  ): IControlStateChangeEvent<this['value']> | null {
    const change = args.event.change.runningValidation as NonNullable<
      IControlStateChange<Value>['runningValidation']
    >;

    const prevSize = this._runningValidation.size;

    this._runningValidation = change(this._runningValidation);

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

    const prevSize = this._runningAsyncValidation.size;

    this._runningAsyncValidation = change(this._runningAsyncValidation);

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

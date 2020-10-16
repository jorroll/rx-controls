import {
  AbstractControl,
  ControlId,
  ControlSource,
  IControlEventArgs,
  IControlEventOptions,
  IControlEvent,
} from './abstract-control';
import { Observable, of } from 'rxjs';
import { pluckOptions, isTruthy } from './util';
import { map, take, filter } from 'rxjs/operators';

// export type ControlBaseValue<T> = T extends ControlBase<infer V, any> ? V : any;
// export type ControlBaseData<T> = T extends ControlBase<any, infer D> ? D : any;

export interface IStateChange<V = unknown> {
  value: V;
  // changes: Array<{ type: 'SET' | 'PATCH' | 'ADD' | 'REMOVE'; value: unknown }>;
}

export interface IControlStateChanges {
  value?: IStateChange;
  parent?: IStateChange<AbstractControl | null>;
}

export interface IControlStateChangeEvent extends IControlEvent {
  type: 'StateChange';
  changes: IControlStateChanges;
}

export interface IControlBaseArgs<Data = any> {
  data?: Data;
  id?: ControlId;
  disabled?: boolean;
}

export abstract class ControlBase<Value = any, Data = any>
  implements AbstractControl<Value, Data> {
  id: ControlId;

  data: Data;

  source = new ControlSource<IControlEventArgs>();

  protected _events = new ControlSource<IControlEvent>();
  events: Observable<
    IControlEvent & { [key: string]: any }
  > = this._events.asObservable();

  protected _value: Value;
  get value() {
    return this._value as Value;
  }

  protected _parent: AbstractControl | null = null;
  get parent() {
    return this._parent;
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
    options: IControlBaseArgs<Data> = {},
  ) {
    // need to provide ControlId in constructor otherwise
    // initial errors will have incorrect source ID
    this.id = controlId;

    this.data = options.data as Data;

    // need to maintain one subscription for the
    // observable to fire and the logic to process
    this.source
      .pipe(
        map((event) => {
          if (!event.meta) event.meta = {};
          if (!event.eventId) event.eventId = AbstractControl.eventId();

          return this.processEvent(event as IControlEvent);
        }),
        filter(isTruthy),
      )
      .subscribe(this._events);

    this._value = value!;
  }

  setParent(value: AbstractControl | null, options?: IControlEventOptions) {
    this.emitEvent<IControlStateChangeEvent>({
      type: 'StateChange',
      changes: {
        parent: { value },
      },
      ...pluckOptions(options),
    });
  }

  setValue(value: Value, options?: IControlEventOptions) {
    this.emitEvent<IControlStateChangeEvent>({
      type: 'StateChange',
      changes: {
        value: { value },
      },
      ...pluckOptions(options),
    });
  }

  // patchValue(value: any, options?: IControlEventOptions) {
  //   this.setValue(value, options);
  // }

  equalValue(value: Value): value is Value {
    return this._value === value;
  }

  [AbstractControl.INTERFACE]() {
    return this;
  }

  replayState(
    options: IControlEventOptions = {},
  ): Observable<IControlStateChangeEvent> {
    return of({
      eventId: '',
      sourceControlId: options.source || this.id,
      type: 'StateChange' as const,
      changes: {
        value: {
          value: this._value,
        },
      },
      noEmit: options.noEmit,
      meta: options.meta || {},
    }).pipe(
      map((event) => {
        // we reset the processed array so that this saved
        // state change can be applied to the same control
        // multiple times
        event.eventId = AbstractControl.eventId();
        return event;
      }),
    );
  }

  abstract clone(): ControlBase<Value, Data>;

  /**
   * A convenience method for emitting an arbitrary control event.
   */
  emitEvent<
    T extends IControlEventArgs = IControlEventArgs & { [key: string]: any }
  >(
    event: Partial<
      Pick<
        T,
        'eventId' | 'sourceControlId' | 'sourceEventId' | 'noEmit' | 'meta'
      >
    > &
      Omit<
        T,
        'eventId' | 'sourceControlId' | 'sourceEventId' | 'noEmit' | 'meta'
      > & {
        type: string;
      },
  ): void {
    this.source.next({
      sourceControlId: this.id,
      ...event,
    });
  }

  protected processEvent(event: IControlEvent): IControlEvent | null {
    if (!isControlEvent('StateChange', event)) return null;

    const changes: IControlStateChanges = {};

    for (const [prop, change] of Object.entries(event.changes)) {
      this.processStateChange({
        event,
        prop,
        change,
        changes,
      });
    }

    if (Object.keys(changes).length === 0) return null;

    return {
      ...event,
      changes,
    } as IControlStateChangeEvent;
  }

  /**
   * Processes a control event. If the event is recognized by this control,
   * `processEvent()` will return `true`. Otherwise, `false` is returned.
   *
   * In general, ControlEvents should not emit additional ControlEvents
   */
  protected processStateChange({
    event,
    prop,
    change,
    changes,
  }: {
    event: IControlStateChangeEvent;
    prop: string;
    change: IStateChange;
    changes: IControlStateChanges;
  }): boolean {
    if (isStateChange<Value>('value', prop, change)) {
      if (this.equalValue(change.value)) return true;
      this._value = change.value;
      changes.value = change;
      return true;
    }

    if (isStateChange('parent', prop, change)) {
      if (this._parent === change.value) return true;
      // ignore the parent state changes of linked controls
      if (event.sourceControlId !== this.id) return true;
      this._parent = change.value;
      changes.parent = change;
      return true;
    }

    return false;
  }
}

function isControlEvent(
  type: 'StateChange',
  event: IControlEvent,
): event is IControlStateChangeEvent;
function isControlEvent<T extends IControlEvent['type']>(
  type: T,
  event: IControlEvent,
) {
  return type === event.type;
}

function isStateChange<V>(
  type: 'value',
  prop: string,
  change: IStateChange,
): change is IStateChange<V>;
function isStateChange<T extends keyof IControlStateChanges>(
  type: T,
  prop: string,
  change: IStateChange,
): change is Required<IControlStateChanges>[T];
function isStateChange<T extends keyof IControlStateChanges>(
  type: T,
  prop: string,
  change: IStateChange,
): change is Required<IControlStateChanges>[T] {
  return prop === type;
}

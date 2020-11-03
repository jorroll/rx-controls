import { Observable, Subject, queueScheduler } from 'rxjs';

export interface ValidationErrors {
  [key: string]: any;
}

export type ValidatorFn = (control: AbstractControl) => ValidationErrors | null;

export type ControlId = string | symbol;

export type IStateChange<V = unknown> = (old: V) => V;

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

// export class AsyncControlSource<T> extends ControlSource<T> {
//   asObservable() {
//     return super.asObservable().pipe(subscribeOn(asyncScheduler));
//   }
// }

export namespace AbstractControl {
  export const INTERFACE = Symbol('@@AbstractControlInterface');

  let _eventId = 0;
  export function eventId() {
    return _eventId++;
  }

  export function isAbstractControl(
    object?: unknown
  ): object is AbstractControl {
    return (
      typeof object === 'object' &&
      (object as any)?.[AbstractControl.INTERFACE]?.() === object
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
  readonly parent: AbstractControl | null;
  readonly enabled: boolean;
  readonly disabled: boolean;

  [AbstractControl.INTERFACE](): this;

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
   * properties containing `null`, errors associated with those keys are deleted
   * from the `errorsStore`.
   *
   * If provided a `Map` object containing `ValidationErrors` keyed to source IDs,
   * that object is merged with the existing `errorsStore`.
   */
  patchErrors(
    value: ValidationErrors | ReadonlyMap<ControlId, ValidationErrors>,
    options?: IControlEventOptions
  ): void;

  setParent(
    parent: AbstractControl | null,
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
      Pick<T, 'eventId' | 'source' | 'idOfOriginatingEvent' | 'noEmit' | 'meta'>
    > &
      Omit<
        T,
        'eventId' | 'source' | 'idOfOriginatingEvent' | 'noEmit' | 'meta'
      > & {
        type: string;
      }
  ): void;
}

// export interface AsyncAbstractControl<Value = any, Data = any>
//   extends AbstractControl<Value, Data> {
//   /**
//    * **Warning!** Do not use this property unless you know what you are doing.
//    *
//    * A control's `source` is the source of truth for the control. Events emitted
//    * by the source are used to update the control's values. By passing events to
//    * this control's source, you can programmatically control every aspect of
//    * of this control.
//    *
//    * Never subscribe to the source directly. If you want to receive events for
//    * this control, subscribe to the `events` observable.
//    */
//   source: AsyncControlSource<IControlEventArgs>;

//   setValue(value: Value, options?: IControlEventOptions): Promise<void>;

//   patchValue(value: any, options?: IControlEventOptions): Promise<void>;

//   clone(): AsyncAbstractControl<Value, Data>;
// }

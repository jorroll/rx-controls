import { Observable, Subject, asyncScheduler } from 'rxjs';
import { subscribeOn } from 'rxjs/operators';

// export type AbstractControlValue<T> = T extends AbstractControl<infer V>
//   ? V
//   : any;
// export type AbstractControlData<T> = T extends AbstractControl<any, infer D>
//   ? D
//   : any;

export type ControlId = string | symbol;

export interface IControlEventArgs {
  eventId?: string;
  sourceEventId?: string;
  sourceControlId: ControlId;
  type: string;
  meta?: { [key: string]: unknown };
  noEmit?: boolean;
}

export interface IControlEvent extends IControlEventArgs {
  eventId: string;
  meta: { [key: string]: unknown };
}

export interface IControlEventOptions {
  noEmit?: boolean;
  meta?: { [key: string]: unknown };
  eventId?: string;
  source?: ControlId;
  // processed?: ControlId[];
}

/**
 * ControlSource is a special rxjs Subject which never
 * completes.
 */
export class ControlSource<T> extends Subject<T> {
  /** NOOP: Complete does nothing */
  complete() {}
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
    return (_eventId++).toString();
  }

  export function isAbstractControl(
    object?: unknown,
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
  source: ControlSource<IControlEventArgs>;

  /** An observable of all events for this AbstractControl */
  events: Observable<IControlEvent & { [key: string]: unknown }>;

  readonly value: Value;
  readonly parent: AbstractControl | null;
  readonly enabled: boolean;
  readonly disabled: boolean;

  [AbstractControl.INTERFACE](): this;

  setValue(value: Value, options?: IControlEventOptions): void;
  // patchValue(value: any, options?: IControlEventOptions): void;

  setParent(
    parent: AbstractControl | null,
    options?: IControlEventOptions,
  ): void;

  /**
   * Returns an observable of this control's state in the form of
   * StateChange objects which can be used to make another control
   * identical to this one. This observable will complete upon
   * replaying the necessary state changes.
   */
  replayState(options?: IControlEventOptions): Observable<IControlEvent>;

  clone(): AbstractControl<Value, Data>;
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

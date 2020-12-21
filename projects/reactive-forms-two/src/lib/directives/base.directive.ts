import {
  OnDestroy,
  OnChanges,
  Renderer2,
  ElementRef,
  Directive,
  Input,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AbstractControl, IControlEvent, isStateChange } from '../models';
import { IControlDirectiveCallback, IControlValueMapper } from './interface';
import { ControlAccessor } from '../accessors/interface';
import {
  IControlSelfStateChangeEvent,
  IControlStateChangeEvent,
} from '../models/abstract-control/abstract-control';
import { filter } from 'rxjs/operators';

function assertEventShape(
  event: IControlStateChangeEvent,
  prop: 'rawValue' | 'parent'
): asserts event is IControlSelfStateChangeEvent<any, any> {
  if (
    event.subtype !== 'Self' ||
    !(event as IControlSelfStateChangeEvent<any, any>).change[prop]
  ) {
    // because the swFormControlValueMapper returns a `IControlSelfStateChangeEvent`
    // state change, we want to ensure that this doesn't accidently destroy a custom
    // event returned by a user. The standard FormControl only changes rawValue/parent
    // via a IControlSelfStateChangeEvent rawValue/parent event.
    throw new Error(
      `swFormControlValueMapper expects all changes to a control's ` +
        `${prop} to come from IControlSelfStateChangeEvent "${prop}" ` +
        `changes but it received a StateChange that didn't conform to this. ` +
        `Are you using a custom accessor that doesn't implement ` +
        `ControlAccessor<FormControl>?`
    );
  }
}

@Directive()
export abstract class BaseDirective<T extends AbstractControl, D = any>
  implements ControlAccessor<T>, OnChanges, OnDestroy {
  static id = 0;
  abstract readonly control: T;

  @Input('swFormDirectiveData') data: D | null = null;

  valueMapper?: IControlValueMapper;

  protected accessorValidatorId = Symbol(
    `SwDirectiveAccessorValidator-${BaseDirective.id++}`
  );

  protected abstract controlDirectiveCallbacks:
    | IControlDirectiveCallback<T>[]
    | null;

  protected onChangesSubscriptions: Subscription[] = [];
  protected subscriptions: Subscription[] = [];

  constructor(protected renderer: Renderer2, protected el: ElementRef) {}

  abstract ngOnChanges(...args: any[]): void;

  ngOnInit() {
    this.controlDirectiveCallbacks?.forEach((c) => {
      const sub = c.controlDirectiveCallback(this.control, this.data);
      if (!sub) return;
      this.subscriptions.push(sub);
    });

    // The nativeElement will be a comment if a directive is placed on
    // an `<ng-container>` element.
    if (!(this.el.nativeElement instanceof HTMLElement)) return;

    this.updateTouchedCSS();
    this.updateReadonlyCSS();
    this.updateDisabledCSS();
    this.updateInvalidCSS();
    this.updateSubmittedCSS();
    this.updateDirtyCSS();
    this.updatePendingCSS();

    this.subscriptions.push(
      this.control.events
        .pipe(filter(isStateChange))
        .subscribe((e) => this.onControlStateChange(e))
    );
  }

  ngOnDestroy() {
    this.onChangesSubscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  protected assertValidValueMapper(name: string, mapper?: IControlValueMapper) {
    if (!mapper) return;

    if (typeof mapper !== 'object') {
      throw new Error(`${name} expected an object`);
    }

    if (typeof mapper.to !== 'function') {
      throw new Error(`${name} expected to have a "to" mapper function`);
    }

    if (typeof mapper.from !== 'function') {
      throw new Error(`${name} expected to have a "from" mapper function`);
    }

    if (
      mapper.accessorValidator &&
      typeof mapper.accessorValidator !== 'function'
    ) {
      throw new Error(
        `${name} optional "accessorValidator" expected to be a function`
      );
    }
  }

  protected toAccessorEventMapFn(control: AbstractControl) {
    const valueMapperToFn = this.valueMapper?.to;

    return (event: IControlEvent) => {
      if (isStateChange(event)) {
        if (valueMapperToFn && event.changedProps.includes('rawValue')) {
          assertEventShape(event, 'rawValue');
          return this.mapValueEvent(control, event, valueMapperToFn);
        } else if (event.changedProps.includes('parent')) {
          assertEventShape(event, 'parent');
          return {
            ...event,
            eventId: AbstractControl.eventId(),
            source: this.control.id,
          };
        }
      }

      if (event.type === 'Focus') {
        return {
          ...event,
          eventId: AbstractControl.eventId(),
          source: this.control.id,
        };
      }

      return event;
    };
  }

  protected fromAccessorEventMapFn() {
    const valueMapperFromFn = this.valueMapper?.from;

    return (event: IControlEvent) => {
      if (
        isStateChange(event) &&
        valueMapperFromFn &&
        event.changedProps.includes('rawValue')
      ) {
        assertEventShape(event, 'rawValue');
        return this.mapValueEvent(this.control, event, valueMapperFromFn);
      }

      return event;
    };
  }

  private mapValueEvent(
    control: AbstractControl,
    event: IControlStateChangeEvent,
    mapperFn: (rawValue: unknown) => unknown
  ) {
    const rawValue = mapperFn(control.rawValue);

    // TODO:
    // If a Assessor implements ControlContainerAccessor and a user
    // links a `swFormControl` to it, then if the ControlContainerAccessor
    // adds a new control it's value could change as well as it's disabled
    // status, readonly status, touched, etc. I don't think the FormControl
    // `value` state change handler is currently setup to catch all of these
    // other state changes. AbstractControl might need to be updated to
    // support handling multiple disperate changes
    const newEvent: IControlSelfStateChangeEvent<T['rawValue'], T['data']> = {
      type: 'StateChange',
      subtype: 'Self',
      source: event.source,
      eventId: event.eventId,
      idOfOriginatingEvent: event.idOfOriginatingEvent,
      change: { rawValue: () => rawValue },
      changedProps: event.changedProps,
      meta: event.meta,
    };

    if (event.noEmit) {
      newEvent.noEmit = event.noEmit;
    }

    return newEvent;
  }

  protected onControlStateChange(e: IControlStateChangeEvent) {
    if (e.changedProps.includes('touched')) {
      this.updateTouchedCSS();
    }

    if (e.changedProps.includes('readonly')) {
      this.updateReadonlyCSS();
    }

    if (e.changedProps.includes('disabled')) {
      this.updateDisabledCSS();
    }

    if (e.changedProps.includes('invalid')) {
      this.updateInvalidCSS();
    }

    if (e.changedProps.includes('submitted')) {
      this.updateSubmittedCSS();
    }

    if (e.changedProps.includes('dirty')) {
      this.updateDirtyCSS();
    }

    if (e.changedProps.includes('pending')) {
      this.updatePendingCSS();
    }
  }

  protected updateTouchedCSS() {
    if (this.control.touched) {
      this.renderer.addClass(this.el.nativeElement, 'sw-touched');
      this.renderer.removeClass(this.el.nativeElement, 'sw-untouched');
    } else {
      this.renderer.addClass(this.el.nativeElement, 'sw-untouched');
      this.renderer.removeClass(this.el.nativeElement, 'sw-touched');
    }
  }

  protected updateReadonlyCSS() {
    if (this.control.readonly) {
      this.renderer.addClass(this.el.nativeElement, 'sw-readonly');
      this.renderer.removeClass(this.el.nativeElement, 'sw-not-readonly');
    } else {
      this.renderer.addClass(this.el.nativeElement, 'sw-not-readonly');
      this.renderer.removeClass(this.el.nativeElement, 'sw-readonly');
    }
  }

  protected updateDisabledCSS() {
    if (this.control.disabled) {
      this.renderer.addClass(this.el.nativeElement, 'sw-disabled');
      this.renderer.removeClass(this.el.nativeElement, 'sw-enabled');
    } else {
      this.renderer.addClass(this.el.nativeElement, 'sw-enabled');
      this.renderer.removeClass(this.el.nativeElement, 'sw-disabled');
    }
  }

  protected updateInvalidCSS() {
    if (this.control.invalid) {
      this.renderer.addClass(this.el.nativeElement, 'sw-invalid');
      this.renderer.removeClass(this.el.nativeElement, 'sw-valid');
    } else {
      this.renderer.addClass(this.el.nativeElement, 'sw-valid');
      this.renderer.removeClass(this.el.nativeElement, 'sw-invalid');
    }
  }

  protected updateSubmittedCSS() {
    if (this.control.submitted) {
      this.renderer.addClass(this.el.nativeElement, 'sw-submitted');
      this.renderer.removeClass(this.el.nativeElement, 'sw-not-submitted');
    } else {
      this.renderer.addClass(this.el.nativeElement, 'sw-not-submitted');
      this.renderer.removeClass(this.el.nativeElement, 'sw-submitted');
    }
  }

  protected updateDirtyCSS() {
    if (this.control.dirty) {
      this.renderer.addClass(this.el.nativeElement, 'sw-dirty');
      this.renderer.removeClass(this.el.nativeElement, 'sw-pristine');
    } else {
      this.renderer.addClass(this.el.nativeElement, 'sw-pristine');
      this.renderer.removeClass(this.el.nativeElement, 'sw-dirty');
    }
  }

  protected updatePendingCSS() {
    if (this.control.pending) {
      this.renderer.addClass(this.el.nativeElement, 'sw-pending');
      this.renderer.removeClass(this.el.nativeElement, 'sw-not-pending');
    } else {
      this.renderer.addClass(this.el.nativeElement, 'sw-not-pending');
      this.renderer.removeClass(this.el.nativeElement, 'sw-pending');
    }
  }
}

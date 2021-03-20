import {
  OnDestroy,
  OnChanges,
  Renderer2,
  ElementRef,
  Directive,
  Input,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  AbstractControl,
  IControlEvent,
  isStateChange,
  transformRawValueStateChange,
} from '../models';
import { IControlDirectiveCallback, IControlValueMapper } from './interface';
import { ControlAccessor } from '../accessors/interface';
import { IControlStateChangeEvent } from '../models/abstract-control/abstract-control';
import { filter } from 'rxjs/operators';

// function assertEventShape(
//   event: IControlStateChangeEvent,
//   prop: 'rawValue' | 'parent'
// ): asserts event is IControlStateChangeEvent {
//   if (
//     event.subtype !== 'Self' ||
//     !(event as IControlStateChangeEvent).change[prop]
//   ) {
//     // because the swFormControlValueMapper returns a `IControlStateChangeEvent`
//     // state change, we want to ensure that this doesn't accidently destroy a custom
//     // event returned by a user. The standard FormControl only changes rawValue/parent
//     // via a IControlStateChangeEvent rawValue/parent event.
//     throw new Error(
//       `swFormControlValueMapper expects all changes to a control's ` +
//         `${prop} to come from IControlStateChangeEvent "${prop}" ` +
//         `changes but it received a StateChange that didn't conform to this. ` +
//         `Are you using a custom accessor that doesn't implement ` +
//         `ControlAccessor<FormControl>?`
//     );
//   }
// }

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

  protected toAccessorEventMapFn() {
    const valueMapperToFn = this.valueMapper?.to;

    return (event: IControlEvent) => {
      if (isStateChange(event)) {
        if (valueMapperToFn && event.changes.has('rawValue')) {
          // assertEventShape(event, 'rawValue');
          return this.mapValueEvent(event, valueMapperToFn);
        } else if (event.changes.has('parent')) {
          // assertEventShape(event, 'parent');
          return {
            ...event,
            source: this.control.id,
          };
        }
      }

      if (event.type === 'Focus') {
        return {
          ...event,
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
        event.changes.has('rawValue')
      ) {
        // assertEventShape(event, 'rawValue');
        return this.mapValueEvent(event, valueMapperFromFn);
      }

      return event;
    };
  }

  private mapValueEvent(
    event: IControlStateChangeEvent,
    mapperFn: (rawValue: unknown) => unknown
  ) {
    return transformRawValueStateChange(event, mapperFn);
  }

  protected onControlStateChange(e: IControlStateChangeEvent) {
    if (e.changes.has('touched')) {
      this.updateTouchedCSS();
    }

    if (e.changes.has('readonly')) {
      this.updateReadonlyCSS();
    }

    if (e.changes.has('disabled')) {
      this.updateDisabledCSS();
    }

    if (e.changes.has('invalid')) {
      this.updateInvalidCSS();
    }

    if (e.changes.has('submitted')) {
      this.updateSubmittedCSS();
    }

    if (e.changes.has('dirty')) {
      this.updateDirtyCSS();
    }

    if (e.changes.has('pending')) {
      this.updatePendingCSS();
    }
  }

  protected updateTouchedCSS() {
    if (this.control.touched) {
      this.addClass('sw-touched');
      this.removeClass('sw-untouched');
    } else {
      this.addClass('sw-untouched');
      this.removeClass('sw-touched');
    }
  }

  protected updateReadonlyCSS() {
    if (this.control.readonly) {
      this.addClass('sw-readonly');
      this.removeClass('sw-not-readonly');
    } else {
      this.addClass('sw-not-readonly');
      this.removeClass('sw-readonly');
    }
  }

  protected updateDisabledCSS() {
    if (this.control.disabled) {
      this.addClass('sw-disabled');
      this.removeClass('sw-enabled');
    } else {
      this.addClass('sw-enabled');
      this.removeClass('sw-disabled');
    }
  }

  protected updateInvalidCSS() {
    if (this.control.invalid) {
      this.addClass('sw-invalid');
      this.removeClass('sw-valid');
    } else {
      this.addClass('sw-valid');
      this.removeClass('sw-invalid');
    }
  }

  protected updateSubmittedCSS() {
    if (this.control.submitted) {
      this.addClass('sw-submitted');
      this.removeClass('sw-not-submitted');
    } else {
      this.addClass('sw-not-submitted');
      this.removeClass('sw-submitted');
    }
  }

  protected updateDirtyCSS() {
    if (this.control.dirty) {
      this.addClass('sw-dirty');
      this.removeClass('sw-pristine');
    } else {
      this.addClass('sw-pristine');
      this.removeClass('sw-dirty');
    }
  }

  protected updatePendingCSS() {
    if (this.control.pending) {
      this.addClass('sw-pending');
      this.removeClass('sw-not-pending');
    } else {
      this.addClass('sw-not-pending');
      this.removeClass('sw-pending');
    }
  }

  private addClass(text: string) {
    this.renderer.addClass(this.el.nativeElement, text);
  }

  private removeClass(text: string) {
    this.renderer.removeClass(this.el.nativeElement, text);
  }
}

import {
  OnDestroy,
  OnChanges,
  Renderer2,
  ElementRef,
  InjectionToken,
  Directive,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AbstractControl, IControlEvent } from '../models';
import { IControlValueMapper } from './interface';
import { ControlAccessor } from '../accessors/interface';
import { isStateChangeOrChildStateChange, isValueStateChange } from './util';
import { IControlStateChangeEvent } from '../models/abstract-control/abstract-control';
import { filter } from 'rxjs/operators';
import { IChildControlStateChangeEvent } from '../models/abstract-control-container/abstract-control-container';

@Directive()
export abstract class BaseDirective<T extends AbstractControl>
  implements ControlAccessor<T>, OnChanges, OnDestroy {
  static id = 0;
  abstract readonly control: T;

  valueMapper?: IControlValueMapper;

  protected accessorValidatorId = Symbol(
    `SwDirectiveAccessorValidator-${BaseDirective.id++}`
  );

  protected onChangesSubscriptions: Subscription[] = [];
  protected subscriptions: Subscription[] = [];

  constructor(protected renderer: Renderer2, protected el: ElementRef) {}

  abstract ngOnChanges(...args: any[]): void;

  ngOnInit() {
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
        .pipe(filter(isStateChangeOrChildStateChange))
        .subscribe((e) => this.onControlStateChangeOrChildStateChange(e))
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
      if (isValueStateChange<T['value']>(event) && valueMapperToFn) {
        return this.mapValueEvent(event, valueMapperToFn);
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
      if (isValueStateChange<T['value']>(event) && valueMapperFromFn) {
        return this.mapValueEvent(event, valueMapperFromFn);
      }

      return event;
    };
  }

  private mapValueEvent(
    event: IControlStateChangeEvent<unknown, unknown>,
    mapperFn: (value: unknown) => unknown
  ) {
    const change = event.change.value!;

    return {
      ...event,
      change: { value: (old: unknown) => mapperFn(change(old)) },
    };
  }

  protected onControlStateChangeOrChildStateChange(
    e:
      | IControlStateChangeEvent<T['value'], T['data']>
      | IChildControlStateChangeEvent<any, any>
  ) {
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

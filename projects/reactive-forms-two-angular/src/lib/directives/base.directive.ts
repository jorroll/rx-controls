import {
  OnDestroy,
  OnChanges,
  Renderer2,
  ElementRef,
  Directive,
  Input,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { IControlDirectiveCallback, IControlValueMapper } from './interface';
import { ControlAccessor } from '../accessors/interface';
import {
  AbstractControl,
  IControlEvent,
  isStateChange,
  IControlStateChangeEvent,
} from '@service-work/reactive-forms';
import { filter } from 'rxjs/operators';

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

    if (typeof mapper.toAccessor !== 'function') {
      throw new Error(`${name} expected to have a "to" mapper function`);
    }

    if (typeof mapper.fromAccessor !== 'function') {
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
    const valueMapperToFn = this.valueMapper?.toAccessor;

    return (event: IControlEvent) => {
      if (isStateChange(event)) {
        if (valueMapperToFn && event.changes.rawValue !== undefined) {
          return this.mapValueEvent(event, valueMapperToFn);
        } else if (event.changes.parent !== undefined) {
          return {
            ...event,
            source: this.control.id,
          };
        }
      }

      if (event.type === 'Focus') {
        return {
          ...event,
          controlId: this.control.id,
        };
      }

      return event;
    };
  }

  protected fromAccessorEventMapFn() {
    const valueMapperFromFn = this.valueMapper?.fromAccessor;

    return (event: IControlEvent) => {
      if (
        isStateChange(event) &&
        valueMapperFromFn &&
        event.changes.rawValue !== undefined
      ) {
        return this.mapValueEvent(event, valueMapperFromFn);
      }

      return event;
    };
  }

  /**
   * This function is only intended for use with FormControls and
   * isn't suitable for use with an AbstractControlContainer's values
   */
  private mapValueEvent(
    event: IControlStateChangeEvent,
    mapperFn: (rawValue: unknown) => unknown
  ) {
    if (event.changes.rawValue === undefined) return event;

    const oldRawValue = event.changes.rawValue as any;
    const newRawValue = mapperFn(oldRawValue) as any;
    const newChanges = {
      ...event.changes,
      rawValue: newRawValue,
      value: newRawValue,
    };
    const newEvent = { ...event, changes: newChanges };

    return newEvent;
  }

  protected onControlStateChange(e: IControlStateChangeEvent) {
    if (e.changes.touched !== undefined) {
      this.updateTouchedCSS();
    }

    if (e.changes.readonly !== undefined) {
      this.updateReadonlyCSS();
    }

    if (e.changes.disabled !== undefined) {
      this.updateDisabledCSS();
    }

    if (e.changes.invalid !== undefined) {
      this.updateInvalidCSS();
    }

    if (e.changes.submitted !== undefined) {
      this.updateSubmittedCSS();
    }

    if (e.changes.dirty !== undefined) {
      this.updateDirtyCSS();
    }

    if (e.changes.pending !== undefined) {
      this.updatePendingCSS();
    }
  }

  protected updateTouchedCSS() {
    this.updateCSS('touched', 'sw-touched', 'sw-untouched');
  }

  protected updateReadonlyCSS() {
    this.updateCSS('readonly', 'sw-readonly', 'sw-not-readonly');
  }

  protected updateDisabledCSS() {
    this.updateCSS('disabled', 'sw-disabled', 'sw-enabled');
  }

  protected updateInvalidCSS() {
    this.updateCSS('invalid', 'sw-invalid', 'sw-valid');
  }

  protected updateSubmittedCSS() {
    this.updateCSS('submitted', 'sw-submitted', 'sw-not-submitted');
  }

  protected updateDirtyCSS() {
    this.updateCSS('dirty', 'sw-dirty', 'sw-pristine');
  }

  protected updatePendingCSS() {
    this.updateCSS('pending', 'sw-pending', 'sw-not-pending');
  }

  private updateCSS(
    prop: keyof AbstractControl,
    present: string,
    notPresent: string
  ) {
    if (this.control[prop]) {
      this.renderer.addClass(this.el.nativeElement, present);
      this.renderer.removeClass(this.el.nativeElement, notPresent);
    } else {
      this.renderer.addClass(this.el.nativeElement, notPresent);
      this.renderer.removeClass(this.el.nativeElement, present);
    }
  }
}

import {
  OnDestroy,
  OnChanges,
  Renderer2,
  ElementRef,
  InjectionToken,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AbstractControl, IControlEvent } from '../models';
import { IControlValueMapper } from './interface';
import { ControlAccessor } from '../accessors';
import { isValueStateChange } from './util';
// import { isValueStateChange } from './util';

export const SW_CONTROL_DIRECTIVE = new InjectionToken<
  SwBaseDirective<AbstractControl>
>('SW_CONTROL_DIRECTIVE');

export abstract class SwBaseDirective<T extends AbstractControl>
  implements ControlAccessor<T>, OnChanges, OnDestroy {
  static id = 0;
  abstract readonly control: T;

  valueMapper?: IControlValueMapper;

  protected accessorValidatorId = Symbol(
    `SwDirectiveAccessorValidator-${SwBaseDirective.id++}`
  );

  protected onChangesSubscriptions: Subscription[] = [];
  protected subscriptions: Subscription[] = [];

  constructor(protected renderer: Renderer2, protected el: ElementRef) {}

  abstract ngOnChanges(...args: any[]): void;

  ngOnInit() {
    // The nativeElement will be a comment if a directive is place on
    // an `<ng-container>` element.
    if (!(this.el.nativeElement instanceof HTMLElement)) return;

    this.subscriptions.push(
      this.control
        .observe('touched', { ignoreNoEmit: true })
        .subscribe((touched) => {
          if (touched) {
            this.renderer.addClass(this.el.nativeElement, 'sw-touched');
            this.renderer.removeClass(this.el.nativeElement, 'sw-untouched');
          } else {
            this.renderer.addClass(this.el.nativeElement, 'sw-untouched');
            this.renderer.removeClass(this.el.nativeElement, 'sw-touched');
          }
        }),
      this.control
        .observe('submitted', { ignoreNoEmit: true })
        .subscribe((submitted) => {
          if (submitted) {
            this.renderer.addClass(this.el.nativeElement, 'sw-submitted');
            this.renderer.removeClass(this.el.nativeElement, 'sw-unsubmitted');
          } else {
            this.renderer.addClass(this.el.nativeElement, 'sw-unsubmitted');
            this.renderer.removeClass(this.el.nativeElement, 'sw-submitted');
          }
        }),
      this.control
        .observe('dirty', { ignoreNoEmit: true })
        .subscribe((dirty) => {
          if (dirty) {
            this.renderer.addClass(this.el.nativeElement, 'sw-dirty');
            this.renderer.removeClass(this.el.nativeElement, 'sw-unchanged');
          } else {
            this.renderer.addClass(this.el.nativeElement, 'sw-unchanged');
            this.renderer.removeClass(this.el.nativeElement, 'sw-dirty');
          }
        })
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

  protected toAccessorValueMapFn() {
    if (this.valueMapper) {
      return this.buildMapperFn(this.valueMapper.to);
    }

    return (event: IControlEvent) => event;
  }

  protected fromAccessorValueMapFn() {
    if (this.valueMapper) {
      return this.buildMapperFn(this.valueMapper.from);
    }

    return (event: IControlEvent) => event;
  }

  private buildMapperFn(mapperFn: (value: unknown) => unknown) {
    return (event: IControlEvent) => {
      if (isValueStateChange<T['value']>(event)) {
        const change = event.change.value;

        return {
          ...event,
          change: { value: (old: unknown) => mapperFn(change(old)) },
        };
      }

      return event;
    };
  }
}

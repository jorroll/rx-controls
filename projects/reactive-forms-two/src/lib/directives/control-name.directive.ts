import { Input, OnDestroy, OnChanges, SimpleChange, Directive } from '@angular/core';
import { AbstractControl } from '../models';
import { IControlValueMapper, IControlAccessorControlEvent } from './interface';
import { map, filter } from 'rxjs/operators';
import { BaseDirective } from './base.directive';
import {
  ControlAccessor,
  ControlContainerAccessor,
} from '../accessors/interface';
import { concat, Subscription } from 'rxjs';

@Directive()
export abstract class ControlNameDirective<T extends AbstractControl>
  extends BaseDirective<T>
  implements ControlAccessor, OnChanges, OnDestroy {
  abstract controlName: string;

  valueMapper?: IControlValueMapper;

  abstract readonly control: T;
  protected abstract containerAccessor: ControlContainerAccessor;

  protected innerSubscriptions: Subscription[] = [];

  ngOnChanges(_: { controlName?: SimpleChange; valueMapper?: SimpleChange }) {
    if (!this.controlName) {
      throw new Error(
        `SwFormControlNameDirective must be passed a ngFormControlName`
      );
    }

    this.cleanupInnerSubs();
    this.onChangesSubscriptions.forEach((sub) => sub.unsubscribe());
    this.onChangesSubscriptions = [];

    const providedControlSub = this.containerAccessor.control
      .observe('controls', this.controlName, { ignoreNoEmit: true })
      .subscribe((providedControl: T) => {
        this.cleanupInnerSubs();

        if (!providedControl) return;

        this.validateProvidedControl(providedControl);

        this.control.emitEvent<IControlAccessorControlEvent>({
          type: 'ControlAccessor',
          label: 'PreInit',
        });

        this.innerSubscriptions.push(
          concat(providedControl.replayState(), providedControl.events)
            .pipe(map(this.toAccessorEventMapFn()))
            .subscribe(this.control.source)
        );

        this.innerSubscriptions.push(
          this.control.events
            .pipe(map(this.fromAccessorEventMapFn()))
            .subscribe(providedControl.source)
        );

        this.control.emitEvent<IControlAccessorControlEvent>({
          type: 'ControlAccessor',
          label: 'PostInit',
        });
      });

    this.onChangesSubscriptions.push(providedControlSub);

    if (this.valueMapper && this.valueMapper.accessorValidator) {
      const validator = this.valueMapper.accessorValidator;

      this.control.setErrors(validator(this.control), {
        source: this.accessorValidatorId,
      });

      // validate the control via a service to avoid the possibility
      // of the user somehow deleting our validator function.
      this.onChangesSubscriptions.push(
        this.control
          .validationService(this.accessorValidatorId)
          .subscribe(() => {
            this.control.setErrors(validator(this.control), {
              source: this.accessorValidatorId,
            });
          })
      );
    } else {
      this.control.setErrors(null, {
        source: this.accessorValidatorId,
      });
    }
  }

  ngOnDestroy() {
    super.ngOnDestroy();

    this.cleanupInnerSubs();
  }

  protected abstract validateProvidedControl(control: any): control is T;

  protected cleanupInnerSubs() {
    this.innerSubscriptions.forEach((sub) => sub.unsubscribe());

    this.control.emitEvent<IControlAccessorControlEvent>({
      type: 'ControlAccessor',
      label: 'Cleanup',
    });

    this.innerSubscriptions = [];
  }
}

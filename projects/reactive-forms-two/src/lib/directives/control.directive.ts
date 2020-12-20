import { OnDestroy, OnChanges, SimpleChange, Directive } from '@angular/core';
import { AbstractControl } from '../models';
import { IControlValueMapper, IControlAccessorControlEvent } from './interface';
import { map, filter } from 'rxjs/operators';
import { BaseDirective } from './base.directive';
import { ControlAccessor } from '../accessors/interface';
import { concat } from 'rxjs';

@Directive()
export abstract class ControlDirective<T extends AbstractControl>
  extends BaseDirective<T>
  implements ControlAccessor, OnChanges, OnDestroy {
  abstract providedControl: T | undefined;

  valueMapper?: IControlValueMapper;

  abstract readonly control: T;

  ngOnChanges(_: {
    providedControl?: SimpleChange;
    valueMapper?: SimpleChange;
  }) {
    if (!this.providedControl) {
      throw new Error(
        `SwControlDirective#ngOnChanges should never be ` +
          `called with !this.providedControl`
      );
    }

    this.onChangesSubscriptions.forEach((sub) => sub.unsubscribe());
    this.onChangesSubscriptions = [];

    this.control.emitEvent<IControlAccessorControlEvent>({
      type: 'ControlAccessor',
      label: 'PreInit',
    });

    this.onChangesSubscriptions.push(
      concat(this.providedControl.replayState(), this.providedControl.events)
        .pipe(map(this.toAccessorEventMapFn(this.providedControl)))
        .subscribe(this.control.source)
    );

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

    this.onChangesSubscriptions.push(
      this.control.events
        .pipe(map(this.fromAccessorEventMapFn()))
        .subscribe(this.providedControl.source)
    );

    this.control.emitEvent<IControlAccessorControlEvent>({
      type: 'ControlAccessor',
      label: 'PostInit',
    });
  }

  ngOnDestroy() {
    super.ngOnDestroy();

    this.control.emitEvent<IControlAccessorControlEvent>({
      type: 'ControlAccessor',
      label: 'Cleanup',
    });
  }
}

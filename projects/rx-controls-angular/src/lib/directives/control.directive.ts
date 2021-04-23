import { OnDestroy, OnChanges, SimpleChange, Directive } from '@angular/core';
import { AbstractControl } from 'rx-controls';
import { IControlValueMapper } from './interface';
import { map, filter } from 'rxjs/operators';
import { BaseDirective } from './base.directive';
import { ControlAccessor } from '../accessors/interface';
import { concat } from 'rxjs';
import { isValidationStartEvent } from './util';

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

    // this.control.emitEvent<IControlAccessorControlEvent>({
    //   type: 'ControlAccessor',
    //   label: 'PreInit',
    // });

    // need to clear any leftover validators before syncing with
    // providedControl because one of the first changes from
    // providedControl will be a rawValue state change and it's
    // value type might be different from what the existing validators
    // expect
    this.control.setValidators(new Map());
    this.control._setParent(null);
    this.control._setParent(this.providedControl.parent);

    this.onChangesSubscriptions.push(
      concat(this.providedControl.replayState(), this.providedControl.events)
        .pipe(map(this.toAccessorEventMapFn()))
        .subscribe((e) => this.control.processEvent(e))
    );

    if (this.valueMapper && this.valueMapper.accessorValidator) {
      const validator = this.valueMapper.accessorValidator;

      this.control.setErrors(validator(this.control), {
        source: this.accessorValidatorId,
      });

      // validate the control via a service to avoid the possibility
      // of the user somehow deleting our validator function.
      this.onChangesSubscriptions.push(
        this.control.events
          .pipe(filter(isValidationStartEvent))
          .subscribe((e) => {
            this.control.setErrors(validator(e), {
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
        .subscribe((e) => this.providedControl!.processEvent(e))
    );

    // this.control.emitEvent<IControlAccessorControlEvent>({
    //   type: 'ControlAccessor',
    //   label: 'PostInit',
    // });
  }

  ngOnDestroy() {
    super.ngOnDestroy();

    // this.control.emitEvent<IControlAccessorControlEvent>({
    //   type: 'ControlAccessor',
    //   label: 'Cleanup',
    // });
  }
}

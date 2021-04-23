import { Directive, forwardRef } from '@angular/core';
import { AbstractControl, FormGroup } from 'rx-controls';
import {
  ControlContainerAccessor,
  CONTROL_ACCESSOR_SPECIFICITY,
  RX_CONTROL_ACCESSOR,
} from '../accessors/interface';

@Directive({
  selector: '[rxFormGroup],[rxFormGroupName]',
  providers: [
    {
      provide: RX_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => DefaultFormGroupDirectiveAccessor),
      multi: true,
    },
  ],
})
export class DefaultFormGroupDirectiveAccessor<
  T extends { [key: string]: AbstractControl<any, any> | undefined } = any,
  D = any
> implements ControlContainerAccessor<FormGroup<T, D>> {
  static id = 0;

  readonly control = new FormGroup<T, D>(({} as unknown) as T, {
    id: Symbol(
      `RxDefaultFormGroupDirectiveAccessor-${DefaultFormGroupDirectiveAccessor.id++}`
    ),
  });

  readonly [CONTROL_ACCESSOR_SPECIFICITY] = '0.1.0';
}

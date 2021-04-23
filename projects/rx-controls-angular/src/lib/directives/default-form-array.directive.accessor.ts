import { Directive, forwardRef } from '@angular/core';
import { AbstractControl, FormArray } from 'rx-controls';
import {
  ControlContainerAccessor,
  CONTROL_ACCESSOR_SPECIFICITY,
  RX_CONTROL_ACCESSOR,
} from '../accessors/interface';

@Directive({
  selector: '[rxFormArray],[rxFormArrayName]',
  providers: [
    {
      provide: RX_CONTROL_ACCESSOR,
      useExisting: forwardRef(() => DefaultFormArrayDirectiveAccessor),
      multi: true,
    },
  ],
})
export class DefaultFormArrayDirectiveAccessor<
  T extends AbstractControl[] = any,
  D = any
> implements ControlContainerAccessor<FormArray<T, D>> {
  static id = 0;

  readonly control = new FormArray<T, D>(([] as unknown) as T, {
    id: Symbol(
      `RxDefaultFormArrayDirectiveAccessor-${DefaultFormArrayDirectiveAccessor.id++}`
    ),
  });

  readonly [CONTROL_ACCESSOR_SPECIFICITY] = '0.1.0';
}

import { Directive, forwardRef } from '@angular/core';
import { AbstractControl, FormArray } from 'reactive-form-controls';
import {
  ControlContainerAccessor,
  CONTROL_ACCESSOR_SPECIFICITY,
  SW_CONTROL_ACCESSOR,
} from '../accessors/interface';

@Directive({
  selector: '[swFormArray],[swFormArrayName]',
  providers: [
    {
      provide: SW_CONTROL_ACCESSOR,
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
      `SwDefaultFormArrayDirectiveAccessor-${DefaultFormArrayDirectiveAccessor.id++}`
    ),
  });

  readonly [CONTROL_ACCESSOR_SPECIFICITY] = '0.1.0';
}

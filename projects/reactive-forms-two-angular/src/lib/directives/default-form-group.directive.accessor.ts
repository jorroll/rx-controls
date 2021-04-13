import { Directive, forwardRef } from '@angular/core';
import { AbstractControl, FormGroup } from '@service-work/reactive-forms';
import {
  ControlContainerAccessor,
  CONTROL_ACCESSOR_SPECIFICITY,
  SW_CONTROL_ACCESSOR,
} from '../accessors/interface';

@Directive({
  selector: '[swFormGroup],[swFormGroupName]',
  providers: [
    {
      provide: SW_CONTROL_ACCESSOR,
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
      `SwDefaultFormGroupDirectiveAccessor-${DefaultFormGroupDirectiveAccessor.id++}`
    ),
  });

  readonly [CONTROL_ACCESSOR_SPECIFICITY] = '0.1.0';
}

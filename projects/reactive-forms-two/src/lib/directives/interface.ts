import { InjectionToken } from '@angular/core';
import { Subscription } from 'rxjs';
import { ControlAccessor } from '../accessors/interface';
import { AbstractControl, IControlEvent, ValidatorFn } from '../models';

export const SW_CONTROL_DIRECTIVE = new InjectionToken<ControlAccessor>(
  'SW_CONTROL_DIRECTIVE'
);

export interface IControlValueMapper<ControlValue = any, AccessorValue = any> {
  to: (value: ControlValue) => AccessorValue;
  from: (value: AccessorValue) => ControlValue;
  accessorValidator?: ValidatorFn;
}

export interface IControlAccessorControlEvent extends IControlEvent {
  type: 'ControlAccessor';
  label: 'Cleanup' | 'PreInit' | 'PostInit';
}

export interface IControlDirectiveCallback<
  T extends AbstractControl = AbstractControl,
  D = any
> {
  controlDirectiveCallback(
    control: T,
    data: D | null
  ): Subscription | undefined;
}

export const SW_CONTROL_DIRECTIVE_CALLBACK = new InjectionToken<IControlDirectiveCallback>(
  'SW_CONTROL_DIRECTIVE_CALLBACK'
);

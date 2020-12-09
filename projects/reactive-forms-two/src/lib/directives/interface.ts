import { InjectionToken } from '@angular/core';
import { ControlAccessor } from '../accessors/interface';
import { IControlEvent, ValidatorFn } from '../models';

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

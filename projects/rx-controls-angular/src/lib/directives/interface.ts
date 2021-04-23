import { InjectionToken } from '@angular/core';
import { Subscription } from 'rxjs';
import { ControlAccessor } from '../accessors/interface';
import { AbstractControl, IControlEvent, ValidatorFn } from 'rx-controls';

export const RX_CONTROL_DIRECTIVE = new InjectionToken<ControlAccessor>(
  'RX_CONTROL_DIRECTIVE'
);

export interface IControlValueMapper<ControlValue = any, AccessorValue = any> {
  toAccessor: (value: ControlValue) => AccessorValue;
  fromAccessor: (value: AccessorValue) => ControlValue;
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

export const RX_CONTROL_DIRECTIVE_CALLBACK = new InjectionToken<IControlDirectiveCallback>(
  'RX_CONTROL_DIRECTIVE_CALLBACK'
);

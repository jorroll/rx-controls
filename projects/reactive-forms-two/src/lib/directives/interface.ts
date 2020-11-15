import { IControlEvent, ValidatorFn } from '../models';

export interface IControlValueMapper<ControlValue = any, AccessorValue = any> {
  to: (value: ControlValue) => AccessorValue;
  from: (value: AccessorValue) => ControlValue;
  accessorValidator?: ValidatorFn;
}

export interface IControlAccessorEvent extends IControlEvent {
  type: 'ControlAccessor';
  label: 'Cleanup' | 'PreInit' | 'PostInit';
}

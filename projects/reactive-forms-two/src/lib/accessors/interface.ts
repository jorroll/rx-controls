import { InjectionToken } from '@angular/core';
import { AbstractControl, AbstractControlContainer } from '../models';

export interface ControlAccessor<T extends AbstractControl = AbstractControl> {
  readonly control: T;
}

export const SW_CONTROL_ACCESSOR = new InjectionToken<ControlAccessor>(
  'SW_CONTROL_ACCESSOR'
);

export interface ControlContainerAccessor<
  T extends AbstractControlContainer = AbstractControlContainer
> extends ControlAccessor<T> {}

// export const SW_CONTROL_CONTAINER_ACCESSOR = new InjectionToken<
//   ControlContainerAccessor
// >('SW_CONTROL_CONTAINER_ACCESSOR');

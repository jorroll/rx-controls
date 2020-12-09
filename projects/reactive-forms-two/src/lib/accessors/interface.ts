import { InjectionToken } from '@angular/core';
import { AbstractControl, AbstractControlContainer } from '../models';

export const CONTROL_ACCESSOR_SPECIFICITY = Symbol(
  'CONTROL_ACCESSOR_SPECIFICITY'
);

export interface ControlAccessor<T extends AbstractControl = AbstractControl> {
  readonly control: T;
  [CONTROL_ACCESSOR_SPECIFICITY]?: string;
}

export const SW_CONTROL_ACCESSOR = new InjectionToken<
  ReadonlyArray<ControlAccessor>
>('SW_CONTROL_ACCESSOR');

export interface ControlContainerAccessor<
  T extends AbstractControlContainer = AbstractControlContainer
> extends ControlAccessor<T> {}

// export const SW_CONTROL_CONTAINER_ACCESSOR = new InjectionToken<
//   ControlContainerAccessor
// >('SW_CONTROL_CONTAINER_ACCESSOR');

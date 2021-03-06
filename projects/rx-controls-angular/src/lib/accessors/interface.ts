import { InjectionToken } from '@angular/core';
import { AbstractControl, AbstractControlContainer } from 'rx-controls';

export const CONTROL_ACCESSOR_SPECIFICITY = Symbol(
  'CONTROL_ACCESSOR_SPECIFICITY'
);

export interface ControlAccessor<T extends AbstractControl = AbstractControl> {
  readonly control: T;
  readonly [CONTROL_ACCESSOR_SPECIFICITY]?: string;
}

export const RX_CONTROL_ACCESSOR = new InjectionToken<
  ReadonlyArray<ControlAccessor>
>('RX_CONTROL_ACCESSOR');

export interface ControlContainerAccessor<
  T extends AbstractControlContainer = AbstractControlContainer
> extends ControlAccessor<T> {}

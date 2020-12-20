import { InjectionToken, Type } from '@angular/core';
import { concat } from 'rxjs';
import {
  ControlAccessor,
  ControlContainerAccessor,
  SW_CONTROL_ACCESSOR,
} from '../accessors/interface';
import {
  selectControlAccessor,
  selectControlContainerAccessor,
} from '../accessors/util';
import { IControlEvent } from '../models';
import { IChildControlStateChangeEvent } from '../models/abstract-control-container/abstract-control-container';
import {
  AbstractControl,
  IStateChange,
  IControlStateChangeEvent,
} from '../models/abstract-control/abstract-control';
import { SW_CONTROL_DIRECTIVE } from './interface';

export function resolveControlAccessor<T extends ControlAccessor>(
  accessors: T[]
) {
  const accessor = selectControlAccessor(accessors);

  if (!accessor) {
    throw new Error('Could not find ControlAccessor');
  }

  return accessor;
}

export function resolveControlContainerAccessor<T extends ControlAccessor>(
  accessors: T[]
) {
  const accessor = selectControlContainerAccessor(accessors);

  if (!accessor) {
    throw new Error('Could not find ControlContainerAccessor');
  }

  return accessor;
}

// export function isStateChangeOrChildStateChange(
//   event: IControlEvent
// ): event is
//   | IControlStateChangeEvent<any, any>
//   | IChildControlStateChangeEvent<any, any> {
//   return event.type === 'StateChange' || event.type === 'ChildStateChange';
// }

// export function isValueStateChange<T = unknown>(
//   event: IControlEvent
// ): event is IControlStateChangeEvent<T, any> & {
//   change: { value: IStateChange<T> };
// } {
//   return (
//     event.type === 'StateChange' &&
//     !!(event as IControlStateChangeEvent<T, any>).change.value
//   );
// }

// export function syncAccessorToControl(
//   accessor: ControlAccessor,
//   control: AbstractControl
// ) {
//   const sub = concat(
//     accessor.control.replayState(),
//     accessor.control.events
//   ).subscribe(control.source);

//   sub.add(control.events.subscribe(accessor.control.source));

//   return sub;
// }

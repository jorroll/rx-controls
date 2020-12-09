import { concat } from 'rxjs';
import { DefaultAccessor } from '../accessors/default.accessor';
import {
  ControlAccessor,
  ControlContainerAccessor,
} from '../accessors/interface';
import { selectControlAccessor } from '../accessors/util';
import { AbstractControlContainer, IControlEvent } from '../models';
import { IChildControlStateChangeEvent } from '../models/abstract-control-container/abstract-control-container';
import {
  AbstractControl,
  IStateChange,
  IControlStateChangeEvent,
} from '../models/abstract-control/abstract-control';

export function resolveControlAccessor(accessors: ControlAccessor[]) {
  const accessor = selectControlAccessor(accessors);

  if (!accessor) {
    throw new Error('Could not find control accessor');
  }

  return accessor;
}

export function resolveControlContainerAccessor(
  accessors: ControlAccessor[]
): ControlContainerAccessor {
  const containerAccessors = accessors.filter((acc) =>
    AbstractControlContainer.isControlContainer(acc.control)
  );

  if (containerAccessors.length > 1) {
    console.error('containerAccessors', containerAccessors);
    throw new Error(
      `Error resolving container accessor. Expected ` +
        `to find 0 or 1 but found ${containerAccessors.length}`
    );
  } else if (containerAccessors.length === 1) {
    return accessors[0] as ControlContainerAccessor;
  } else {
    console.error('accessors', accessors);
    throw new Error('Could not find control container accessor');
  }
}

export function isStateChangeOrChildStateChange(
  event: IControlEvent
): event is
  | IControlStateChangeEvent<any, any>
  | IChildControlStateChangeEvent<any, any> {
  return event.type === 'StateChange' || event.type === 'ChildStateChange';
}

export function isValueStateChange<T = unknown>(
  event: IControlEvent
): event is IControlStateChangeEvent<T, any> & {
  change: { value: IStateChange<T> };
} {
  return (
    event.type === 'StateChange' &&
    !!(event as IControlStateChangeEvent<T, any>).change.value
  );
}

export function syncAccessorToControl(
  accessor: ControlAccessor,
  control: AbstractControl
) {
  const sub = concat(
    accessor.control.replayState(),
    accessor.control.events
  ).subscribe(control.source);

  sub.add(control.events.subscribe(accessor.control.source));

  return sub;
}

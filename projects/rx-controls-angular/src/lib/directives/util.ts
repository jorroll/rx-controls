import { ControlAccessor } from '../accessors/interface';
import {
  selectControlAccessor,
  selectControlContainerAccessor,
} from '../accessors/util';

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

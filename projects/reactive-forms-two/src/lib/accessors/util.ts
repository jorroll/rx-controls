import { filter, map, distinctUntilChanged } from 'rxjs/operators';
import { isStateChange } from '../models/util';
import {
  ControlAccessor,
  ControlContainerAccessor,
  CONTROL_ACCESSOR_SPECIFICITY,
} from './interface';
import { ElementRef, Renderer2 } from '@angular/core';
import { IControlFocusEvent } from '../models/abstract-control/abstract-control';
import { NEVER } from 'rxjs';
import { AbstractControlContainer } from '../models';

export function looseIdentical(a: any, b: any): boolean {
  return (
    a === b ||
    (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b))
  );
}

/** Returns an "unlisten" function */
export function setupListeners(
  dir: any,
  event: string,
  fn: string
): () => void {
  return dir.renderer.listen(dir.el.nativeElement, event, dir[fn].bind(dir));
}

export function setupStdControlEventHandlers<T extends ControlAccessor>(
  _dir: T,
  options: {
    onValueChangeFn: (value: T['control']['value']) => void;
  }
) {
  const dir = (_dir as unknown) as ControlAccessor & {
    renderer: Renderer2;
    el: ElementRef<HTMLElement | null>;
    _valueHasBeenSet: boolean;
  };

  return dir.control.events.subscribe((e) => {
    if (isStateChange(e)) {
      if (e.changedProps.includes('value')) {
        dir._valueHasBeenSet = true;
        options.onValueChangeFn(dir.control.value);
      }

      if (e.changedProps.includes('disabled')) {
        dir.renderer.setProperty(
          dir.el.nativeElement,
          'disabled',
          dir.control.disabled
        );
      }

      if (e.changedProps.includes('readonly')) {
        dir.renderer.setProperty(
          dir.el.nativeElement,
          'readonly',
          dir.control.readonly
        );
      }
    } else if (
      e.type === 'Focus' &&
      // make sure that the nativeElement has a "focus" method
      dir.el.nativeElement &&
      'focus' in dir.el.nativeElement &&
      typeof (dir.el.nativeElement as any).focus === 'function'
    ) {
      if ((e as IControlFocusEvent).focus) {
        (dir.el.nativeElement as any).focus();
      } else {
        (dir.el.nativeElement as any).blur();
      }
    }
  });
}

export function selectControlAccessor<T extends ControlAccessor>(
  accessors: readonly [T, ...T[]]
): T;
export function selectControlAccessor<T extends ControlAccessor>(
  accessors: readonly T[]
): T | undefined;
export function selectControlAccessor<T extends ControlAccessor>(
  accessors: readonly T[]
): T | undefined {
  if (accessors.length < 2) return accessors[0];

  return accessors.reduce((prev, curr) => {
    if (
      !prev[CONTROL_ACCESSOR_SPECIFICITY] &&
      !curr[CONTROL_ACCESSOR_SPECIFICITY]
    ) {
      throw new Error(
        `Multiple ControlAccessors that don't have a ` +
          `CONTROL_ACCESSOR_SPECIFICITY value were found ` +
          `on an element.`
      );
    }

    if (!prev[CONTROL_ACCESSOR_SPECIFICITY]) return prev;
    if (!curr[CONTROL_ACCESSOR_SPECIFICITY]) return curr;

    return prev[CONTROL_ACCESSOR_SPECIFICITY]! >
      curr[CONTROL_ACCESSOR_SPECIFICITY]!
      ? prev
      : curr;
  });
}

export function selectControlContainerAccessor<T extends ControlAccessor>(
  accessors: readonly [T, ...T[]]
): Extract<T, ControlContainerAccessor>;
export function selectControlContainerAccessor<T extends ControlAccessor>(
  accessors: readonly T[]
): Extract<T, ControlContainerAccessor> | undefined;
export function selectControlContainerAccessor<T extends ControlAccessor>(
  accessors: readonly T[]
): Extract<T, ControlContainerAccessor> | undefined {
  const containerAccessors = accessors.filter((acc) =>
    AbstractControlContainer.isControlContainer(acc.control)
  ) as Array<Extract<T, ControlContainerAccessor>>;

  return selectControlAccessor(containerAccessors);
}

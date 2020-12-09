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

// export function setupValueStateChangeHandler<T extends ControlAccessor>(
//   dir: T,
//   fn: (value: T['control']['value']) => void
// ) {
//   return dir.control.events
//     .pipe(
//       filter(
//         (event) => isStateChange(event) && event.changedProps.includes('value')
//       ),
//       map(() => dir.control.value),
//       distinctUntilChanged()
//     )
//     .subscribe((value) => {
//       (dir as any)._valueHasBeenSet = true;
//       fn(value);
//     });
// }

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

// export function setupDisabledStateChangeHandler<T extends ControlAccessor>(
//   dir: T
// ) {
//   return dir.control.events
//     .pipe(
//       filter(
//         (event) =>
//           isStateChange(event) &&
//           event.changedProps.includes('disabled') &&
//           event.source !== dir.control.id
//       ),
//       map(() => dir.control.disabled),
//       distinctUntilChanged()
//     )
//     .subscribe((isDisabled) => {
//       ((dir as unknown) as { renderer: Renderer2 }).renderer.setProperty(
//         (dir as any).el.nativeElement,
//         'disabled',
//         isDisabled
//       );
//     });
// }

// export function setupControlFocusHandler<T extends ControlAccessor>(dir: T) {
//   const el = (dir as any).el as ElementRef<object> | null;

//   if (
//     !(
//       el &&
//       el.nativeElement &&
//       'focus' in el.nativeElement &&
//       typeof (el.nativeElement as any).focus === 'function'
//     )
//   ) {
//     return NEVER.subscribe();
//   }

//   return dir.control.events
//     .pipe(filter((event) => event.type === 'Focus'))
//     .subscribe((e) => {
//       if ((e as IControlFocusEvent).focus) {
//         (el.nativeElement as any).focus();
//       } else {
//         (el.nativeElement as any).blur();
//       }
//     });
// }

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

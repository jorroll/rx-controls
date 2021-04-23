import { distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  isStateChange,
  AbstractControlContainer,
  AbstractControl,
  IControlFocusEvent,
} from 'rx-controls';
import {
  ControlAccessor,
  ControlContainerAccessor,
  CONTROL_ACCESSOR_SPECIFICITY,
} from './interface';
import { ElementRef, Renderer2 } from '@angular/core';
import { combineLatest, Observable, of } from 'rxjs';

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
    onValueChangeFn: (value: T['control']['rawValue']) => void;
  }
) {
  const dir = (_dir as unknown) as ControlAccessor & {
    renderer: Renderer2;
    el: ElementRef<HTMLElement | null>;
    _valueHasBeenSet: boolean;
  };

  const sub1 = combineLatest([
    dir.control.observe('disabled'),
    isAncestorControlPropTruthy$(dir.control, 'selfDisabled'),
  ]).subscribe(([a, b]) => {
    dir.renderer.setProperty(dir.el.nativeElement, 'disabled', a || b);
  });

  const sub2 = combineLatest([
    dir.control.observe('readonly'),
    isAncestorControlPropTruthy$(dir.control, 'selfReadonly'),
  ]).subscribe(([a, b]) => {
    dir.renderer.setProperty(dir.el.nativeElement, 'readonly', a || b);
  });

  const sub3 = dir.control.events.subscribe((e) => {
    if (isStateChange(e)) {
      if (e.changes.rawValue !== undefined) {
        dir._valueHasBeenSet = true;
        options.onValueChangeFn(dir.control.rawValue);
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

  return sub1.add(sub2).add(sub3);
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

/**
 * Subscribes to the parent of this control and checks to see
 * if the given prop is truthy. If yes, returns `true`. If no,
 * subscribes to the parent of that parent and checks to see
 * if the given prop is truthy, and so on until a truthy
 * value is found or no more parents exist (in which case
 * it returns `false`).
 */
export function isAncestorControlPropTruthy$(
  control: AbstractControl,
  prop: keyof AbstractControlContainer
): Observable<boolean> {
  return control.observe('parent').pipe(
    switchMap((parent) =>
      !parent
        ? of(false)
        : parent
            .observe(prop as keyof AbstractControl)
            .pipe(
              switchMap((value) =>
                value ? of(true) : isAncestorControlPropTruthy$(parent, prop)
              )
            )
    ),
    distinctUntilChanged()
  );
}

import {
  AbstractControl,
  AbstractControlContainer,
  isStateChangeEvent,
  isFocusEvent,
  IControlEvent,
} from 'rx-controls';

import { concat, Observable, pipe, Subscription } from 'rxjs';

import {
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';

import { useControl } from './context';

import type { ElementOf } from 'ts-essentials';

import { useCallback } from 'react';
import { useObservable } from 'rxjs-hooks';

export function syncProvidedControl(
  staticControl: AbstractControl,
  props: {
    control?: AbstractControl;
    controlContainer?: AbstractControlContainer;
    controlName?: string;
  }
) {
  const providedContainer =
    useControl<NonNullable<typeof props.controlContainer>>();

  useCallback(() => {
    if (!props.control) {
      if (props.controlName && !(props.controlContainer || providedContainer)) {
        throw new Error(
          `A "controlName" was provided but no "controlContainer" was provided. ` +
            `When using "controlName", you must provide a controlContainer via props or context.`
        );
      } else if (!props.controlName) {
        return;
      }
    }

    // map focus events from dynamic control to static control (used below)
    const mapFocusEvents = pipe(
      map((e: IControlEvent) => {
        if (isFocusEvent(e)) {
          return {
            ...e,
            controlId: staticControl.id,
          };
        }

        return e;
      })
    );

    let s: Subscription;

    if (props.control) {
      const dynamicControl = props.control;

      s = concat(dynamicControl.replayState(), dynamicControl.events)
        .pipe(mapFocusEvents)
        .subscribe((e) => staticControl.processEvent(e));

      s.add(
        staticControl.events.subscribe((e) => dynamicControl.processEvent(e))
      );
    } else {
      const container = props.controlContainer || providedContainer;

      const dynamicControl$: Observable<AbstractControl> = container!.observe(
        'controls',
        props.controlName as keyof typeof container
      );

      s = dynamicControl$
        .pipe(
          switchMap((dynamicControl) =>
            concat(dynamicControl.replayState(), dynamicControl.events)
          ),
          mapFocusEvents
        )
        .subscribe((dynamicControlEvent) =>
          staticControl.processEvent(dynamicControlEvent)
        );

      s.add(
        dynamicControl$
          .pipe(
            switchMap((dynamicControl) =>
              staticControl.events.pipe(
                map(
                  (staticControlEvent) =>
                    [dynamicControl, staticControlEvent] as const
                )
              )
            )
          )
          .subscribe(([dynamicControl, staticControlEvent]) =>
            dynamicControl.processEvent(staticControlEvent)
          )
      );
    }

    return () => s.unsubscribe();
  }, [props.control, props.controlContainer, props.controlName])();
}

export function useFocusHandler(
  control: AbstractControl,
  setRef?: (node: HTMLElement) => void
) {
  return useCallback((node) => {
    if (!node) return;
    if (setRef) setRef(node);

    const sub = control.events
      .pipe(
        filter(isFocusEvent),
        map((e) => e.focus)
      )
      .subscribe((focus) => {
        if (focus) {
          node.focus();
        } else {
          node.blur();
        }
      });

    return () => sub.unsubscribe();
  }, []);
}

export function useControlClassList<
  T extends AbstractControl,
  P extends ReadonlyArray<keyof T>,
  R extends string | { [key: string]: boolean }
>(control: T, props: P, fn: (props: Pick<T, ElementOf<P>>) => R) {
  return useObservable(() =>
    control.events.pipe(
      filter(isStateChangeEvent),
      filter((e) => props.some((p) => p in e.changes)),
      startWith(null),
      map(
        () =>
          Object.fromEntries(props.map((p) => [p, control[p]])) as Pick<
            T,
            ElementOf<P>
          >
      ),
      map(fn),
      distinctUntilChanged((a, b) => {
        if (typeof a === 'string' || typeof b === 'string') return a === b;

        const x = Object.entries(a);

        if (x.length !== Object.keys(b).length) return false;

        for (const [k, v] of x) {
          if ((b as { [key: string]: boolean })[k] !== v) return false;
        }

        return true;
      })
    )
  ) as R;
}

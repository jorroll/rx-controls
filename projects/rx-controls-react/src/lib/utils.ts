import {
  AbstractControl,
  AbstractControlContainer,
  isStateChangeEvent,
  isFocusEvent,
  IControlEvent,
} from 'rx-controls';
import { concat, NEVER, Observable, pipe, Subscription } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { useControl } from './context';
import type { ElementOf } from 'ts-essentials';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useObservable } from 'rxjs-hooks';

function isValidControlName(val: unknown): val is string | number {
  return typeof val === 'string' || Number.isInteger(val);
}

export function syncProvidedControl(
  staticControl: AbstractControl,
  props: {
    control?: AbstractControl;
    controlContainer?: AbstractControlContainer;
    controlName?: string | number;
  }
) {
  const providedContainer =
    useControl<NonNullable<typeof props.controlContainer>>();

  const sub = useRef<Subscription | null>(null);

  // force subscriptions to be handled synchronously
  useMemo(() => {
    if (sub.current) {
      sub.current.unsubscribe();
      sub.current = null;
    }

    if (!props.control) {
      if (
        isValidControlName(props.controlName) &&
        !(props.controlContainer || providedContainer)
      ) {
        throw new Error(
          `A "controlName" was provided but no "controlContainer" was provided. ` +
            `When using "controlName", you must provide a controlContainer via props or context.`
        );
      } else if (!isValidControlName(props.controlName)) {
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

    let s: Subscription | undefined;

    if (props.control) {
      const dynamicControl = props.control;

      s = concat(dynamicControl.replayState(), dynamicControl.events)
        .pipe(mapFocusEvents)
        .subscribe((e) => staticControl.processEvent(e));

      s.add(
        staticControl.events.subscribe((e) => dynamicControl.processEvent(e))
      );
    } else {
      const container = props.controlContainer || providedContainer!;

      const dynamicControl$ = container.observe(
        'controls',
        props.controlName!
      ) as Observable<AbstractControl>;

      s = dynamicControl$
        .pipe(
          switchMap((dynamicControl) =>
            !dynamicControl
              ? NEVER
              : concat(dynamicControl.replayState(), dynamicControl.events)
          ),
          mapFocusEvents
        )
        .subscribe((dynamicControlEvent) => {
          staticControl.processEvent(dynamicControlEvent);
        });

      s.add(
        dynamicControl$
          .pipe(
            switchMap((dynamicControl) =>
              !dynamicControl
                ? NEVER
                : staticControl.events.pipe(
                    map(
                      (staticControlEvent) =>
                        [dynamicControl, staticControlEvent] as const
                    )
                  )
            )
          )
          .subscribe(([dynamicControl, staticControlEvent]) => {
            dynamicControl.processEvent(staticControlEvent);
          })
      );
    }

    sub.current = s;
  }, [staticControl, props.control, props.controlContainer, props.controlName]);

  useEffect(() => {
    return () => sub.current?.unsubscribe();
  }, [sub]);
}

export function useFocusHandler(
  control: AbstractControl,
  setRef?: (node: HTMLElement) => void
) {
  const sub = useRef<Subscription | null>(null);

  const callback = useCallback(
    (node: HTMLElement | null) => {
      if (sub.current) {
        sub.current.unsubscribe();
        sub.current = null;
      }

      if (!node) return;
      if (setRef) setRef(node);

      sub.current = control.events
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
    },
    [control, sub, setRef]
  );

  useEffect(() => {
    return () => sub.current?.unsubscribe();
  }, [sub]);

  return callback;
}

export function useControlClassList<
  T extends AbstractControl,
  P extends ReadonlyArray<keyof T>,
  R extends string | { [key: string]: boolean }
>(control: T, props: P, fn: (props: Pick<T, ElementOf<P>>) => R) {
  return useObservable(
    () =>
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
      ),
    undefined,
    [control, props, fn]
  ) as R;
}

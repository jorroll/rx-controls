import {
  AbstractControl,
  AbstractControlContainer,
  isStateChangeEvent,
  isFocusEvent,
} from 'rx-controls';
import { createComputed, onCleanup, onMount, createSignal } from 'solid-js';
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
import { IControlEvent } from 'projects/rx-controls/src/public-api';

export function toSignal<T>(input: Observable<T>, defaultValue?: T) {
  const [value, setValue] = createSignal(defaultValue as T);

  const sub = input.subscribe(setValue);

  onCleanup(() => sub.unsubscribe());

  return value;
}

export function syncProvidedControl(
  staticControl: AbstractControl,
  props: {
    control?: AbstractControl;
    controlContainer?: AbstractControlContainer;
    controlName?: string;
  }
) {
  createComputed(() => {
    const providedContainer = useControl<
      NonNullable<typeof props.controlContainer>
    >();

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

    onCleanup(() => s.unsubscribe());
  });
}

export function setupFocusHandler(
  control: AbstractControl,
  el: () => HTMLElement | undefined
) {
  onMount(() => {
    if (!el()) return;

    const sub = control.events
      .pipe(
        filter(isFocusEvent),
        map((e) => e.focus)
      )
      .subscribe((focus) => {
        if (focus) {
          el()!.focus();
        } else {
          el()!.blur();
        }
      });

    onCleanup(() => sub.unsubscribe());
  });
}

export function createClassListSignal<
  T extends AbstractControl,
  P extends ReadonlyArray<keyof T>
>(
  control: T,
  props: P,
  fn: (props: Pick<T, ElementOf<P>>) => { [key: string]: boolean }
) {
  const obs = control.events.pipe(
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
      const x = Object.entries(a);

      if (x.length !== Object.keys(b).length) return false;

      for (const [k, v] of x) {
        if (b[k] !== v) return false;
      }

      return true;
    })
  );

  return toSignal(obs);
}

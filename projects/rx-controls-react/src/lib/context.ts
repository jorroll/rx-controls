import { AbstractControl } from 'rx-controls';
import { createContext, useContext, useMemo } from 'react';
import { useObservable } from 'rxjs-hooks';
import { switchMap } from 'rxjs/operators';

export const ControlContext = createContext<AbstractControl | null>(null);

export function useControl<T extends AbstractControl = AbstractControl>() {
  return useContext(ControlContext) as T | undefined;
}

export function useControlState<
  T extends AbstractControl,
  A extends keyof T,
  B extends keyof NonNullable<T[A]>,
  C extends keyof NonNullable<NonNullable<T[A]>[B]>,
  D extends keyof NonNullable<NonNullable<NonNullable<T[A]>[B]>[C]>,
  E extends keyof NonNullable<
    NonNullable<NonNullable<NonNullable<T[A]>[B]>[C]>[D]
  >
>(
  control: T,
  a: A,
  b: B,
  c: C,
  d: D,
  e: E
): NonNullable<NonNullable<NonNullable<NonNullable<T[A]>[B]>[C]>[D]>[E];
export function useControlState<
  T extends AbstractControl,
  A extends keyof T,
  B extends keyof NonNullable<T[A]>,
  C extends keyof NonNullable<NonNullable<T[A]>[B]>,
  D extends keyof NonNullable<NonNullable<NonNullable<T[A]>[B]>[C]>
>(
  control: T,
  a: A,
  b: B,
  c: C,
  d: D
): NonNullable<NonNullable<NonNullable<T[A]>[B]>[C]>[D];
export function useControlState<
  T extends AbstractControl,
  A extends keyof T,
  B extends keyof NonNullable<T[A]>,
  C extends keyof NonNullable<NonNullable<T[A]>[B]>
>(control: T, a: A, b: B, c: C): NonNullable<NonNullable<T[A]>[B]>[C];
export function useControlState<
  T extends AbstractControl,
  A extends keyof T,
  B extends keyof NonNullable<T[A]>
>(control: T, a: A, b: B): NonNullable<T[A]>[B];
export function useControlState<T extends AbstractControl, A extends keyof T>(
  control: T,
  a: A
): T[A];
export function useControlState<T>(
  control: AbstractControl,
  ...props: Array<string | number>
): T;
export function useControlState<T extends AbstractControl>(
  control: T,
  ..._keys: Array<string | number>
): any {
  const keys = useMemo(() => _keys, [_keys.length, _keys.join()]);

  const init = useMemo(
    () => keys.reduce((prev: any, curr) => prev && prev[curr], control),
    [control, keys]
  );

  return useObservable(
    (_, inputs$) =>
      inputs$.pipe(
        switchMap((k) => (k.shift() as T).observe(k as unknown as string[]))
      ),
    init,
    [control, keys]
  );
}

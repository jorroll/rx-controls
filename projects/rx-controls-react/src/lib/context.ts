import { AbstractControl } from 'rx-controls';
import { createContext, useContext } from 'react';
import { useObservable } from 'rxjs-hooks';
import { switchMap } from 'rxjs/operators';

export const ControlContext = createContext<AbstractControl | null>(null);

export function useControl<T extends AbstractControl = AbstractControl>() {
  return useContext(ControlContext) as T | undefined;
}

export function useControlState<T extends AbstractControl, K extends keyof T>(
  control: T,
  key: K
) {
  return useObservable(
    (_, inputs$) => inputs$.pipe(switchMap(([k]) => control.observeChanges(k))),
    control[key],
    [key]
  );
}

import { AbstractControl } from 'rx-controls';
import { createContext, useContext } from 'react';
import { useObservable } from 'rxjs-hooks';

export const ControlContext = createContext<AbstractControl | null>(null);

export function useControl<T extends AbstractControl = AbstractControl>() {
  return useContext(ControlContext) as T | undefined;
}

export function useControlState<T extends AbstractControl, K extends keyof T>(
  control: T,
  key: K
) {
  return useObservable(() => control.observeChanges(key), control[key]);
}

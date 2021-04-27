import { AbstractControl } from 'rx-controls';
import { createContext, useContext } from 'solid-js';

export const ControlContext = createContext<AbstractControl>();

export function useControl<T extends AbstractControl = AbstractControl>() {
  return useContext(ControlContext) as T | undefined;
}

import {
  AbstractControl,
  AbstractControlContainer,
  FormControl,
} from "rx-controls";

import { ControlContext } from "./context";

import { syncProvidedControl, useFocusHandler } from "./utils";

import React, { PropsWithChildren, FunctionComponent, useMemo } from "react";

export type WithControlProps<
  T extends { control: AbstractControl; setRef?: (ref: HTMLElement) => void }
> = PropsWithChildren<
  Omit<T, "control"> & {
    control?: T["control"];
    controlContainer?: AbstractControlContainer;
    controlName?: string;
  }
>;

export interface WithControlOptions<
  P extends { control: AbstractControl; setRef?: (ref: HTMLElement) => void }
> {
  component: FunctionComponent<P>;
  controlFactory?: (props: WithControlProps<P>) => P["control"];
}

const DEFAULT_OPTIONS = {
  controlFactory: <
    T extends { control: AbstractControl; setRef?: (ref: HTMLElement) => void }
  >() => new FormControl(null) as any as T["control"],
};

export function withControl<
  P extends {
    control: FormControl;
    setRef?: (ref: HTMLElement) => void;
  } = {
    control: FormControl;
    setRef?: (ref: HTMLElement) => void;
  }
>(Component: FunctionComponent<P>): FunctionComponent<WithControlProps<P>>;
export function withControl<
  P extends {
    control: AbstractControl;
    setRef?: (ref: HTMLElement) => void;
  }
>(options: WithControlOptions<P>): FunctionComponent<WithControlProps<P>>;
export function withControl<
  P extends { control: AbstractControl; setRef?: (ref: HTMLElement) => void }
>(args: FunctionComponent<P> | WithControlOptions<P>) {
  const options =
    typeof args !== "function"
      ? { ...DEFAULT_OPTIONS, ...args }
      : {
          ...DEFAULT_OPTIONS,
          component: args,
        };

  return (props: WithControlProps<P>) => {
    const control = useMemo(
      () => options.controlFactory(props) as P["control"],
      []
    );

    // sync focus events
    const setRef = useFocusHandler(control, props.setRef);

    syncProvidedControl(control, props);

    // For some reason typescript is complaining about types. Seems like it
    // might be a typescript bug since I can't see anything wrong with the
    // type signatures
    const Component = options.component as any;

    return (
      <ControlContext.Provider value={control}>
        <Component {...props} control={control} setRef={setRef} />
      </ControlContext.Provider>
    );
  };
}

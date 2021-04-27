import {
  AbstractControl,
  AbstractControlContainer,
  FormControl,
} from "rx-controls";
import { ControlContext } from "./context";
import { setupFocusHandler, syncProvidedControl } from "./utils";
import type { Component, JSX } from "solid-js";

type PropsWithChildren<P> = P & { children?: JSX.Element };

export type WithControlProps<
  T extends { control: AbstractControl; ref?: HTMLElement }
> = PropsWithChildren<
  Omit<T, "control"> & {
    control?: T["control"];
    controlContainer?: AbstractControlContainer;
    controlName?: string;
  }
>;

export interface WithControlOptions<
  P extends { control: AbstractControl; ref?: HTMLElement }
> {
  component: Component<P>;
  controlFactory?: (props: WithControlProps<P>) => P["control"];
}

const DEFAULT_OPTIONS = {
  controlFactory: <
    T extends { control: AbstractControl; ref?: HTMLElement }
  >() => (new FormControl(null) as any) as T["control"],
};

export function withControl<
  P extends {
    control: FormControl;
    ref?: HTMLElement | undefined;
  } = {
    control: FormControl;
    ref?: HTMLElement | undefined;
  }
>(Component: Component<P>): (props: WithControlProps<P>) => JSX.Element;
export function withControl<
  P extends {
    control: AbstractControl;
    ref?: HTMLElement | undefined;
  }
>(options: WithControlOptions<P>): (props: WithControlProps<P>) => JSX.Element;
export function withControl<
  P extends { control: AbstractControl; ref?: HTMLElement }
>(args: Component<P> | WithControlOptions<P>) {
  const options =
    typeof args !== "function"
      ? { ...DEFAULT_OPTIONS, ...args }
      : {
          ...DEFAULT_OPTIONS,
          component: args,
        };

  return (props: WithControlProps<P>) => {
    const control = options.controlFactory(props) as P["control"];
    setupFocusHandler(control, () => props.ref);
    syncProvidedControl(control, props);
    // For some reason typescript is complaining about types. Seems like it
    // might be a typescript bug since I can't see anything wrong with the
    // type signatures
    const Component = options.component as any;

    return (
      <ControlContext.Provider value={control}>
        <Component {...props} control={control} ref={props.ref} />
      </ControlContext.Provider>
    );
  };
}

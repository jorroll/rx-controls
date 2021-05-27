import { AbstractControl, AbstractControlContainer } from "rx-controls";
import { ControlContext } from "./context";
import { syncProvidedControl, useFocusHandler } from "./utils";
import React, { PropsWithChildren, FunctionComponent, useMemo } from "react";

export type WithControlProps<
  P extends { control: AbstractControl },
  R extends HTMLElement = HTMLElement
> = PropsWithChildren<
  Omit<P, "control"> & {
    control?: P["control"];
    controlContainer?: AbstractControlContainer;
    controlName?: string | number;
    setRef?: (el: R) => void;
  }
>;

export interface WithControlOptions<
  P extends { control: AbstractControl },
  R extends HTMLElement
> {
  controlFactory: (props: WithControlProps<P, R>) => P["control"];
  component: FunctionComponent<P>;
}

export function withControl<
  P extends { control: AbstractControl },
  R extends HTMLElement = HTMLElement
>(options: WithControlOptions<P, R>) {
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

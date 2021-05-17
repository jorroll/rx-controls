import { useControlClassList, useFocusHandler } from "./utils";
import { FormControl } from "rx-controls";
import { FunctionComponent } from "react";
import classnames from "classnames";
import { render } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import React from "react";

describe("useControlClassList", () => {
  it("works", () => {
    const controlProps = [
      "data",
      "valid",
      "touched",
      "dirty",
      "pending",
      "readonly",
      "disabled",
      "submitted",
    ] as const;

    const control = new FormControl(null, {
      data: { required: true },
    });

    let classList:
      | string
      | {
          [key: string]: boolean;
        };

    const Component: FunctionComponent<{}> = (props) => {
      classList = useControlClassList(control, controlProps, (p) => {
        const required = p.data?.required || false;

        return {
          "sw-required": required,
          "sw-valid": p.valid,
          "sw-invalid": !p.valid,
          "sw-touched": p.touched,
          "sw-untouched": !p.touched,
          "sw-dirty": p.dirty,
          "sw-clean": !p.dirty,
          "sw-pending": p.pending,
          "sw-not-pending": !p.pending,
          "sw-readonly": p.readonly,
          "sw-editable": !p.readonly,
          "sw-disabled": p.disabled,
          "sw-enabled": !p.disabled,
          "sw-submitted": p.submitted,
          "sw-not-submitted": !p.submitted,
        };
      });

      return <div id="the-div" className={classnames(classList)}></div>;
    };

    const { container } = render(<Component />);
    const div = container.querySelector("#the-div");

    expect(div?.className).toEqual(
      `sw-required sw-valid sw-untouched sw-clean sw-not-pending sw-editable sw-enabled sw-not-submitted`
    );

    expect(classList!).toEqual({
      "sw-required": true,
      "sw-valid": true,
      "sw-invalid": false,
      "sw-touched": false,
      "sw-untouched": true,
      "sw-dirty": false,
      "sw-clean": true,
      "sw-pending": false,
      "sw-not-pending": true,
      "sw-readonly": false,
      "sw-editable": true,
      "sw-disabled": false,
      "sw-enabled": true,
      "sw-submitted": false,
      "sw-not-submitted": true,
    });

    act(() => {
      control.markTouched(true);
    });

    expect(div?.className).toEqual(
      `sw-required sw-valid sw-touched sw-clean sw-not-pending sw-editable sw-enabled sw-not-submitted`
    );

    expect(classList!).toEqual({
      "sw-required": true,
      "sw-valid": true,
      "sw-invalid": false,
      "sw-touched": true,
      "sw-untouched": false,
      "sw-dirty": false,
      "sw-clean": true,
      "sw-pending": false,
      "sw-not-pending": true,
      "sw-readonly": false,
      "sw-editable": true,
      "sw-disabled": false,
      "sw-enabled": true,
      "sw-submitted": false,
      "sw-not-submitted": true,
    });
  });
});

describe("useFocusHandler", () => {
  let control: FormControl;
  let setRef: jest.Mock<any, any>;
  let onfocus: jest.Mock<any, any>;
  let onblur: jest.Mock<any, any>;
  let Component: FunctionComponent<{}>;
  let div: HTMLDivElement;

  beforeEach(() => {
    control = new FormControl("");
    setRef = jest.fn();
    onfocus = jest.fn();
    onblur = jest.fn();
    Component = (props) => {
      const _setRef = useFocusHandler(control, setRef);
      return <div id="the-div" ref={_setRef}></div>;
    };
    const { container } = render(<Component />);
    div = container.querySelector("#the-div") as HTMLDivElement;
  });

  it("focus works", async () => {
    // div.onfocus = onfocus;
    // div.onblur = onblur;

    act(() => {
      control.focus();
    });

    expect(setRef.mock.calls.length).toBe(1);
    // expect(onfocus.mock.calls.length).toBe(1);
    // expect(onblur.mock.calls.length).toBe(0);
  });

  it("blur works", () => {
    // div.onfocus = onfocus;
    // div.onblur = onblur;

    act(() => {
      control.focus(false);
    });

    expect(setRef.mock.calls.length).toBe(1);
    // expect(onfocus.mock.calls.length).toBe(1);
    // expect(onblur.mock.calls.length).toBe(0);
  });
});

// describe("syncProvidedControl", () => {
//   function testSync(
//     beforeEachFn: () => {
//       staticControl: FormControl<null>;
//       dynamicControl: FormControl<string>;
//       props: {
//         control?: AbstractControl;
//         controlContainer?: AbstractControlContainer;
//         controlName?: string;
//       };
//     }
//   ) {
//     let staticControl: AbstractControl;
//     let dynamicControl: AbstractControl;
//     let props: {
//       control?: AbstractControl;
//       controlContainer?: AbstractControlContainer;
//       controlName?: string;
//     };

//     beforeEach(() => {
//       ({ staticControl, dynamicControl, props } = beforeEachFn());
//     });

//     it("initializes", () => {
//       createRoot((disposer) => {
//         syncProvidedControl(staticControl, props);

//         expect(staticControl.value).toEqual("");
//         expect(dynamicControl.value).toEqual("");

//         dynamicControl.setValue("one");

//         expect(staticControl.value).toEqual("one");
//         expect(dynamicControl.value).toEqual("one");

//         staticControl.setValue("two");

//         expect(staticControl.value).toEqual("two");
//         expect(dynamicControl.value).toEqual("two");

//         disposer();
//       });
//     });

//     it("handles Focus events", () => {
//       createRoot((disposer) => {
//         syncProvidedControl(staticControl, props);

//         const callback = jest.fn();

//         let sub = staticControl.events
//           .pipe(filter(isFocusEvent))
//           .subscribe(callback);

//         dynamicControl.focus();
//         dynamicControl.focus(false);

//         expect(callback.mock.calls[0][0]).toEqual<IControlFocusEvent>({
//           type: "Focus",
//           controlId: staticControl.id,
//           debugPath: expect.any(String),
//           focus: true,
//           meta: {},
//           source: dynamicControl.id,
//         });

//         expect(callback.mock.calls[1][0]).toEqual<IControlFocusEvent>({
//           type: "Focus",
//           controlId: staticControl.id,
//           debugPath: expect.any(String),
//           focus: false,
//           meta: {},
//           source: dynamicControl.id,
//         });

//         sub.unsubscribe();

//         sub = dynamicControl.events
//           .pipe(filter(isFocusEvent))
//           .subscribe(callback);

//         staticControl.focus();

//         expect(callback.mock.calls[2]).toEqual(undefined);

//         sub.unsubscribe();
//         disposer();
//       });
//     });

//     it("handles StateChange events", () => {
//       createRoot((disposer) => {
//         syncProvidedControl(staticControl, props);

//         const callback = jest.fn();

//         let sub = staticControl.events.subscribe(callback);

//         dynamicControl.setValue("one");

//         expect(callback.mock.calls[0][0]).toEqual<
//           IControlValidationEvent<string>
//         >({
//           type: "ValidationStart",
//           controlId: staticControl.id,
//           debugPath: expect.any(String),
//           meta: {},
//           source: dynamicControl.id,
//           value: "one",
//           rawValue: "one",
//         });

//         expect(callback.mock.calls[1][0]).toEqual<
//           IControlValidationEvent<string>
//         >({
//           type: "AsyncValidationStart",
//           controlId: staticControl.id,
//           debugPath: expect.any(String),
//           meta: {},
//           source: dynamicControl.id,
//           value: "one",
//           rawValue: "one",
//         });

//         expect(callback.mock.calls[2][0]).toEqual<IControlStateChangeEvent>({
//           type: "StateChange",
//           controlId: staticControl.id,
//           debugPath: expect.any(String),
//           meta: {},
//           source: dynamicControl.id,
//           changes: {
//             value: "one",
//             rawValue: "one",
//           },
//         });

//         expect(callback.mock.calls[3]).toEqual(undefined);

//         sub.unsubscribe();

//         sub = dynamicControl.events.subscribe(callback);

//         staticControl.setValue("two");

//         expect(callback.mock.calls[3][0]).toEqual<
//           IControlValidationEvent<string>
//         >({
//           type: "ValidationStart",
//           controlId: dynamicControl.id,
//           debugPath: expect.any(String),
//           meta: {},
//           source: staticControl.id,
//           value: "two",
//           rawValue: "two",
//         });

//         expect(callback.mock.calls[4][0]).toEqual<
//           IControlValidationEvent<string>
//         >({
//           type: "AsyncValidationStart",
//           controlId: dynamicControl.id,
//           debugPath: expect.any(String),
//           meta: {},
//           source: staticControl.id,
//           value: "two",
//           rawValue: "two",
//         });

//         expect(callback.mock.calls[5][0]).toEqual<IControlStateChangeEvent>({
//           type: "StateChange",
//           controlId: dynamicControl.id,
//           debugPath: expect.any(String),
//           meta: {},
//           source: staticControl.id,
//           changes: {
//             value: "two",
//             rawValue: "two",
//           },
//         });

//         expect(callback.mock.calls[6]).toEqual(undefined);

//         sub.unsubscribe();
//         disposer();
//       });
//     });
//   }

//   describe("props.control", () => {
//     testSync(() => {
//       const dynamicControl = new FormControl("");

//       return {
//         staticControl: new FormControl(null),
//         dynamicControl,
//         props: {
//           control: dynamicControl,
//         },
//       };
//     });
//   });

//   describe("props.controlContainer & props.controlName", () => {
//     testSync(() => {
//       const dynamicControl = new FormControl("");

//       return {
//         staticControl: new FormControl(null),
//         dynamicControl,
//         props: {
//           controlContainer: new FormGroup({
//             street: dynamicControl,
//           }),
//           controlName: "street",
//         },
//       };
//     });
//   });
// });

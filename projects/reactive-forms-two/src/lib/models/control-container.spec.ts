import { AbstractControl } from './abstract-control';
import { ControlContainer } from './control-container';

describe('ControlContainer', () => {
  it('isControlContainer', () => {
    expect(ControlContainer.isControlContainer(0)).toBe(false);
    expect(ControlContainer.isControlContainer(undefined)).toBe(false);
    expect(ControlContainer.isControlContainer(null)).toBe(false);
    expect(ControlContainer.isControlContainer(true)).toBe(false);
    expect(ControlContainer.isControlContainer('true')).toBe(false);
    expect(ControlContainer.isControlContainer({})).toBe(false);
    expect(ControlContainer.isControlContainer(ControlContainer)).toBe(false);

    const control0 = {
      [AbstractControl.INTERFACE]() {
        return this;
      },
    };

    expect(ControlContainer.isControlContainer(control0)).toBe(false);

    const control1 = {
      [ControlContainer.INTERFACE]() {
        return this;
      },
    };

    expect(ControlContainer.isControlContainer(control1)).toBe(false);

    const control2 = {
      [AbstractControl.INTERFACE]() {
        return this;
      },
      [ControlContainer.INTERFACE]() {
        return this;
      },
    };

    expect(ControlContainer.isControlContainer(control2)).toBe(true);

    const control3 = {
      [AbstractControl.INTERFACE]() {
        return this;
      },
      [ControlContainer.INTERFACE]: true,
    };

    expect(ControlContainer.isControlContainer(control3)).toBe(false);

    const control4 = {
      [AbstractControl.INTERFACE]() {
        return this;
      },
      [ControlContainer.INTERFACE]() {
        return true;
      },
    };

    expect(ControlContainer.isControlContainer(control4)).toBe(false);
  });
});

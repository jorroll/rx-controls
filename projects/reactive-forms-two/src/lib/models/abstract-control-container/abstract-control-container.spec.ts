import { AbstractControl } from '../abstract-control/abstract-control';
import { AbstractControlContainer } from './abstract-control-container';

describe('AbstractControlContainer', () => {
  it('isAbstractControlContainer', () => {
    expect(AbstractControlContainer.isControlContainer(0)).toBe(false);
    expect(AbstractControlContainer.isControlContainer(undefined)).toBe(false);
    expect(AbstractControlContainer.isControlContainer(null)).toBe(false);
    expect(AbstractControlContainer.isControlContainer(true)).toBe(false);
    expect(AbstractControlContainer.isControlContainer('true')).toBe(false);
    expect(AbstractControlContainer.isControlContainer({})).toBe(false);
    expect(
      AbstractControlContainer.isControlContainer(AbstractControlContainer)
    ).toBe(false);

    const control0 = {
      [AbstractControl.INTERFACE]() {
        return this;
      },
    };

    expect(AbstractControlContainer.isControlContainer(control0)).toBe(false);

    const control1 = {
      [AbstractControlContainer.INTERFACE]() {
        return this;
      },
    };

    expect(AbstractControlContainer.isControlContainer(control1)).toBe(false);

    const control2 = {
      [AbstractControl.INTERFACE]() {
        return this;
      },
      [AbstractControlContainer.INTERFACE]() {
        return this;
      },
    };

    expect(AbstractControlContainer.isControlContainer(control2)).toBe(true);

    const control3 = {
      [AbstractControl.INTERFACE]() {
        return this;
      },
      [AbstractControlContainer.INTERFACE]: true,
    };

    expect(AbstractControlContainer.isControlContainer(control3)).toBe(false);

    const control4 = {
      [AbstractControl.INTERFACE]() {
        return this;
      },
      [AbstractControlContainer.INTERFACE]() {
        return true;
      },
    };

    expect(AbstractControlContainer.isControlContainer(control4)).toBe(false);
  });
});

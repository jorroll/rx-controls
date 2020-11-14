import { AbstractControl } from './abstract-control';

describe('AbstractControl', () => {
  it('eventId', () => {
    expect(AbstractControl.eventId()).toBe(1);
    expect(AbstractControl.eventId()).toBe(2);
    expect(AbstractControl.eventId()).toBe(3);

    expect(AbstractControl.eventId(1)).toBe(1);
    expect(AbstractControl.eventId()).toBe(2);
    expect(AbstractControl.eventId(2)).toBe(2);
  });

  it('isAbstractControl', () => {
    expect(AbstractControl.isAbstractControl(0)).toBe(false);
    expect(AbstractControl.isAbstractControl(undefined)).toBe(false);
    expect(AbstractControl.isAbstractControl(null)).toBe(false);
    expect(AbstractControl.isAbstractControl(true)).toBe(false);
    expect(AbstractControl.isAbstractControl('true')).toBe(false);
    expect(AbstractControl.isAbstractControl({})).toBe(false);
    expect(AbstractControl.isAbstractControl(AbstractControl)).toBe(false);

    const control1 = {
      [AbstractControl.INTERFACE]() {
        return this;
      },
    };

    expect(AbstractControl.isAbstractControl(control1)).toBe(true);

    const control2 = {
      [AbstractControl.INTERFACE]: true,
    };

    expect(AbstractControl.isAbstractControl(control2)).toBe(false);

    const control3 = {
      [AbstractControl.INTERFACE]() {
        return true;
      },
    };

    expect(AbstractControl.isAbstractControl(control3)).toBe(false);
  });
});

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
    expect(AbstractControl.isControl(0)).toBe(false);
    expect(AbstractControl.isControl(undefined)).toBe(false);
    expect(AbstractControl.isControl(null)).toBe(false);
    expect(AbstractControl.isControl(true)).toBe(false);
    expect(AbstractControl.isControl('true')).toBe(false);
    expect(AbstractControl.isControl({})).toBe(false);
    expect(AbstractControl.isControl(AbstractControl)).toBe(false);

    const control1 = {
      [AbstractControl.INTERFACE]() {
        return this;
      },
    };

    expect(AbstractControl.isControl(control1)).toBe(true);

    const control2 = {
      [AbstractControl.INTERFACE]: true,
    };

    expect(AbstractControl.isControl(control2)).toBe(false);

    const control3 = {
      [AbstractControl.INTERFACE]() {
        return true;
      },
    };

    expect(AbstractControl.isControl(control3)).toBe(false);
  });
});

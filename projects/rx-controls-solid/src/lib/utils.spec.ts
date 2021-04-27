import { FormControl } from 'rx-controls';
import { createClassListSignal } from './utils';
import { createRoot } from 'solid-js';

describe('createClassListSignal', () => {
  it('works', () => {
    const controlProps = [
      'data',
      'valid',
      'touched',
      'dirty',
      'pending',
      'readonly',
      'disabled',
      'submitted',
    ] as const;

    const control = new FormControl(null, {
      data: { required: true },
    });

    createRoot((disposer) => {
      const signal = createClassListSignal(control, controlProps, (p) => {
        const required = p.data?.required || false;

        return {
          'sw-required': required,
          'sw-valid': p.valid,
          'sw-invalid': !p.valid,
          'sw-touched': p.touched,
          'sw-untouched': !p.touched,
          'sw-dirty': p.dirty,
          'sw-clean': !p.dirty,
          'sw-pending': p.pending,
          'sw-not-pending': !p.pending,
          'sw-readonly': p.readonly,
          'sw-editable': !p.readonly,
          'sw-disabled': p.disabled,
          'sw-enabled': !p.disabled,
          'sw-submitted': p.submitted,
          'sw-not-submitted': !p.submitted,
        };
      });

      expect(typeof signal).toBe('function');

      expect(signal()).toEqual({
        'sw-required': true,
        'sw-valid': true,
        'sw-invalid': false,
        'sw-touched': false,
        'sw-untouched': true,
        'sw-dirty': false,
        'sw-clean': true,
        'sw-pending': false,
        'sw-not-pending': true,
        'sw-readonly': false,
        'sw-editable': true,
        'sw-disabled': false,
        'sw-enabled': true,
        'sw-submitted': false,
        'sw-not-submitted': true,
      });

      control.markTouched(true);

      expect(signal()).toEqual({
        'sw-required': true,
        'sw-valid': true,
        'sw-invalid': false,
        'sw-touched': true,
        'sw-untouched': false,
        'sw-dirty': false,
        'sw-clean': true,
        'sw-pending': false,
        'sw-not-pending': true,
        'sw-readonly': false,
        'sw-editable': true,
        'sw-disabled': false,
        'sw-enabled': true,
        'sw-submitted': false,
        'sw-not-submitted': true,
      });

      disposer();
    });
  });
});

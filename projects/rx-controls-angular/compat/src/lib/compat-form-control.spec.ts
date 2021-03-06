import { FormControl as OldFormControl } from '@angular/forms';
import { FormControl, isAncestorControlPropTruthy$ } from 'rx-controls-angular';
import { testAllAbstractControlDefaultsExcept } from 'rx-controls/src/lib/test-util';
import { combineLatest, Subscription } from 'rxjs';
import { CompatFormControl, FROM_RXCONTROL } from './compat-form-control';
import { testAllCompatControlDefaultsExcept } from './test-utils';

const CONTROL_SELF_ID = '__CONTROL_SELF_ID';

describe('CompatFormControl', () => {
  let compat: CompatFormControl;
  let control: FormControl;
  let subscription: Subscription | undefined;

  beforeEach(() => {
    if (subscription) {
      subscription.unsubscribe();
    }

    control = new FormControl();
    compat = new CompatFormControl(control);
    subscription = combineLatest([
      control.observe('disabled'),
      isAncestorControlPropTruthy$(control, 'selfDisabled'),
    ]).subscribe(([a, b]) => {
      if (a || b) {
        compat.disable({ [FROM_RXCONTROL]: true });
      } else {
        compat.enable({ [FROM_RXCONTROL]: true });
      }
    });
  });

  it('initializes', () => {
    expect(compat).toBeInstanceOf(CompatFormControl);
    expect(compat).toBeInstanceOf(OldFormControl);
    testAllCompatControlDefaultsExcept(compat);
  });

  describe('disabled', () => {
    function theTest() {
      expect(control.disabled).toEqual(true);
      expect(control.selfDisabled).toEqual(true);
      expect(control.enabled).toEqual(false);
      expect(control.selfEnabled).toEqual(false);
      expect(control.status).toEqual('DISABLED');
      expect(compat.disabled).toEqual(true);
      expect(compat.enabled).toEqual(false);
      expect(compat.status).toEqual('DISABLED');
      // The original angular form control treats
      // valid and invalid differently than the new one. Originally,
      // AbstractControl#valid = (AbstractControl#status === 'VALID')
      // Now, AbstractControl#valid = (AbstractControl#errors === null)
      // I've found this to be problematic because a control can have
      // errors and still not be invalid.
      expect(compat.valid).toEqual(false);
      expect(compat.invalid).toEqual(false);

      testAllAbstractControlDefaultsExcept(
        control,
        'disabled',
        'selfDisabled',
        'enabled',
        'selfEnabled',
        'status'
      );

      testAllCompatControlDefaultsExcept(
        compat,
        'disabled',
        'enabled',
        'status',
        'valid',
        'invalid'
      );
    }

    it('from rxControl', () => {
      control.markDisabled(true);
      theTest();
    });

    it('from compat', () => {
      compat.disable();
      theTest();
    });
  });

  describe('enabled', () => {
    function theTest() {
      testAllAbstractControlDefaultsExcept(control);
      testAllCompatControlDefaultsExcept(compat);
    }

    it('from rxControl', () => {
      control.markDisabled(true);
      control.markDisabled(false);
      theTest();
    });

    it('from compat', () => {
      compat.disable();
      compat.enable();
      theTest();
    });
  });

  describe('touched', () => {
    function theTest() {
      expect(control.touched).toEqual(true);
      expect(control.selfTouched).toEqual(true);
      expect(compat.touched).toEqual(true);
      expect(compat.untouched).toEqual(false);

      testAllAbstractControlDefaultsExcept(control, 'touched', 'selfTouched');
      testAllCompatControlDefaultsExcept(compat, 'touched');
    }

    it('from rxControl', () => {
      control.markTouched(true);
      theTest();
    });

    it('from compat', () => {
      compat.markAsTouched();
      theTest();
    });
  });

  describe('untouched', () => {
    function theTest() {
      testAllAbstractControlDefaultsExcept(control);
      testAllCompatControlDefaultsExcept(compat);
    }

    it('from rxControl', () => {
      control.markTouched(true);
      control.markTouched(false);
      theTest();
    });

    it('from compat', () => {
      compat.markAsTouched();
      compat.markAsUntouched();
      theTest();
    });
  });

  describe('dirty', () => {
    function theTest() {
      expect(control.dirty).toEqual(true);
      expect(control.selfDirty).toEqual(true);
      expect(compat.dirty).toEqual(true);
      expect(compat.pristine).toEqual(false);

      testAllAbstractControlDefaultsExcept(control, 'dirty', 'selfDirty');
      testAllCompatControlDefaultsExcept(compat, 'dirty');
    }

    it('from rxControl', () => {
      control.markDirty(true);
      theTest();
    });

    it('from compat', () => {
      compat.markAsDirty();
      theTest();
    });
  });

  describe('untouched', () => {
    function theTest() {
      testAllAbstractControlDefaultsExcept(control);
      testAllCompatControlDefaultsExcept(compat);
    }

    it('from rxControl', () => {
      control.markDirty(true);
      control.markDirty(false);
      theTest();
    });

    it('from compat', () => {
      compat.markAsDirty();
      compat.markAsPristine();
      theTest();
    });
  });

  describe('pending', () => {
    function theTest() {
      expect(control.pending).toEqual(true);
      expect(control.selfPending).toEqual(true);
      expect(control.pendingStore).toEqual(new Set([CONTROL_SELF_ID]));
      expect(control.status).toEqual('PENDING');
      expect(compat.pending).toEqual(true);
      expect(compat.status).toEqual('PENDING');
      // The original angular form control treats
      // valid and invalid differently than the new one. Originally,
      // AbstractControl#valid = (AbstractControl#status === 'VALID')
      // Now, AbstractControl#valid = (AbstractControl#errors === null)
      // I've found this to be problematic because a control can have
      // errors and still not be invalid.
      expect(compat.valid).toEqual(false);

      testAllAbstractControlDefaultsExcept(
        control,
        'pending',
        'selfPending',
        'pendingStore',
        'status'
      );

      testAllCompatControlDefaultsExcept(compat, 'pending', 'status', 'valid');
    }

    it('from rxControl', () => {
      control.markPending(true);
      theTest();
    });

    it('from compat', () => {
      compat.markAsPending();
      theTest();
    });
  });

  describe('not pending', () => {
    function theTest() {
      testAllAbstractControlDefaultsExcept(control);
      testAllCompatControlDefaultsExcept(compat);
    }

    it('from rxControl', () => {
      control.markPending(true);
      control.markPending(false);
      theTest();
    });

    // it('from compat', () => {
    //   compat.markAsDirty();
    //   compat.markAsPristine();
    //   theTest();
    // });
  });

  describe('setErrors object', () => {
    const errors = { required: true };

    function theTest() {
      expect(control.errors).toEqual(errors);
      expect(control.selfErrors).toEqual(errors);
      expect(control.errorsStore).toEqual(new Map([[CONTROL_SELF_ID, errors]]));
      expect(control.valid).toEqual(false);
      expect(control.selfValid).toEqual(false);
      expect(control.invalid).toEqual(true);
      expect(control.selfInvalid).toEqual(true);
      expect(control.status).toEqual('INVALID');

      expect(compat.errors).toEqual(errors);
      expect(compat.valid).toEqual(false);
      expect(compat.invalid).toEqual(true);
      expect(compat.status).toEqual('INVALID');

      testAllAbstractControlDefaultsExcept(
        control,
        'errors',
        'selfErrors',
        'errorsStore',
        'valid',
        'selfValid',
        'invalid',
        'selfInvalid',
        'status'
      );

      testAllCompatControlDefaultsExcept(
        compat,
        'errors',
        'valid',
        'invalid',
        'status'
      );
    }

    it('from rxControl', () => {
      control.setErrors(errors);
      theTest();
    });

    it('from compat', () => {
      compat.setErrors(errors);
      theTest();
    });
  });

  describe('setErrors null', () => {
    const errors = { required: true };

    function theTest() {
      testAllAbstractControlDefaultsExcept(control);
      testAllCompatControlDefaultsExcept(compat);
    }

    it('from rxControl', () => {
      control.setErrors(errors);
      control.setErrors(null);
      theTest();
    });

    it('from compat', () => {
      compat.setErrors(errors);
      compat.setErrors(null);
      theTest();
    });
  });

  describe('setValue string', () => {
    const value = 'okey';

    function theTest() {
      expect(control.rawValue).toEqual(value);
      expect(control.value).toEqual(value);
      expect(compat.value).toEqual(value);
      testAllAbstractControlDefaultsExcept(control, 'rawValue', 'value');
      testAllCompatControlDefaultsExcept(compat, 'value');
    }

    it('from rxControl', () => {
      control.setValue(value);
      theTest();
    });

    it('from compat', () => {
      compat.setValue(value);
      theTest();
    });
  });

  describe('setValue null', () => {
    const value = 'okey';

    function theTest() {
      testAllAbstractControlDefaultsExcept(control);
      testAllCompatControlDefaultsExcept(compat);
    }

    it('from rxControl', () => {
      control.setValue(value);
      control.setValue(null);
      theTest();
    });

    describe('from compat', () => {
      it('setValue', () => {
        compat.setValue(value);
        compat.setValue(null);
        theTest();
      });

      it('patchValue', () => {
        compat.patchValue(value);
        compat.patchValue(null);
        theTest();
      });
    });
  });

  describe('setValidators', () => {
    const validator = (c: { value: unknown }) =>
      c.value !== 'hi' ? null : { invalidValue: true };

    describe('null value initially', () => {
      function theTest() {
        testAllAbstractControlDefaultsExcept(
          control,
          'validator',
          'validatorStore'
        );

        testAllCompatControlDefaultsExcept(compat, 'validator');
      }

      it('from rxControl', () => {
        control.setValidators(validator);
        expect(control.validator).toEqual(expect.any(Function));
        expect(control.validatorStore).toEqual(
          new Map([[CONTROL_SELF_ID, expect.any(Function)]])
        );
        expect(compat.validator).toEqual(null);
        theTest();
      });

      it('from compat', () => {
        compat.setValidators(validator);
        expect(compat.validator).toEqual(expect.any(Function));
        expect(control.validator).toEqual(null);
        expect(control.validatorStore).toEqual(new Map());
        theTest();
      });
    });

    describe('invalid value initially', () => {
      function theTest() {
        expect(control.rawValue).toEqual('hi');
        expect(control.value).toEqual('hi');
        expect(control.valid).toEqual(false);
        expect(control.selfValid).toEqual(false);
        expect(control.invalid).toEqual(true);
        expect(control.selfInvalid).toEqual(true);
        expect(control.status).toEqual('INVALID');
        expect(control.errors).toEqual({ invalidValue: true });
        expect(control.selfErrors).toEqual({ invalidValue: true });
        expect(control.errorsStore).toEqual(
          new Map([[CONTROL_SELF_ID, { invalidValue: true }]])
        );

        expect(compat.value).toEqual('hi');
        expect(compat.valid).toEqual(false);
        expect(compat.invalid).toEqual(true);
        expect(compat.status).toEqual('INVALID');

        testAllAbstractControlDefaultsExcept(
          control,
          'validator',
          'validatorStore',
          'rawValue',
          'value',
          'valid',
          'selfValid',
          'errors',
          'selfErrors',
          'errorsStore',
          'invalid',
          'selfInvalid',
          'status'
        );

        testAllCompatControlDefaultsExcept(
          compat,
          'validator',
          'value',
          'valid',
          'invalid',
          'errors',
          'status'
        );
      }

      it('from rxControl', () => {
        control.setValue('hi');
        control.setValidators(validator);
        expect(control.validator).toEqual(expect.any(Function));
        expect(control.validatorStore).toEqual(
          new Map([[CONTROL_SELF_ID, expect.any(Function)]])
        );
        expect(compat.validator).toEqual(null);
        theTest();
      });

      it('from compat', () => {
        compat.setValue('hi');
        compat.setValidators(validator);
        compat.updateValueAndValidity();
        expect(compat.validator).toEqual(expect.any(Function));
        expect(control.validator).toEqual(null);
        expect(control.validatorStore).toEqual(new Map());
        theTest();
      });
    });

    describe('invalid to valid', () => {
      function theTest() {
        testAllAbstractControlDefaultsExcept(
          control,
          'validator',
          'validatorStore'
        );

        testAllCompatControlDefaultsExcept(compat, 'validator');
      }

      it('from rxControl', () => {
        control.setValue('hi');
        control.setValidators(validator);
        control.setValue(null);
        expect(control.validator).toEqual(expect.any(Function));
        expect(control.validatorStore).toEqual(
          new Map([[CONTROL_SELF_ID, expect.any(Function)]])
        );
        expect(compat.validator).toEqual(null);
        theTest();
      });

      it('from compat', () => {
        compat.setValue('hi');
        compat.setValidators(validator);
        compat.setValue(null);
        expect(compat.validator).toEqual(expect.any(Function));
        expect(control.validator).toEqual(null);
        expect(control.validatorStore).toEqual(new Map());
        theTest();
      });
    });

    describe('valid to invalid', () => {
      function theTest() {
        expect(control.rawValue).toEqual('hi');
        expect(control.value).toEqual('hi');
        expect(control.valid).toEqual(false);
        expect(control.selfValid).toEqual(false);
        expect(control.invalid).toEqual(true);
        expect(control.selfInvalid).toEqual(true);
        expect(control.status).toEqual('INVALID');
        expect(control.errors).toEqual({ invalidValue: true });
        expect(control.selfErrors).toEqual({ invalidValue: true });
        expect(control.errorsStore).toEqual(
          new Map([[CONTROL_SELF_ID, { invalidValue: true }]])
        );

        expect(compat.value).toEqual('hi');
        expect(compat.valid).toEqual(false);
        expect(compat.invalid).toEqual(true);
        expect(compat.status).toEqual('INVALID');

        testAllAbstractControlDefaultsExcept(
          control,
          'validator',
          'validatorStore',
          'rawValue',
          'value',
          'valid',
          'selfValid',
          'errors',
          'selfErrors',
          'errorsStore',
          'invalid',
          'selfInvalid',
          'status'
        );

        testAllCompatControlDefaultsExcept(
          compat,
          'validator',
          'value',
          'valid',
          'invalid',
          'errors',
          'status'
        );
      }

      it('from rxControl', () => {
        control.setValidators(validator);
        control.setValue('hi');
        expect(control.validator).toEqual(expect.any(Function));
        expect(control.validatorStore).toEqual(
          new Map([[CONTROL_SELF_ID, expect.any(Function)]])
        );
        expect(compat.validator).toEqual(null);
        theTest();
      });

      it('from compat', () => {
        compat.setValidators(validator);
        compat.setValue('hi');
        expect(compat.validator).toEqual(expect.any(Function));
        expect(control.validator).toEqual(null);
        expect(control.validatorStore).toEqual(new Map());
        theTest();
      });
    });
  });
});

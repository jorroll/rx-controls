import { FormControl as OldFormControl } from '@angular/forms';
import { FormControl } from '@service-work/reactive-forms';
import { testAllAbstractControlDefaultsExcept } from '@service-work/reactive-forms/src/lib/models/test-util';
import { CompatFormControl } from './compat-form-control';
import { testAllCompatControlDefaultsExcept } from './test-utils';

describe('CompatFormControl', () => {
  let compat: CompatFormControl;
  let control: FormControl;

  beforeEach(() => {
    control = new FormControl();
    compat = new CompatFormControl(control);
  });

  it('initializes', () => {
    expect(compat).toBeInstanceOf(CompatFormControl);
    expect(compat).toBeInstanceOf(OldFormControl);
    testAllCompatControlDefaultsExcept(compat);
  });

  describe('disabled', () => {
    function theTest() {
      expect(control.disabled).toEqual(true);
      expect(control.enabled).toEqual(false);
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
        'enabled',
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

    it('from swControl', () => {
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

    it('from swControl', () => {
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
      expect(compat.touched).toEqual(true);
      expect(compat.untouched).toEqual(false);

      testAllAbstractControlDefaultsExcept(control, 'touched');
      testAllCompatControlDefaultsExcept(compat, 'touched');
    }

    it('from swControl', () => {
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

    it('from swControl', () => {
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
      expect(compat.dirty).toEqual(true);
      expect(compat.pristine).toEqual(false);

      testAllAbstractControlDefaultsExcept(control, 'dirty');
      testAllCompatControlDefaultsExcept(compat, 'dirty');
    }

    it('from swControl', () => {
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

    it('from swControl', () => {
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
      expect(control.pendingStore).toEqual(new Set([control.id]));
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
        'pendingStore',
        'status'
      );

      testAllCompatControlDefaultsExcept(compat, 'pending', 'status', 'valid');
    }

    it('from swControl', () => {
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

    it('from swControl', () => {
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
      expect(control.errorsStore).toEqual(new Map([[control.id, errors]]));
      expect(control.valid).toEqual(false);
      expect(control.invalid).toEqual(true);
      expect(control.status).toEqual('INVALID');

      expect(compat.errors).toEqual(errors);
      expect(compat.valid).toEqual(false);
      expect(compat.invalid).toEqual(true);
      expect(compat.status).toEqual('INVALID');

      testAllAbstractControlDefaultsExcept(
        control,
        'errors',
        'errorsStore',
        'valid',
        'invalid',
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

    it('from swControl', () => {
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

    it('from swControl', () => {
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
      expect(compat.value).toEqual(value);
      testAllAbstractControlDefaultsExcept(control, 'value');
      testAllCompatControlDefaultsExcept(compat, 'value');
    }

    it('from swControl', () => {
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

    it('from swControl', () => {
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

      it('from swControl', () => {
        control.setValidators(validator);
        expect(control.validator).toEqual(expect.any(Function));
        expect(control.validatorStore).toEqual(
          new Map([[control.id, expect.any(Function)]])
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
        expect(control.valid).toEqual(false);
        expect(control.invalid).toEqual(true);
        expect(control.status).toEqual('INVALID');
        expect(control.errors).toEqual({ invalidValue: true });
        expect(control.errorsStore).toEqual(
          new Map([[control.id, { invalidValue: true }]])
        );

        expect(compat.value).toEqual('hi');
        expect(compat.valid).toEqual(false);
        expect(compat.invalid).toEqual(true);
        expect(compat.status).toEqual('INVALID');

        testAllAbstractControlDefaultsExcept(
          control,
          'validator',
          'validatorStore',
          'value',
          'valid',
          'errors',
          'errorsStore',
          'invalid',
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

      it('from swControl', () => {
        control.setValue('hi');
        control.setValidators(validator);
        expect(control.validator).toEqual(expect.any(Function));
        expect(control.validatorStore).toEqual(
          new Map([[control.id, expect.any(Function)]])
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

      it('from swControl', () => {
        control.setValue('hi');
        control.setValidators(validator);
        control.setValue(null);
        expect(control.validator).toEqual(expect.any(Function));
        expect(control.validatorStore).toEqual(
          new Map([[control.id, expect.any(Function)]])
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
        expect(control.valid).toEqual(false);
        expect(control.invalid).toEqual(true);
        expect(control.status).toEqual('INVALID');
        expect(control.errors).toEqual({ invalidValue: true });
        expect(control.errorsStore).toEqual(
          new Map([[control.id, { invalidValue: true }]])
        );

        expect(compat.value).toEqual('hi');
        expect(compat.valid).toEqual(false);
        expect(compat.invalid).toEqual(true);
        expect(compat.status).toEqual('INVALID');

        testAllAbstractControlDefaultsExcept(
          control,
          'validator',
          'validatorStore',
          'value',
          'valid',
          'errors',
          'errorsStore',
          'invalid',
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

      it('from swControl', () => {
        control.setValidators(validator);
        control.setValue('hi');
        expect(control.validator).toEqual(expect.any(Function));
        expect(control.validatorStore).toEqual(
          new Map([[control.id, expect.any(Function)]])
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

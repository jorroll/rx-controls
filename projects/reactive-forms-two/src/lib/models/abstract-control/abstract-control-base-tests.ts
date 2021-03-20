import { AbstractControl, ControlId, ValidatorFn } from './abstract-control';
import {
  AbstractControlBase,
  IAbstractControlBaseArgs,
} from './abstract-control-base';
import {
  getControlEventsUntilEnd,
  testAllAbstractControlDefaultsExcept,
} from '../test-util';

const testAllDefaultsExcept = testAllAbstractControlDefaultsExcept;

export default function runAbstractControlBaseTestSuite(
  name: string,
  createControlBase: (args?: {
    options?: IAbstractControlBaseArgs;
  }) => AbstractControlBase<any, any, any>
) {
  describe(name, () => {
    let a: AbstractControlBase<any, any, any>;

    beforeEach(() => {
      AbstractControl.eventId(0);
    });

    describe('initialization', () => {
      it('defaults', () => {
        testAllDefaultsExcept(createControlBase());
      });

      describe('options', () => {
        it('id', () => {
          a = createControlBase({ options: { id: 'one' } });

          expect(a.id).toEqual('one');
          testAllDefaultsExcept(a, 'id');
        });

        it('data', () => {
          a = createControlBase({ options: { data: 'one' } });

          expect(a.data).toEqual('one');
          testAllDefaultsExcept(a, 'data');
        });

        it('disabled', () => {
          a = createControlBase({ options: { disabled: true } });

          expect(a).toImplementObject({
            enabled: false,
            disabled: true,
            status: 'DISABLED',
          });

          testAllDefaultsExcept(a, 'enabled', 'disabled', 'status');

          a = createControlBase({ options: { disabled: false } });

          expect(a).toImplementObject({
            enabled: true,
            disabled: false,
          });

          testAllDefaultsExcept(a, 'enabled', 'disabled');
        });

        it('dirty', () => {
          a = createControlBase({ options: { dirty: true } });

          expect(a.dirty).toEqual(true);
          testAllDefaultsExcept(a, 'dirty');

          a = createControlBase({ options: { dirty: false } });

          expect(a.dirty).toEqual(false);
          testAllDefaultsExcept(a, 'dirty');
        });

        it('readonly', () => {
          a = createControlBase({ options: { readonly: true } });

          expect(a.readonly).toEqual(true);
          testAllDefaultsExcept(a, 'readonly');

          a = createControlBase({ options: { readonly: false } });

          expect(a.readonly).toEqual(false);
          testAllDefaultsExcept(a, 'readonly');
        });

        it('submitted', () => {
          a = createControlBase({ options: { submitted: true } });

          expect(a.submitted).toEqual(true);
          testAllDefaultsExcept(a, 'submitted');

          a = createControlBase({ options: { submitted: false } });

          expect(a.submitted).toEqual(false);
          testAllDefaultsExcept(a, 'submitted');
        });

        it('errors', () => {
          a = createControlBase({ options: { errors: { anError: true } } });

          expect(a.errors).toEqual({ anError: true });
          expect(a.errorsStore).toEqual(new Map([[a.id, { anError: true }]]));
          expect(a.valid).toEqual(false);
          expect(a.invalid).toEqual(true);
          expect(a.status).toEqual('INVALID');
          testAllDefaultsExcept(
            a,
            'errors',
            'errorsStore',
            'valid',
            'invalid',
            'status'
          );

          const errors = new Map([['one', { secondError: true }]]);

          a = createControlBase({ options: { errors } });

          expect(a.errors).toEqual(errors.get('one'));
          expect(a.errorsStore).toEqual(errors);
          expect(a.valid).toEqual(false);
          expect(a.invalid).toEqual(true);
          expect(a.status).toEqual('INVALID');
          testAllDefaultsExcept(
            a,
            'errors',
            'errorsStore',
            'valid',
            'invalid',
            'status'
          );

          a = createControlBase({ options: { errors: null } });

          expect(a.errors).toEqual(null);
          expect(a.errorsStore).toEqual(new Map());
          expect(a.valid).toEqual(true);
          expect(a.invalid).toEqual(false);
          expect(a.status).toEqual('VALID');
          testAllDefaultsExcept(
            a,
            'errors',
            'errorsStore',
            'valid',
            'invalid',
            'status'
          );
        });

        it('validator', () => {
          let validators:
            | ValidatorFn
            | ValidatorFn[]
            | Map<ControlId, ValidatorFn> = (a) => null;

          a = createControlBase({ options: { validators } });

          expect(a.validator).toEqual(expect.any(Function));
          expect(a.validatorStore).toEqual(new Map([[a.id, validators]]));
          expect(a.valid).toEqual(true);
          expect(a.invalid).toEqual(false);
          expect(a.errors).toEqual(null);
          expect(a.errorsStore).toEqual(new Map());
          expect(a.status).toEqual('VALID');
          testAllDefaultsExcept(
            a,
            'validator',
            'validatorStore',
            'valid',
            'invalid',
            'errors',
            'errorsStore',
            'status'
          );

          validators = [() => null, () => ({ error: true })];

          a = createControlBase({ options: { validators } });

          expect(a.validator).toEqual(expect.any(Function));
          expect(a.validatorStore).toEqual(
            new Map([[a.id, expect.any(Function)]])
          );
          expect(a.valid).toEqual(false);
          expect(a.invalid).toEqual(true);
          expect(a.errors).toEqual({ error: true });
          expect(a.errorsStore).toEqual(new Map([[a.id, { error: true }]]));
          expect(a.status).toEqual('INVALID');
          testAllDefaultsExcept(
            a,
            'validator',
            'validatorStore',
            'valid',
            'invalid',
            'errors',
            'errorsStore',
            'status'
          );

          const fn1 = (() => null) as ValidatorFn;
          const fn2 = (() => ({ error: true })) as ValidatorFn;

          validators = new Map([
            ['one', fn1],
            ['two', fn2],
          ]);

          a = createControlBase({ options: { validators } });

          expect(a.validator).toEqual(expect.any(Function));
          expect(a.validatorStore).toEqual(
            new Map([
              ['one', fn1],
              ['two', fn2],
            ])
          );
          expect(a.valid).toEqual(false);
          expect(a.invalid).toEqual(true);
          expect(a.errors).toEqual({ error: true });
          expect(a.errorsStore).toEqual(new Map([[a.id, { error: true }]]));
          expect(a.status).toEqual('INVALID');
          testAllDefaultsExcept(
            a,
            'validator',
            'validatorStore',
            'valid',
            'invalid',
            'errors',
            'errorsStore',
            'status'
          );

          a = createControlBase({ options: { validators: null } });

          expect(a.validator).toEqual(null);
          expect(a.validatorStore).toEqual(new Map());
          expect(a.valid).toEqual(true);
          expect(a.invalid).toEqual(false);
          expect(a.errors).toEqual(null);
          expect(a.errorsStore).toEqual(new Map());
          expect(a.status).toEqual('VALID');
          testAllDefaultsExcept(
            a,
            'validator',
            'validatorStore',
            'valid',
            'invalid',
            'errors',
            'errorsStore',
            'status'
          );
        });

        it('pending', () => {
          a = createControlBase({ options: { pending: true } });

          expect(a.pending).toEqual(true);
          expect(a.pendingStore).toEqual(new Set([a.id]));
          expect(a.status).toEqual('PENDING');
          testAllDefaultsExcept(a, 'pending', 'pendingStore', 'status');

          a = createControlBase({ options: { pending: new Set(['one']) } });

          expect(a.pending).toEqual(true);
          expect(a.pendingStore).toEqual(new Set(['one']));
          expect(a.status).toEqual('PENDING');
          testAllDefaultsExcept(a, 'pending', 'pendingStore', 'status');

          a = createControlBase({ options: { pending: false } });

          expect(a.pending).toEqual(false);
          expect(a.pendingStore).toEqual(new Set());
          expect(a.status).toEqual('VALID');
          testAllDefaultsExcept(a, 'pending', 'pendingStore', 'status');
        });
      });
    });
  });
}

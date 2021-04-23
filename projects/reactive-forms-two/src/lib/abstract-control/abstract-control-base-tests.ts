import {
  AbstractControl,
  ControlId,
  IControlStateChangeEvent,
  ValidatorFn,
} from './abstract-control';
import {
  AbstractControlBase,
  CONTROL_SELF_ID,
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
  describe(`AbstractControlBase`, () => {
    let a: AbstractControlBase<any, any, any>;

    beforeEach(() => {
      // AbstractControl.eventId(0);
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
            selfEnabled: false,
            disabled: true,
            selfDisabled: true,
            status: 'DISABLED',
          });

          testAllDefaultsExcept(
            a,
            'enabled',
            'selfEnabled',
            'disabled',
            'selfDisabled',
            'status'
          );

          a = createControlBase({ options: { disabled: false } });

          testAllDefaultsExcept(a);
        });

        it('dirty', () => {
          a = createControlBase({ options: { dirty: true } });

          expect(a).toImplementObject({
            dirty: true,
            selfDirty: true,
          });

          testAllDefaultsExcept(a, 'dirty', 'selfDirty');

          a = createControlBase({ options: { dirty: false } });

          testAllDefaultsExcept(a);
        });

        it('readonly', () => {
          a = createControlBase({ options: { readonly: true } });

          expect(a).toImplementObject({
            readonly: true,
            selfReadonly: true,
          });

          testAllDefaultsExcept(a, 'readonly', 'selfReadonly');

          a = createControlBase({ options: { readonly: false } });

          testAllDefaultsExcept(a);
        });

        it('submitted', () => {
          a = createControlBase({ options: { submitted: true } });

          expect(a).toImplementObject({
            submitted: true,
            selfSubmitted: true,
          });

          testAllDefaultsExcept(a, 'submitted', 'selfSubmitted');

          a = createControlBase({ options: { submitted: false } });

          testAllDefaultsExcept(a);
        });

        it('errors', () => {
          a = createControlBase({ options: { errors: { anError: true } } });

          expect(a).toImplementObject({
            errors: { anError: true },
            selfErrors: { anError: true },
            errorsStore: new Map([[CONTROL_SELF_ID, { anError: true }]]),
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          testAllDefaultsExcept(
            a,
            'errors',
            'selfErrors',
            'errorsStore',
            'valid',
            'selfValid',
            'invalid',
            'selfInvalid',
            'status'
          );

          const errors = new Map([['one', { secondError: true }]]);

          a = createControlBase({ options: { errors } });

          expect(a).toImplementObject({
            errors: errors.get('one'),
            selfErrors: errors.get('one'),
            errorsStore: errors,
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          testAllDefaultsExcept(
            a,
            'errors',
            'selfErrors',
            'errorsStore',
            'valid',
            'selfValid',
            'invalid',
            'selfInvalid',
            'status'
          );

          a = createControlBase({ options: { errors: null } });

          testAllDefaultsExcept(a);
        });

        it('validator', () => {
          let validators:
            | ValidatorFn
            | ValidatorFn[]
            | Map<ControlId, ValidatorFn> = (a) => null;

          a = createControlBase({ options: { validators } });

          expect(a).toImplementObject({
            validator: expect.any(Function),
            validatorStore: new Map([[CONTROL_SELF_ID, validators]]),
          });

          testAllDefaultsExcept(a, 'validator', 'validatorStore');

          validators = [() => null, () => ({ error: true })];

          a = createControlBase({ options: { validators } });

          expect(a).toImplementObject({
            validator: expect.any(Function),
            validatorStore: new Map([[CONTROL_SELF_ID, expect.any(Function)]]),
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            errors: { error: true },
            selfErrors: { error: true },
            errorsStore: new Map([[CONTROL_SELF_ID, { error: true }]]),
            status: 'INVALID',
          });

          testAllDefaultsExcept(
            a,
            'validator',
            'validatorStore',
            'valid',
            'selfValid',
            'invalid',
            'selfInvalid',
            'errors',
            'selfErrors',
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

          expect(a).toImplementObject({
            validator: expect.any(Function),
            validatorStore: new Map([
              ['one', fn1],
              ['two', fn2],
            ]),
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            errors: { error: true },
            selfErrors: { error: true },
            errorsStore: new Map([[CONTROL_SELF_ID, { error: true }]]),
            status: 'INVALID',
          });

          testAllDefaultsExcept(
            a,
            'validator',
            'validatorStore',
            'valid',
            'selfValid',
            'invalid',
            'selfInvalid',
            'errors',
            'selfErrors',
            'errorsStore',
            'status'
          );

          a = createControlBase({ options: { validators: null } });

          testAllDefaultsExcept(a);
        });

        it('pending', () => {
          a = createControlBase({ options: { pending: true } });

          expect(a).toImplementObject({
            pending: true,
            selfPending: true,
            pendingStore: new Set([CONTROL_SELF_ID]),
            status: 'PENDING',
          });

          testAllDefaultsExcept(
            a,
            'pending',
            'selfPending',
            'pendingStore',
            'status'
          );

          a = createControlBase({ options: { pending: new Set(['one']) } });

          expect(a).toImplementObject({
            pending: true,
            selfPending: true,
            pendingStore: new Set(['one']),
            status: 'PENDING',
          });

          testAllDefaultsExcept(
            a,
            'pending',
            'selfPending',
            'pendingStore',
            'status'
          );

          a = createControlBase({ options: { pending: false } });

          testAllDefaultsExcept(a);
        });
      });
    });

    describe('processEvent', () => {
      beforeEach(() => {
        a = createControlBase();
      });

      describe('StateChange', () => {
        let e: IControlStateChangeEvent | null = null;

        beforeEach(() => {
          e = null;
        });

        it('selfDisabled', () => {
          e = {
            type: 'StateChange',
            source: 'one',
            meta: {},
            debugPath: expect.any(String),
            controlId: expect.any(Symbol),
            changes: {
              selfDisabled: true,
            },
          };

          const result = a.processEvent(e);

          expect(a).toImplementObject({
            disabled: true,
            selfDisabled: true,
            enabled: false,
            selfEnabled: false,
            status: 'DISABLED',
          });

          testAllDefaultsExcept(
            a,
            'disabled',
            'selfDisabled',
            'enabled',
            'selfEnabled',
            'status'
          );

          expect(result.status).toEqual('PROCESSED');
          expect(result.result).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: {
              disabled: true,
              selfDisabled: true,
              enabled: false,
              selfEnabled: false,
              status: 'DISABLED',
            },
          });
        });

        it('selfTouched', () => {
          e = {
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: { selfTouched: true },
          };

          const result = a.processEvent(e);

          expect(a).toImplementObject({
            touched: true,
            selfTouched: true,
          });

          testAllDefaultsExcept(a, 'touched', 'selfTouched');

          expect(result.status).toEqual('PROCESSED');
          expect(result.result).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: {
              touched: true,
              selfTouched: true,
            },
          });
        });

        it('selfDirty', () => {
          e = {
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: { selfDirty: true },
          };

          const result = a.processEvent(e);

          expect(a).toImplementObject({
            dirty: true,
            selfDirty: true,
          });

          testAllDefaultsExcept(a, 'dirty', 'selfDirty');

          expect(result.status).toEqual('PROCESSED');
          expect(result.result).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: {
              dirty: true,
              selfDirty: true,
            },
          });
        });

        it('selfReadonly', () => {
          e = {
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: { selfReadonly: true },
          };

          const result = a.processEvent(e);

          expect(a).toImplementObject({
            readonly: true,
            selfReadonly: true,
          });

          testAllDefaultsExcept(a, 'readonly', 'selfReadonly');

          expect(result.status).toEqual('PROCESSED');
          expect(result.result).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: { readonly: true, selfReadonly: true },
          });
        });

        it('selfSubmitted', () => {
          e = {
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: { selfSubmitted: true },
          };

          const result = a.processEvent(e);

          expect(a).toImplementObject({
            submitted: true,
            selfSubmitted: true,
          });

          testAllDefaultsExcept(a, 'submitted', 'selfSubmitted');

          expect(result.status).toEqual('PROCESSED');
          expect(result.result).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: { submitted: true, selfSubmitted: true },
          });
        });

        it('data', () => {
          e = {
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: { data: { one: true } },
          };

          const result = a.processEvent(e);

          expect(a).toImplementObject({
            data: { one: true },
          });

          testAllDefaultsExcept(a, 'data');

          expect(result.status).toEqual('PROCESSED');
          expect(result.result).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: { data: { one: true } },
          });
        });

        it('validatorStore', () => {
          const validatorStore = new Map([['one', () => null]]);

          e = {
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: { validatorStore },
          };

          const result = a.processEvent(e);

          expect(a).toImplementObject({
            validator: expect.any(Function),
            validatorStore: new Map([['one', expect.any(Function)]]),
          });

          testAllDefaultsExcept(a, 'validator', 'validatorStore');

          expect(result.status).toEqual('PROCESSED');
          expect(result.result).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: {
              validatorStore: new Map([['one', expect.any(Function)]]),
              validator: expect.any(Function),
            },
          });
        });

        it('pendingStore', () => {
          const pendingStore = new Set('one');

          e = {
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: { pendingStore },
          };

          const result = a.processEvent(e);

          expect(a).toImplementObject({
            pending: true,
            selfPending: true,
            pendingStore,
            status: 'PENDING',
          });

          testAllDefaultsExcept(
            a,
            'pending',
            'selfPending',
            'pendingStore',
            'status'
          );

          expect(result.status).toEqual('PROCESSED');
          expect(result.result).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: {
              pendingStore,
              selfPending: true,
              pending: true,
              status: 'PENDING',
            },
          });
        });

        it('errorsStore', () => {
          const errors = { required: true };
          const errorsStore = new Map([['one', errors]]);

          e = {
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: { errorsStore },
          };

          const result = a.processEvent(e);

          expect(a).toImplementObject({
            errors,
            selfErrors: errors,
            errorsStore,
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          testAllDefaultsExcept(
            a,
            'errors',
            'selfErrors',
            'errorsStore',
            'status',
            'valid',
            'selfValid',
            'invalid',
            'selfInvalid'
          );

          expect(result.status).toEqual('PROCESSED');
          expect(result.result).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: 'one',
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: {
              errorsStore,
              selfErrors: errors,
              errors,
              valid: false,
              selfValid: false,
              invalid: true,
              selfInvalid: true,
              status: 'INVALID',
            },
          });
        });
      });
    });
  });
}

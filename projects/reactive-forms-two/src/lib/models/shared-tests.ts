import { Subject } from 'rxjs';
import { takeUntil, toArray } from 'rxjs/operators';
import {
  AbstractControl,
  ControlId,
  IControlStateChangeEvent,
  ValidationErrors,
} from './abstract-control/abstract-control';
import {
  AbstractControlBase,
  CONTROL_SELF_ID,
  IAbstractControlBaseArgs,
} from './abstract-control/abstract-control-base';
import { getControlEventsUntilEnd, setExistingErrors } from './test-util';

export default function runSharedTestSuite(
  name: string,
  createControlBase: (args?: {
    options?: IAbstractControlBaseArgs;
  }) => AbstractControlBase<any, any, any>,
  options: { controlContainer?: boolean } = {}
) {
  const IS_CONTROL_CONTAINER_TEST = !!options.controlContainer;

  describe(`SharedTests`, () => {
    let a: AbstractControlBase<any, any, any>;

    beforeEach(() => {
      // AbstractControl.eventId(0);
      a = createControlBase();
    });

    describe('observe', () => {
      function observeControlUntilEnd<
        T extends AbstractControlBase<any, any, any>
      >(
        control: T,
        prop: keyof T,
        options: { end?: Subject<void>; ignoreNoObserve?: boolean } = {}
      ) {
        const end = options.end || new Subject();

        const promise = control
          .observe(prop, options)
          .pipe(takeUntil(end), toArray())
          .toPromise();

        return [promise, end] as const;
      }

      it('data', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'data');

        const data = { one: true };

        a.setData(data);

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual(undefined);
        expect(event1).toEqual(data);
        expect(event2).toEqual(undefined);
      });

      it('dirty', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'dirty');

        a.markDirty(true);

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual(false);
        expect(event1).toEqual(true);
        expect(event2).toEqual(undefined);
      });

      it('disabled', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'disabled');

        a.markDisabled(true);

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual(false);
        expect(event1).toEqual(true);
        expect(event2).toEqual(undefined);
      });

      it('enabled', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'enabled');

        a.markDisabled(true);

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual(true);
        expect(event1).toEqual(false);
        expect(event2).toEqual(undefined);
      });

      it('errors', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'errors');

        const errors = { required: true };

        a.setErrors(errors);

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual(null);
        expect(event1).toEqual(errors);
        expect(event2).toEqual(undefined);
      });

      it('errorsStore', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'errorsStore');

        const errors = { required: true };

        a.setErrors(errors);

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual(new Map());
        expect(event1).toEqual(new Map([[CONTROL_SELF_ID, errors]]));
        expect(event2).toEqual(undefined);
      });

      it('invalid', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'invalid');

        const errors = { required: true };

        a.setErrors(errors);

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual(false);
        expect(event1).toEqual(true);
        expect(event2).toEqual(undefined);
      });

      it('pending', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'pending');

        a.markPending(true);

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual(false);
        expect(event1).toEqual(true);
        expect(event2).toEqual(undefined);
      });

      it('pendingStore', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'pendingStore');

        a.markPending(true);

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual(new Set());
        expect(event1).toEqual(new Set([CONTROL_SELF_ID]));
        expect(event2).toEqual(undefined);
      });

      it('readonly', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'readonly');

        a.markReadonly(true);

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual(false);
        expect(event1).toEqual(true);
        expect(event2).toEqual(undefined);
      });

      it('status', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'status');

        a.markDisabled(true);

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual('VALID');
        expect(event1).toEqual('DISABLED');
        expect(event2).toEqual(undefined);
      });

      it('submitted', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'submitted');

        a.markSubmitted(true);

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual(false);
        expect(event1).toEqual(true);
        expect(event2).toEqual(undefined);
      });

      it('touched', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'touched');

        a.markTouched(true);

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual(false);
        expect(event1).toEqual(true);
        expect(event2).toEqual(undefined);
      });

      it('valid', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'valid');

        a.setErrors({ required: true });

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual(true);
        expect(event1).toEqual(false);
        expect(event2).toEqual(undefined);
      });

      it('validator', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'validator');

        a.setValidators(() => null);

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual(null);
        expect(event1).toEqual(expect.any(Function));
        expect(event2).toEqual(undefined);
      });

      it('validatorStore', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'validatorStore');

        a.setValidators(() => null);

        end.next();
        end.complete();

        const [event0, event1, event2] = await promise1;

        expect(event0).toEqual(new Map());
        expect(event1).toEqual(
          new Map([[CONTROL_SELF_ID, expect.any(Function)]])
        );
        expect(event2).toEqual(undefined);
      });

      it('parent', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'parent');

        a._setParent(a);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(null);
        expect(event2).toEqual(a);
      });

      describe('options', () => {
        it('noEmit', async () => {
          const [promise1, end] = observeControlUntilEnd(a, 'parent');

          a._setParent(a, { noObserve: true });

          end.next();
          end.complete();

          const [event1, event2] = await promise1;

          expect(event1).toEqual(null);
          expect(event2).toEqual(undefined);
        });

        it('ignoreNoEmit', async () => {
          const [promise1, end] = observeControlUntilEnd(a, 'parent', {
            ignoreNoObserve: true,
          });

          a._setParent(a, { noObserve: true });

          end.next();
          end.complete();

          const [event1, event2] = await promise1;

          expect(event1).toEqual(null);
          expect(event2).toEqual(a);
        });
      });
    });

    describe('observeChanges', () => {
      function observeControlChangesUntilEnd<
        T extends AbstractControlBase<any, any, any>
      >(
        control: T,
        prop: keyof T,
        options: { end?: Subject<void>; ignoreNoObserve?: boolean } = {}
      ) {
        const end = options.end || new Subject();

        const promise = control
          .observeChanges(prop, options)
          .pipe(takeUntil(end), toArray())
          .toPromise();

        return [promise, end] as const;
      }

      it('data', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'data');

        const data = { one: true };

        a.setData(data);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(data);
        expect(event2).toEqual(undefined);
      });

      it('dirty', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'dirty');

        a.markDirty(true);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(true);
        expect(event2).toEqual(undefined);
      });

      it('disabled', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'disabled');

        a.markDisabled(true);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(true);
        expect(event2).toEqual(undefined);
      });

      it('enabled', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'enabled');

        a.markDisabled(true);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(false);
        expect(event2).toEqual(undefined);
      });

      it('errors', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'errors');

        const errors = { required: true };

        a.setErrors(errors);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(errors);
        expect(event2).toEqual(undefined);
      });

      it('errorsStore', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'errorsStore');

        const errors = { required: true };

        a.setErrors(errors);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(new Map([[CONTROL_SELF_ID, errors]]));
        expect(event2).toEqual(undefined);
      });

      it('invalid', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'invalid');

        const errors = { required: true };

        a.setErrors(errors);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(true);
        expect(event2).toEqual(undefined);
      });

      it('pending', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'pending');

        a.markPending(true);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(true);
        expect(event2).toEqual(undefined);
      });

      it('pendingStore', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(
          a,
          'pendingStore'
        );

        a.markPending(true);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(new Set([CONTROL_SELF_ID]));
        expect(event2).toEqual(undefined);
      });

      it('readonly', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'readonly');

        a.markReadonly(true);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(true);
        expect(event2).toEqual(undefined);
      });

      it('status', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'status');

        a.markDisabled(true);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual('DISABLED');
        expect(event2).toEqual(undefined);
      });

      it('submitted', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'submitted');

        a.markSubmitted(true);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(true);
        expect(event2).toEqual(undefined);
      });

      it('touched', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'touched');

        a.markTouched(true);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(true);
        expect(event2).toEqual(undefined);
      });

      it('valid', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'valid');

        a.setErrors({ required: true });

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(false);
        expect(event2).toEqual(undefined);
      });

      it('validator', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'validator');

        a.setValidators(() => null);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(expect.any(Function));
        expect(event2).toEqual(undefined);
      });

      it('validatorStore', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(
          a,
          'validatorStore'
        );

        a.setValidators(() => null);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(
          new Map([[CONTROL_SELF_ID, expect.any(Function)]])
        );
        expect(event2).toEqual(undefined);
      });

      it('parent', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'parent');

        a._setParent(a);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(a);
        expect(event2).toEqual(undefined);
      });

      describe('options', () => {
        it('noEmit', async () => {
          const [promise1, end] = observeControlChangesUntilEnd(a, 'parent');

          a._setParent(a, { noObserve: true });

          end.next();
          end.complete();

          const [event1] = await promise1;

          expect(event1).toEqual(undefined);
        });

        it('ignoreNoEmit', async () => {
          const [promise1, end] = observeControlChangesUntilEnd(a, 'parent', {
            ignoreNoObserve: true,
          });

          a._setParent(a, { noObserve: true });

          end.next();
          end.complete();

          const [event1] = await promise1;

          expect(event1).toEqual(a);
        });
      });
    });

    describe('markTouched', () => {
      it('true', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.markTouched(true);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          touched: true,
          selfTouched: true,
        });

        const [event1] = await promise1;

        expect(event1).toEqual<IControlStateChangeEvent>({
          type: 'StateChange',
          source: a.id,
          meta: {},
          trigger: { label: expect.any(String), source: expect.any(Symbol) },
          changes: new Map([
            ['selfTouched', true],
            ['touched', true],
          ]),
        });
      });

      it('false', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.markTouched(false);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          touched: false,
          selfTouched: false,
        });

        const [event1] = await promise1;

        expect(event1).toEqual(undefined);
      });
    });

    describe('markDirty', () => {
      it('true', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.markDirty(true);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          dirty: true,
          selfDirty: true,
        });

        const [event1] = await promise1;

        expect(event1).toEqual<IControlStateChangeEvent>({
          type: 'StateChange',
          source: a.id,
          meta: {},
          trigger: { label: expect.any(String), source: expect.any(Symbol) },
          changes: new Map([
            ['selfDirty', true],
            ['dirty', true],
          ]),
        });
      });

      it('false', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.markDirty(false);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          dirty: false,
          selfDirty: false,
        });

        const [event1] = await promise1;

        expect(event1).toEqual(undefined);
      });
    });

    describe('markReadonly', () => {
      it('true', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.markReadonly(true);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          readonly: true,
          selfReadonly: true,
        });

        const [event1] = await promise1;

        expect(event1).toEqual<IControlStateChangeEvent>({
          type: 'StateChange',
          source: a.id,
          meta: {},
          trigger: { label: expect.any(String), source: expect.any(Symbol) },
          changes: new Map([
            ['selfReadonly', true],
            ['readonly', true],
          ]),
        });
      });

      it('false', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.markReadonly(false);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          readonly: false,
          selfReadonly: false,
        });

        const [event1] = await promise1;

        expect(event1).toEqual(undefined);
      });
    });

    describe('markDisabled', () => {
      it('true', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.markDisabled(true);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          disabled: true,
          selfDisabled: true,
          enabled: false,
          selfEnabled: false,
          status: 'DISABLED',
        });

        const [event1] = await promise1;

        expect(event1).toEqual<IControlStateChangeEvent>({
          type: 'StateChange',
          source: a.id,
          meta: {},
          trigger: { label: expect.any(String), source: expect.any(Symbol) },
          changes: new Map<string, any>([
            ['selfDisabled', true],
            ['disabled', true],
            ['selfEnabled', false],
            ['enabled', false],
            ['status', 'DISABLED'],
          ]),
        });
      });

      it('false', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.markDisabled(false);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          disabled: false,
          selfDisabled: false,
          enabled: true,
          selfEnabled: true,
          status: 'VALID',
        });

        const [event1] = await promise1;

        expect(event1).toEqual(undefined);
      });
    });

    describe('markSubmitted', () => {
      it('true', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.markSubmitted(true);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          submitted: true,
          selfSubmitted: true,
        });

        const [event1] = await promise1;

        expect(event1).toEqual<IControlStateChangeEvent>({
          type: 'StateChange',
          source: a.id,
          meta: {},
          trigger: { label: expect.any(String), source: expect.any(Symbol) },
          changes: new Map<string, any>([
            ['selfSubmitted', true],
            ['submitted', true],
          ]),
        });
      });

      it('false', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.markSubmitted(false);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          submitted: false,
          selfSubmitted: false,
        });

        const [event1] = await promise1;

        expect(event1).toEqual(undefined);
      });
    });

    describe('markPending', () => {
      describe('boolean', () => {
        it('true', async () => {
          const [promise1, end] = getControlEventsUntilEnd(a);

          a.markPending(true);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            pending: true,
            selfPending: true,
            pendingStore: new Set([CONTROL_SELF_ID]),
            status: 'PENDING',
          });

          const [event1] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: a.id,
            meta: {},
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map<string, any>([
              ['pendingStore', new Set([CONTROL_SELF_ID])],
              ['selfPending', true],
              ['pending', true],
              ['status', 'PENDING'],
            ]),
          });
        });

        it('false', async () => {
          const [promise1, end] = getControlEventsUntilEnd(a);

          a.markPending(false);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            pending: false,
            selfPending: false,
            pendingStore: new Set(),
            status: 'VALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual(undefined);
        });
      });

      describe('pendingStore', () => {
        it('sets new pendingStore', async () => {
          const pendingStore = new Set(['one', a.id]);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.markPending(pendingStore);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            pending: true,
            selfPending: true,
            pendingStore,
            status: 'PENDING',
          });

          const [event1] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: a.id,
            meta: {},
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map<string, any>([
              ['selfPending', true],
              ['pending', true],
              ['pendingStore', pendingStore],
              ['status', 'PENDING'],
            ]),
          });
        });
      });
    });

    describe('setParent', () => {
      it('sets the parent', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a._setParent(a);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          parent: a,
        });

        const [event1] = await promise1;

        expect(event1).toEqual<IControlStateChangeEvent>({
          type: 'StateChange',
          source: a.id,
          meta: {},
          trigger: { label: expect.any(String), source: expect.any(Symbol) },
          changes: new Map([['parent', a]]),
        });
      });
    });

    describe('setData', () => {
      it('when passed data', async () => {
        const data = Symbol('the data');

        const [promise1, end] = getControlEventsUntilEnd(a);

        a.setData(data);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          data,
        });

        const [event1] = await promise1;

        expect(event1).toEqual<IControlStateChangeEvent>({
          type: 'StateChange',
          source: a.id,
          meta: {},
          trigger: { label: expect.any(String), source: expect.any(Symbol) },
          changes: new Map([['data', data]]),
        });
      });
    });
  });

  describe(`SharedTests`, () => {
    let a: AbstractControlBase<unknown, unknown, unknown>;

    beforeEach(() => {
      // AbstractControl.eventId(0);
      a = createControlBase();
    });

    describe('setErrors', () => {
      it('intializes', () => {
        expect(a.errors).toEqual(null);
        expect(a.errorsStore.size).toEqual(0);
      });

      describe('ValidationErrors', () => {
        it('sets a ValidationErrors object for the control', async () => {
          const error = { required: 'This control is required' };
          const errorsStore = new Map([[CONTROL_SELF_ID, error]]);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.setErrors(error);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: error,
            selfErrors: error,
            errorsStore,
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: a.id,
            meta: {},
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map<string, any>([
              ['errorsStore', errorsStore],
              ['selfErrors', error],
              ['errors', error],
              ['valid', false],
              ['selfValid', false],
              ['invalid', true],
              ['selfInvalid', true],
              ['status', 'INVALID'],
            ]),
          });
        });

        it('should not modify errors for other ControlIds', async () => {
          const prexistingError = { required: 'This control is required' };

          setExistingErrors(
            a,
            prexistingError,
            new Map([['one', prexistingError]])
          );

          expect(a).toImplementObject({
            errors: prexistingError,
            selfErrors: prexistingError,
            errorsStore: new Map([['one', prexistingError]]),
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const newError = { spelling: 'Text is mispelled' };
          const newErrorsStore = new Map<ControlId, ValidationErrors>([
            ['one', prexistingError],
            [CONTROL_SELF_ID, newError],
          ]);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.setErrors(newError);

          end.next();
          end.complete();

          const errors = { ...prexistingError, ...newError };

          expect(a).toImplementObject({
            errors,
            selfErrors: errors,
            errorsStore: newErrorsStore,
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: a.id,
            meta: {},
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map<string, any>([
              ['errorsStore', newErrorsStore],
              ['selfErrors', errors],
              ['errors', errors],
            ]),
          });
        });

        it('should replace existing errors for this ControlId', async () => {
          const prexistingError = { required: 'This control is required' };

          setExistingErrors(
            a,
            prexistingError,
            new Map([[CONTROL_SELF_ID, prexistingError]])
          );

          expect(a).toImplementObject({
            errors: prexistingError,
            selfErrors: prexistingError,
            errorsStore: new Map([[CONTROL_SELF_ID, prexistingError]]),
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const newError = { spelling: 'Text is mispelled' };
          const newErrorsStore = new Map<ControlId, ValidationErrors>([
            [CONTROL_SELF_ID, newError],
          ]);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.setErrors(newError);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: newError,
            selfErrors: newError,
            errorsStore: newErrorsStore,
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: a.id,
            meta: {},
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map<string, any>([
              ['errorsStore', newErrorsStore],
              ['selfErrors', newError],
              ['errors', newError],
            ]),
          });
        });

        it('should treat {} as null', async () => {
          const prexistingError = { required: 'This control is required' };

          setExistingErrors(
            a,
            prexistingError,
            new Map([[CONTROL_SELF_ID, prexistingError]])
          );

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.setErrors({});

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: null,
            selfErrors: null,
            errorsStore: new Map(),
            valid: true,
            selfValid: true,
            invalid: false,
            selfInvalid: false,
            status: 'VALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: a.id,
            meta: {},
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map<string, any>([
              ['errorsStore', new Map()],
              ['selfErrors', null],
              ['errors', null],
              ['valid', true],
              ['selfValid', true],
              ['invalid', false],
              ['selfInvalid', false],
              ['status', 'VALID'],
            ]),
          });
        });
      });

      describe('errorsStore', () => {
        it('should set the errorsStore for the control', async () => {
          const error1 = { required: 'This control is required' };
          const error2 = { spelling: 'Text is mispelled' };
          const errorsStore = new Map<ControlId, ValidationErrors>([
            [CONTROL_SELF_ID, error1],
            ['two', error2],
          ]);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.setErrors(errorsStore);

          end.next();
          end.complete();

          const errors = { ...error1, ...error2 };

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

          const [event1] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: a.id,
            meta: {},
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map<string, any>([
              ['errorsStore', errorsStore],
              ['selfErrors', errors],
              ['errors', errors],
              ['valid', false],
              ['selfValid', false],
              ['invalid', true],
              ['selfInvalid', true],
              ['status', 'INVALID'],
            ]),
          });
        });
      });

      describe('null', () => {
        it('noop on valid control', async () => {
          const [promise1, end] = getControlEventsUntilEnd(a);

          a.setErrors(null);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: null,
            selfErrors: null,
            errorsStore: new Map(),
            valid: true,
            selfValid: true,
            invalid: false,
            selfInvalid: false,
            status: 'VALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual(undefined);
        });

        it('should clear existing errors for this ControlId', async () => {
          const prexistingError = { required: 'This control is required' };
          const preexistingErrorsStore = new Map([
            [CONTROL_SELF_ID, prexistingError],
          ]);

          setExistingErrors(a, prexistingError, preexistingErrorsStore);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.setErrors(null);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: null,
            selfErrors: null,
            errorsStore: new Map(),
            valid: true,
            selfValid: true,
            invalid: false,
            selfInvalid: false,
            status: 'VALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: a.id,
            meta: {},
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map<string, any>([
              ['errorsStore', new Map()],
              ['selfErrors', null],
              ['errors', null],
              ['valid', true],
              ['selfValid', true],
              ['invalid', false],
              ['selfInvalid', false],
              ['status', 'VALID'],
            ]),
          });
        });

        it('should ignore errors for other ControlIds', async () => {
          const prexistingError = { required: 'This control is required' };
          const preexistingErrorsStore = new Map([['one', prexistingError]]);

          setExistingErrors(a, prexistingError, preexistingErrorsStore);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.setErrors(null);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: prexistingError,
            selfErrors: prexistingError,
            errorsStore: new Map([['one', prexistingError]]),
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual(undefined);
        });
      });
    });

    describe('patchErrors', () => {
      describe('ValidationErrors', () => {
        it('should ignore {}', async () => {
          const prexistingError = { required: 'This control is required' };
          const preexistingErrorsStore = new Map([
            [CONTROL_SELF_ID, prexistingError],
          ]);

          setExistingErrors(a, prexistingError, preexistingErrorsStore);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.patchErrors({});

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: prexistingError,
            selfErrors: prexistingError,
            errorsStore: preexistingErrorsStore,
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual(undefined);
        });

        it('should set errors if none exist', async () => {
          const error: ValidationErrors = { error: true };

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.patchErrors(error);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: error,
            selfErrors: error,
            errorsStore: new Map([[CONTROL_SELF_ID, error]]),
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: a.id,
            meta: {},
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map<string, any>([
              ['errorsStore', new Map([[CONTROL_SELF_ID, error]])],
              ['errors', error],
              ['selfErrors', error],
              ['valid', false],
              ['selfValid', false],
              ['invalid', true],
              ['selfInvalid', true],
              ['status', 'INVALID'],
            ]),
          });
        });

        it('should merge into existing errors', async () => {
          const prexistingError = { required: 'This control is required' };
          const preexistingErrorsStore = new Map([
            [CONTROL_SELF_ID, prexistingError],
          ]);

          setExistingErrors(a, prexistingError, preexistingErrorsStore);

          expect(a).toImplementObject({
            errors: prexistingError,
            selfErrors: prexistingError,
            errorsStore: preexistingErrorsStore,
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [promise1, end] = getControlEventsUntilEnd(a);

          const newError = { anotherError: true };

          a.patchErrors(newError);

          end.next();
          end.complete();

          const errors = { ...prexistingError, ...newError };

          expect(a).toImplementObject({
            errors,
            selfErrors: errors,
            errorsStore: preexistingErrorsStore.set(CONTROL_SELF_ID, errors),
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: a.id,
            meta: {},
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map<string, any>([
              ['errorsStore', preexistingErrorsStore],
              ['selfErrors', errors],
              ['errors', errors],
            ]),
          });
        });

        it('should delete existing error', async () => {
          const prexistingError = { required: 'This control is required' };
          const preexistingErrorsStore = new Map([
            [CONTROL_SELF_ID, prexistingError],
          ]);

          setExistingErrors(a, prexistingError, preexistingErrorsStore);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.patchErrors({ required: null });

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: null,
            selfErrors: null,
            errorsStore: new Map(),
            valid: true,
            selfValid: true,
            invalid: false,
            selfInvalid: false,
            status: 'VALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: a.id,
            meta: {},
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map<string, any>([
              ['errorsStore', new Map()],
              ['selfErrors', null],
              ['errors', null],
              ['valid', true],
              ['selfValid', true],
              ['invalid', false],
              ['selfInvalid', false],
              ['status', 'VALID'],
            ]),
          });
        });

        it('should ignore errors for other ControlIds', async () => {
          const prexistingError = { required: 'This control is required' };
          const preexistingErrorsStore = new Map([['one', prexistingError]]);

          setExistingErrors(a, prexistingError, preexistingErrorsStore);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.patchErrors({ required: null });

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: prexistingError,
            selfErrors: prexistingError,
            errorsStore: preexistingErrorsStore,
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual(undefined);
        });
      });

      describe('errorsStore', () => {
        it('should ignore empty map', async () => {
          const prexistingError = { required: 'This control is required' };
          const preexistingErrorsStore = new Map([[a.id, prexistingError]]);

          setExistingErrors(a, prexistingError, preexistingErrorsStore);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.patchErrors(new Map());

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: prexistingError,
            selfErrors: prexistingError,
            errorsStore: preexistingErrorsStore,
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual(undefined);
        });

        it('should set errors if none exist', async () => {
          const errorsStore = new Map([[a.id, { error: true }]]);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.patchErrors(errorsStore);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: errorsStore.get(a.id),
            selfErrors: errorsStore.get(a.id),
            errorsStore,
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: a.id,
            meta: {},
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map<string, any>([
              ['errorsStore', errorsStore],
              ['selfErrors', errorsStore.get(a.id)],
              ['errors', errorsStore.get(a.id)],
              ['valid', false],
              ['selfValid', false],
              ['invalid', true],
              ['selfInvalid', true],
              ['status', 'INVALID'],
            ]),
          });
        });

        it('should merge into existing errors', async () => {
          const preexistingErrorsStore = new Map([
            [a.id, { required: false }],
            ['one', { text: false }],
          ]);
          const preexistingError = { required: false, text: false };

          setExistingErrors(a, preexistingError, preexistingErrorsStore);

          expect(a).toImplementObject({
            errors: preexistingError,
            selfErrors: preexistingError,
            errorsStore: preexistingErrorsStore,
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [promise1, end] = getControlEventsUntilEnd(a);

          const newErrorsStore = new Map([
            ['one', { anotherError: true }],
            ['two', { three: true }],
          ]);

          a.patchErrors(newErrorsStore);

          end.next();
          end.complete();

          const errors = { required: false, anotherError: true, three: true };
          const errorsStore = new Map([
            ...preexistingErrorsStore,
            ...newErrorsStore,
          ] as any);

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

          const [event1] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: a.id,
            meta: {},
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map<string, any>([
              ['errorsStore', errorsStore],
              ['selfErrors', errors],
              ['errors', errors],
            ]),
          });
        });

        it('should replace existing error', async () => {
          const prexistingError = { required: 'This control is required' };
          const preexistingErrorsStore = new Map([['one', prexistingError]]);

          setExistingErrors(a, prexistingError, preexistingErrorsStore);

          expect(a).toImplementObject({
            errors: prexistingError,
            selfErrors: prexistingError,
            errorsStore: preexistingErrorsStore,
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [promise1, end] = getControlEventsUntilEnd(a);

          const errorsStore = new Map([['one', { required: null }]]);

          a.patchErrors(errorsStore);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: { required: null },
            selfErrors: { required: null },
            errorsStore,
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: a.id,
            meta: {},
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map<string, any>([
              ['errorsStore', errorsStore],
              ['selfErrors', { required: null }],
              ['errors', { required: null }],
            ]),
          });
        });

        it('should ignore errors for other ControlIds', async () => {
          const preexistingError = { required: 'This control is required' };
          const preexistingErrorsStore = new Map([['one', preexistingError]]);

          setExistingErrors(a, preexistingError, preexistingErrorsStore);

          expect(a).toImplementObject({
            errors: preexistingError,
            selfErrors: preexistingError,
            errorsStore: preexistingErrorsStore,
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [promise1, end] = getControlEventsUntilEnd(a);

          const errorsStore = new Map([[a.id, { required: null }]]);

          a.patchErrors(errorsStore);

          end.next();
          end.complete();

          const errors = { ...preexistingError, required: null };

          expect(a).toImplementObject({
            errors,
            selfErrors: errors,
            errorsStore: new Map([
              ...preexistingErrorsStore,
              ...errorsStore,
            ] as any),
            valid: false,
            selfValid: false,
            invalid: true,
            selfInvalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: a.id,
            meta: {},
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map<string, any>([
              [
                'errorsStore',
                new Map([...preexistingErrorsStore, ...errorsStore] as any),
              ],
              ['selfErrors', errors],
              ['errors', errors],
            ]),
          });
        });
      });
    });
  });
}

// testAllDefaultsExcept(
//   b,
//   'value',
//   'rawValue',
//   'controls',
//   'id',
//   'data',
//   'valid',
//   'invalid',
//   'status',
//   'enabled',
//   'disabled',
//   'dirty',
//   'readonly',
//   'submitted',
//   'errors',
//   'errorsStore',
//   'validator',
//   'validatorStore',
//   'pending',
//   'pendingStore',
//   'parent',
//   'childDirty',
//   'childDisabled',
//   'childInvalid',
//   'childPending',
//   'childReadonly',
//   'childSubmitted',
//   'childTouched',
//   'childValid',
//   'childrenDirty',
//   'childrenDisabled',
//   'childrenErrors',
//   'childrenInvalid',
//   'childrenPending',
//   'childrenReadonly',
//   'childrenSubmitted',
//   'childrenTouched',
//   'childrenValid',
//   'containerDirty',
//   'containerDisabled',
//   'containerErrors',
//   'containerInvalid',
//   'containerPending',
//   'containerReadonly',
//   'containerSubmitted',
//   'containerTouched',
//   'containerValid',
//   'controlsStore'
// );

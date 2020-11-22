import { Subject } from 'rxjs';
import { takeUntil, toArray } from 'rxjs/operators';
import {
  AbstractControl,
  ControlId,
  ValidationErrors,
} from './abstract-control/abstract-control';
import {
  AbstractControlBase,
  IAbstractControlBaseArgs,
} from './abstract-control/abstract-control-base';
import { getControlEventsUntilEnd, setExistingErrors } from './test-util';

export default function runSharedTestSuite(
  name: string,
  createControlBase: (args?: {
    options?: IAbstractControlBaseArgs;
  }) => AbstractControlBase,
  options: { controlContainer?: boolean } = {}
) {
  const IS_CONTROL_CONTAINER_TEST = !!options.controlContainer;

  describe(name, () => {
    let a: AbstractControlBase;

    beforeEach(() => {
      AbstractControl.eventId(0);
      a = createControlBase();
    });

    describe('observe', () => {
      function observeControlUntilEnd<T extends AbstractControlBase>(
        control: T,
        prop: keyof T,
        options: { end?: Subject<void>; ignoreNoEmit?: boolean } = {}
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
        expect(event1).toEqual(new Map([[a.id, errors]]));
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
        expect(event1).toEqual(new Set([a.id]));
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
        expect(event1).toEqual(new Map([[a.id, expect.any(Function)]]));
        expect(event2).toEqual(undefined);
      });

      it('parent', async () => {
        const [promise1, end] = observeControlUntilEnd(a, 'parent');

        a.setParent(a);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(null);
        expect(event2).toEqual(a);
      });

      describe('options', () => {
        it('noEmit', async () => {
          const [promise1, end] = observeControlUntilEnd(a, 'parent');

          a.setParent(a, { noEmit: true });

          end.next();
          end.complete();

          const [event1, event2] = await promise1;

          expect(event1).toEqual(null);
          expect(event2).toEqual(undefined);
        });

        it('ignoreNoEmit', async () => {
          const [promise1, end] = observeControlUntilEnd(a, 'parent', {
            ignoreNoEmit: true,
          });

          a.setParent(a, { noEmit: true });

          end.next();
          end.complete();

          const [event1, event2] = await promise1;

          expect(event1).toEqual(null);
          expect(event2).toEqual(a);
        });
      });
    });

    describe('observeChanges', () => {
      function observeControlChangesUntilEnd<T extends AbstractControlBase>(
        control: T,
        prop: keyof T,
        options: { end?: Subject<void>; ignoreNoEmit?: boolean } = {}
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

        expect(event1).toEqual(new Map([[a.id, errors]]));
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

        expect(event1).toEqual(new Set([a.id]));
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

        expect(event1).toEqual(new Map([[a.id, expect.any(Function)]]));
        expect(event2).toEqual(undefined);
      });

      it('parent', async () => {
        const [promise1, end] = observeControlChangesUntilEnd(a, 'parent');

        a.setParent(a);

        end.next();
        end.complete();

        const [event1, event2] = await promise1;

        expect(event1).toEqual(a);
        expect(event2).toEqual(undefined);
      });

      describe('options', () => {
        it('noEmit', async () => {
          const [promise1, end] = observeControlChangesUntilEnd(a, 'parent');

          a.setParent(a, { noEmit: true });

          end.next();
          end.complete();

          const [event1] = await promise1;

          expect(event1).toEqual(undefined);
        });

        it('ignoreNoEmit', async () => {
          const [promise1, end] = observeControlChangesUntilEnd(a, 'parent', {
            ignoreNoEmit: true,
          });

          a.setParent(a, { noEmit: true });

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
        });

        const [event1] = await promise1;

        const changedProps = IS_CONTROL_CONTAINER_TEST
          ? ['containerTouched']
          : [];

        expect(event1).toEqual({
          type: 'StateChange',
          eventId: expect.any(Number),
          idOfOriginatingEvent: expect.any(Number),
          source: a.id,
          meta: {},
          change: {
            touched: expect.any(Function),
          },
          changedProps,
        });
      });

      it('false', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.markTouched(false);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          touched: false,
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
        });

        const [event1] = await promise1;

        const changedProps = IS_CONTROL_CONTAINER_TEST
          ? ['containerDirty']
          : [];

        expect(event1).toEqual({
          type: 'StateChange',
          eventId: expect.any(Number),
          idOfOriginatingEvent: expect.any(Number),
          source: a.id,
          meta: {},
          change: {
            dirty: expect.any(Function),
          },
          changedProps,
        });
      });

      it('false', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.markDirty(false);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          dirty: false,
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
        });

        const [event1] = await promise1;

        const changedProps = IS_CONTROL_CONTAINER_TEST
          ? ['containerReadonly']
          : [];

        expect(event1).toEqual({
          type: 'StateChange',
          eventId: expect.any(Number),
          idOfOriginatingEvent: expect.any(Number),
          source: a.id,
          meta: {},
          change: {
            readonly: expect.any(Function),
          },
          changedProps,
        });
      });

      it('false', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.markReadonly(false);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          readonly: false,
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
          status: 'DISABLED',
        });

        const [event1] = await promise1;

        const changedProps = IS_CONTROL_CONTAINER_TEST
          ? ['containerDisabled']
          : [];

        expect(event1).toEqual({
          type: 'StateChange',
          eventId: expect.any(Number),
          idOfOriginatingEvent: expect.any(Number),
          source: a.id,
          meta: {},
          change: {
            disabled: expect.any(Function),
          },
          changedProps: expect.arrayContaining([...changedProps, 'status']),
        });
      });

      it('false', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.markDisabled(false);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          disabled: false,
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
        });

        const [event1] = await promise1;

        const changedProps = IS_CONTROL_CONTAINER_TEST
          ? ['containerSubmitted']
          : [];

        expect(event1).toEqual({
          type: 'StateChange',
          eventId: expect.any(Number),
          idOfOriginatingEvent: expect.any(Number),
          source: a.id,
          meta: {},
          change: {
            submitted: expect.any(Function),
          },
          changedProps,
        });
      });

      it('false', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.markSubmitted(false);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          submitted: false,
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
            pendingStore: new Set([a.id]),
            status: 'PENDING',
          });

          const [event1] = await promise1;

          const changedProps = IS_CONTROL_CONTAINER_TEST
            ? ['containerPending']
            : [];

          expect(event1).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            meta: {},
            change: {
              pendingStore: expect.any(Function),
            },
            changedProps: expect.arrayContaining([
              ...changedProps,
              'pending',
              'status',
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
            pendingStore,
            status: 'PENDING',
          });

          const [event1] = await promise1;

          const changedProps = IS_CONTROL_CONTAINER_TEST
            ? ['containerPending']
            : [];

          expect(event1).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            meta: {},
            change: {
              pendingStore: expect.any(Function),
            },
            changedProps: expect.arrayContaining([
              ...changedProps,
              'pending',
              'status',
            ]),
          });
        });
      });
    });

    describe('setParent', () => {
      it('sets the parent', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.setParent(a);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          parent: a,
        });

        const [event1] = await promise1;

        expect(event1).toEqual({
          type: 'StateChange',
          eventId: expect.any(Number),
          idOfOriginatingEvent: expect.any(Number),
          source: a.id,
          meta: {},
          change: {
            parent: expect.any(Function),
          },
          changedProps: [],
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

        expect(event1).toEqual({
          type: 'StateChange',
          eventId: expect.any(Number),
          idOfOriginatingEvent: expect.any(Number),
          source: a.id,
          meta: {},
          change: {
            data: expect.any(Function),
          },
          changedProps: [],
        });
      });

      it('when passed a function', async () => {
        const data = (old: any) => [...old, 'two'];

        a.data = ['one'];

        const [promise1, end] = getControlEventsUntilEnd(a);

        a.setData(data);

        end.next();
        end.complete();

        expect(a).toImplementObject({
          data: ['one', 'two'],
        });

        const [event1] = await promise1;

        expect(event1).toEqual({
          type: 'StateChange',
          eventId: expect.any(Number),
          idOfOriginatingEvent: expect.any(Number),
          source: a.id,
          meta: {},
          change: {
            data: expect.any(Function),
          },
          changedProps: [],
        });
      });
    });

    describe('emitEvent', () => {
      it('ignores unknown event', async () => {
        const [promise1, end] = getControlEventsUntilEnd(a);

        a.emitEvent({ type: 'CustomEvent' });

        end.next();
        end.complete();

        const [event1] = await promise1;

        expect(event1).toEqual(undefined);
      });

      it('accepts options', async () => {
        const end = new Subject();
        const promise1 = a.source.pipe(takeUntil(end), toArray()).toPromise();

        a.emitEvent(
          {
            type: 'CustomEvent',
            noEmit: true,
            myCustomProp: {
              three: true,
            },
          },
          {
            idOfOriginatingEvent: 2,
            meta: { two: true },
            noEmit: false,
            source: 'two',
          }
        );

        end.next();
        end.complete();

        const [event1] = await promise1;

        expect(event1).toEqual({
          type: 'CustomEvent',
          eventId: expect.any(Number),
          idOfOriginatingEvent: 2,
          source: 'two',
          meta: { two: true },
          noEmit: true,
          myCustomProp: {
            three: true,
          },
        });
      });

      it('primary args take precidence over options', async () => {
        const end = new Subject();
        const promise1 = a.source.pipe(takeUntil(end), toArray()).toPromise();

        a.emitEvent(
          {
            type: 'CustomEvent',
            idOfOriginatingEvent: 3,
            meta: { one: true },
            noEmit: true,
            source: 'one',
            myCustomProp: {
              three: true,
            },
          },
          {
            idOfOriginatingEvent: 2,
            meta: { two: true },
            noEmit: false,
            source: 'two',
          }
        );

        end.next();
        end.complete();

        const [event1] = await promise1;

        expect(event1).toEqual({
          type: 'CustomEvent',
          eventId: expect.any(Number),
          idOfOriginatingEvent: 3,
          source: 'one',
          meta: { one: true },
          noEmit: true,
          myCustomProp: {
            three: true,
          },
        });
      });
    });
  });

  describe(name, () => {
    const ERRORS_SIDE_EFFECTS = IS_CONTROL_CONTAINER_TEST
      ? ['errors', 'containerErrors']
      : ['errors'];

    let a: AbstractControlBase;

    beforeEach(() => {
      AbstractControl.eventId(0);
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
          const errorsStore = new Map([[a.id, error]]);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.setErrors(error);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: error,
            errorsStore,
            valid: false,
            invalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            changedProps: expect.arrayContaining([
              ...ERRORS_SIDE_EFFECTS,
              'status',
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

          const newError = { spelling: 'Text is mispelled' };
          const newErrorsStore = new Map<ControlId, ValidationErrors>([
            [a.id, newError],
            ['one', prexistingError],
          ]);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.setErrors(newError);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: { ...prexistingError, ...newError },
            errorsStore: newErrorsStore,
            valid: false,
            invalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            changedProps: expect.arrayContaining(ERRORS_SIDE_EFFECTS),
          });
        });

        it('should replace existing errors for this ControlId', async () => {
          const prexistingError = { required: 'This control is required' };

          setExistingErrors(
            a,
            prexistingError,
            new Map([[a.id, prexistingError]])
          );

          const newError = { spelling: 'Text is mispelled' };
          const newErrorsStore = new Map<ControlId, ValidationErrors>([
            [a.id, newError],
          ]);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.setErrors(newError);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: newError,
            errorsStore: newErrorsStore,
            valid: false,
            invalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            changedProps: expect.arrayContaining([...ERRORS_SIDE_EFFECTS]),
          });
        });

        it('should treat {} as null', async () => {
          const prexistingError = { required: 'This control is required' };

          setExistingErrors(
            a,
            prexistingError,
            new Map([[a.id, prexistingError]])
          );

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.setErrors({});

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: null,
            errorsStore: new Map(),
            valid: true,
            invalid: false,
            status: 'VALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            changedProps: expect.arrayContaining([...ERRORS_SIDE_EFFECTS]),
          });
        });
      });

      describe('errorsStore', () => {
        it('should set the errorsStore for the control', async () => {
          const error1 = { required: 'This control is required' };
          const error2 = { spelling: 'Text is mispelled' };
          const errorsStore = new Map<ControlId, ValidationErrors>([
            [a.id, error1],
            ['two', error2],
          ]);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.setErrors(errorsStore);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: { ...error1, ...error2 },
            errorsStore,
            valid: false,
            invalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            changedProps: expect.arrayContaining([
              ...ERRORS_SIDE_EFFECTS,
              'status',
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
            errorsStore: new Map(),
            valid: true,
            invalid: false,
            status: 'VALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual(undefined);
        });

        it('should clear existing errors for this ControlId', async () => {
          const prexistingError = { required: 'This control is required' };
          const preexistingErrorsStore = new Map([[a.id, prexistingError]]);

          setExistingErrors(a, prexistingError, preexistingErrorsStore);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.setErrors(null);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: null,
            errorsStore: new Map(),
            valid: true,
            invalid: false,
            status: 'VALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            changedProps: expect.arrayContaining([
              ...ERRORS_SIDE_EFFECTS,
              'status',
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
            errorsStore: new Map([['one', prexistingError]]),
            valid: false,
            invalid: true,
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
          const preexistingErrorsStore = new Map([[a.id, prexistingError]]);

          setExistingErrors(a, prexistingError, preexistingErrorsStore);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.patchErrors({});

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: prexistingError,
            errorsStore: preexistingErrorsStore,
            valid: false,
            invalid: true,
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
            errorsStore: new Map([[a.id, error]]),
            valid: false,
            invalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            changedProps: expect.arrayContaining([
              ...ERRORS_SIDE_EFFECTS,
              'status',
            ]),
          });
        });

        it('should merge into existing errors', async () => {
          const prexistingError = { required: 'This control is required' };
          const preexistingErrorsStore = new Map([[a.id, prexistingError]]);

          setExistingErrors(a, prexistingError, preexistingErrorsStore);

          const [promise1, end] = getControlEventsUntilEnd(a);

          const newError = { anotherError: true };

          a.patchErrors(newError);

          end.next();
          end.complete();

          const errors = { ...prexistingError, ...newError };

          expect(a).toImplementObject({
            errors,
            errorsStore: preexistingErrorsStore.set(a.id, errors),
            valid: false,
            invalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            changedProps: expect.arrayContaining(ERRORS_SIDE_EFFECTS),
          });
        });

        it('should delete existing error', async () => {
          const prexistingError = { required: 'This control is required' };
          const preexistingErrorsStore = new Map([[a.id, prexistingError]]);

          setExistingErrors(a, prexistingError, preexistingErrorsStore);

          const [promise1, end] = getControlEventsUntilEnd(a);

          a.patchErrors({ required: null });

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: null,
            errorsStore: new Map(),
            valid: true,
            invalid: false,
            status: 'VALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            changedProps: expect.arrayContaining([
              ...ERRORS_SIDE_EFFECTS,
              'status',
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
            errorsStore: preexistingErrorsStore,
            valid: false,
            invalid: true,
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
            errorsStore: preexistingErrorsStore,
            valid: false,
            invalid: true,
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
            errorsStore,
            valid: false,
            invalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            changedProps: expect.arrayContaining([
              ...ERRORS_SIDE_EFFECTS,
              'status',
            ]),
          });
        });

        it('should merge into existing errors', async () => {
          const preexistingErrorsStore = new Map([
            [a.id, { required: false }],
            ['one', { text: false }],
          ]);

          setExistingErrors(
            a,
            { required: false, text: false },
            preexistingErrorsStore
          );

          const [promise1, end] = getControlEventsUntilEnd(a);

          const newErrorsStore = new Map([
            ['one', { anotherError: true }],
            ['two', { three: true }],
          ]);

          a.patchErrors(newErrorsStore);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: { required: false, anotherError: true, three: true },
            errorsStore: new Map([
              ...preexistingErrorsStore,
              ...newErrorsStore,
            ] as any),
            valid: false,
            invalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            changedProps: expect.arrayContaining(ERRORS_SIDE_EFFECTS),
          });
        });

        it('should replace existing error', async () => {
          const prexistingError = { required: 'This control is required' };
          const preexistingErrorsStore = new Map([['one', prexistingError]]);

          setExistingErrors(a, prexistingError, preexistingErrorsStore);

          const [promise1, end] = getControlEventsUntilEnd(a);

          const errorsStore = new Map([['one', { required: null }]]);

          a.patchErrors(errorsStore);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: { required: null },
            errorsStore,
            valid: false,
            invalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            changedProps: expect.arrayContaining(ERRORS_SIDE_EFFECTS),
          });
        });

        it('should ignore errors for other ControlIds', async () => {
          const preexistingError = { required: 'This control is required' };
          const preexistingErrorsStore = new Map([['one', preexistingError]]);

          setExistingErrors(a, preexistingError, preexistingErrorsStore);

          const [promise1, end] = getControlEventsUntilEnd(a);

          const errorsStore = new Map([[a.id, { required: null }]]);

          a.patchErrors(errorsStore);

          end.next();
          end.complete();

          expect(a).toImplementObject({
            errors: { ...preexistingError, required: null },
            errorsStore: new Map([
              ...preexistingErrorsStore,
              ...errorsStore,
            ] as any),
            valid: false,
            invalid: true,
            status: 'INVALID',
          });

          const [event1] = await promise1;

          expect(event1).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            changedProps: expect.arrayContaining(ERRORS_SIDE_EFFECTS),
          });
        });
      });
    });
  });
}

// testAllDefaultsExcept(
//   b,
//   'value',
//   'enabledValue',
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

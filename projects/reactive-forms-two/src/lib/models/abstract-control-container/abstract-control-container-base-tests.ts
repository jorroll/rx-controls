import { toArray } from 'rxjs/operators';
import {
  AbstractControl,
  ControlId,
  ValidatorFn,
} from '../abstract-control/abstract-control';
import { AbstractControlContainer } from './abstract-control-container';
import { IAbstractControlContainerBaseArgs } from './abstract-control-container-base';
import {
  getControlEventsUntilEnd,
  testAllAbstractControlDefaultsExcept,
  testAllAbstractControlContainerDefaultsExcept,
  wait,
} from '../test-util';

function testAllDefaultsExcept(
  c: AbstractControlContainer,
  ...skipTests: Array<
    Omit<keyof AbstractControlContainer, 'value' | 'enabledValue' | 'controls'>
  >
) {
  testAllAbstractControlDefaultsExcept(c, ...skipTests);
  testAllAbstractControlContainerDefaultsExcept(c, ...skipTests);
}

export default function runAbstractControlContainerBaseTestSuite<
  T extends AbstractControlContainer
>(
  name: string,
  createControlContainer: (args?: {
    children?: number;
    options?: IAbstractControlContainerBaseArgs<T['data']>;
  }) => T
) {
  describe(name, () => {
    let a: AbstractControlContainer;

    beforeEach(() => {
      AbstractControl.eventId(0);
    });

    describe('initialization', () => {
      it('defaults', () => {
        testAllDefaultsExcept(createControlContainer());
      });

      describe('options', () => {
        it('id', () => {
          a = createControlContainer({ options: { id: 'one' } });

          expect(a.id).toEqual('one');
          testAllDefaultsExcept(a, 'id');
        });

        it('data', () => {
          a = createControlContainer({ options: { data: 'one' } });

          expect(a.data).toEqual('one');
          testAllDefaultsExcept(a, 'data');
        });

        describe('disabled', () => {
          it('true', () => {
            a = createControlContainer({ options: { disabled: true } });

            expect(a).toImplementObject({
              enabled: false,
              containerEnabled: false,
              disabled: true,
              containerDisabled: true,
              status: 'DISABLED',
            });

            testAllDefaultsExcept(
              a,
              'enabled',
              'containerEnabled',
              'disabled',
              'containerDisabled',
              'status'
            );
          });

          it('false', () => {
            a = createControlContainer({ options: { disabled: false } });

            testAllDefaultsExcept(a);
          });
        });

        describe('dirty', () => {
          it('true', () => {});

          it('false', () => {});
          a = createControlContainer({ options: { dirty: true } });

          expect(a).toImplementObject({
            dirty: true,
            containerDirty: true,
          });

          testAllDefaultsExcept(a, 'dirty', 'containerDirty');

          a = createControlContainer({ options: { dirty: false } });

          testAllDefaultsExcept(a);
        });

        describe('readonly', () => {
          it('true', () => {
            a = createControlContainer({ options: { readonly: true } });

            expect(a).toImplementObject({
              readonly: true,
              containerReadonly: true,
            });

            testAllDefaultsExcept(a, 'readonly', 'containerReadonly');
          });

          it('false', () => {
            a = createControlContainer({ options: { readonly: false } });

            testAllDefaultsExcept(a);
          });
        });

        describe('submitted', () => {
          it('true', () => {
            a = createControlContainer({ options: { submitted: true } });

            expect(a).toImplementObject({
              submitted: true,
              containerSubmitted: true,
            });

            testAllDefaultsExcept(a, 'submitted', 'containerSubmitted');
          });

          it('false', () => {
            a = createControlContainer({ options: { submitted: false } });

            testAllDefaultsExcept(a);
          });
        });

        describe('errors', () => {
          it('ValidationErrors', () => {
            a = createControlContainer({
              options: { errors: { anError: true } },
            });

            expect(a).toImplementObject({
              errorsStore: new Map([[a.id, { anError: true }]]),
              errors: { anError: true },
              containerErrors: { anError: true },
              valid: false,
              containerValid: false,
              invalid: true,
              containerInvalid: true,
              status: 'INVALID',
            });

            testAllDefaultsExcept(
              a,
              'errorsStore',
              'errors',
              'containerErrors',
              'valid',
              'containerValid',
              'invalid',
              'containerInvalid',
              'status'
            );
          });

          it('errorsStore', () => {
            const errorsStore = new Map([['one', { secondError: true }]]);

            a = createControlContainer({ options: { errors: errorsStore } });

            expect(a).toImplementObject({
              errorsStore,
              errors: { secondError: true },
              containerErrors: { secondError: true },
              valid: false,
              containerValid: false,
              invalid: true,
              containerInvalid: true,
              status: 'INVALID',
            });

            testAllDefaultsExcept(
              a,
              'errorsStore',
              'errors',
              'containerErrors',
              'valid',
              'containerValid',
              'invalid',
              'containerInvalid',
              'status'
            );
          });

          it('null', () => {
            a = createControlContainer({ options: { errors: null } });

            testAllDefaultsExcept(a);
          });

          it('null', () => {
            a = createControlContainer({ options: { errors: {} } });

            testAllDefaultsExcept(a);
          });
        });

        describe('validator', () => {
          let validators:
            | ValidatorFn
            | ValidatorFn[]
            | Map<ControlId, ValidatorFn>;

          it('noop ValidatorFn', () => {
            validators = () => null;

            a = createControlContainer({ options: { validators } });

            expect(a).toImplementObject({
              validator: expect.any(Function),
              validatorStore: new Map([[a.id, expect.any(Function)]]),
            });

            testAllDefaultsExcept(a, 'validator', 'validatorStore');
          });

          it('ValidatorFn[]', () => {
            validators = [() => null, () => ({ anError: true })];

            a = createControlContainer({ options: { validators } });

            expect(a).toImplementObject({
              errorsStore: new Map([[a.id, { anError: true }]]),
              errors: { anError: true },
              containerErrors: { anError: true },
              valid: false,
              containerValid: false,
              invalid: true,
              containerInvalid: true,
              status: 'INVALID',
              validator: expect.any(Function),
              validatorStore: new Map([[a.id, expect.any(Function)]]),
            });

            testAllDefaultsExcept(
              a,
              'errorsStore',
              'errors',
              'containerErrors',
              'valid',
              'containerValid',
              'invalid',
              'containerInvalid',
              'status',
              'validator',
              'validatorStore'
            );
          });

          it('validatorsStore', () => {
            const fn1 = (() => null) as ValidatorFn;
            const fn2 = (() => ({ anError: true })) as ValidatorFn;

            validators = new Map([
              ['one', fn1],
              ['two', fn2],
            ]);

            a = createControlContainer({ options: { validators } });

            expect(a).toImplementObject({
              errorsStore: new Map([[a.id, { anError: true }]]),
              errors: { anError: true },
              containerErrors: { anError: true },
              valid: false,
              containerValid: false,
              invalid: true,
              containerInvalid: true,
              status: 'INVALID',
              validator: expect.any(Function),
              validatorStore: validators,
            });

            testAllDefaultsExcept(
              a,
              'errorsStore',
              'errors',
              'containerErrors',
              'valid',
              'containerValid',
              'invalid',
              'containerInvalid',
              'status',
              'validator',
              'validatorStore'
            );
          });

          it('null', () => {
            a = createControlContainer({ options: { validators: null } });

            testAllDefaultsExcept(a);
          });
        });

        describe('pending', () => {
          it('true', () => {
            a = createControlContainer({ options: { pending: true } });

            expect(a).toImplementObject({
              pending: true,
              containerPending: true,
              pendingStore: new Set([a.id]),
              status: 'PENDING',
            });

            testAllDefaultsExcept(
              a,
              'status',
              'pending',
              'containerPending',
              'pendingStore'
            );
          });

          it('pendingStore', () => {
            a = createControlContainer({
              options: { pending: new Set(['one']) },
            });

            expect(a).toImplementObject({
              pending: true,
              containerPending: true,
              pendingStore: new Set(['one']),
              status: 'PENDING',
            });

            testAllDefaultsExcept(
              a,
              'status',
              'pending',
              'containerPending',
              'pendingStore'
            );
          });

          it('false', () => {
            a = createControlContainer({ options: { pending: false } });

            testAllDefaultsExcept(a);
          });
        });
      });
    });

    describe(`replayState`, () => {
      let b: AbstractControlContainer;

      beforeEach(() => {
        b = createControlContainer();
      });

      it('', async () => {
        const state = a.replayState();

        function buildStateChangeBase(change: any) {
          return {
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: a.id,
            change,
            changedProps: [],
            meta: {},
          };
        }

        const [
          controlsStoreEvent,
          valueEvent,
          disabledEvent,
          touchedEvent,
          dirtyEvent,
          readonlyEvent,
          submittedEvent,
          validatorStoreEvent,
          pendingStoreEvent,
          errorsStoreEvent,
          dataEvent,
        ] = await state.pipe(toArray()).toPromise();

        [
          [
            controlsStoreEvent,
            { controlsStore: expect.any(Function) },
          ] as const,
          [valueEvent, { value: expect.any(Function) }] as const,
          [disabledEvent, { disabled: expect.any(Function) }] as const,
          [touchedEvent, { touched: expect.any(Function) }] as const,
          [dirtyEvent, { dirty: expect.any(Function) }] as const,
          [readonlyEvent, { readonly: expect.any(Function) }] as const,
          [submittedEvent, { submitted: expect.any(Function) }] as const,
          [
            validatorStoreEvent,
            { validatorStore: expect.any(Function) },
          ] as const,
          [pendingStoreEvent, { pendingStore: expect.any(Function) }] as const,
          [errorsStoreEvent, { errorsStore: expect.any(Function) }] as const,
          [dataEvent, { data: expect.any(Function) }] as const,
        ].forEach(([event, change]) => {
          expect(event).toEqual(buildStateChangeBase(change));
        });
      });

      it('can be subscribed to multiple times', async () => {
        const state = a.replayState();

        expect(b.errors).toEqual(null);

        state.subscribe(b.source);

        expect(b.errors).toEqual(a.errors);

        b.setErrors({ threvinty: true });

        // Errors in the queueSchedular are suppressed unless you await
        // a promise like below. If this test is failing, uncomment the
        // line below to see if there's a hidden error:
        await wait(0);

        expect(b.errors).not.toEqual(a.errors);
        expect(b.errors).toEqual({ threvinty: true });

        state.subscribe(b.source);

        expect(b.errors).toEqual(a.errors);
      });
    });

    describe('with 1 child', () => {
      let b: AbstractControlContainer;
      let child1: AbstractControl;

      beforeEach(() => {
        b = createControlContainer({ children: 1 });
        child1 = b.get(0);
      });

      ['Touched', 'Dirty', 'Readonly', 'Submitted'].forEach((prop) => {
        const METHOD_NAME = `mark${prop}` as keyof AbstractControl & string;
        const PROP_NAME = prop.toLowerCase();
        const CHILD_PROP_NAME = `child${prop}`;
        const CHILDREN_PROP_NAME = `children${prop}`;

        describe(METHOD_NAME, () => {
          it('on enabled child', async () => {
            const [promise1, end] = getControlEventsUntilEnd(b);

            child1[METHOD_NAME](true);

            end.next();
            end.complete();

            expect(b).toImplementObject({
              [PROP_NAME]: true,
              [CHILD_PROP_NAME]: true,
              [CHILDREN_PROP_NAME]: true,
            });

            testAllDefaultsExcept(
              b,
              PROP_NAME,
              CHILD_PROP_NAME,
              CHILDREN_PROP_NAME,
              'parent'
            );

            const [event1, event2] = await promise1;

            expect(event1).toEqual({
              type: 'ChildStateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: b.id,
              meta: {},
              key: expect.anything(),
              childEvent: {
                type: 'StateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: child1.id,
                meta: {},
                change: {
                  [PROP_NAME]: expect.any(Function),
                },
                changedProps: [PROP_NAME],
              },
              changedProps: expect.arrayContaining([
                PROP_NAME,
                CHILD_PROP_NAME,
                CHILDREN_PROP_NAME,
              ]),
            });

            expect(event2).toEqual(undefined);
          });

          it('on disabled child', async () => {
            child1.markDisabled(true);

            const [promise1, end] = getControlEventsUntilEnd(b);

            child1[METHOD_NAME](true);

            end.next();
            end.complete();

            expect(b).toImplementObject({
              disabled: true,
              childDisabled: true,
              childrenDisabled: true,
              enabled: false,
              childEnabled: false,
              childrenEnabled: false,
              status: 'DISABLED',
            });

            testAllDefaultsExcept(
              b,
              'parent',
              'disabled',
              'childDisabled',
              'childrenDisabled',
              'enabled',
              'childEnabled',
              'childrenEnabled',
              'status'
            );

            const [event1, event2] = await promise1;

            expect(event1).toEqual({
              type: 'ChildStateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: b.id,
              meta: {},
              key: expect.anything(),
              childEvent: {
                type: 'StateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: child1.id,
                meta: {},
                change: {
                  [PROP_NAME]: expect.any(Function),
                },
                changedProps: [PROP_NAME],
              },
              changedProps: [],
            });

            expect(event2).toEqual(undefined);
          });

          it('on child that is then disabled', async () => {
            const [promise1, end] = getControlEventsUntilEnd(b);

            child1[METHOD_NAME](true);
            child1.markDisabled(true);

            end.next();
            end.complete();

            expect(b).toImplementObject({
              disabled: true,
              childDisabled: true,
              childrenDisabled: true,
              enabled: false,
              childEnabled: false,
              childrenEnabled: false,
              status: 'DISABLED',
            });

            testAllDefaultsExcept(
              b,
              'parent',
              'disabled',
              'childDisabled',
              'childrenDisabled',
              'enabled',
              'childEnabled',
              'childrenEnabled',
              'status'
            );

            const [event1, event2, event3] = await promise1;

            expect(event1).toEqual({
              type: 'ChildStateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: b.id,
              meta: {},
              key: expect.anything(),
              childEvent: {
                type: 'StateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: child1.id,
                meta: {},
                change: {
                  [PROP_NAME]: expect.any(Function),
                },
                changedProps: [PROP_NAME],
              },
              changedProps: expect.arrayContaining([
                PROP_NAME,
                CHILD_PROP_NAME,
                CHILDREN_PROP_NAME,
              ]),
            });

            expect(event2).toEqual({
              type: 'ChildStateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: b.id,
              meta: {},
              key: expect.anything(),
              childEvent: {
                type: 'StateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: child1.id,
                meta: {},
                change: {
                  disabled: expect.any(Function),
                },
                changedProps: expect.arrayContaining([
                  'disabled',
                  'enabled',
                  'status',
                ]),
              },
              changedProps: expect.arrayContaining([
                'disabled',
                'childDisabled',
                'childrenDisabled',
                'enabled',
                'childEnabled',
                'childrenEnabled',
                'status',
                PROP_NAME,
                CHILD_PROP_NAME,
                CHILDREN_PROP_NAME,
              ]),
            });

            expect(event3).toEqual(undefined);
          });
        });
      });

      describe('markPending', () => {
        it('on enabled child', async () => {
          const [promise1, end] = getControlEventsUntilEnd(b);

          child1.markPending(true);

          end.next();
          end.complete();

          expect(b).toImplementObject({
            pending: true,
            childPending: true,
            childrenPending: true,
            status: 'PENDING',
          });

          testAllDefaultsExcept(
            b,
            'pending',
            'childPending',
            'childrenPending',
            'parent',
            'status'
          );

          const [event1, event2] = await promise1;

          expect(event1).toEqual({
            type: 'ChildStateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: b.id,
            meta: {},
            key: expect.anything(),
            childEvent: {
              type: 'StateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: child1.id,
              meta: {},
              change: {
                pendingStore: expect.any(Function),
              },
              changedProps: expect.arrayContaining([
                'pending',
                'pendingStore',
                'status',
              ]),
            },
            changedProps: expect.arrayContaining([
              'pending',
              'childPending',
              'childrenPending',
              'status',
            ]),
          });

          expect(event2).toEqual(undefined);
        });

        it('on disabled child', async () => {
          child1.markDisabled(true);

          const [promise1, end] = getControlEventsUntilEnd(b);

          child1.markPending(true);

          end.next();
          end.complete();

          expect(b).toImplementObject({
            disabled: true,
            childDisabled: true,
            childrenDisabled: true,
            enabled: false,
            childEnabled: false,
            childrenEnabled: false,
            status: 'DISABLED',
          });

          testAllDefaultsExcept(
            b,
            'parent',
            'disabled',
            'childDisabled',
            'childrenDisabled',
            'enabled',
            'childEnabled',
            'childrenEnabled',
            'status'
          );

          const [event1, event2] = await promise1;

          expect(event1).toEqual({
            type: 'ChildStateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: b.id,
            meta: {},
            key: expect.anything(),
            childEvent: {
              type: 'StateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: child1.id,
              meta: {},
              change: {
                pendingStore: expect.any(Function),
              },
              changedProps: expect.arrayContaining(['pending', 'pendingStore']),
            },
            changedProps: [],
          });

          expect(event2).toEqual(undefined);
        });

        it('on child that is then disabled', async () => {
          const [promise1, end] = getControlEventsUntilEnd(b);

          child1.markPending(true);
          child1.markDisabled(true);

          end.next();
          end.complete();

          expect(b).toImplementObject({
            disabled: true,
            childDisabled: true,
            childrenDisabled: true,
            enabled: false,
            childEnabled: false,
            childrenEnabled: false,
            status: 'DISABLED',
          });

          testAllDefaultsExcept(
            b,
            'parent',
            'disabled',
            'childDisabled',
            'childrenDisabled',
            'enabled',
            'childEnabled',
            'childrenEnabled',
            'status'
          );

          const [event1, event2, event3] = await promise1;

          expect(event1).toEqual({
            type: 'ChildStateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: b.id,
            meta: {},
            key: expect.anything(),
            childEvent: {
              type: 'StateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: child1.id,
              meta: {},
              change: {
                pendingStore: expect.any(Function),
              },
              changedProps: expect.arrayContaining([
                'pending',
                'pendingStore',
                'status',
              ]),
            },
            changedProps: expect.arrayContaining([
              'pending',
              'childPending',
              'childrenPending',
              'status',
            ]),
          });

          expect(event2).toEqual({
            type: 'ChildStateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: b.id,
            meta: {},
            key: expect.anything(),
            childEvent: {
              type: 'StateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: child1.id,
              meta: {},
              change: {
                disabled: expect.any(Function),
              },
              changedProps: expect.arrayContaining([
                'disabled',
                'enabled',
                'status',
              ]),
            },
            changedProps: expect.arrayContaining([
              'disabled',
              'childDisabled',
              'childrenDisabled',
              'enabled',
              'childEnabled',
              'childrenEnabled',
              'status',
              'pending',
              'childPending',
              'childrenPending',
            ]),
          });

          expect(event3).toEqual(undefined);
        });
      });

      describe('markDisabled', () => {
        it('on enabled child', async () => {
          const [promise1, end] = getControlEventsUntilEnd(b);

          child1.markDisabled(true);

          end.next();
          end.complete();

          expect(b).toImplementObject({
            disabled: true,
            childDisabled: true,
            childrenDisabled: true,
            enabled: false,
            childEnabled: false,
            childrenEnabled: false,
            status: 'DISABLED',
          });

          testAllDefaultsExcept(
            b,
            'disabled',
            'childDisabled',
            'childrenDisabled',
            'enabled',
            'childEnabled',
            'childrenEnabled',
            'parent',
            'status'
          );

          const [event1, event2] = await promise1;

          expect(event1).toEqual({
            type: 'ChildStateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: b.id,
            meta: {},
            key: expect.anything(),
            childEvent: {
              type: 'StateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: child1.id,
              meta: {},
              change: {
                disabled: expect.any(Function),
              },
              changedProps: expect.arrayContaining([
                'disabled',
                'enabled',
                'status',
              ]),
            },
            changedProps: expect.arrayContaining([
              'disabled',
              'childDisabled',
              'childrenDisabled',
              'enabled',
              'childEnabled',
              'childrenEnabled',
              'status',
            ]),
          });

          expect(event2).toEqual(undefined);
        });

        it('on disabled child', async () => {
          child1.markDisabled(true);

          const [promise1, end] = getControlEventsUntilEnd(b);

          child1.markDisabled(false);

          end.next();
          end.complete();

          expect(b).toImplementObject({
            disabled: false,
            childDisabled: false,
            childrenDisabled: false,
            enabled: true,
            childEnabled: true,
            childrenEnabled: true,
          });

          testAllDefaultsExcept(b, 'parent');

          const [event1, event2] = await promise1;

          expect(event1).toEqual({
            type: 'ChildStateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: b.id,
            meta: {},
            key: expect.anything(),
            childEvent: {
              type: 'StateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: child1.id,
              meta: {},
              change: {
                disabled: expect.any(Function),
              },
              changedProps: expect.arrayContaining([
                'disabled',
                'enabled',
                'status',
              ]),
            },
            changedProps: expect.arrayContaining([
              'disabled',
              'childDisabled',
              'childrenDisabled',
              'enabled',
              'childEnabled',
              'childrenEnabled',
              'status',
            ]),
          });

          expect(event2).toEqual(undefined);
        });
      });

      describe('that has 1 child', () => {
        let b2: AbstractControlContainer;

        beforeEach(() => {
          b2 = createControlContainer({ children: 1 });

          let key;
          for (const [k, v] of b.controlsStore) {
            key = k;
            b.setControl(k, b2);
            break;
          }

          child1 = b2.get(key);
        });

        ['Touched', 'Dirty', 'Readonly', 'Submitted'].forEach((prop) => {
          const METHOD_NAME = `mark${prop}` as keyof AbstractControl & string;
          const PROP_NAME = prop.toLowerCase();
          const CHILD_PROP_NAME = `child${prop}`;
          const CHILDREN_PROP_NAME = `children${prop}`;

          describe(METHOD_NAME, () => {
            it('on enabled child', async () => {
              const [promise1, end] = getControlEventsUntilEnd(b);

              child1[METHOD_NAME](true);

              end.next();
              end.complete();

              expect(b).toImplementObject({
                [PROP_NAME]: true,
                [CHILD_PROP_NAME]: true,
                [CHILDREN_PROP_NAME]: true,
              });

              testAllDefaultsExcept(
                b,
                PROP_NAME,
                CHILD_PROP_NAME,
                CHILDREN_PROP_NAME,
                'parent'
              );

              const [event1, event2] = await promise1;

              expect(event1).toEqual({
                type: 'ChildStateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: b.id,
                meta: {},
                key: expect.anything(),
                childEvent: {
                  type: 'ChildStateChange',
                  eventId: expect.any(Number),
                  idOfOriginatingEvent: expect.any(Number),
                  source: b2.id,
                  meta: {},
                  key: expect.anything(),
                  childEvent: {
                    type: 'StateChange',
                    eventId: expect.any(Number),
                    idOfOriginatingEvent: expect.any(Number),
                    source: child1.id,
                    meta: {},
                    change: {
                      [PROP_NAME]: expect.any(Function),
                    },
                    changedProps: [PROP_NAME],
                  },
                  changedProps: expect.arrayContaining([
                    PROP_NAME,
                    CHILD_PROP_NAME,
                    CHILDREN_PROP_NAME,
                  ]),
                },
                changedProps: expect.arrayContaining([
                  PROP_NAME,
                  CHILD_PROP_NAME,
                  CHILDREN_PROP_NAME,
                ]),
              });

              expect(event2).toEqual(undefined);
            });

            it('on disabled child', async () => {
              child1.markDisabled(true);

              const [promise1, end] = getControlEventsUntilEnd(b);

              child1[METHOD_NAME](true);

              end.next();
              end.complete();

              expect(b).toImplementObject({
                disabled: true,
                childDisabled: true,
                childrenDisabled: true,
                enabled: false,
                childEnabled: false,
                childrenEnabled: false,
                status: 'DISABLED',
              });

              testAllDefaultsExcept(
                b,
                'parent',
                'disabled',
                'childDisabled',
                'childrenDisabled',
                'enabled',
                'childEnabled',
                'childrenEnabled',
                'status'
              );

              const [event1, event2] = await promise1;

              expect(event1).toEqual({
                type: 'ChildStateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: b.id,
                meta: {},
                key: expect.anything(),
                childEvent: {
                  type: 'ChildStateChange',
                  eventId: expect.any(Number),
                  idOfOriginatingEvent: expect.any(Number),
                  source: b2.id,
                  meta: {},
                  key: expect.anything(),
                  childEvent: {
                    type: 'StateChange',
                    eventId: expect.any(Number),
                    idOfOriginatingEvent: expect.any(Number),
                    source: child1.id,
                    meta: {},
                    change: {
                      [PROP_NAME]: expect.any(Function),
                    },
                    changedProps: [PROP_NAME],
                  },
                  changedProps: [],
                },
                changedProps: [],
              });

              expect(event2).toEqual(undefined);
            });

            it('on child that is then disabled', async () => {
              const [promise1, end] = getControlEventsUntilEnd(b);

              child1[METHOD_NAME](true);
              child1.markDisabled(true);

              end.next();
              end.complete();

              expect(b).toImplementObject({
                disabled: true,
                childDisabled: true,
                childrenDisabled: true,
                enabled: false,
                childEnabled: false,
                childrenEnabled: false,
                status: 'DISABLED',
              });

              testAllDefaultsExcept(
                b,
                'parent',
                'disabled',
                'childDisabled',
                'childrenDisabled',
                'enabled',
                'childEnabled',
                'childrenEnabled',
                'status'
              );

              const [event1, event2, event3] = await promise1;

              expect(event1).toEqual({
                type: 'ChildStateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: b.id,
                meta: {},
                key: expect.anything(),
                childEvent: {
                  type: 'ChildStateChange',
                  eventId: expect.any(Number),
                  idOfOriginatingEvent: expect.any(Number),
                  source: b2.id,
                  meta: {},
                  key: expect.anything(),
                  childEvent: {
                    type: 'StateChange',
                    eventId: expect.any(Number),
                    idOfOriginatingEvent: expect.any(Number),
                    source: child1.id,
                    meta: {},
                    change: {
                      [PROP_NAME]: expect.any(Function),
                    },
                    changedProps: [PROP_NAME],
                  },
                  changedProps: expect.arrayContaining([
                    PROP_NAME,
                    CHILD_PROP_NAME,
                    CHILDREN_PROP_NAME,
                  ]),
                },
                changedProps: expect.arrayContaining([
                  PROP_NAME,
                  CHILD_PROP_NAME,
                  CHILDREN_PROP_NAME,
                ]),
              });

              expect(event2).toEqual({
                type: 'ChildStateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: b.id,
                meta: {},
                key: expect.anything(),
                childEvent: {
                  type: 'ChildStateChange',
                  eventId: expect.any(Number),
                  idOfOriginatingEvent: expect.any(Number),
                  source: b2.id,
                  meta: {},
                  key: expect.anything(),
                  childEvent: {
                    type: 'StateChange',
                    eventId: expect.any(Number),
                    idOfOriginatingEvent: expect.any(Number),
                    source: child1.id,
                    meta: {},
                    change: {
                      disabled: expect.any(Function),
                    },
                    changedProps: expect.arrayContaining([
                      'disabled',
                      'enabled',
                      'status',
                    ]),
                  },
                  changedProps: expect.arrayContaining([
                    'disabled',
                    'childDisabled',
                    'childrenDisabled',
                    'enabled',
                    'childEnabled',
                    'childrenEnabled',
                    'status',
                    PROP_NAME,
                    CHILD_PROP_NAME,
                    CHILDREN_PROP_NAME,
                  ]),
                },
                changedProps: expect.arrayContaining([
                  'disabled',
                  'childDisabled',
                  'childrenDisabled',
                  'enabled',
                  'childEnabled',
                  'childrenEnabled',
                  'status',
                  PROP_NAME,
                  CHILD_PROP_NAME,
                  CHILDREN_PROP_NAME,
                ]),
              });

              expect(event3).toEqual(undefined);
            });
          });
        });
      });
    });

    describe('with 2 children', () => {
      let b: AbstractControlContainer;
      let child1: AbstractControl;
      let child2: AbstractControl;

      beforeEach(() => {
        b = createControlContainer({ children: 2 });
        child1 = b.get(0);
        child2 = b.get(1);
      });

      ['Touched', 'Dirty'].forEach((prop) => {
        const METHOD_NAME = `mark${prop}` as keyof AbstractControl & string;
        const PROP_NAME = prop.toLowerCase();
        const CHILD_PROP_NAME = `child${prop}`;
        const CHILDREN_PROP_NAME = `children${prop}`;

        describe(METHOD_NAME, () => {
          it('on enabled child', async () => {
            const [promise1, end] = getControlEventsUntilEnd(b);

            child1[METHOD_NAME](true);

            end.next();
            end.complete();

            expect(b).toImplementObject({
              [PROP_NAME]: true,
              [CHILD_PROP_NAME]: true,
              [CHILDREN_PROP_NAME]: false,
            });

            const [event1] = await promise1;

            expect(event1).toEqual({
              type: 'ChildStateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: b.id,
              meta: {},
              key: expect.anything(),
              childEvent: {
                type: 'StateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: child1.id,
                meta: {},
                change: {
                  [PROP_NAME]: expect.any(Function),
                },
                changedProps: [PROP_NAME],
              },
              changedProps: expect.arrayContaining([
                PROP_NAME,
                CHILD_PROP_NAME,
              ]),
            });
          });

          it('on disabled child', async () => {
            child1.markDisabled(true);

            const [promise1, end] = getControlEventsUntilEnd(b);

            child1[METHOD_NAME](true);

            end.next();
            end.complete();

            expect(b).toImplementObject({
              disabled: false,
              childDisabled: true,
              childrenDisabled: false,
              enabled: true,
              childEnabled: true,
              childrenEnabled: false,
              status: 'VALID',
            });

            testAllDefaultsExcept(
              b,
              'parent',
              'disabled',
              'childDisabled',
              'childrenDisabled',
              'enabled',
              'childEnabled',
              'childrenEnabled',
              'status'
            );

            const [event1, event2] = await promise1;

            expect(event1).toEqual({
              type: 'ChildStateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: b.id,
              meta: {},
              key: expect.anything(),
              childEvent: {
                type: 'StateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: child1.id,
                meta: {},
                change: {
                  [PROP_NAME]: expect.any(Function),
                },
                changedProps: [PROP_NAME],
              },
              changedProps: [],
            });

            expect(event2).toEqual(undefined);
          });

          it('on child that is then disabled', async () => {
            const [promise1, end] = getControlEventsUntilEnd(b);

            child1[METHOD_NAME](true);
            child1.markDisabled(true);

            end.next();
            end.complete();

            expect(b).toImplementObject({
              disabled: false,
              childDisabled: true,
              childrenDisabled: false,
              enabled: true,
              childEnabled: true,
              childrenEnabled: false,
              status: 'VALID',
            });

            testAllDefaultsExcept(
              b,
              'parent',
              'disabled',
              'childDisabled',
              'childrenDisabled',
              'enabled',
              'childEnabled',
              'childrenEnabled',
              'status'
            );

            const [event1, event2, event3] = await promise1;

            expect(event1).toEqual({
              type: 'ChildStateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: b.id,
              meta: {},
              key: expect.anything(),
              childEvent: {
                type: 'StateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: child1.id,
                meta: {},
                change: {
                  [PROP_NAME]: expect.any(Function),
                },
                changedProps: [PROP_NAME],
              },
              changedProps: expect.arrayContaining([
                PROP_NAME,
                CHILD_PROP_NAME,
              ]),
            });

            expect(event2).toEqual({
              type: 'ChildStateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: b.id,
              meta: {},
              key: expect.anything(),
              childEvent: {
                type: 'StateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: child1.id,
                meta: {},
                change: {
                  disabled: expect.any(Function),
                },
                changedProps: expect.arrayContaining([
                  'disabled',
                  'enabled',
                  'status',
                ]),
              },
              changedProps: expect.arrayContaining([
                'childDisabled',
                'childrenEnabled',
                PROP_NAME,
                CHILD_PROP_NAME,
              ]),
            });

            expect(event3).toEqual(undefined);
          });
        });
      });

      ['Readonly', 'Submitted'].forEach((prop) => {
        const METHOD_NAME = `mark${prop}` as keyof AbstractControl & string;
        const PROP_NAME = prop.toLowerCase();
        const CHILD_PROP_NAME = `child${prop}`;
        const CHILDREN_PROP_NAME = `children${prop}`;

        describe(METHOD_NAME, () => {
          it('on enabled child', async () => {
            const [promise1, end] = getControlEventsUntilEnd(b);

            child1[METHOD_NAME](true);

            end.next();
            end.complete();

            expect(b).toImplementObject({
              [PROP_NAME]: false,
              [CHILD_PROP_NAME]: true,
              [CHILDREN_PROP_NAME]: false,
            });

            const [event1] = await promise1;

            expect(event1).toEqual({
              type: 'ChildStateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: b.id,
              meta: {},
              key: expect.anything(),
              childEvent: {
                type: 'StateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: child1.id,
                meta: {},
                change: {
                  [PROP_NAME]: expect.any(Function),
                },
                changedProps: [PROP_NAME],
              },
              changedProps: expect.arrayContaining([CHILD_PROP_NAME]),
            });
          });

          it('on disabled child', async () => {
            child1.markDisabled(true);

            const [promise1, end] = getControlEventsUntilEnd(b);

            child1[METHOD_NAME](true);

            end.next();
            end.complete();

            expect(b).toImplementObject({
              disabled: false,
              childDisabled: true,
              childrenDisabled: false,
              enabled: true,
              childEnabled: true,
              childrenEnabled: false,
              status: 'VALID',
            });

            testAllDefaultsExcept(
              b,
              'parent',
              'disabled',
              'childDisabled',
              'childrenDisabled',
              'enabled',
              'childEnabled',
              'childrenEnabled',
              'status'
            );

            const [event1, event2] = await promise1;

            expect(event1).toEqual({
              type: 'ChildStateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: b.id,
              meta: {},
              key: expect.anything(),
              childEvent: {
                type: 'StateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: child1.id,
                meta: {},
                change: {
                  [PROP_NAME]: expect.any(Function),
                },
                changedProps: [PROP_NAME],
              },
              changedProps: [],
            });

            expect(event2).toEqual(undefined);
          });

          it('on child that is then disabled', async () => {
            const [promise1, end] = getControlEventsUntilEnd(b);

            child1[METHOD_NAME](true);
            child1.markDisabled(true);

            end.next();
            end.complete();

            expect(b).toImplementObject({
              disabled: false,
              childDisabled: true,
              childrenDisabled: false,
              enabled: true,
              childEnabled: true,
              childrenEnabled: false,
              status: 'VALID',
            });

            testAllDefaultsExcept(
              b,
              'parent',
              'disabled',
              'childDisabled',
              'childrenDisabled',
              'enabled',
              'childEnabled',
              'childrenEnabled',
              'status'
            );

            const [event1, event2, event3] = await promise1;

            expect(event1).toEqual({
              type: 'ChildStateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: b.id,
              meta: {},
              key: expect.anything(),
              childEvent: {
                type: 'StateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: child1.id,
                meta: {},
                change: {
                  [PROP_NAME]: expect.any(Function),
                },
                changedProps: [PROP_NAME],
              },
              changedProps: expect.arrayContaining([CHILD_PROP_NAME]),
            });

            expect(event2).toEqual({
              type: 'ChildStateChange',
              eventId: expect.any(Number),
              idOfOriginatingEvent: expect.any(Number),
              source: b.id,
              meta: {},
              key: expect.anything(),
              childEvent: {
                type: 'StateChange',
                eventId: expect.any(Number),
                idOfOriginatingEvent: expect.any(Number),
                source: child1.id,
                meta: {},
                change: {
                  disabled: expect.any(Function),
                },
                changedProps: expect.arrayContaining([
                  'disabled',
                  'enabled',
                  'status',
                ]),
              },
              changedProps: expect.arrayContaining([
                'childDisabled',
                'childrenEnabled',
                CHILD_PROP_NAME,
              ]),
            });

            expect(event3).toEqual(undefined);
          });
        });
      });
    });
  });
}

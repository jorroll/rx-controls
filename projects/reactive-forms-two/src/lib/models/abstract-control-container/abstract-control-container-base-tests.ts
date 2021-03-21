import { takeUntil, toArray } from 'rxjs/operators';
import {
  AbstractControl,
  ControlId,
  IControlStateChangeEvent,
  ValidatorFn,
} from '../abstract-control/abstract-control';
import { AbstractControlContainer } from './abstract-control-container';
import { IAbstractControlContainerBaseArgs } from './abstract-control-container-base';
import {
  getControlEventsUntilEnd,
  testAllAbstractControlDefaultsExcept,
  testAllAbstractControlContainerDefaultsExcept,
  wait,
  subscribeToControlEventsUntilEnd,
} from '../test-util';
import { Subject } from 'rxjs';
import {
  AbstractControlBase,
  CONTROL_SELF_ID,
} from '../abstract-control/abstract-control-base';
import { inspect } from 'util';

function testAllDefaultsExcept(
  c: AbstractControlContainer,
  ...skipTests: Array<
    Omit<keyof AbstractControlContainer, 'value' | 'rawValue' | 'controls'>
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
    options?: IAbstractControlContainerBaseArgs<
      T['data'],
      T['rawValue'],
      T['value']
    >;
  }) => T
) {
  describe(`AbstractControlContainerBase`, () => {
    let a: AbstractControlContainer;

    beforeEach(() => {
      // AbstractControl.eventId(0);
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
            selfDirty: true,
          });

          testAllDefaultsExcept(a, 'dirty', 'selfDirty');

          a = createControlContainer({ options: { dirty: false } });

          testAllDefaultsExcept(a);
        });

        describe('readonly', () => {
          it('true', () => {
            a = createControlContainer({ options: { readonly: true } });

            expect(a).toImplementObject({
              readonly: true,
              selfReadonly: true,
            });

            testAllDefaultsExcept(a, 'readonly', 'selfReadonly');
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
              selfSubmitted: true,
            });

            testAllDefaultsExcept(a, 'submitted', 'selfSubmitted');
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
              errorsStore: new Map([[CONTROL_SELF_ID, { anError: true }]]),
              errors: { anError: true },
              selfErrors: { anError: true },
              valid: false,
              selfValid: false,
              invalid: true,
              selfInvalid: true,
              status: 'INVALID',
            });

            testAllDefaultsExcept(
              a,
              'errorsStore',
              'errors',
              'selfErrors',
              'valid',
              'selfValid',
              'invalid',
              'selfInvalid',
              'status'
            );
          });

          it('errorsStore', () => {
            const errorsStore = new Map([['one', { secondError: true }]]);

            a = createControlContainer({ options: { errors: errorsStore } });

            expect(a).toImplementObject({
              errorsStore,
              errors: { secondError: true },
              selfErrors: { secondError: true },
              valid: false,
              selfValid: false,
              invalid: true,
              selfInvalid: true,
              status: 'INVALID',
            });

            testAllDefaultsExcept(
              a,
              'errorsStore',
              'errors',
              'selfErrors',
              'valid',
              'selfValid',
              'invalid',
              'selfInvalid',
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
              validatorStore: new Map([
                [CONTROL_SELF_ID, expect.any(Function)],
              ]),
            });

            testAllDefaultsExcept(a, 'validator', 'validatorStore');
          });

          it('ValidatorFn[]', () => {
            validators = [() => null, () => ({ anError: true })];

            a = createControlContainer({ options: { validators } });

            expect(a).toImplementObject({
              errorsStore: new Map([[CONTROL_SELF_ID, { anError: true }]]),
              errors: { anError: true },
              selfErrors: { anError: true },
              valid: false,
              selfValid: false,
              invalid: true,
              selfInvalid: true,
              status: 'INVALID',
              validator: expect.any(Function),
              validatorStore: new Map([
                [CONTROL_SELF_ID, expect.any(Function)],
              ]),
            });

            testAllDefaultsExcept(
              a,
              'errorsStore',
              'errors',
              'selfErrors',
              'valid',
              'selfValid',
              'invalid',
              'selfInvalid',
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
              errorsStore: new Map([[CONTROL_SELF_ID, { anError: true }]]),
              errors: { anError: true },
              selfErrors: { anError: true },
              valid: false,
              selfValid: false,
              invalid: true,
              selfInvalid: true,
              status: 'INVALID',
              validator: expect.any(Function),
              validatorStore: validators,
            });

            testAllDefaultsExcept(
              a,
              'errorsStore',
              'errors',
              'selfErrors',
              'valid',
              'selfValid',
              'invalid',
              'selfInvalid',
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
              selfPending: true,
              pendingStore: new Set([CONTROL_SELF_ID]),
              status: 'PENDING',
            });

            testAllDefaultsExcept(
              a,
              'status',
              'pending',
              'selfPending',
              'pendingStore'
            );
          });

          it('pendingStore', () => {
            a = createControlContainer({
              options: { pending: new Set(['one']) },
            });

            expect(a).toImplementObject({
              pending: true,
              selfPending: true,
              pendingStore: new Set(['one']),
              status: 'PENDING',
            });

            testAllDefaultsExcept(
              a,
              'status',
              'pending',
              'selfPending',
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
        const event1 = await a.replayState().toPromise();

        expect(event1).toEqual<IControlStateChangeEvent>({
          type: 'StateChange',
          source: a.id,
          meta: {},
          controlId: expect.any(Symbol),
          debugPath: expect.any(String),
          changes: new Map<string, any>([
            ['controls', expect.any(Object)],
            ['size', 0],
            ['controlsStore', new Map()],
            ['childValid', true],
            ['childrenValid', true],
            ['childInvalid', false],
            ['childrenInvalid', false],
            ['childEnabled', true],
            ['childrenEnabled', true],
            ['childDisabled', false],
            ['childrenDisabled', false],
            ['childReadonly', false],
            ['childrenReadonly', false],
            ['childPending', false],
            ['childrenPending', false],
            ['childTouched', false],
            ['childrenTouched', false],
            ['childDirty', false],
            ['childrenDirty', false],
            ['childSubmitted', false],
            ['childrenSubmitted', false],
            ['childrenErrors', null],
            ['enabled', true],
            ['selfEnabled', true],
            ['disabled', false],
            ['selfDisabled', false],
            ['touched', false],
            ['selfTouched', false],
            ['dirty', false],
            ['selfDirty', false],
            ['readonly', false],
            ['selfReadonly', false],
            ['submitted', false],
            ['selfSubmitted', false],
            ['data', undefined],
            ['value', expect.any(Object)],
            ['rawValue', expect.any(Object)],
            ['validator', null],
            ['validatorStore', new Map()],
            ['pending', false],
            ['selfPending', false],
            ['pendingStore', new Set()],
            ['valid', true],
            ['selfValid', true],
            ['invalid', false],
            ['selfInvalid', false],
            ['status', 'VALID'],
            ['errors', null],
            ['selfErrors', null],
            ['errorsStore', new Map()],
          ]),
        });
      });

      it('can be subscribed to multiple times', async () => {
        const state = a.replayState();

        expect(b.errors).toEqual(null);

        state.subscribe((e) => b.processEvent(e));

        expect(b.errors).toEqual(a.errors);

        b.setErrors({ threvinty: true });

        // Errors in the queueSchedular are suppressed unless you await
        // a promise like below. If this test is failing, uncomment the
        // line below to see if there's a hidden error:
        await wait(0);

        expect(b.errors).not.toEqual(a.errors);
        expect(b.errors).toEqual({ threvinty: true });

        state.subscribe((e) => b.processEvent(e));

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

      describe(`replayState`, () => {
        it('', async () => {
          const event1 = await b.replayState().toPromise();

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: b.id,
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: new Map<string, any>([
              ['controls', expect.any(Object)],
              ['size', 1],
              [
                'controlsStore',
                new Map([[expect.anything(), expect.any(AbstractControlBase)]]),
              ],
              ['childValid', true],
              ['childrenValid', true],
              ['childInvalid', false],
              ['childrenInvalid', false],
              ['childEnabled', true],
              ['childrenEnabled', true],
              ['childDisabled', false],
              ['childrenDisabled', false],
              ['childReadonly', false],
              ['childrenReadonly', false],
              ['childPending', false],
              ['childrenPending', false],
              ['childTouched', false],
              ['childrenTouched', false],
              ['childDirty', false],
              ['childrenDirty', false],
              ['childSubmitted', false],
              ['childrenSubmitted', false],
              ['childrenErrors', null],
              ['enabled', true],
              ['selfEnabled', true],
              ['disabled', false],
              ['selfDisabled', false],
              ['touched', false],
              ['selfTouched', false],
              ['dirty', false],
              ['selfDirty', false],
              ['readonly', false],
              ['selfReadonly', false],
              ['submitted', false],
              ['selfSubmitted', false],
              ['data', undefined],
              ['value', expect.any(Object)],
              ['rawValue', expect.any(Object)],
              ['validator', null],
              ['validatorStore', new Map()],
              ['pending', false],
              ['selfPending', false],
              ['pendingStore', new Set()],
              ['valid', true],
              ['selfValid', true],
              ['invalid', false],
              ['selfInvalid', false],
              ['status', 'VALID'],
              ['errors', null],
              ['selfErrors', null],
              ['errorsStore', new Map()],
            ]),
          });
        });

        it('can be used to reset control when control is linked to another', async () => {
          expect(a).not.toEqualControl(b, {
            skip: ['parent'],
          });

          const [end] = subscribeToControlEventsUntilEnd(a, b);
          subscribeToControlEventsUntilEnd(b, a, end);

          b.replayState().subscribe((e) => a.processEvent(e));

          expect(a).toEqualControl(b, {
            skip: ['parent'],
          });

          end.next();
          end.complete();

          // this `wait(0)` is, for some reason, necessary to show a `Maximum call stack size` exception
          await wait(0);
        });
      });

      ['Touched', 'Dirty', 'Readonly', 'Submitted'].forEach((prop) => {
        const METHOD_NAME = `mark${prop}` as keyof AbstractControl & string;
        const PROP_NAME = prop.toLowerCase();
        const SELF_PROP_NAME = `self${prop}`;
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

            expect(event1).toEqual<IControlStateChangeEvent>({
              type: 'StateChange',
              source: child1.id,
              meta: {},
              controlId: expect.any(Symbol),
              debugPath: expect.any(String),
              changes: new Map([
                [CHILD_PROP_NAME, true],
                [CHILDREN_PROP_NAME, true],
                [PROP_NAME, true],
              ]),
              childEvents: {
                0: {
                  type: 'StateChange',
                  source: child1.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map([
                    [SELF_PROP_NAME, true],
                    [PROP_NAME, true],
                  ]),
                },
              },
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

            expect(event1).toEqual<IControlStateChangeEvent>({
              type: 'StateChange',
              source: child1.id,
              meta: {},
              controlId: expect.any(Symbol),
              debugPath: expect.any(String),
              changes: new Map(),
              childEvents: {
                0: {
                  type: 'StateChange',
                  source: child1.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map([
                    [SELF_PROP_NAME, true],
                    [PROP_NAME, true],
                  ]),
                },
              },
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

            expect(event1).toEqual<IControlStateChangeEvent>({
              type: 'StateChange',
              source: child1.id,
              meta: {},
              controlId: expect.any(Symbol),
              debugPath: expect.any(String),
              changes: new Map([
                [CHILD_PROP_NAME, true],
                [CHILDREN_PROP_NAME, true],
                [PROP_NAME, true],
              ]),
              childEvents: {
                0: {
                  type: 'StateChange',
                  source: child1.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map([
                    [SELF_PROP_NAME, true],
                    [PROP_NAME, true],
                  ]),
                },
              },
            });

            expect(event2).toEqual<IControlStateChangeEvent>({
              type: 'StateChange',
              source: child1.id,
              meta: {},
              controlId: expect.any(Symbol),
              debugPath: expect.any(String),
              changes: new Map<string, unknown>([
                ['value', expect.any(Object)],
                ['childDisabled', true],
                ['childrenEnabled', false],
                ['childrenDisabled', true],
                ['childEnabled', false],
                [CHILD_PROP_NAME, false],
                [CHILDREN_PROP_NAME, false],
                ['disabled', true],
                ['enabled', false],
                [PROP_NAME, false],
                ['status', 'DISABLED'],
              ]),
              childEvents: {
                0: {
                  type: 'StateChange',
                  source: child1.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map<string, unknown>([
                    ['selfDisabled', true],
                    ['selfEnabled', false],
                    ['disabled', true],
                    ['enabled', false],
                    ['status', 'DISABLED'],
                  ]),
                },
              },
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
            selfPending: false,
            childPending: true,
            childrenPending: true,
            status: 'PENDING',
          });

          testAllDefaultsExcept(
            b,
            'pending',
            'selfPending',
            'childPending',
            'childrenPending',
            'parent',
            'status'
          );

          const [event1, event2] = await promise1;

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: child1.id,
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: new Map<string, unknown>([
              ['childPending', true],
              ['childrenPending', true],
              ['pending', true],
              ['status', 'PENDING'],
            ]),
            childEvents: {
              0: {
                type: 'StateChange',
                source: child1.id,
                meta: {},
                controlId: expect.any(Symbol),
                debugPath: expect.any(String),
                changes: new Map<string, unknown>([
                  ['pendingStore', new Set([CONTROL_SELF_ID])],
                  ['selfPending', true],
                  ['pending', true],
                  ['status', 'PENDING'],
                ]),
              },
            },
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
            selfDisabled: false,
            childDisabled: true,
            childrenDisabled: true,
            enabled: false,
            selfEnabled: true,
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

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: child1.id,
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: new Map<string, unknown>(),
            childEvents: {
              0: {
                type: 'StateChange',
                source: child1.id,
                meta: {},
                controlId: expect.any(Symbol),
                debugPath: expect.any(String),
                changes: new Map<string, unknown>([
                  ['pendingStore', new Set([CONTROL_SELF_ID])],
                  ['selfPending', true],
                  ['pending', true],
                ]),
              },
            },
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

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: child1.id,
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: new Map<string, unknown>([
              ['childPending', true],
              ['childrenPending', true],
              ['pending', true],
              ['status', 'PENDING'],
            ]),
            childEvents: {
              0: {
                type: 'StateChange',
                source: child1.id,
                meta: {},
                controlId: expect.any(Symbol),
                debugPath: expect.any(String),
                changes: new Map<string, unknown>([
                  ['pendingStore', new Set([CONTROL_SELF_ID])],
                  ['selfPending', true],
                  ['pending', true],
                  ['status', 'PENDING'],
                ]),
              },
            },
          });

          expect(event2).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: child1.id,
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: new Map<string, unknown>([
              ['value', expect.any(Object)],
              ['childDisabled', true],
              ['childrenEnabled', false],
              ['childrenDisabled', true],
              ['childEnabled', false],
              ['childPending', false],
              ['childrenPending', false],
              ['disabled', true],
              ['enabled', false],
              ['pending', false],
              ['status', 'DISABLED'],
            ]),
            childEvents: {
              0: {
                type: 'StateChange',
                source: child1.id,
                meta: {},
                controlId: expect.any(Symbol),
                debugPath: expect.any(String),
                changes: new Map<string, unknown>([
                  ['selfDisabled', true],
                  ['selfEnabled', false],
                  ['disabled', true],
                  ['enabled', false],
                  ['status', 'DISABLED'],
                ]),
              },
            },
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

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: child1.id,
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: new Map<string, unknown>([
              ['value', expect.any(Object)],
              ['childDisabled', true],
              ['childrenEnabled', false],
              ['childrenDisabled', true],
              ['childEnabled', false],
              ['disabled', true],
              ['enabled', false],
              ['status', 'DISABLED'],
            ]),
            childEvents: {
              0: {
                type: 'StateChange',
                source: child1.id,
                meta: {},
                controlId: expect.any(Symbol),
                debugPath: expect.any(String),
                changes: new Map<string, unknown>([
                  ['selfDisabled', true],
                  ['selfEnabled', false],
                  ['disabled', true],
                  ['enabled', false],
                  ['status', 'DISABLED'],
                ]),
              },
            },
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

          expect(event1).toEqual<IControlStateChangeEvent>({
            type: 'StateChange',
            source: child1.id,
            meta: {},
            controlId: expect.any(Symbol),
            debugPath: expect.any(String),
            changes: new Map<string, unknown>([
              ['value', expect.any(Object)],
              ['childDisabled', false],
              ['childrenEnabled', true],
              ['childrenDisabled', false],
              ['childEnabled', true],
              ['disabled', false],
              ['enabled', true],
              ['status', 'VALID'],
            ]),
            childEvents: {
              0: {
                type: 'StateChange',
                source: child1.id,
                meta: {},
                controlId: expect.any(Symbol),
                debugPath: expect.any(String),
                changes: new Map<string, unknown>([
                  ['selfDisabled', false],
                  ['selfEnabled', true],
                  ['disabled', false],
                  ['enabled', true],
                  ['status', 'VALID'],
                ]),
              },
            },
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
          const SELF_PROP_NAME = `self${prop}`;
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

              expect(event1).toEqual<IControlStateChangeEvent>({
                type: 'StateChange',
                source: child1.id,
                meta: {},
                controlId: expect.any(Symbol),
                debugPath: expect.any(String),
                changes: new Map([
                  [CHILD_PROP_NAME, true],
                  [CHILDREN_PROP_NAME, true],
                  [PROP_NAME, true],
                ]),
                childEvents: {
                  0: {
                    type: 'StateChange',
                    source: child1.id,
                    meta: {},
                    controlId: expect.any(Symbol),
                    debugPath: expect.any(String),
                    changes: new Map([
                      [CHILD_PROP_NAME, true],
                      [CHILDREN_PROP_NAME, true],
                      [PROP_NAME, true],
                    ]),
                    childEvents: {
                      0: {
                        type: 'StateChange',
                        source: child1.id,
                        meta: {},
                        controlId: expect.any(Symbol),
                        debugPath: expect.any(String),
                        changes: new Map([
                          [SELF_PROP_NAME, true],
                          [PROP_NAME, true],
                        ]),
                      },
                    },
                  },
                },
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

              expect(event1).toEqual<IControlStateChangeEvent>({
                type: 'StateChange',
                source: child1.id,
                meta: {},
                controlId: expect.any(Symbol),
                debugPath: expect.any(String),
                changes: new Map(),
                childEvents: {
                  0: {
                    type: 'StateChange',
                    source: child1.id,
                    meta: {},
                    controlId: expect.any(Symbol),
                    debugPath: expect.any(String),
                    changes: new Map(),
                    childEvents: {
                      0: {
                        type: 'StateChange',
                        source: child1.id,
                        meta: {},
                        controlId: expect.any(Symbol),
                        debugPath: expect.any(String),
                        changes: new Map([
                          [SELF_PROP_NAME, true],
                          [PROP_NAME, true],
                        ]),
                      },
                    },
                  },
                },
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

              expect(event1).toEqual<IControlStateChangeEvent>({
                type: 'StateChange',
                source: child1.id,
                meta: {},
                controlId: expect.any(Symbol),
                debugPath: expect.any(String),
                changes: new Map([
                  [CHILD_PROP_NAME, true],
                  [CHILDREN_PROP_NAME, true],
                  [PROP_NAME, true],
                ]),
                childEvents: {
                  0: {
                    type: 'StateChange',
                    source: child1.id,
                    meta: {},
                    controlId: expect.any(Symbol),
                    debugPath: expect.any(String),
                    changes: new Map([
                      [CHILD_PROP_NAME, true],
                      [CHILDREN_PROP_NAME, true],
                      [PROP_NAME, true],
                    ]),
                    childEvents: {
                      0: {
                        type: 'StateChange',
                        source: child1.id,
                        meta: {},
                        controlId: expect.any(Symbol),
                        debugPath: expect.any(String),
                        changes: new Map([
                          [SELF_PROP_NAME, true],
                          [PROP_NAME, true],
                        ]),
                      },
                    },
                  },
                },
              });

              expect(event2).toEqual<IControlStateChangeEvent>({
                type: 'StateChange',
                source: child1.id,
                meta: {},
                controlId: expect.any(Symbol),
                debugPath: expect.any(String),
                changes: new Map<string, unknown>([
                  ['value', expect.any(Object)],
                  ['childDisabled', true],
                  ['childrenEnabled', false],
                  ['childrenDisabled', true],
                  ['childEnabled', false],
                  [CHILD_PROP_NAME, false],
                  [CHILDREN_PROP_NAME, false],
                  ['disabled', true],
                  ['enabled', false],
                  [PROP_NAME, false],
                  ['status', 'DISABLED'],
                ]),
                childEvents: {
                  0: {
                    type: 'StateChange',
                    source: child1.id,
                    meta: {},
                    controlId: expect.any(Symbol),
                    debugPath: expect.any(String),
                    changes: new Map<string, unknown>([
                      ['value', expect.any(Object)],
                      ['childDisabled', true],
                      ['childrenEnabled', false],
                      ['childrenDisabled', true],
                      ['childEnabled', false],
                      [CHILD_PROP_NAME, false],
                      [CHILDREN_PROP_NAME, false],
                      ['disabled', true],
                      ['enabled', false],
                      [PROP_NAME, false],
                      ['status', 'DISABLED'],
                    ]),
                    childEvents: {
                      0: {
                        type: 'StateChange',
                        source: child1.id,
                        meta: {},
                        controlId: expect.any(Symbol),
                        debugPath: expect.any(String),
                        changes: new Map<string, unknown>([
                          ['selfDisabled', true],
                          ['selfEnabled', false],
                          ['disabled', true],
                          ['enabled', false],
                          ['status', 'DISABLED'],
                        ]),
                      },
                    },
                  },
                },
              });

              expect(event3).toEqual(undefined);
            });
          });
        });

        // markChildrenX
        ['Touched', 'Dirty', 'Readonly', 'Submitted'].forEach((prop) => {
          const METHOD_NAME = `markChildren${prop}` as keyof AbstractControl &
            string;
          const PROP_NAME = prop.toLowerCase();
          const SELF_PROP_NAME = `self${prop}`;
          const CHILD_PROP_NAME = `child${prop}`;
          const CHILDREN_PROP_NAME = `children${prop}`;

          describe(METHOD_NAME, () => {
            it('deep = false', async () => {
              const [promise1, end] = getControlEventsUntilEnd(b);

              b[METHOD_NAME](true);

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

              expect(event1).toEqual<IControlStateChangeEvent>({
                type: 'StateChange',
                source: b.id,
                meta: {},
                controlId: expect.any(Symbol),
                debugPath: expect.any(String),
                changes: new Map([
                  [CHILD_PROP_NAME, true],
                  [CHILDREN_PROP_NAME, true],
                  [PROP_NAME, true],
                ]),
                childEvents: {
                  0: {
                    type: 'StateChange',
                    source: b.id,
                    meta: {},
                    controlId: expect.any(Symbol),
                    debugPath: expect.any(String),
                    changes: new Map([
                      [PROP_NAME, true],
                      [SELF_PROP_NAME, true],
                    ]),
                  },
                },
              });

              expect(event2).toEqual(undefined);
            });

            it('deep = true', async () => {
              const [promise1, end] = getControlEventsUntilEnd(b);

              b[METHOD_NAME](true, { deep: true });

              end.next();
              end.complete();

              expect(b).toImplementObject({
                [PROP_NAME]: true,
                [CHILD_PROP_NAME]: true,
                [CHILDREN_PROP_NAME]: true,
              });

              expect(b.get('0')).toImplementObject({
                [PROP_NAME]: true,
                [SELF_PROP_NAME]: true,
                [CHILD_PROP_NAME]: true,
                [CHILDREN_PROP_NAME]: true,
              });

              expect(b.get('0', '0')).toImplementObject({
                [PROP_NAME]: true,
                [SELF_PROP_NAME]: true,
              });

              testAllDefaultsExcept(
                b,
                PROP_NAME,
                CHILD_PROP_NAME,
                CHILDREN_PROP_NAME,
                'parent'
              );

              const [event1, event2] = await promise1;

              expect(event1).toEqual<IControlStateChangeEvent>({
                type: 'StateChange',
                source: b.id,
                meta: {},
                controlId: expect.any(Symbol),
                debugPath: expect.any(String),
                changes: new Map([
                  [CHILD_PROP_NAME, true],
                  [CHILDREN_PROP_NAME, true],
                  [PROP_NAME, true],
                ]),
                childEvents: {
                  0: {
                    type: 'StateChange',
                    source: b.id,
                    meta: {},
                    controlId: expect.any(Symbol),
                    debugPath: expect.any(String),
                    changes: new Map([
                      [CHILD_PROP_NAME, true],
                      [CHILDREN_PROP_NAME, true],
                      [SELF_PROP_NAME, true],
                      [PROP_NAME, true],
                    ]),
                    childEvents: {
                      0: {
                        type: 'StateChange',
                        source: b.id,
                        meta: {},
                        controlId: expect.any(Symbol),
                        debugPath: expect.any(String),
                        changes: new Map([
                          [PROP_NAME, true],
                          [SELF_PROP_NAME, true],
                        ]),
                      },
                    },
                  },
                },
              });

              expect(event2).toEqual(undefined);
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
        const SELF_PROP_NAME = `self${prop}`;
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

            const [event1, event2] = await promise1;

            expect(event1).toEqual<IControlStateChangeEvent>({
              type: 'StateChange',
              source: child1.id,
              meta: {},
              controlId: expect.any(Symbol),
              debugPath: expect.any(String),
              changes: new Map([
                [CHILD_PROP_NAME, true],
                [PROP_NAME, true],
              ]),
              childEvents: {
                0: {
                  type: 'StateChange',
                  source: child1.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map([
                    [SELF_PROP_NAME, true],
                    [PROP_NAME, true],
                  ]),
                },
              },
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

            expect(event1).toEqual<IControlStateChangeEvent>({
              type: 'StateChange',
              source: child1.id,
              meta: {},
              controlId: expect.any(Symbol),
              debugPath: expect.any(String),
              changes: new Map(),
              childEvents: {
                0: {
                  type: 'StateChange',
                  source: child1.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map([
                    [SELF_PROP_NAME, true],
                    [PROP_NAME, true],
                  ]),
                },
              },
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

            expect(event1).toEqual<IControlStateChangeEvent>({
              type: 'StateChange',
              source: child1.id,
              meta: {},
              controlId: expect.any(Symbol),
              debugPath: expect.any(String),
              changes: new Map([
                [CHILD_PROP_NAME, true],
                [PROP_NAME, true],
              ]),
              childEvents: {
                0: {
                  type: 'StateChange',
                  source: child1.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map([
                    [SELF_PROP_NAME, true],
                    [PROP_NAME, true],
                  ]),
                },
              },
            });

            expect(event2).toEqual<IControlStateChangeEvent>({
              type: 'StateChange',
              source: child1.id,
              meta: {},
              controlId: expect.any(Symbol),
              debugPath: expect.any(String),
              changes: new Map<string, unknown>([
                ['value', expect.any(Object)],
                ['childDisabled', true],
                ['childrenEnabled', false],
                [CHILD_PROP_NAME, false],
                [PROP_NAME, false],
              ]),
              childEvents: {
                0: {
                  type: 'StateChange',
                  source: child1.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map<string, unknown>([
                    ['selfDisabled', true],
                    ['selfEnabled', false],
                    ['disabled', true],
                    ['enabled', false],
                    ['status', 'DISABLED'],
                  ]),
                },
              },
            });

            expect(event3).toEqual(undefined);
          });
        });
      });

      ['Readonly', 'Submitted'].forEach((prop) => {
        const METHOD_NAME = `mark${prop}` as keyof AbstractControl & string;
        const PROP_NAME = prop.toLowerCase();
        const SELF_PROP_NAME = `self${prop}`;
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

            const [event1, event2] = await promise1;

            expect(event1).toEqual<IControlStateChangeEvent>({
              type: 'StateChange',
              source: child1.id,
              meta: {},
              controlId: expect.any(Symbol),
              debugPath: expect.any(String),
              changes: new Map([[CHILD_PROP_NAME, true]]),
              childEvents: {
                0: {
                  type: 'StateChange',
                  source: child1.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map([
                    [SELF_PROP_NAME, true],
                    [PROP_NAME, true],
                  ]),
                },
              },
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

            expect(event1).toEqual<IControlStateChangeEvent>({
              type: 'StateChange',
              source: child1.id,
              meta: {},
              controlId: expect.any(Symbol),
              debugPath: expect.any(String),
              changes: new Map(),
              childEvents: {
                0: {
                  type: 'StateChange',
                  source: child1.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map([
                    [SELF_PROP_NAME, true],
                    [PROP_NAME, true],
                  ]),
                },
              },
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

            expect(event1).toEqual<IControlStateChangeEvent>({
              type: 'StateChange',
              source: child1.id,
              meta: {},
              controlId: expect.any(Symbol),
              debugPath: expect.any(String),
              changes: new Map([[CHILD_PROP_NAME, true]]),
              childEvents: {
                0: {
                  type: 'StateChange',
                  source: child1.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map([
                    [SELF_PROP_NAME, true],
                    [PROP_NAME, true],
                  ]),
                },
              },
            });

            expect(event2).toEqual<IControlStateChangeEvent>({
              type: 'StateChange',
              source: child1.id,
              meta: {},
              controlId: expect.any(Symbol),
              debugPath: expect.any(String),
              changes: new Map<string, unknown>([
                ['value', expect.any(Object)],
                ['childDisabled', true],
                ['childrenEnabled', false],
                [CHILD_PROP_NAME, false],
              ]),
              childEvents: {
                0: {
                  type: 'StateChange',
                  source: child1.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map<string, unknown>([
                    ['selfDisabled', true],
                    ['selfEnabled', false],
                    ['disabled', true],
                    ['enabled', false],
                    ['status', 'DISABLED'],
                  ]),
                },
              },
            });

            expect(event3).toEqual(undefined);
          });
        });
      });

      // markChildrenX
      ['Touched', 'Dirty', 'Readonly', 'Submitted'].forEach((prop) => {
        const METHOD_NAME = `markChildren${prop}` as keyof AbstractControl &
          string;
        const PROP_NAME = prop.toLowerCase();
        const SELF_PROP_NAME = `self${prop}`;
        const CHILD_PROP_NAME = `child${prop}`;
        const CHILDREN_PROP_NAME = `children${prop}`;

        describe(METHOD_NAME, () => {
          it('with enabled children', async () => {
            const [promise1, end] = getControlEventsUntilEnd(b);

            b[METHOD_NAME](true);

            end.next();
            end.complete();

            expect(b).toImplementObject({
              [PROP_NAME]: true,
              [CHILD_PROP_NAME]: true,
              [CHILDREN_PROP_NAME]: true,
            });

            const [event1, event2] = await promise1;

            expect(event1).toEqual<IControlStateChangeEvent>({
              type: 'StateChange',
              source: b.id,
              meta: {},
              controlId: expect.any(Symbol),
              debugPath: expect.any(String),
              changes: new Map([
                [CHILDREN_PROP_NAME, true],
                [CHILD_PROP_NAME, true],
                [PROP_NAME, true],
              ]),
              childEvents: {
                0: {
                  type: 'StateChange',
                  source: b.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map([
                    [SELF_PROP_NAME, true],
                    [PROP_NAME, true],
                  ]),
                },
                1: {
                  type: 'StateChange',
                  source: b.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map([
                    [SELF_PROP_NAME, true],
                    [PROP_NAME, true],
                  ]),
                },
              },
            });

            expect(event2).toEqual(undefined);
          });

          it('with disabled child', async () => {
            child1.markDisabled(true);

            const [promise1, end] = getControlEventsUntilEnd(b);

            b[METHOD_NAME](true);

            end.next();
            end.complete();

            expect(b).toImplementObject({
              disabled: false,
              childDisabled: true,
              childrenDisabled: false,
              enabled: true,
              childEnabled: true,
              childrenEnabled: false,
              [PROP_NAME]: true,
              [CHILDREN_PROP_NAME]: true,
              [CHILD_PROP_NAME]: true,
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
              PROP_NAME,
              CHILDREN_PROP_NAME,
              CHILD_PROP_NAME,
              'status'
            );

            const [event1, event2] = await promise1;

            expect(event1).toEqual<IControlStateChangeEvent>({
              type: 'StateChange',
              source: b.id,
              meta: {},
              controlId: expect.any(Symbol),
              debugPath: expect.any(String),
              changes: new Map([
                [CHILDREN_PROP_NAME, true],
                [CHILD_PROP_NAME, true],
                [PROP_NAME, true],
              ]),
              childEvents: {
                0: {
                  type: 'StateChange',
                  source: b.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map([
                    [SELF_PROP_NAME, true],
                    [PROP_NAME, true],
                  ]),
                },
                1: {
                  type: 'StateChange',
                  source: b.id,
                  meta: {},
                  controlId: expect.any(Symbol),
                  debugPath: expect.any(String),
                  changes: new Map([
                    [SELF_PROP_NAME, true],
                    [PROP_NAME, true],
                  ]),
                },
              },
            });

            expect(event2).toEqual(undefined);
          });
        });
      });
    });
  });
}

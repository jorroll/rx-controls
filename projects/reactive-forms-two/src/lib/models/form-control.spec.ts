import { Subject } from 'rxjs';
import { filter, skip, take, takeUntil, toArray } from 'rxjs/operators';
import {
  AbstractControl,
  ControlId,
  IControlStateChangeEvent,
  IControlValidationEvent,
  ValidatorFn,
} from './abstract-control/abstract-control';
import { CONTROL_SELF_ID } from './abstract-control/abstract-control-base';
import runAbstractControlBaseTestSuite from './abstract-control/abstract-control-base-tests';
import { FormControl } from './form-control';
import { FormGroup } from './form-group';
import runSharedTestSuite from './shared-tests';
import {
  getControlEventsUntilEnd,
  testAllAbstractControlDefaultsExcept,
  wait,
} from './test-util';

runAbstractControlBaseTestSuite(
  'FormControl',
  (args) => new FormControl(null, args?.options)
);

runSharedTestSuite(
  'FormControl',
  (args) => new FormControl(null, args?.options),
  {
    controlContainer: false,
  }
);

function testAllDefaultsExcept(
  c: FormControl,
  ...skipTests: Array<keyof FormControl>
) {
  testAllAbstractControlDefaultsExcept(c, ...skipTests);

  if (!(skipTests.includes('value') || skipTests.includes('rawValue'))) {
    expect(c.value).toEqual(null);
    expect(c.rawValue).toEqual(null);
  }
}

describe('FormControl', () => {
  beforeEach(() => {
    // AbstractControl.eventId(0);
  });

  describe('initialization', () => {
    it('defaults', () => {
      testAllDefaultsExcept(new FormControl());
    });

    describe('options', () => {
      let c: FormControl;

      it('value/rawValue', () => {
        c = new FormControl('one');

        expect(c.value).toEqual('one');
        expect(c.rawValue).toEqual('one');

        testAllDefaultsExcept(c, 'value', 'rawValue');
      });

      it('id', () => {
        c = new FormControl(null, {
          id: 'one',
        });

        expect(c.id).toEqual('one');
        testAllDefaultsExcept(c, 'id');
      });

      it('data', () => {
        c = new FormControl(null, {
          data: 'one',
        });

        expect(c.data).toEqual('one');
        testAllDefaultsExcept(c, 'data');
      });

      it('all options', () => {
        const c = new FormControl('one', {
          data: 'one',
          dirty: true,
          disabled: true,
          errors: { error: true },
          id: 'controlId',
          pending: true,
          readonly: true,
          submitted: true,
          touched: true,
          validators: (c) => null,
        });

        expect(c).toImplementObject({
          value: 'one',
          rawValue: 'one',
          invalid: true,
          status: 'DISABLED',
          valid: false,
          data: 'one',
          dirty: true,
          parent: null,
          disabled: true,
          enabled: false,
          errors: { error: true },
          errorsStore: new Map([[CONTROL_SELF_ID, { error: true }]]),
          id: 'controlId',
          pending: true,
          pendingStore: new Set([CONTROL_SELF_ID]),
          readonly: true,
          submitted: true,
          touched: true,
          validator: expect.any(Function),
          validatorStore: new Map([[CONTROL_SELF_ID, expect.any(Function)]]),
        });
      });
    });
  });

  describe('clone', () => {
    it('', () => {
      const parent = new FormGroup();

      const original = new FormControl('one', {
        data: 'one',
        dirty: true,
        disabled: true,
        errors: { error: true },
        id: 'controlId',
        pending: true,
        readonly: true,
        submitted: true,
        touched: true,
        validators: (c) => null,
      });

      original._setParent(parent);

      const clone = original.clone();

      expect(clone).not.toBe(original);
      expect(clone).toEqualControl(original, {
        skip: ['parent'],
      });
    });
  });

  describe('setValue', () => {
    // let g: FormControl;
    let c: FormControl;
    // let o: FormControl;
    beforeEach(() => {
      c = new FormControl('oldValue');
      // o = new FormControl('otherValue');
      // g = new FormControl({ one: c });
    });

    it('should have starting value', () => {
      expect(c.rawValue).toEqual('oldValue');
      // expect(o.value).toEqual('otherValue');
    });

    it('should set the value of the control', () => {
      c.setValue('newValue');
      expect(c.rawValue).toEqual('newValue');
    });

    it('should fire a StateChange event', async () => {
      const [promise, end] = getControlEventsUntilEnd(c);

      c.setValue('newValue');

      expect(c).toImplementObject({
        value: 'newValue',
        rawValue: 'newValue',
      });

      end.next();
      end.complete();

      const [event1, event2, event3, event4] = await promise;

      expect(event1).toEqual<IControlValidationEvent<unknown, unknown>>({
        type: 'ValidationStart',
        source: c.id,
        rawValue: 'newValue',
        value: 'newValue',
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
      });

      expect(event2).toEqual<IControlValidationEvent<unknown, unknown>>({
        type: 'AsyncValidationStart',
        source: c.id,
        rawValue: 'newValue',
        value: 'newValue',
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
      });

      expect(event3).toEqual<IControlStateChangeEvent>({
        type: 'StateChange',
        source: c.id,
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        changes: new Map([
          ['rawValue', 'newValue'],
          ['value', 'newValue'],
        ]),
      });

      expect(event4).toBe(undefined);
    });

    it('with validator', async () => {
      c.setValidators((c) =>
        c.rawValue !== 'oldValue' ? null : { required: true }
      );

      expect(c).toImplementObject({
        value: 'oldValue',
        rawValue: 'oldValue',
        valid: false,
        selfValid: false,
        invalid: true,
        selfInvalid: true,
        status: 'INVALID',
        errors: { required: true },
        selfErrors: { required: true },
        errorsStore: new Map([[CONTROL_SELF_ID, { required: true }]]),
        validator: expect.any(Function),
        validatorStore: new Map([[CONTROL_SELF_ID, expect.any(Function)]]),
      });

      testAllDefaultsExcept(
        c,
        'value',
        'rawValue',
        'status',
        'valid',
        'selfValid',
        'invalid',
        'selfInvalid',
        'errors',
        'selfErrors',
        'errorsStore',
        'validator',
        'validatorStore'
      );

      const [promise1, end] = getControlEventsUntilEnd(c);

      c.setValue('hi');

      end.next();
      end.complete();

      expect(c).toImplementObject({
        value: 'hi',
        rawValue: 'hi',
        validator: expect.any(Function),
        validatorStore: new Map([[CONTROL_SELF_ID, expect.any(Function)]]),
      });

      testAllDefaultsExcept(
        c,
        'value',
        'rawValue',
        'validator',
        'validatorStore'
      );

      const [event1, event2, event3, event4] = await promise1;

      expect(event1).toEqual<IControlValidationEvent<string, string>>({
        type: 'ValidationStart',
        source: c.id,
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        rawValue: 'hi',
        value: 'hi',
      });

      expect(event2).toEqual<IControlValidationEvent<string, string>>({
        type: 'AsyncValidationStart',
        source: c.id,
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        rawValue: 'hi',
        value: 'hi',
      });

      expect(event3).toEqual<IControlStateChangeEvent>({
        type: 'StateChange',
        source: c.id,
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        changes: new Map<string, unknown>([
          ['rawValue', 'hi'],
          ['value', 'hi'],
          ['errorsStore', new Map()],
          ['selfErrors', null],
          ['errors', null],
          ['valid', true],
          ['selfValid', true],
          ['invalid', false],
          ['selfInvalid', false],
          ['status', 'VALID'],
        ]),
        meta: {},
      });

      expect(event4).toBe(undefined);
    });
  });

  describe('validationService', () => {
    let c: FormControl;
    beforeEach(() => {
      c = new FormControl('oldValue');
    });

    it('with one service', async () => {
      const [promise1, end] = getControlEventsUntilEnd(c);

      c.events
        .pipe(
          filter((event) => event.type === 'ValidationStart'),
          takeUntil(end)
        )
        .subscribe((_e) => {
          const e = _e as IControlValidationEvent<string, string>;

          const errors =
            e.rawValue === 'validValue' ? null : { invalidValue: true };

          c.setErrors(errors, { source: 'myValidationService' });
        });

      c.setValue('invalidValue');
      expect(c.rawValue).toEqual('invalidValue');

      c.setValue('validValue');
      expect(c.rawValue).toEqual('validValue');

      end.next();
      end.complete();

      const [
        event1,
        event2,
        event3,
        event4,
        event5,
        event6,
        event7,
        event8,
        event9,
      ] = await promise1;

      expect(event1).toEqual<IControlValidationEvent<unknown, unknown>>({
        type: 'ValidationStart',
        source: c.id,
        rawValue: 'invalidValue',
        value: 'invalidValue',
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
      });

      expect(event2).toEqual<IControlStateChangeEvent>({
        type: 'StateChange',
        source: 'myValidationService',
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        changes: new Map<string, any>([
          [
            'errorsStore',
            new Map([['myValidationService', { invalidValue: true }]]),
          ],
          ['selfErrors', { invalidValue: true }],
          ['errors', { invalidValue: true }],
          ['valid', false],
          ['selfValid', false],
          ['invalid', true],
          ['selfInvalid', true],
          ['status', 'INVALID'],
        ]),
      });

      expect(event3).toEqual<IControlValidationEvent<unknown, unknown>>({
        type: 'AsyncValidationStart',
        source: c.id,
        rawValue: 'invalidValue',
        value: 'invalidValue',
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        meta: {},
      });

      expect(event4).toEqual<IControlStateChangeEvent>({
        type: 'StateChange',
        source: c.id,
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        changes: new Map<string, any>([
          ['rawValue', 'invalidValue'],
          ['value', 'invalidValue'],
        ]),
      });

      expect(event5).toEqual<IControlValidationEvent<unknown, unknown>>({
        type: 'ValidationStart',
        source: c.id,
        rawValue: 'validValue',
        value: 'validValue',
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        meta: {},
      });

      expect(event6).toEqual<IControlStateChangeEvent>({
        type: 'StateChange',
        source: 'myValidationService',
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
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

      expect(event7).toEqual<IControlValidationEvent<unknown, unknown>>({
        type: 'AsyncValidationStart',
        source: c.id,
        rawValue: 'validValue',
        value: 'validValue',
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
      });

      expect(event8).toEqual<IControlStateChangeEvent>({
        type: 'StateChange',
        source: c.id,
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        changes: new Map<string, any>([
          ['rawValue', 'validValue'],
          ['value', 'validValue'],
        ]),
      });

      expect(event9).toEqual(undefined);
    });

    it('with two services', async () => {
      const [promise1, end] = getControlEventsUntilEnd(c);

      c.events
        .pipe(
          filter((event) => event.type === 'ValidationStart'),
          takeUntil(end)
        )
        .subscribe((_e) => {
          const e = _e as IControlValidationEvent<string, string>;

          const errors =
            e.rawValue.toLowerCase() === e.rawValue
              ? null
              : { mustBeLowercase: true };

          c.setErrors(errors, { source: 'lowercaseValidationService' });
        });

      c.events
        .pipe(
          filter((event) => event.type === 'ValidationStart'),
          takeUntil(end)
        )
        .subscribe((_e) => {
          const e = _e as IControlValidationEvent<string, string>;

          const errors =
            e.rawValue.toLowerCase() === 'validvalue'
              ? null
              : { invalidValue: true };

          c.setErrors(errors, { source: 'valueValidationService' });
        });

      c.setValue('invalidValue');
      expect(c.rawValue).toEqual('invalidValue');

      c.setValue('validValue');
      expect(c.rawValue).toEqual('validValue');

      c.setValue('validvalue');
      expect(c.rawValue).toEqual('validvalue');

      end.next();
      end.complete();

      const [
        event1,
        event2,
        event3,
        event4,
        event5,
        event6,
        event7,
        event8,
        event9,
        event10,
        event11,
        event12,
        event13,
        event14,
      ] = await promise1;

      expect(event1).toEqual<IControlValidationEvent<unknown, unknown>>({
        type: 'ValidationStart',
        source: c.id,
        rawValue: 'invalidValue',
        value: 'invalidValue',
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
      });

      expect(event2).toEqual<IControlStateChangeEvent>({
        type: 'StateChange',
        source: 'lowercaseValidationService',
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        changes: new Map<string, any>([
          [
            'errorsStore',
            new Map([
              ['lowercaseValidationService', { mustBeLowercase: true }],
            ]),
          ],
          ['selfErrors', { mustBeLowercase: true }],
          ['errors', { mustBeLowercase: true }],
          ['valid', false],
          ['selfValid', false],
          ['invalid', true],
          ['selfInvalid', true],
          ['status', 'INVALID'],
        ]),
      });

      expect(event3).toEqual<IControlStateChangeEvent>({
        type: 'StateChange',
        source: 'valueValidationService',
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        changes: new Map<string, any>([
          [
            'errorsStore',
            new Map([
              ['lowercaseValidationService', { mustBeLowercase: true }],
              ['valueValidationService', { invalidValue: true }],
            ]),
          ],
          ['selfErrors', { invalidValue: true, mustBeLowercase: true }],
          ['errors', { invalidValue: true, mustBeLowercase: true }],
        ]),
      });

      expect(event4).toEqual<IControlValidationEvent<unknown, unknown>>({
        type: 'AsyncValidationStart',
        source: c.id,
        rawValue: 'invalidValue',
        value: 'invalidValue',
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        meta: {},
      });

      expect(event5).toEqual<IControlStateChangeEvent>({
        type: 'StateChange',
        source: c.id,
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        changes: new Map<string, any>([
          ['rawValue', 'invalidValue'],
          ['value', 'invalidValue'],
        ]),
      });

      expect(event6).toEqual<IControlValidationEvent<unknown, unknown>>({
        type: 'ValidationStart',
        source: c.id,
        rawValue: 'validValue',
        value: 'validValue',
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        meta: {},
      });

      expect(event7).toEqual<IControlStateChangeEvent>({
        type: 'StateChange',
        source: 'valueValidationService',
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        changes: new Map<string, any>([
          [
            'errorsStore',
            new Map([
              ['lowercaseValidationService', { mustBeLowercase: true }],
            ]),
          ],
          ['selfErrors', { mustBeLowercase: true }],
          ['errors', { mustBeLowercase: true }],
        ]),
      });

      expect(event8).toEqual<IControlValidationEvent<unknown, unknown>>({
        type: 'AsyncValidationStart',
        source: c.id,
        rawValue: 'validValue',
        value: 'validValue',
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        meta: {},
      });

      expect(event9).toEqual<IControlStateChangeEvent>({
        type: 'StateChange',
        source: c.id,
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        changes: new Map<string, any>([
          ['rawValue', 'validValue'],
          ['value', 'validValue'],
        ]),
      });

      expect(event10).toEqual<IControlValidationEvent<unknown, unknown>>({
        type: 'ValidationStart',
        source: c.id,
        rawValue: 'validvalue',
        value: 'validvalue',
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        meta: {},
      });

      expect(event11).toEqual<IControlStateChangeEvent>({
        type: 'StateChange',
        source: 'lowercaseValidationService',
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
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

      expect(event12).toEqual<IControlValidationEvent<unknown, unknown>>({
        type: 'AsyncValidationStart',
        source: c.id,
        rawValue: 'validvalue',
        value: 'validvalue',
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        meta: {},
      });

      expect(event13).toEqual<IControlStateChangeEvent>({
        type: 'StateChange',
        source: c.id,
        meta: {},
        controlId: expect.any(Symbol),
        debugPath: expect.any(String),
        changes: new Map<string, any>([
          ['rawValue', 'validvalue'],
          ['value', 'validvalue'],
        ]),
      });

      expect(event14).toEqual(undefined);
    });
  });

  describe(`replayState`, () => {
    let a: FormControl<string>;
    let b: FormControl<number>;
    beforeEach(() => {
      a = new FormControl('one');
      b = new FormControl(2);
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
          ['value', 'one'],
          ['rawValue', 'one'],
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

    it('can be subscribed to multiple times', () => {
      // AbstractControl.eventId(0);

      const state = a.replayState();

      expect(b.rawValue).toEqual(2);

      state.subscribe((e) => b.processEvent(e));

      expect(b.rawValue).toEqual(a.rawValue);

      b.setValue(3);

      expect(b.rawValue).not.toEqual(a.rawValue);
      expect(b.rawValue).toEqual(3);

      state.subscribe((e) => b.processEvent(e));

      expect(b.rawValue).toEqual(a.rawValue);
    });
  });

  describe(`observe`, () => {
    let a: FormControl;
    beforeEach(() => {
      a = new FormControl();
    });

    function theTests(valueProp: 'value' | 'rawValue') {
      it('', () => {
        const promise1 = a
          .observe(valueProp)
          .pipe(take(1))
          .forEach((value) => {
            expect(value).toEqual(null);
          });

        const promise2 = a
          .observe(valueProp)
          .pipe(skip(1), take(1))
          .forEach((value) => {
            expect(value).toEqual('one');
          });

        a.setValue('one');

        return Promise.all([promise1, promise2]);
      });

      it('waits for sync validation complete', async () => {
        const [_, end] = getControlEventsUntilEnd(a);

        a.events
          .pipe(
            filter((event) => event.type === 'ValidationStart'),
            takeUntil(end)
          )
          .subscribe((_e) => {
            const e = _e as IControlValidationEvent<string, string>;

            const errors =
              e.rawValue === 'validValue' ? null : { invalidValue: true };

            a.setErrors(errors, { source: 'myValidationService' });
          });

        const promise1 = a
          .observe(valueProp)
          .pipe(takeUntil(end), toArray())
          .toPromise();

        a.setValue('invalidValue');

        expect(a.errors).toEqual({ invalidValue: true });
        expect(a.rawValue).toEqual('invalidValue');
        expect(a.value).toEqual('invalidValue');

        a.setValue('validValue');

        expect(a.errors).toEqual(null);
        expect(a.rawValue).toEqual('validValue');
        expect(a.value).toEqual('validValue');

        end.next();
        end.complete();

        const [value1, value2, value3, value4] = await promise1;

        expect(value1).toEqual(null);
        expect(value2).toEqual('invalidValue');
        expect(value3).toEqual('validValue');
        expect(value4).toEqual(undefined);
      });

      it('parent', () => {
        const promise1 = a
          .observe('parent')
          .pipe(take(1))
          .forEach((p) => {
            expect(p).toEqual(null);
          });

        const parent = new FormControl();

        const promise2 = a
          .observe('parent')
          .pipe(skip(1), take(1))
          .forEach((p) => {
            expect(p).toEqual(parent);
          });

        a._setParent(parent);

        return Promise.all([promise1, promise2]);
      });

      describe('options', () => {
        it('noEmit', async () => {
          const promise1 = a
            .observe(valueProp)
            .pipe(take(1))
            .forEach((value) => {
              expect(value).toEqual(null);
            });

          const completeSignal = new Subject();

          const promise2 = a
            .observe(valueProp)
            .pipe(takeUntil(completeSignal), skip(1))
            .forEach(() => {
              throw new Error('This should never be called');
            });

          a.setValue('one', { noObserve: true });

          await wait(0);

          completeSignal.next();
          completeSignal.complete();

          return Promise.all([promise1, promise2]);
        });

        it('ignoreNoEmit', async () => {
          const promise1 = a
            .observe(valueProp, { ignoreNoObserve: true })
            .pipe(take(1))
            .forEach((value) => {
              expect(value).toEqual(null);
            });

          const promise2 = a
            .observe(valueProp, { ignoreNoObserve: true })
            .pipe(skip(1), take(1))
            .forEach((value) => {
              expect(value).toEqual('one');
            });

          a.setValue('one', { noObserve: true });

          return Promise.all([promise1, promise2]);
        });
      });
    }

    describe('value', () => theTests('value'));
    describe('rawValue', () => theTests('rawValue'));
  });

  describe(`observeChanges`, () => {
    let a: FormControl;
    beforeEach(() => {
      a = new FormControl();
    });

    function theTests(valueProp: 'value' | 'rawValue') {
      it('', () => {
        const promise1 = a
          .observeChanges(valueProp)
          .pipe(take(1))
          .forEach((value) => {
            expect(value).toEqual('one');
          });

        a.setValue('one');

        return promise1;
      });

      it('waits for sync validation complete', async () => {
        const [_, end] = getControlEventsUntilEnd(a);

        a.events
          .pipe(
            filter((event) => event.type === 'ValidationStart'),
            takeUntil(end)
          )
          .subscribe((_e) => {
            const e = _e as IControlValidationEvent<string, string>;

            const errors =
              e.rawValue === 'validValue' ? null : { invalidValue: true };

            a.setErrors(errors, { source: 'myValidationService' });
          });

        const promise1 = a
          .observeChanges(valueProp)
          .pipe(takeUntil(end), toArray())
          .toPromise();

        a.setValue('invalidValue');

        expect(a.errors).toEqual({ invalidValue: true });
        expect(a.rawValue).toEqual('invalidValue');
        expect(a.value).toEqual('invalidValue');

        a.setValue('validValue');

        expect(a.errors).toEqual(null);
        expect(a.rawValue).toEqual('validValue');
        expect(a.value).toEqual('validValue');

        end.next();
        end.complete();

        const [value1, value2] = await promise1;

        expect(value1).toEqual('invalidValue');
        expect(value2).toEqual('validValue');
      });
    }

    describe('value', () => theTests('value'));
    describe('rawValue', () => theTests('rawValue'));
  });

  describe(`link`, () => {
    let a: FormControl;
    let b: FormControl;
    beforeEach(() => {
      a = new FormControl('one');
      b = new FormControl(2);
    });

    it(`a to b`, () => {
      a.events.subscribe((e) => b.processEvent(e));

      a.setValue('two');

      expect(a.rawValue).toEqual('two');
      expect(b.rawValue).toEqual('two');

      b.setValue(3);

      expect(b.rawValue).toEqual(3);
      expect(a.rawValue).toEqual('two');
    });

    it(`a & b`, () => {
      a.events.subscribe((e) => b.processEvent(e));
      b.events.subscribe((e) => a.processEvent(e));

      a.setValue('two');

      expect(a.rawValue).toEqual('two');
      expect(b.rawValue).toEqual('two');

      b.setValue(3);

      expect(b.rawValue).toEqual(3);
      expect(a.rawValue).toEqual(3);
    });
  });
});

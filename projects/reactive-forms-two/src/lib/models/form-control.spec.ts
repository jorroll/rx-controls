import { Subject } from 'rxjs';
import { skip, take, takeUntil, toArray } from 'rxjs/operators';
import {
  AbstractControl,
  ControlId,
  ValidationErrors,
  ValidatorFn,
} from './abstract-control';
import runControlBaseTestSuite from './control-base-tests';
import { FormControl } from './form-control';
import { FormGroup } from './form-group';
import { testAllAbstractControlDefaultsExcept, wait } from './test-util';

runControlBaseTestSuite('FormControl', () => new FormControl());

function testAllDefaultsExcept(
  c: FormControl,
  ...skipTests: Array<keyof FormControl>
) {
  testAllAbstractControlDefaultsExcept(c, ...skipTests);

  if (!skipTests.includes('value')) {
    expect(c.value).toEqual(null);
  }
}

describe('FormControl', () => {
  beforeEach(() => {
    AbstractControl.eventId(0);
  });

  describe('initialization', () => {
    it('defaults', () => {
      testAllDefaultsExcept(new FormControl());
    });

    describe('options', () => {
      let c: FormControl;

      it('value', () => {
        c = new FormControl('one');

        expect(c.value).toEqual('one');

        testAllDefaultsExcept(c, 'value');
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

      it('disabled', () => {
        c = new FormControl(null, {
          disabled: true,
        });

        expect(c.enabled).toEqual(false);
        expect(c.disabled).toEqual(true);
        expect(c.status).toEqual('DISABLED');
        testAllDefaultsExcept(c, 'enabled', 'disabled', 'status');

        c = new FormControl(null, {
          disabled: false,
        });

        expect(c.enabled).toEqual(true);
        expect(c.disabled).toEqual(false);
        expect(c.status).toEqual('VALID');
        testAllDefaultsExcept(c, 'enabled', 'disabled', 'status');
      });

      it('dirty', () => {
        c = new FormControl(null, {
          dirty: true,
        });

        expect(c.dirty).toEqual(true);
        testAllDefaultsExcept(c, 'dirty');

        c = new FormControl(null, {
          dirty: false,
        });

        expect(c.dirty).toEqual(false);
        testAllDefaultsExcept(c, 'dirty');
      });

      it('readonly', () => {
        c = new FormControl(null, {
          readonly: true,
        });

        expect(c.readonly).toEqual(true);
        testAllDefaultsExcept(c, 'readonly');

        c = new FormControl(null, {
          readonly: false,
        });

        expect(c.readonly).toEqual(false);
        testAllDefaultsExcept(c, 'readonly');
      });

      it('submitted', () => {
        c = new FormControl(null, {
          submitted: true,
        });

        expect(c.submitted).toEqual(true);
        testAllDefaultsExcept(c, 'submitted');

        c = new FormControl(null, {
          submitted: false,
        });

        expect(c.submitted).toEqual(false);
        testAllDefaultsExcept(c, 'submitted');
      });

      it('errors', () => {
        c = new FormControl(null, {
          errors: { anError: true },
        });

        expect(c.errors).toEqual({ anError: true });
        expect(c.errorsStore).toEqual(new Map([[c.id, { anError: true }]]));
        expect(c.valid).toEqual(false);
        expect(c.invalid).toEqual(true);
        expect(c.status).toEqual('INVALID');
        testAllDefaultsExcept(
          c,
          'errors',
          'errorsStore',
          'valid',
          'invalid',
          'status'
        );

        const errors = new Map([['one', { secondError: true }]]);

        c = new FormControl(null, { errors });

        expect(c.errors).toEqual(errors.get('one'));
        expect(c.errorsStore).toEqual(errors);
        expect(c.valid).toEqual(false);
        expect(c.invalid).toEqual(true);
        expect(c.status).toEqual('INVALID');
        testAllDefaultsExcept(
          c,
          'errors',
          'errorsStore',
          'valid',
          'invalid',
          'status'
        );

        c = new FormControl(null, { errors: null });

        expect(c.errors).toEqual(null);
        expect(c.errorsStore).toEqual(new Map());
        expect(c.valid).toEqual(true);
        expect(c.invalid).toEqual(false);
        expect(c.status).toEqual('VALID');
        testAllDefaultsExcept(
          c,
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
          | Map<ControlId, ValidatorFn> = (c) => null;

        c = new FormControl(null, { validators });

        expect(c.validator).toEqual(expect.any(Function));
        expect(c.validatorStore).toEqual(new Map([[c.id, validators]]));
        expect(c.valid).toEqual(true);
        expect(c.invalid).toEqual(false);
        expect(c.errors).toEqual(null);
        expect(c.errorsStore).toEqual(new Map());
        expect(c.status).toEqual('VALID');
        testAllDefaultsExcept(
          c,
          'validator',
          'validatorStore',
          'valid',
          'invalid',
          'errors',
          'errorsStore',
          'status'
        );

        validators = [() => null, () => ({ error: true })];

        c = new FormControl(null, { validators });

        expect(c.validator).toEqual(expect.any(Function));
        expect(c.validatorStore).toEqual(
          new Map([[c.id, expect.any(Function)]])
        );
        expect(c.valid).toEqual(false);
        expect(c.invalid).toEqual(true);
        expect(c.errors).toEqual({ error: true });
        expect(c.errorsStore).toEqual(new Map([[c.id, { error: true }]]));
        expect(c.status).toEqual('INVALID');
        testAllDefaultsExcept(
          c,
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

        c = new FormControl(null, { validators });

        expect(c.validator).toEqual(expect.any(Function));
        expect(c.validatorStore).toEqual(
          new Map([
            ['one', fn1],
            ['two', fn2],
          ])
        );
        expect(c.valid).toEqual(false);
        expect(c.invalid).toEqual(true);
        expect(c.errors).toEqual({ error: true });
        expect(c.errorsStore).toEqual(new Map([[c.id, { error: true }]]));
        expect(c.status).toEqual('INVALID');
        testAllDefaultsExcept(
          c,
          'validator',
          'validatorStore',
          'valid',
          'invalid',
          'errors',
          'errorsStore',
          'status'
        );

        c = new FormControl(null, { validators: null });

        expect(c.validator).toEqual(null);
        expect(c.validatorStore).toEqual(new Map());
        expect(c.valid).toEqual(true);
        expect(c.invalid).toEqual(false);
        expect(c.errors).toEqual(null);
        expect(c.errorsStore).toEqual(new Map());
        expect(c.status).toEqual('VALID');
        testAllDefaultsExcept(
          c,
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
        c = new FormControl(null, {
          pending: true,
        });

        expect(c.pending).toEqual(true);
        expect(c.pendingStore).toEqual(new Set([c.id]));
        expect(c.status).toEqual('PENDING');
        testAllDefaultsExcept(c, 'pending', 'pendingStore', 'status');

        c = new FormControl(null, {
          pending: new Set(['one']),
        });

        expect(c.pending).toEqual(true);
        expect(c.pendingStore).toEqual(new Set(['one']));
        expect(c.status).toEqual('PENDING');
        testAllDefaultsExcept(c, 'pending', 'pendingStore', 'status');

        c = new FormControl(null, {
          pending: false,
        });

        expect(c.pending).toEqual(false);
        expect(c.pendingStore).toEqual(new Set());
        expect(c.status).toEqual('VALID');
        testAllDefaultsExcept(c, 'pending', 'pendingStore', 'status');
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

      original.setParent(parent);

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
      expect(c.value).toEqual('oldValue');
      // expect(o.value).toEqual('otherValue');
    });

    it('should set the value of the control', () => {
      c.setValue('newValue');
      expect(c.value).toEqual('newValue');
    });

    it('should fire a StateChange event', () => {
      expect.assertions(4);

      const promise1 = c.events.pipe(take(1)).forEach((event) => {
        expect(event).toEqual({
          type: 'StateChange',
          eventId: expect.any(Number),
          idOfOriginatingEvent: expect.any(Number),
          source: c.id,
          meta: {},
          change: {
            value: expect.any(Function),
          },
          sideEffects: [],
        });
      });

      const promise2 = c.events.pipe(skip(1), take(1)).forEach((event) => {
        expect(event).toEqual({
          type: 'AsyncValidationStart',
          eventId: expect.any(Number),
          idOfOriginatingEvent: expect.any(Number),
          source: c.id,
          value: 'newValue',
          meta: {},
        });
      });

      const promise3 = c.events.pipe(skip(2), take(1)).forEach((event) => {
        expect(event).toEqual({
          type: 'ValidationComplete',
          eventId: expect.any(Number),
          idOfOriginatingEvent: expect.any(Number),
          source: c.id,
          value: 'newValue',
          meta: {},
        });
      });

      c.setValue('newValue');

      expect(c.value).toEqual('newValue');

      return Promise.all([promise1, promise2, promise3]);
    });
  });

  describe('validationService', () => {
    let c: FormControl;
    beforeEach(() => {
      c = new FormControl('oldValue');
    });

    it('with one service', async () => {
      expect.assertions(6);

      const promise = c.events.pipe(take(5), toArray()).toPromise();

      const validatorPromise = c
        .validationService('myValidationService')
        .pipe(take(1))
        .forEach((e) => {
          if (e.value === 'validValue') {
            c.setErrors(null, { source: 'myValidationService' });
            c.markValidationComplete('myValidationService');
            return;
          }

          c.setErrors(
            { invalidValue: true },
            { source: 'myValidationService' }
          );
          c.markValidationComplete('myValidationService');
        });

      c.setValue('invalidValue');

      const [one, two, three, four, five] = await promise;

      expect(c.value).toEqual('invalidValue');

      // expect(one).toEqual({
      //   type: 'StateChange',
      //   eventId: expect.any(Number),
      //   source: c.id,
      //   meta: {},
      //   changes: {
      //     registeredValidators: expect.any(Function),
      //   },
      // });

      expect(one).toEqual({
        type: 'StateChange',
        // the "registeredValidators" StateChange is still firing behind the scenes
        eventId: expect.any(Number),
        idOfOriginatingEvent: expect.any(Number),
        source: c.id,
        meta: {},
        change: {
          value: expect.any(Function),
        },
        sideEffects: [],
      });

      expect(two).toEqual({
        type: 'ValidationStart',
        eventId: expect.any(Number),
        idOfOriginatingEvent: expect.any(Number),
        source: c.id,
        value: 'invalidValue',
        meta: {},
      });

      expect(three).toEqual({
        type: 'StateChange',
        eventId: expect.any(Number),
        idOfOriginatingEvent: expect.any(Number),
        source: 'myValidationService',
        meta: {},
        change: {
          errorsStore: expect.any(Function),
        },
        sideEffects: ['errors', 'status'],
      });

      // expect(five).toEqual({
      //   type: 'StateChange',
      //   eventId: expect.any(Number),
      //   source: c.id,
      //   meta: {},
      //   changes: {
      //     runningValidation: expect.any(Function),
      //   },
      // });

      // expect(six).toEqual({
      //   type: 'StateChange',
      //   eventId: expect.any(Number),
      //   source: c.id,
      //   meta: {},
      //   changes: {
      //     registeredValidators: expect.any(Function),
      //   },
      // });

      expect(four).toEqual({
        type: 'AsyncValidationStart',
        eventId: expect.any(Number),
        idOfOriginatingEvent: expect.any(Number),
        source: c.id,
        value: 'invalidValue',
        meta: {},
      });

      expect(five).toEqual({
        type: 'ValidationComplete',
        eventId: expect.any(Number),
        idOfOriginatingEvent: expect.any(Number),
        source: c.id,
        value: 'invalidValue',
        meta: {},
      });

      return validatorPromise;
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
      const state = a.replayState();

      const changes = [
        { value: expect.any(Function) },
        { disabled: expect.any(Function) },
        { touched: expect.any(Function) },
        { dirty: expect.any(Function) },
        { readonly: expect.any(Function) },
        { submitted: expect.any(Function) },
        { validatorStore: expect.any(Function) },
        { pendingStore: expect.any(Function) },
        { errorsStore: expect.any(Function) },
        { data: expect.any(Function) },
      ];

      const events = await state
        .pipe(take(changes.length), toArray())
        .toPromise();

      events.forEach((event, i) => {
        expect(event).toEqual({
          type: 'StateChange',
          eventId: expect.any(Number),
          idOfOriginatingEvent: expect.any(Number),
          source: a.id,
          sideEffects: [],
          meta: {},
          change: changes[i],
        });
      });
    });

    it('can be subscribed to multiple times', () => {
      AbstractControl.eventId(0);

      const state = a.replayState();

      expect(b.value).toEqual(2);

      state.subscribe(b.source);

      expect(b.value).toEqual(a.value);

      b.setValue(3);

      expect(b.value).not.toEqual(a.value);
      expect(b.value).toEqual(3);

      state.subscribe(b.source);

      expect(b.value).toEqual(a.value);
    });
  });

  describe(`observe`, () => {
    let a: FormControl;
    beforeEach(() => {
      a = new FormControl();
    });

    describe('value', () => {
      it('', () => {
        const promise1 = a
          .observe('value')
          .pipe(take(1))
          .forEach((value) => {
            expect(value).toEqual(null);
          });

        const promise2 = a
          .observe('value')
          .pipe(skip(1), take(1))
          .forEach((value) => {
            expect(value).toEqual('one');
          });

        a.setValue('one');

        return Promise.all([promise1, promise2]);
      });

      it('waits for sync validation complete', () => {
        const testCompleteSignal = new Subject();

        const validatorPromise = a
          .validationService('myValidationService')
          .pipe(takeUntil(testCompleteSignal))
          .forEach((e) => {
            if (e.value === 'validValue') {
              a.setErrors(null, { source: 'myValidationService' });
              a.markValidationComplete('myValidationService');
              return;
            }

            a.setErrors(
              { invalidValue: true },
              { source: 'myValidationService' }
            );

            a.markValidationComplete('myValidationService');
          });

        const promise1 = a
          .observe('value')
          .pipe(take(1))
          .forEach((value) => {
            expect(a.errors).toEqual(null);
            expect(value).toEqual(null);
          });

        const promise2 = a
          .observe('value')
          .pipe(skip(1), take(1))
          .forEach((value) => {
            expect(a.errors).toEqual({ invalidValue: true });
            expect(value).toEqual('invalidValue');
          });

        const promise3 = a
          .observe('value')
          .pipe(skip(2), take(1))
          .forEach((value) => {
            expect(a.errors).toEqual(null);
            expect(value).toEqual('validValue');
          });

        a.setValue('invalidValue');

        expect(a.errors).toEqual({ invalidValue: true });
        expect(a.value).toEqual('invalidValue');

        a.setValue('validValue');

        expect(a.errors).toEqual(null);
        expect(a.value).toEqual('validValue');

        testCompleteSignal.next();
        testCompleteSignal.complete();

        return Promise.all([promise1, promise2, promise3, validatorPromise]);
      });
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

      a.setParent(parent);

      return Promise.all([promise1, promise2]);
    });

    describe('options', () => {
      it('noEmit', async () => {
        const promise1 = a
          .observe('value')
          .pipe(take(1))
          .forEach((value) => {
            expect(value).toEqual(null);
          });

        const completeSignal = new Subject();

        const promise2 = a
          .observe('value')
          .pipe(takeUntil(completeSignal), skip(1))
          .forEach(() => {
            throw new Error('This should never be called');
          });

        a.setValue('one', { noEmit: true });

        await wait(0);

        completeSignal.next();
        completeSignal.complete();

        return Promise.all([promise1, promise2]);
      });

      it('ignoreNoEmit', async () => {
        const promise1 = a
          .observe('value', { ignoreNoEmit: true })
          .pipe(take(1))
          .forEach((value) => {
            expect(value).toEqual(null);
          });

        const promise2 = a
          .observe('value', { ignoreNoEmit: true })
          .pipe(skip(1), take(1))
          .forEach((value) => {
            expect(value).toEqual('one');
          });

        a.setValue('one', { noEmit: true });

        return Promise.all([promise1, promise2]);
      });
    });
  });

  describe.skip(`observeChanges`, () => {
    let a: FormControl;
    beforeEach(() => {
      a = new FormControl();
    });

    describe('value', () => {
      it('', () => {
        const promise1 = a
          .observeChanges('value')
          .pipe(take(1))
          .forEach((value) => {
            expect(value).toEqual('one');
          });

        a.setValue('one');

        return promise1;
      });

      it('waits for sync validation complete', () => {
        const testCompleteSignal = new Subject();

        const validatorPromise = a
          .validationService('myValidationService')
          .pipe(takeUntil(testCompleteSignal))
          .forEach((e) => {
            if (e.value === 'validValue') {
              a.setErrors(null, { source: 'myValidationService' });
              a.markValidationComplete('myValidationService');
              return;
            }

            a.setErrors(
              { invalidValue: true },
              { source: 'myValidationService' }
            );

            a.markValidationComplete('myValidationService');
          });

        const promise1 = a
          .observeChanges('value')
          .pipe(take(1))
          .forEach((value) => {
            expect(a.errors).toEqual({ invalidValue: true });
            expect(value).toEqual('invalidValue');
          });

        const promise2 = a
          .observeChanges('value')
          .pipe(skip(1), take(1))
          .forEach((value) => {
            expect(a.errors).toEqual(null);
            expect(value).toEqual('validValue');
          });

        a.setValue('invalidValue');

        expect(a.errors).toEqual({ invalidValue: true });
        expect(a.value).toEqual('invalidValue');

        a.setValue('validValue');

        expect(a.errors).toEqual(null);
        expect(a.value).toEqual('validValue');

        testCompleteSignal.next();
        testCompleteSignal.complete();

        return Promise.all([promise1, promise2, validatorPromise]);
      });
    });

    it('parent', () => {
      const parent = new FormControl();

      const promise1 = a
        .observeChanges('parent')
        .pipe(take(1))
        .forEach((p) => {
          expect(p).toEqual(parent);
        });

      a.setParent(parent);

      return Promise.all([promise1]);
    });

    describe('options', () => {
      it('noEmit', async () => {
        const completeSignal = new Subject();

        const promise1 = a
          .observeChanges('value')
          .pipe(takeUntil(completeSignal))
          .forEach(() => {
            throw new Error('This should never be called');
          });

        a.setValue('one', { noEmit: true });

        await wait(0);

        completeSignal.next();
        completeSignal.complete();

        return promise1;
      });

      it('ignoreNoEmit', async () => {
        const promise1 = a
          .observeChanges('value', { ignoreNoEmit: true })
          .pipe(take(1))
          .forEach((value) => {
            expect(value).toEqual('one');
          });

        a.setValue('one', { noEmit: true });

        return promise1;
      });
    });
  });

  describe(`link`, () => {
    let a: FormControl;
    let b: FormControl;
    beforeEach(() => {
      a = new FormControl('one');
      b = new FormControl(2);
    });

    it(`a to b`, () => {
      a.events.subscribe(b.source);

      a.setValue('two');

      expect(a.value).toEqual('two');
      expect(b.value).toEqual('two');

      b.setValue(3);

      expect(b.value).toEqual(3);
      expect(a.value).toEqual('two');
    });

    it(`a & b`, () => {
      a.events.subscribe(b.source);
      b.events.subscribe(a.source);

      a.setValue('two');

      expect(a.value).toEqual('two');
      expect(b.value).toEqual('two');

      b.setValue(3);

      expect(b.value).toEqual(3);
      expect(a.value).toEqual(3);
    });
  });
});

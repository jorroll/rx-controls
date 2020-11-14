import { ValidationErrors } from '@angular/forms';
import { Subject } from 'rxjs';
import { skip, take, takeUntil, toArray } from 'rxjs/operators';
import { AbstractControl, ControlId } from './abstract-control';
import { FormControl as TestControlBase } from './form-control';
import { wait } from './test-util';

describe('ControlBase', () => {
  beforeEach(() => {
    AbstractControl.eventId(0);
  });

  describe('initialization', () => {
    describe('defaults', () => {
      it('value', () => {
        const c = new TestControlBase();
        expect(c.value).toEqual(null);
      });

      it('id', () => {
        const c = new TestControlBase();
        expect(typeof c.id).toEqual('symbol');
      });

      it('parent', () => {
        const c = new TestControlBase();
        expect(c.parent).toEqual(null);
      });

      it('data', () => {
        const c = new TestControlBase();
        expect(c.data).toEqual(undefined);
      });

      it('enabled', () => {
        const c = new TestControlBase();
        expect(c.enabled).toEqual(true);
      });

      it('disabled', () => {
        const c = new TestControlBase();
        expect(c.disabled).toEqual(false);
      });
    });

    describe('options', () => {
      function testAllDefaultsExcept(
        c: TestControlBase<any>,
        ...skipTests: string[]
      ): void {
        if (!skipTests.includes('value')) {
          expect(c.value).toEqual(null);
        }
        if (!skipTests.includes('id')) {
          expect(typeof c.id).toEqual('symbol');
        }
        if (!skipTests.includes('parent')) {
          expect(c.parent).toEqual(null);
        }
        if (!skipTests.includes('data')) {
          expect(c.data).toEqual(undefined);
        }
        if (!skipTests.includes('enabled')) {
          expect(c.enabled).toEqual(true);
        }
        if (!skipTests.includes('disabled')) {
          expect(c.disabled).toEqual(false);
        }
      }

      it('value', () => {
        const c = new TestControlBase('one');

        expect(c.value).toEqual('one');

        testAllDefaultsExcept(c, 'value');
      });

      it('id', () => {
        const c = new TestControlBase(null, {
          id: 'one',
        });

        expect(c.id).toEqual('one');
        testAllDefaultsExcept(c, 'id');
      });

      it('data', () => {
        const c = new TestControlBase(null, {
          data: 'one',
        });

        expect(c.data).toEqual('one');
        testAllDefaultsExcept(c, 'data');
      });

      // it('disabled', () => {
      //   const c = new TestControlBase(null, {
      //     disabled: true,
      //   });

      //   expect(c.enabled).toEqual(false);
      //   expect(c.disabled).toEqual(true);
      //   testAllDefaultsExcept(c, 'enabled', 'disabled');
      // });
    });
  });

  describe('setValue', () => {
    // let g: TestControlBase;
    let c: TestControlBase;
    // let o: TestControlBase;
    beforeEach(() => {
      c = new TestControlBase('oldValue');
      // o = new TestControlBase('otherValue');
      // g = new TestControlBase({ one: c });
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
          processed: [c.id],
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
          processed: [c.id],
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
          processed: [c.id],
          value: 'newValue',
          meta: {},
        });
      });

      c.setValue('newValue');

      expect(c.value).toEqual('newValue');

      return Promise.all([promise1, promise2, promise3]);
    });

    // describe('when linked', () => {
    //   it('should set the value of other FormControl', () => {
    //     c.events.subscribe(o.source);
    //     c.setValue('newValue');
    //     expect(c.value).toEqual('newValue');
    //     expect(o.value).toEqual('newValue');
    //   });

    //   it('should not enter infinite loop', () => {
    //     c.events.subscribe(o.source);
    //     o.events.subscribe(c.source);
    //     c.setValue('newValue');
    //     expect(c.value).toEqual('newValue');
    //     expect(o.value).toEqual('newValue');
    //   });
    // });
  });

  describe('setParent', () => {
    // let g: TestControlBase;
    let c: TestControlBase;
    beforeEach(() => {
      c = new TestControlBase('oldValue');
    });

    it('should start with no parent', () => {
      expect(c.parent).toEqual(null);
    });

    it('should set the parent of the control', () => {
      expect.assertions(2);

      const parent = new TestControlBase();

      const promise1 = c.events.pipe(take(1)).forEach((event) => {
        expect(event).toEqual({
          type: 'StateChange',
          eventId: expect.any(Number),
          idOfOriginatingEvent: expect.any(Number),
          source: c.id,
          processed: [c.id],
          meta: {},
          change: {
            parent: expect.any(Function),
          },
          sideEffects: [],
        });
      });

      c.setParent(parent);
      expect(c.parent).toEqual(parent);

      return promise1;
    });
  });

  describe('setErrors', () => {
    let c: TestControlBase;
    beforeEach(() => {
      c = new TestControlBase('oldValue');
    });

    it('should start with no errors', () => {
      expect(c.errors).toEqual(null);
      expect(c.errorsStore.size).toEqual(0);
    });

    describe('when passed ValidationErrors', () => {
      it('should set a ValidationErrors object for the control', () => {
        expect.assertions(3);

        const error = { required: 'This control is required' };
        const errorsStore = new Map([[c.id, error]]);

        const promise1 = c.events.pipe(take(1)).forEach((event) => {
          expect(event).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: c.id,
            processed: [c.id],
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            sideEffects: ['errors'],
          });
        });

        c.setErrors(error);
        expect(c.errors).toEqual(error);
        expect(c.errorsStore).toEqual(errorsStore);

        return promise1;
      });

      it('should not modify errors for other ControlIds', () => {
        expect.assertions(3);

        const prexistingError = { required: 'This control is required' };
        (c as any)._errorsStore = new Map([['one', prexistingError]]);
        (c as any)._errors = prexistingError;

        const newError = { spelling: 'Text is mispelled' };
        const newErrorsStore = new Map<ControlId, ValidationErrors>([
          [c.id, newError],
          ['one', prexistingError],
        ]);

        const promise1 = c.events.pipe(take(1)).forEach((event) => {
          expect(event).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: c.id,
            processed: [c.id],
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            sideEffects: ['errors'],
          });
        });

        c.setErrors(newError);
        expect(c.errors).toEqual({ ...prexistingError, ...newError });
        expect(c.errorsStore).toEqual(newErrorsStore);

        return promise1;
      });

      it('should replace existing errors for this ControlId', () => {
        expect.assertions(3);

        const prexistingError = { required: 'This control is required' };
        (c as any)._errorsStore = new Map([[c.id, prexistingError]]);
        (c as any)._errors = prexistingError;

        const newError = { spelling: 'Text is mispelled' };
        const newErrorsStore = new Map<ControlId, ValidationErrors>([
          [c.id, newError],
        ]);

        const promise1 = c.events.pipe(take(1)).forEach((event) => {
          expect(event).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: c.id,
            processed: [c.id],
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            sideEffects: ['errors'],
          });
        });

        c.setErrors(newError);
        expect(c.errors).toEqual(newError);
        expect(c.errorsStore).toEqual(newErrorsStore);

        return promise1;
      });
    });

    describe('when passed errorsStore', () => {
      it('should set the errorsStore for the control', () => {
        expect.assertions(3);

        const error1 = { required: 'This control is required' };
        const error2 = { spelling: 'Text is mispelled' };
        const errorsStore = new Map<ControlId, ValidationErrors>([
          [c.id, error1],
          ['two', error2],
        ]);

        const promise1 = c.events.pipe(take(1)).forEach((event) => {
          expect(event).toEqual({
            type: 'StateChange',
            eventId: expect.any(Number),
            idOfOriginatingEvent: expect.any(Number),
            source: c.id,
            processed: [c.id],
            meta: {},
            change: {
              errorsStore: expect.any(Function),
            },
            sideEffects: ['errors'],
          });
        });

        c.setErrors(errorsStore);
        expect(c.errors).toEqual({ ...error1, ...error2 });
        expect(c.errorsStore).toEqual(errorsStore);

        return promise1;
      });
    });
  });

  describe('validationService', () => {
    let c: TestControlBase;
    beforeEach(() => {
      c = new TestControlBase('oldValue');
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
        processed: [c.id],
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
        processed: [c.id],
        value: 'invalidValue',
        meta: {},
      });

      expect(three).toEqual({
        type: 'StateChange',
        eventId: expect.any(Number),
        idOfOriginatingEvent: expect.any(Number),
        source: 'myValidationService',
        processed: [c.id],
        meta: {},
        change: {
          errorsStore: expect.any(Function),
        },
        sideEffects: ['errors'],
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
        processed: [c.id],
        value: 'invalidValue',
        meta: {},
      });

      expect(five).toEqual({
        type: 'ValidationComplete',
        eventId: expect.any(Number),
        idOfOriginatingEvent: expect.any(Number),
        source: c.id,
        processed: [c.id],
        value: 'invalidValue',
        meta: {},
      });

      return validatorPromise;
    });
  });

  describe(`replayState`, () => {
    let a: TestControlBase<string>;
    let b: TestControlBase<number>;
    beforeEach(() => {
      a = new TestControlBase('one');
      b = new TestControlBase(2);
    });

    it('', () => {
      AbstractControl.eventId(0);

      const state = a.replayState();

      const promise1 = state.pipe(take(1)).forEach((event) => {
        expect(event).toEqual({
          type: 'StateChange',
          eventId: 1,
          idOfOriginatingEvent: 1,
          source: a.id,
          processed: [],
          change: {
            value: expect.any(Function),
          },
          sideEffects: [],
          meta: {},
        });
      });

      const promise2 = state.pipe(skip(1), take(1)).forEach((event) => {
        expect(event).toEqual({
          type: 'StateChange',
          eventId: 2,
          idOfOriginatingEvent: 2,
          source: a.id,
          processed: [],
          change: {
            errorsStore: expect.any(Function),
          },
          sideEffects: [],
          meta: {},
        });
      });

      const promise3 = state.pipe(skip(2), take(1)).forEach((event) => {
        expect(event).toEqual({
          type: 'StateChange',
          eventId: 3,
          idOfOriginatingEvent: 3,
          source: a.id,
          processed: [],
          change: {
            parent: expect.any(Function),
          },
          sideEffects: [],
          meta: {},
        });
      });

      const promise4 = state.pipe(skip(3), take(1)).forEach((event) => {
        expect(event).toEqual({
          type: 'StateChange',
          eventId: 4,
          idOfOriginatingEvent: 4,
          source: a.id,
          processed: [],
          change: {
            validatorStore: expect.any(Function),
          },
          sideEffects: [],
          meta: {},
        });
      });

      return Promise.all([promise1, promise2, promise3, promise4]);
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
    let a: TestControlBase;
    beforeEach(() => {
      a = new TestControlBase();
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

      const parent = new TestControlBase();

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

  describe(`observeChanges`, () => {
    let a: TestControlBase;
    beforeEach(() => {
      a = new TestControlBase();
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
      const parent = new TestControlBase();

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
    let a: TestControlBase;
    let b: TestControlBase;
    beforeEach(() => {
      a = new TestControlBase('one');
      b = new TestControlBase(2);
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

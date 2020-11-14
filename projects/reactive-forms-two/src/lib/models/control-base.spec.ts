import { ValidationErrors } from '@angular/forms';
import { skip, take, toArray } from 'rxjs/operators';
import { AbstractControl, ControlId } from './abstract-control';
import { ControlBase, IControlBaseArgs } from './control-base';
// import { resetCurrentEventId } from './test-util';
import { FormControl as TestControlBase } from './form-control';

// export type ITestControlArgs<D> = IControlBaseArgs<D>;

// export class TestControlBase<V = any, D = any> extends ControlBase<V, D> {
//   static id = 0;

//   constructor(value: V = null as any, options: ITestControlArgs<D> = {}) {
//     super(
//       options.id || Symbol(`TestControlBase-${TestControlBase.id++}`),
//       value,
//       options
//     );
//   }

//   clone() {
//     const c = new TestControlBase<V, D>();
//     this.replayState().subscribe(c.source);
//     return c;
//   }
// }

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
      expect.assertions(3);

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

      return Promise.all([promise1, promise2]);
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
      expect.assertions(5);

      const promise = c.events.pipe(take(4), toArray()).toPromise();

      const validatorPromise = c
        .validationService('myValidationService')
        .pipe(take(1))
        .forEach((e) => {
          if (e.value === 'validValue') {
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

      const [one, two, three, four] = await promise;

      expect(c.value).toEqual('invalidValue');

      // expect(one).toEqual({
      //   type: 'StateChange',
      //   eventId: '0',
      //   source: c.id,
      //   meta: {},
      //   changes: {
      //     registeredValidators: expect.any(Function),
      //   },
      // });

      expect(one).toEqual({
        type: 'StateChange',
        // the "registeredValidators" StateChange is still firing behind the scenes
        // which is assigned `eventId: '0'`
        eventId: expect.any(Number),
        idOfOriginatingEvent: expect.any(Number),
        source: c.id,
        processed: [c.id],
        meta: {},
        change: {
          value: expect.any(Function),
          // runningValidation: expect.any(Function),
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
      //   eventId: '4',
      //   source: c.id,
      //   meta: {},
      //   changes: {
      //     runningValidation: expect.any(Function),
      //   },
      // });

      // expect(six).toEqual({
      //   type: 'StateChange',
      //   eventId: '5',
      //   source: c.id,
      //   meta: {},
      //   changes: {
      //     registeredValidators: expect.any(Function),
      //   },
      // });

      expect(four).toEqual({
        type: 'ValidationComplete',
        // the "runningValidation" and "registeredValidators" StateChanges are
        // still firing behind the scenes which are assigned `eventId` '4' and '5'
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

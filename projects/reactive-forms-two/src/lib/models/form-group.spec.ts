import isEqual from 'lodash-es/isEqual';
import { merge, Subject } from 'rxjs';
import { skip, take, takeUntil, toArray } from 'rxjs/operators';
import { AbstractControl, ValidationErrors } from './abstract-control';
import runControlBaseTestSuite from './control-base-tests';
import { FormControl } from './form-control';
import { FormGroup } from './form-group';
import {
  testAllControlContainerDefaultsExcept,
  wait,
  getControlEventsUntilEnd,
  toControlMatcherEntries,
} from './test-util';

runControlBaseTestSuite('FormGroup', () => new FormGroup());

function testAllDefaultsExcept(
  c: FormGroup<any>,
  ...skipTests: Array<keyof FormGroup>
) {
  testAllControlContainerDefaultsExcept(c, ...skipTests);

  if (!skipTests.includes('value')) {
    expect(c.value).toEqual({});
  }

  if (!skipTests.includes('enabledValue')) {
    expect(c.enabledValue).toEqual({});
  }

  if (!skipTests.includes('controls')) {
    expect(c.controls).toEqual({});
  }
}

describe('FormGroup', () => {
  beforeEach(() => {
    AbstractControl.eventId(0);
  });

  describe('initialization', () => {
    it('defaults', () => {
      testAllDefaultsExcept(new FormGroup());
    });

    describe('options', () => {
      it('value', async () => {
        const controls = {
          one: new FormControl('one'),
          two: new FormControl(2),
        };

        const c = new FormGroup(controls);

        await wait(0);

        expect(c.value).toEqual({
          one: 'one',
          two: 2,
        });
        expect(c.enabledValue).toEqual({
          one: 'one',
          two: 2,
        });
        expect(c.controls).toEqual(controls);
        expect(c.controlsStore).toEqual(new Map(Object.entries(controls)));
        expect(c.size).toEqual(2);

        testAllDefaultsExcept(
          c,
          'value',
          'enabledValue',
          'controls',
          'controlsStore',
          'size'
        );
      });

      it('id', () => {
        const c = new FormGroup(
          {},
          {
            id: 'one',
          }
        );

        expect(c.id).toEqual('one');
        testAllDefaultsExcept(c, 'id');
      });

      it('data', () => {
        const c = new FormGroup(
          {},
          {
            data: 'one',
          }
        );

        expect(c.data).toEqual('one');
        testAllDefaultsExcept(c, 'data');
      });

      // it('disabled', () => {
      //   const c = new FormGroup(
      //     {},
      //     {
      //       disabled: true,
      //     }
      //   );

      //   expect(c.enabled).toEqual(false);
      //   expect(c.disabled).toEqual(true);
      //   testAllDefaultsExcept(c, 'enabled', 'disabled');
      // });
    });
  });
});

describe('FormGroup', () => {
  let a: FormGroup;
  let aControls: { [key: string]: AbstractControl };

  let b: FormGroup<{
    three: FormControl<string[]>;
    four: typeof a;
  }>;
  let bControls: {
    three: FormControl<string[]>;
    four: typeof a;
  };

  let c: FormGroup;
  let cControls: { [key: string]: AbstractControl };

  beforeEach(() => {
    aControls = {
      one: new FormControl('one'),
      two: new FormControl(2),
    };
    a = new FormGroup(aControls);

    bControls = {
      three: new FormControl(['one']),
      four: a,
    };
    b = new FormGroup(bControls);

    cControls = {};
    c = new FormGroup(cControls);
  });

  it('initialization', () => {
    expect(a.value).toEqual({
      one: 'one',
      two: 2,
    });

    expect(b.value).toEqual({
      three: ['one'],
      four: {
        one: 'one',
        two: 2,
      },
    });
  });

  describe('setControls', () => {
    it('works', async () => {
      a.setControls({ three: new FormControl('three') });

      expect(a.value).toEqual({ three: 'three' });
      expect(b.value).toEqual({
        three: ['one'],
        four: { three: 'three' },
      });
    });
  });

  describe('setControl', () => {
    it('adds additional control', async () => {
      a.setControl('three', new FormControl('three'));

      expect(a.value).toEqual({
        one: 'one',
        two: 2,
        three: 'three',
      });

      expect(b.value).toEqual({
        three: ['one'],
        four: {
          one: 'one',
          two: 2,
          three: 'three',
        },
      });
    });

    it('replaces existing control', async () => {
      a.setControl('two', new FormControl('three'));

      expect(a.value).toEqual({
        one: 'one',
        two: 'three',
      });

      expect(b.value).toEqual({
        three: ['one'],
        four: {
          one: 'one',
          two: 'three',
        },
      });
    });

    it('deletes existing control', async () => {
      a.setControl('two', null);

      expect(a.value).toEqual({ one: 'one' });

      expect(b.value).toEqual({
        three: ['one'],
        four: { one: 'one' },
      });
    });
  });

  describe('addControl', () => {
    it('adds additional control', async () => {
      a.addControl('three', new FormControl('three'));

      expect(a.value).toEqual({
        one: 'one',
        two: 2,
        three: 'three',
      });

      expect(b.value).toEqual({
        three: ['one'],
        four: {
          one: 'one',
          two: 2,
          three: 'three',
        },
      });
    });

    it('does not replace existing control', async () => {
      a.addControl('two', new FormControl('three'));

      expect(a.value).toEqual({
        one: 'one',
        two: 2,
      });

      expect(b.value).toEqual({
        three: ['one'],
        four: {
          one: 'one',
          two: 2,
        },
      });
    });
  });

  describe('removeControl', () => {
    describe('when provided control', () => {
      it('ignores non-existant control', async () => {
        const c = new FormControl('fake');

        a.removeControl(c);

        expect(a.value).toEqual({
          one: 'one',
          two: 2,
        });

        expect(b.value).toEqual({
          three: ['one'],
          four: {
            one: 'one',
            two: 2,
          },
        });
      });

      it('removes existing control', async () => {
        const c = a.get('two');

        a.removeControl(c);

        expect(a.value).toEqual({
          one: 'one',
        });

        expect(b.value).toEqual({
          three: ['one'],
          four: {
            one: 'one',
          },
        });
      });
    });

    describe('when provided key', () => {
      it('ignores non-existant control', async () => {
        a.removeControl('three');

        expect(a.value).toEqual({
          one: 'one',
          two: 2,
        });

        expect(b.value).toEqual({
          three: ['one'],
          four: {
            one: 'one',
            two: 2,
          },
        });
      });

      it('removes existing control', async () => {
        a.removeControl('two');

        expect(a.value).toEqual({
          one: 'one',
        });

        expect(b.value).toEqual({
          three: ['one'],
          four: {
            one: 'one',
          },
        });
      });
    });
  });

  describe('setValue', () => {
    it('should fire a StateChange event', async () => {
      const newValue = {
        one: 'two',
        two: 3,
      };

      const end = new Subject();

      const [promise1] = getControlEventsUntilEnd(a, end);
      const [promise2] = getControlEventsUntilEnd(b, end);

      a.setValue(newValue);
      expect(a.controls.one.value).toEqual(newValue.one);
      expect(a.controls.two.value).toEqual(newValue.two);
      expect(a.value).toEqual(newValue);

      const bNewValue = { three: ['one'], four: newValue };
      expect(b.value).toEqual(bNewValue);

      end.next();
      end.complete();

      const [event1, event2, event3] = await promise1;
      const [event4, event5, event6] = await promise2;

      expect(event1).toEqual({
        type: 'StateChange',
        eventId: expect.any(Number),
        idOfOriginatingEvent: expect.any(Number),
        source: a.id,
        change: {
          value: expect.any(Function),
        },
        sideEffects: ['enabledValue'],
        meta: {},
      });

      expect(event2).toEqual({
        type: 'AsyncValidationStart',
        eventId: expect.any(Number),
        idOfOriginatingEvent: expect.any(Number),
        source: a.id,
        value: newValue,
        meta: {},
      });

      expect(event3).toEqual({
        type: 'ValidationComplete',
        eventId: expect.any(Number),
        idOfOriginatingEvent: expect.any(Number),
        source: a.id,
        value: newValue,
        meta: {},
      });

      expect(event4).toEqual({
        type: 'StateChange',
        eventId: expect.any(Number),
        idOfOriginatingEvent: expect.any(Number),
        source: a.id,
        change: {
          value: expect.any(Function),
        },
        sideEffects: ['enabledValue'],
        meta: {},
      });

      expect(event5).toEqual({
        type: 'AsyncValidationStart',
        eventId: expect.any(Number),
        idOfOriginatingEvent: expect.any(Number),
        source: b.id,
        value: bNewValue,
        meta: {},
      });

      expect(event6).toEqual({
        type: 'ValidationComplete',
        eventId: expect.any(Number),
        idOfOriginatingEvent: expect.any(Number),
        source: b.id,
        value: bNewValue,
        meta: {},
      });
    });
  });

  describe('patchValue', () => {
    it('', async () => {
      b.patchValue({
        four: {
          one: 'two',
        },
      });

      expect(a.value).toEqual({ one: 'two', two: 2 });
      expect(a.controls.one.value).toEqual('two');
      expect(a.controls.two.value).toEqual(2);
      expect(b.value).toEqual({
        three: ['one'],
        four: { one: 'two', two: 2 },
      });
    });

    it('errors if incorrect shape', async () => {
      expect(() => {
        b.patchValue({
          four: {
            five: 'two' as any,
          },
        });
      }).toThrowError();
    });
  });

  describe('setErrors', () => {
    describe('c', () => {
      it('null', async () => {
        c.setErrors(null);

        testAllDefaultsExcept(c);
      });

      it('{ error: true }', async () => {
        const error: ValidationErrors = { error: true };

        c.setErrors(error);

        testAllDefaultsExcept(
          c,
          'errors',
          'containerErrors',
          'errorsStore',
          'valid',
          'containerValid',
          'invalid',
          'containerInvalid',
          'status'
        );

        expect(c.errors).toEqual(error);
        expect(c.containerErrors).toEqual(error);
        expect(c.errorsStore).toEqual(new Map([[c.id, error]]));
        expect(c.valid).toEqual(false);
        expect(c.containerValid).toEqual(false);
        expect(c.invalid).toEqual(true);
        expect(c.containerInvalid).toEqual(true);
        expect(c.status).toEqual('INVALID');
      });
    });

    describe('b', () => {
      function testLocalDefaults() {
        expect(b.value).toEqual({
          three: ['one'],
          four: { one: 'one', two: 2 },
        });
        expect(b.enabledValue).toEqual({
          three: ['one'],
          four: { one: 'one', two: 2 },
        });
        expect(b.controls).toEqual(bControls);
        expect(b.controlsStore).toEqual(new Map(Object.entries(bControls)));
      }

      it('null', async () => {
        b.setErrors(null);

        testAllDefaultsExcept(
          b,
          'value',
          'enabledValue',
          'controls',
          'controlsStore'
        );

        testLocalDefaults();
      });

      it('{ error: true }', async () => {
        const error: ValidationErrors = { error: true };

        b.setErrors(error);

        testAllDefaultsExcept(
          b,
          'value',
          'enabledValue',
          'controls',
          'controlsStore',
          'errors',
          'containerErrors',
          'errorsStore',
          'valid',
          'containerValid',
          'invalid',
          'containerInvalid',
          'status'
        );

        testLocalDefaults();

        expect(b.errors).toEqual(error);
        expect(b.containerErrors).toEqual(error);
        expect(b.errorsStore).toEqual(new Map([[b.id, error]]));
        expect(b.valid).toEqual(false);
        expect(b.containerValid).toEqual(false);
        expect(b.invalid).toEqual(true);
        expect(b.containerInvalid).toEqual(true);
        expect(b.status).toEqual('INVALID');
      });
    });
  });

  describe('patchErrors', () => {
    function testBLocalDefaults() {
      expect(b.value).toEqual({
        three: ['one'],
        four: { one: 'one', two: 2 },
      });
      expect(b.enabledValue).toEqual({
        three: ['one'],
        four: { one: 'one', two: 2 },
      });

      const entries = toControlMatcherEntries(bControls);

      expect(b.controls).toEqual(Object.fromEntries(entries));
      expect(b.controlsStore).toEqual(new Map(entries));
    }

    describe('on parent', () => {
      describe('c', () => {
        it('{}', async () => {
          c.patchErrors({});

          testAllDefaultsExcept(c);
        });

        it('{ error: true }', async () => {
          const error: ValidationErrors = { error: true };

          c.patchErrors(error);

          testAllDefaultsExcept(
            c,
            'errors',
            'containerErrors',
            'errorsStore',
            'valid',
            'containerValid',
            'invalid',
            'containerInvalid',
            'status'
          );

          expect(c.errors).toEqual(error);
          expect(c.containerErrors).toEqual(error);
          expect(c.errorsStore).toEqual(new Map([[c.id, error]]));
          expect(c.valid).toEqual(false);
          expect(c.containerValid).toEqual(false);
          expect(c.invalid).toEqual(true);
          expect(c.containerInvalid).toEqual(true);
          expect(c.status).toEqual('INVALID');
        });

        it('{ error: null }', async () => {
          c = new FormGroup(
            {},
            {
              errors: { error: true },
            }
          );

          c.patchErrors({ error: null });

          testAllDefaultsExcept(c);
        });
      });

      describe('b', () => {
        it('{}', async () => {
          b.patchErrors({});

          testAllDefaultsExcept(
            b,
            'value',
            'enabledValue',
            'controls',
            'controlsStore'
          );

          testBLocalDefaults();
        });

        it('{ error: true }', async () => {
          const error: ValidationErrors = { error: true };

          b.patchErrors(error);

          testAllDefaultsExcept(
            b,
            'value',
            'enabledValue',
            'controls',
            'controlsStore',
            'errors',
            'containerErrors',
            'errorsStore',
            'valid',
            'containerValid',
            'invalid',
            'containerInvalid',
            'status'
          );

          testBLocalDefaults();

          expect(b.errors).toEqual(error);
          expect(b.containerErrors).toEqual(error);
          expect(b.errorsStore).toEqual(new Map([[b.id, error]]));
          expect(b.valid).toEqual(false);
          expect(b.containerValid).toEqual(false);
          expect(b.invalid).toEqual(true);
          expect(b.containerInvalid).toEqual(true);
          expect(b.status).toEqual('INVALID');
        });

        it('{ error: null }', async () => {
          // because bControls was already used in the beforeEach()
          // callback, above, all of these controls already have a
          // parent in this test and are being cloned. This means that
          // strict equality doesn't work, which might explain the huge
          // memory issues
          b = new FormGroup(bControls, {
            errors: { error: true },
          });

          b.patchErrors({ error: null });

          expect(b.value).toEqual({
            three: ['one'],
            four: { one: 'one', two: 2 },
          });
          expect(b.enabledValue).toEqual({
            three: ['one'],
            four: { one: 'one', two: 2 },
          });

          const entries = toControlMatcherEntries(bControls);

          expect(b.controls).toEqual(Object.fromEntries(entries));
          expect(b.controlsStore).toEqual(new Map(entries));

          testAllDefaultsExcept(
            b,
            'value',
            'enabledValue',
            'controls',
            'controlsStore'
          );

          testBLocalDefaults();
        });
      });
    });

    describe('on child', () => {
      describe('b', () => {
        it('{}', async () => {
          const child = bControls.four.controls.one;

          child.patchErrors({});

          testAllDefaultsExcept(
            b,
            'value',
            'enabledValue',
            'controls',
            'controlsStore'
          );

          testBLocalDefaults();
        });

        it('{ error: true }', async () => {
          const child = bControls.four.controls.one;

          const error: ValidationErrors = { error: true };

          child.patchErrors(error);

          testAllDefaultsExcept(
            b,
            'value',
            'enabledValue',
            'controls',
            'controlsStore',
            'errors',
            'containerErrors',
            'childrenErrors',
            'errorsStore',
            'valid',
            'containerValid',
            'childValid',
            'childrenValid',
            'invalid',
            'containerInvalid',
            'childInvalid',
            'childrenInvalid',
            'status'
          );

          testBLocalDefaults();

          expect(b).toImplementObject({
            errors: error,
            containerErrors: null,
            childrenErrors: error,
            errorsStore: new Map(),
            valid: false,
            containerValid: true,
            childValid: true,
            childrenValid: false,
            invalid: true,
            containerInvalid: false,
            childInvalid: true,
            childrenInvalid: false,
            status: 'INVALID',
          });
        });

        it('{ error: null }', async () => {
          const child = new FormControl('one', {
            errors: { error: true },
          });

          a = new FormGroup<{ [key: string]: AbstractControl }>({
            ...aControls,
            one: child,
          });

          b = new FormGroup({
            ...bControls,
            four: a,
          });

          child.patchErrors({ error: null });

          testAllDefaultsExcept(
            b,
            'value',
            'enabledValue',
            'controls',
            'controlsStore'
          );

          testBLocalDefaults();
        });
      });
    });
  });

  describe('get', () => {
    it('', () => {
      const one = a.get('one');
      const two = b.get('four').get('one');
      expect(one).toBeInstanceOf(FormControl);
      expect(one).toBe(two);

      const three = b.get('four', 'one');
      expect(one).toBe(three);
    });
  });
});

describe('FormGroup', () => {
  beforeEach(() => {
    AbstractControl.eventId(0);
  });

  describe(`replayState`, () => {
    let a: FormGroup<{
      one: FormControl<string>;
      two: FormControl<number>;
    }>;

    let b: FormGroup;

    beforeEach(() => {
      a = new FormGroup({
        one: new FormControl('one'),
        two: new FormControl(2),
      });

      b = new FormGroup();
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
          sideEffects: [],
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
        [controlsStoreEvent, { controlsStore: expect.any(Function) }] as const,
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

      expect(b.value).toEqual({});

      state.subscribe(b.source);

      expect(b.value).toEqual(a.value);

      b.setControls({ threvinty: new FormControl('sleven') });

      // Errors in the queueSchedular are suppressed unless you await
      // a promise like below. If this test is failing, uncomment the
      // line below to see if there's a hidden error:
      await wait(0);

      expect(b.value).not.toEqual(a.value);
      expect(b.value).toEqual({ threvinty: 'sleven' });

      state.subscribe(b.source);

      expect(b.value).toEqual(a.value);
    });
  });

  describe(`link`, () => {
    let a: FormGroup<{
      one: FormControl<string>;
      two: FormControl<number>;
    }>;

    let b: FormGroup;

    let c: FormGroup<{
      three: FormControl<string[]>;
      four: typeof a;
    }>;

    beforeEach(() => {
      a = new FormGroup({
        one: new FormControl('one'),
        two: new FormControl(2),
      });

      b = new FormGroup();

      c = new FormGroup({
        three: new FormControl(['one']),
        four: a,
      });
    });

    it(`a to b`, () => {
      expect(a.value).toEqual({ one: 'one', two: 2 });
      expect(b.value).toEqual({});
      expect(c.value).toEqual({ three: ['one'], four: { one: 'one', two: 2 } });

      a.replayState().subscribe(b.source);

      expect(b.value).toEqual(a.value);

      a.events.subscribe(b.source);

      const newValue = {
        one: 'two',
        two: 3,
      };

      a.setValue(newValue);
      expect(a.value).toEqual(newValue);
      expect(b.value).toEqual(newValue);
      expect(c.value).toEqual({ three: ['one'], four: newValue });
    });

    it(`a & b`, async () => {
      a.replayState().subscribe(b.source);

      a.events.subscribe(b.source);
      b.events.subscribe(a.source);

      const value1 = {
        one: 'two',
        two: 3,
      };

      a.setValue(value1);

      expect(a.value).toEqual(value1);
      expect(b.value).toEqual(value1);
      expect(c.value).toEqual({ three: ['one'], four: value1 });

      const value2 = {
        one: 'three',
        two: 4,
      };

      b.setValue(value2);

      expect(b.value).toEqual(value2);
      expect(a.value).toEqual(value2);
      expect(c.value).toEqual({ three: ['one'], four: value2 });
    });
  });
});

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

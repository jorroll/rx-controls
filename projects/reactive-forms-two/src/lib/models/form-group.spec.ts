import { Subject } from 'rxjs';
import {
  AbstractControl,
  IControlEvent,
  IControlStateChangeEvent,
  ValidationErrors,
} from './abstract-control/abstract-control';
import runAbstractControlBaseTestSuite from './abstract-control/abstract-control-base-tests';
import runAbstractControlContainerBaseTestSuite from './abstract-control-container/abstract-control-container-base-tests';
import { FormControl } from './form-control';
import { FormGroup } from './form-group';
import {
  testAllAbstractControlContainerDefaultsExcept,
  wait,
  getControlEventsUntilEnd,
  toControlMatcherEntries,
  testAllAbstractControlDefaultsExcept,
  subscribeToControlEventsUntilEnd,
  mapControlsToId,
} from './test-util';
import runSharedTestSuite from './shared-tests';
import { map, tap } from 'rxjs/operators';
import { isStateChange } from './util';

runAbstractControlContainerBaseTestSuite('FormGroup', (args = {}) => {
  const c = new FormGroup<{ [key: string]: AbstractControl }>({}, args.options);

  if (args.children) {
    for (let i = 0; i < args.children; i++) {
      c.addControl(`${i}`, new FormControl(i));
    }
  }

  return c;
});

runAbstractControlBaseTestSuite(
  'FormGroup',
  (args) => new FormGroup({}, args?.options)
);

runSharedTestSuite('FormGroup', (args) => new FormGroup({}, args?.options), {
  controlContainer: true,
});

function testAllDefaultsExcept(
  c: FormGroup<any>,
  ...skipTests: Array<keyof FormGroup>
) {
  testAllAbstractControlDefaultsExcept(c, ...skipTests);
  testAllAbstractControlContainerDefaultsExcept(c, ...skipTests);

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
        const aControls = {
          one: new FormControl('one'),
          two: new FormControl(2),
        };
        const a = new FormGroup(aControls);

        const bControls = {
          three: new FormControl(['one']),
          four: a,
        };
        const b = new FormGroup(bControls);

        await wait(0);

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

        expect(a.controls).toEqual(aControls);
        expect(a.controlsStore).toEqual(new Map(Object.entries(aControls)));
        expect(a.size).toEqual(2);

        testAllDefaultsExcept(
          a,
          'value',
          'enabledValue',
          'controls',
          'controlsStore',
          'size',
          'parent'
        );

        expect(b.controls).toEqual(bControls);
        expect(b.controlsStore).toEqual(new Map(Object.entries(bControls)));
        expect(b.size).toEqual(2);

        testAllDefaultsExcept(
          b,
          'value',
          'enabledValue',
          'controls',
          'controlsStore',
          'size'
        );
      });
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
        changedProps: ['value', 'enabledValue'],
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
        changedProps: ['value', 'enabledValue'],
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

    it('setup', () => {
      expect(a).toImplementObject({ value: { one: 'one', two: 2 } });
      expect(b).toImplementObject({ value: {} });
      expect(c).toImplementObject({
        value: { three: ['one'], four: { one: 'one', two: 2 } },
      });
    });

    it(`a to b`, () => {
      a.replayState().subscribe(b.source);

      expect(b).toEqualControl(a, {
        skip: ['parent'],
      });

      const [end] = subscribeToControlEventsUntilEnd(a, b);

      const newValue = {
        one: 'two',
        two: 3,
      };

      a.setValue(newValue);

      expect(b).toEqualControl(a, {
        skip: ['parent'],
      });

      expect(c.value).toEqual({ three: ['one'], four: newValue });

      end.next();
      end.complete();
    });

    it(`a & b`, async () => {
      a.replayState().subscribe(b.source);

      const [end] = subscribeToControlEventsUntilEnd(a, b);
      subscribeToControlEventsUntilEnd(b, a, end);

      const value1 = {
        one: 'two',
        two: 3,
      };

      a.setValue(value1);

      expect(b).toEqualControl(a, {
        skip: ['parent'],
      });

      expect(c.value).toEqual({ three: ['one'], four: value1 });

      const value2 = {
        one: 'three',
        two: 4,
      };

      b.setValue(value2);

      expect(a).toEqualControl(b, {
        skip: ['parent'],
      });

      expect(c.value).toEqual({ three: ['one'], four: value2 });

      end.next();
      end.complete();
    });

    it('c to b', () => {
      c.replayState().subscribe(b.source);

      expect(b).toEqualControl(c, {
        skip: ['parent'],
      });

      const [end] = subscribeToControlEventsUntilEnd(c, b);

      const newValue = {
        three: ['two'],
        four: {
          one: 'three',
          two: 4,
        },
      };

      c.setValue(newValue);

      expect(b).toEqualControl(c, {
        skip: ['parent'],
      });

      expect(a.value).toEqual(newValue.four);

      end.next();
      end.complete();
    });

    describe('c & b', () => {
      it(`setValue on parent`, async () => {
        c.replayState().subscribe(b.source);

        const [end] = subscribeToControlEventsUntilEnd(c, b);
        subscribeToControlEventsUntilEnd(b, c, end);

        const value1 = {
          three: ['two'],
          four: {
            one: 'three',
            two: 4,
          },
        };

        c.setValue(value1);

        expect(b).toEqualControl(c, {
          skip: ['parent'],
        });

        expect(a.value).toEqual(value1.four);

        const value2 = {
          three: ['three'],
          four: {
            one: 'one',
            two: 5,
          },
        };

        b.setValue(value2);

        expect(c).toEqualControl(b, {
          skip: ['parent'],
        });

        expect(a.value).toEqual(value2.four);

        end.next();
        end.complete();
      });

      it(`setValue on child`, async () => {
        c.replayState().subscribe(b.source);

        const [end] = subscribeToControlEventsUntilEnd(c, b);
        subscribeToControlEventsUntilEnd(b, c, end);

        const child = b.get('four', 'one')!;

        child.setValue('threvinty');

        expect(child.value).toEqual('threvinty');
        expect(b.value).toEqual({
          three: ['one'],
          four: {
            one: 'threvinty',
            two: 2,
          },
        });

        expect(c).toEqualControl(b, {
          skip: ['parent'],
        });

        const child2 = c.get('four', 'two')!;

        child2.setValue(3);

        expect(child2.value).toEqual(3);
        expect(c.value).toEqual({
          three: ['one'],
          four: {
            one: 'threvinty',
            two: 3,
          },
        });

        expect(b).toEqualControl(c, {
          skip: ['parent'],
        });

        end.next();
        end.complete();
      });

      it('with value transform', () => {
        c.replayState().subscribe(b.source);

        c.events
          .pipe(
            map((e) => {
              if (!isStateChange(e)) return e;
              if (!e.change.value) return e;

              const newValue = {
                ...c.value,
                four: {
                  ...c.value.four,
                  one: c.value.four.one.toUpperCase(),
                },
              };

              return { ...e, change: { value: () => newValue } };
            })
          )
          .subscribe(b.source);

        b.events
          .pipe(
            map((e) => {
              if (!isStateChange(e)) return e;
              if (!e.change.value) return e;

              const newValue = {
                ...b.value,
                four: {
                  ...b.value.four,
                  one: b.value.four.one.toLowerCase(),
                },
              };

              return { ...e, change: { value: () => newValue } };
            })
          )
          .subscribe(c.source);

        const child = c.get('four', 'one')!;
        const child2 = b.get('four', 'one')!;

        child.setValue('threVINTY');

        expect(child.value).toEqual('threvinty');
        expect(child2.value).toEqual('THREVINTY');

        expect(b.value).toEqual({
          three: ['one'],
          four: {
            one: 'THREVINTY',
            two: 2,
          },
        });

        expect(b.enabledValue).toEqual({
          three: ['one'],
          four: {
            one: 'THREVINTY',
            two: 2,
          },
        });

        expect(c.value).toEqual({
          three: ['one'],
          four: {
            one: 'threvinty',
            two: 2,
          },
        });

        expect(c.enabledValue).toEqual({
          three: ['one'],
          four: {
            one: 'threvinty',
            two: 2,
          },
        });

        expect(c).toEqualControl(b, {
          skip: ['parent', '_value', 'value', '_enabledValue', 'enabledValue'],
        });

        const child3 = b.get('four', 'two')!;

        child3.setValue(3);

        expect(child3.value).toEqual(3);

        expect(b.value).toEqual({
          three: ['one'],
          four: {
            one: 'THREVINTY',
            two: 3,
          },
        });

        expect(b.enabledValue).toEqual({
          three: ['one'],
          four: {
            one: 'THREVINTY',
            two: 3,
          },
        });

        expect(c.value).toEqual({
          three: ['one'],
          four: {
            one: 'threvinty',
            two: 3,
          },
        });

        expect(c.enabledValue).toEqual({
          three: ['one'],
          four: {
            one: 'threvinty',
            two: 3,
          },
        });

        expect(b).toEqualControl(c, {
          skip: ['parent', '_value', 'value', '_enabledValue', 'enabledValue'],
        });
      });
    });
  });
});

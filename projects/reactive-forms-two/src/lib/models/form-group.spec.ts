import { merge, Subject } from 'rxjs';
import {
  AbstractControl,
  IControlEvent,
  IControlStateChangeEvent,
  IControlValidationEvent,
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
  TestSingletons,
} from './test-util';
import runSharedTestSuite from './shared-tests';
import { map, takeUntil, tap, toArray } from 'rxjs/operators';
import { isStateChange, transformRawValueStateChange } from './util';
import { CONTROL_SELF_ID } from './abstract-control/abstract-control-base';
import { inspect } from 'util';

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
  // type problem is arising because `Array<keyof this & string>` for AbstractControlBase
  // is not the same as `Array<keyof this & string>` for FormGroup
  (args) => new FormGroup({}, args?.options) as any
);

runSharedTestSuite(
  'FormGroup',
  (args) => new FormGroup({}, args?.options) as any,
  {
    controlContainer: true,
  }
);

function testAllDefaultsExcept(
  c: FormGroup<any>,
  ...skipTests: Array<keyof FormGroup>
) {
  testAllAbstractControlDefaultsExcept(c, ...skipTests);
  testAllAbstractControlContainerDefaultsExcept(c, ...skipTests);

  if (!skipTests.includes('rawValue')) {
    expect(c.rawValue).toEqual({});
  }

  if (!skipTests.includes('value')) {
    expect(c.value).toEqual({});
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

        expect(a).toImplementObject({
          value: { one: 'one', two: 2 },
          rawValue: { one: 'one', two: 2 },
        });

        expect(b).toImplementObject({
          value: {
            three: ['one'],
            four: {
              one: 'one',
              two: 2,
            },
          },
          rawValue: {
            three: ['one'],
            four: {
              one: 'one',
              two: 2,
            },
          },
        });

        expect(a.controls).toEqual(aControls);
        expect(a.controlsStore).toEqual(new Map(Object.entries(aControls)));
        expect(a.size).toEqual(2);

        testAllDefaultsExcept(
          a,
          'rawValue',
          'value',
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
          'rawValue',
          'value',
          'controls',
          'controlsStore',
          'size'
        );
      });

      it('invalid child', async () => {
        const aControls = {
          one: new FormControl('', {
            validators: (c) =>
              c.rawValue.length > 0 ? null : { required: true },
          }),
        };

        const a = new FormGroup(aControls);

        await wait(0);

        expect(a.rawValue).toEqual({ one: '' });
        expect(a.value).toEqual({ one: '' });
        expect(a.valid).toEqual(false);
        expect(a.childValid).toEqual(false);
        expect(a.childrenValid).toEqual(false);
        expect(a.selfValid).toEqual(true);
        expect(a.invalid).toEqual(true);
        expect(a.childInvalid).toEqual(true);
        expect(a.childrenInvalid).toEqual(true);
        expect(a.selfInvalid).toEqual(false);
        expect(a.status).toEqual('INVALID');
        expect(a.errors).toEqual({ required: true });
        expect(a.selfErrors).toEqual(null);
        expect(a.childrenErrors).toEqual({ required: true });

        expect(a.controls).toEqual(aControls);
        expect(a.controlsStore).toEqual(new Map(Object.entries(aControls)));
        expect(a.size).toEqual(1);

        testAllDefaultsExcept(
          a,
          'rawValue',
          'value',
          'controls',
          'controlsStore',
          'size',
          'parent',
          'status',
          'valid',
          'childValid',
          'childrenValid',
          'selfValid',
          'invalid',
          'childInvalid',
          'childrenInvalid',
          'selfInvalid',
          'errors',
          'selfErrors',
          'childrenErrors'
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

      expect(a.rawValue).toEqual({ three: 'three' });
      expect(a.value).toEqual({ three: 'three' });
      expect(b.rawValue).toEqual({
        three: ['one'],
        four: { three: 'three' },
      });
      expect(b.value).toEqual({
        three: ['one'],
        four: { three: 'three' },
      });
    });
  });

  describe('setControl', () => {
    it('adds additional control', async () => {
      a.setControl('three', new FormControl('three'));

      expect(a.rawValue).toEqual({
        one: 'one',
        two: 2,
        three: 'three',
      });

      expect(a.value).toEqual({
        one: 'one',
        two: 2,
        three: 'three',
      });

      expect(b.rawValue).toEqual({
        three: ['one'],
        four: {
          one: 'one',
          two: 2,
          three: 'three',
        },
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

      expect(a.rawValue).toEqual({
        one: 'one',
        two: 'three',
      });

      expect(a.value).toEqual({
        one: 'one',
        two: 'three',
      });

      expect(b.rawValue).toEqual({
        three: ['one'],
        four: {
          one: 'one',
          two: 'three',
        },
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

      expect(a.rawValue).toEqual({ one: 'one' });
      expect(a.value).toEqual({ one: 'one' });

      expect(b.rawValue).toEqual({
        three: ['one'],
        four: { one: 'one' },
      });

      expect(b.value).toEqual({
        three: ['one'],
        four: { one: 'one' },
      });
    });
  });

  describe('addControl', () => {
    it('adds additional control', async () => {
      a.addControl('three', new FormControl('three'));

      expect(a.rawValue).toEqual({
        one: 'one',
        two: 2,
        three: 'three',
      });

      expect(a.value).toEqual({
        one: 'one',
        two: 2,
        three: 'three',
      });

      expect(b.rawValue).toEqual({
        three: ['one'],
        four: {
          one: 'one',
          two: 2,
          three: 'three',
        },
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

      expect(a.rawValue).toEqual({
        one: 'one',
        two: 2,
      });

      expect(a.value).toEqual({
        one: 'one',
        two: 2,
      });

      expect(b.rawValue).toEqual({
        three: ['one'],
        four: {
          one: 'one',
          two: 2,
        },
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

        expect(a.rawValue).toEqual({
          one: 'one',
          two: 2,
        });

        expect(a.value).toEqual({
          one: 'one',
          two: 2,
        });

        expect(b.rawValue).toEqual({
          three: ['one'],
          four: {
            one: 'one',
            two: 2,
          },
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

        expect(a.rawValue).toEqual({
          one: 'one',
        });

        expect(a.value).toEqual({
          one: 'one',
        });

        expect(b.rawValue).toEqual({
          three: ['one'],
          four: {
            one: 'one',
          },
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

        expect(a.rawValue).toEqual({
          one: 'one',
          two: 2,
        });

        expect(a.value).toEqual({
          one: 'one',
          two: 2,
        });

        expect(b.rawValue).toEqual({
          three: ['one'],
          four: {
            one: 'one',
            two: 2,
          },
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

        expect(a.rawValue).toEqual({
          one: 'one',
        });

        expect(a.value).toEqual({
          one: 'one',
        });

        expect(b.rawValue).toEqual({
          three: ['one'],
          four: {
            one: 'one',
          },
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
      const newValue = { one: 'two', two: 3 };

      const [promise1, end] = getControlEventsUntilEnd(a);
      const [promise2] = getControlEventsUntilEnd(b, end);

      a.setValue(newValue);

      expect(a.controls.one.rawValue).toEqual(newValue.one);
      expect(a.controls.one.value).toEqual(newValue.one);
      expect(a.controls.two.rawValue).toEqual(newValue.two);
      expect(a.controls.two.value).toEqual(newValue.two);
      expect(a.rawValue).toEqual(newValue);
      expect(a.value).toEqual(newValue);

      const bNewValue = { three: ['one'], four: newValue };
      expect(b.rawValue).toEqual(bNewValue);
      expect(b.value).toEqual(bNewValue);

      end.next();
      end.complete();

      const [event1, event2, event3, event4] = await promise1;
      const [event5, event6, event7, event8] = await promise2;

      expect(event1).toEqual<IControlValidationEvent<unknown>>({
        type: 'ValidationStart',
        source: a.id,
        meta: {},
        rawValue: newValue,
        value: newValue,
        trigger: { label: expect.any(String), source: expect.any(Symbol) },
      });

      expect(event2).toEqual<IControlValidationEvent<unknown>>({
        type: 'AsyncValidationStart',
        source: a.id,
        meta: {},
        rawValue: newValue,
        value: newValue,
        trigger: { label: expect.any(String), source: expect.any(Symbol) },
      });

      expect(event3).toEqual<IControlStateChangeEvent>({
        type: 'StateChange',
        source: a.id,
        trigger: { label: expect.any(String), source: expect.any(Symbol) },
        changes: new Map([
          ['rawValue', newValue],
          ['value', newValue],
        ]),
        childEvents: {
          one: {
            type: 'StateChange',
            source: a.id,
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map([
              ['rawValue', newValue.one],
              ['value', newValue.one],
            ]),
            meta: {},
          },
          two: {
            type: 'StateChange',
            source: a.id,
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map([
              ['rawValue', newValue.two],
              ['value', newValue.two],
            ]),
            meta: {},
          },
        },
        meta: {},
      });

      expect(event4).toEqual(undefined);

      expect(event5).toEqual<IControlValidationEvent<unknown>>({
        type: 'ValidationStart',
        source: a.id,
        meta: {},
        rawValue: bNewValue,
        value: bNewValue,
        trigger: { label: expect.any(String), source: expect.any(Symbol) },
      });

      expect(event6).toEqual<IControlValidationEvent<unknown>>({
        type: 'AsyncValidationStart',
        source: a.id,
        meta: {},
        rawValue: bNewValue,
        value: bNewValue,
        trigger: { label: expect.any(String), source: expect.any(Symbol) },
      });

      expect(event7).toEqual<IControlStateChangeEvent>({
        type: 'StateChange',
        source: a.id,
        trigger: { label: expect.any(String), source: expect.any(Symbol) },
        changes: new Map([
          ['rawValue', bNewValue],
          ['value', bNewValue],
        ]),
        childEvents: {
          four: {
            type: 'StateChange',
            source: a.id,
            trigger: { label: expect.any(String), source: expect.any(Symbol) },
            changes: new Map([
              ['rawValue', newValue],
              ['value', newValue],
            ]),
            childEvents: {
              one: {
                type: 'StateChange',
                source: a.id,
                trigger: {
                  label: expect.any(String),
                  source: expect.any(Symbol),
                },
                changes: new Map([
                  ['rawValue', newValue.one],
                  ['value', newValue.one],
                ]),
                meta: {},
              },
              two: {
                type: 'StateChange',
                source: a.id,
                trigger: {
                  label: expect.any(String),
                  source: expect.any(Symbol),
                },
                changes: new Map([
                  ['rawValue', newValue.two],
                  ['value', newValue.two],
                ]),
                meta: {},
              },
            },
            meta: {},
          },
        },
        meta: {},
      });

      expect(event8).toEqual(undefined);
    });
  });

  describe('patchValue', () => {
    it('', async () => {
      b.patchValue({
        four: {
          one: 'two',
        },
      });

      expect(a.rawValue).toEqual({ one: 'two', two: 2 });
      expect(a.value).toEqual({ one: 'two', two: 2 });
      expect(a.controls.one.rawValue).toEqual('two');
      expect(a.controls.one.value).toEqual('two');
      expect(a.controls.two.rawValue).toEqual(2);
      expect(a.controls.two.value).toEqual(2);
      expect(b.rawValue).toEqual({
        three: ['one'],
        four: { one: 'two', two: 2 },
      });
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
          'selfErrors',
          'errorsStore',
          'valid',
          'selfValid',
          'invalid',
          'selfInvalid',
          'status'
        );

        expect(c.errors).toEqual(error);
        expect(c.selfErrors).toEqual(error);
        expect(c.errorsStore).toEqual(new Map([[CONTROL_SELF_ID, error]]));
        expect(c.valid).toEqual(false);
        expect(c.selfValid).toEqual(false);
        expect(c.invalid).toEqual(true);
        expect(c.selfInvalid).toEqual(true);
        expect(c.status).toEqual('INVALID');
      });
    });

    describe('b', () => {
      function testLocalDefaults() {
        expect(b.rawValue).toEqual({
          three: ['one'],
          four: { one: 'one', two: 2 },
        });
        expect(b.value).toEqual({
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
          'rawValue',
          'value',
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
          'rawValue',
          'value',
          'controls',
          'controlsStore',
          'errors',
          'selfErrors',
          'errorsStore',
          'valid',
          'selfValid',
          'invalid',
          'selfInvalid',
          'status'
        );

        testLocalDefaults();

        expect(b.errors).toEqual(error);
        expect(b.selfErrors).toEqual(error);
        expect(b.errorsStore).toEqual(new Map([[CONTROL_SELF_ID, error]]));
        expect(b.valid).toEqual(false);
        expect(b.selfValid).toEqual(false);
        expect(b.invalid).toEqual(true);
        expect(b.selfInvalid).toEqual(true);
        expect(b.status).toEqual('INVALID');
      });
    });
  });

  describe('patchErrors', () => {
    function testBLocalDefaults() {
      expect(b.rawValue).toEqual({
        three: ['one'],
        four: { one: 'one', two: 2 },
      });
      expect(b.value).toEqual({
        three: ['one'],
        four: { one: 'one', two: 2 },
      });

      // skipping `parent` because `bControls` controls may have been cloned
      // when added to `b`
      const entries = toControlMatcherEntries(bControls, {
        skip: ['parent'],
      });

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
            'selfErrors',
            'errorsStore',
            'valid',
            'selfValid',
            'invalid',
            'selfInvalid',
            'status'
          );

          expect(c.errors).toEqual(error);
          expect(c.selfErrors).toEqual(error);
          expect(c.errorsStore).toEqual(new Map([[CONTROL_SELF_ID, error]]));
          expect(c.valid).toEqual(false);
          expect(c.selfValid).toEqual(false);
          expect(c.invalid).toEqual(true);
          expect(c.selfInvalid).toEqual(true);
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
            'rawValue',
            'value',
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
            'rawValue',
            'value',
            'controls',
            'controlsStore',
            'errors',
            'selfErrors',
            'errorsStore',
            'valid',
            'selfValid',
            'invalid',
            'selfInvalid',
            'status'
          );

          testBLocalDefaults();

          expect(b.errors).toEqual(error);
          expect(b.selfErrors).toEqual(error);
          expect(b.errorsStore).toEqual(new Map([[CONTROL_SELF_ID, error]]));
          expect(b.valid).toEqual(false);
          expect(b.selfValid).toEqual(false);
          expect(b.invalid).toEqual(true);
          expect(b.selfInvalid).toEqual(true);
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

          testAllDefaultsExcept(
            b,
            'rawValue',
            'value',
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
            'rawValue',
            'value',
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
            'rawValue',
            'value',
            'controls',
            'controlsStore',
            'errors',
            'selfErrors',
            'childrenErrors',
            'errorsStore',
            'valid',
            'selfValid',
            'childValid',
            'childrenValid',
            'invalid',
            'selfInvalid',
            'childInvalid',
            'childrenInvalid',
            'status'
          );

          testBLocalDefaults();

          expect(b).toImplementObject({
            errors: error,
            selfErrors: null,
            childrenErrors: error,
            errorsStore: new Map(),
            valid: false,
            selfValid: true,
            childValid: true,
            childrenValid: false,
            invalid: true,
            selfInvalid: false,
            childInvalid: true,
            childrenInvalid: false,
            status: 'INVALID',
          });
        });

        it('{ error: null }', async () => {
          const child = new FormControl('one', {
            errors: { error: true },
          });

          aControls = { ...aControls, one: child };

          a = new FormGroup<{ [key: string]: AbstractControl }>(aControls);

          bControls = { ...bControls, four: a };

          b = new FormGroup(bControls);

          child.patchErrors({ error: null });

          testAllDefaultsExcept(
            b,
            'rawValue',
            'value',
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

  describe('processEvent', () => {
    let a: FormGroup;

    beforeEach(() => {
      a = new FormGroup();
    });

    describe('StateChange', () => {
      let e: IControlStateChangeEvent | null = null;

      beforeEach(() => {
        e = null;
      });

      it('controlStore', () => {
        const controlsObj = {
          one: new FormControl('one'),
          two: new FormControl(2),
          subgroup: new FormGroup({
            three: new FormControl(3),
          }),
        };

        e = {
          type: 'StateChange',
          source: 'mySource',
          meta: {},
          trigger: { label: expect.any(String), source: expect.any(Symbol) },
          changes: new Map([
            [
              'controlsStore',
              new Map<string, any>(Object.entries(controlsObj)),
            ],
          ]),
        };

        const result = a.processEvent(e);

        const value = { one: 'one', two: 2, subgroup: { three: 3 } };
        const controls = Object.fromEntries(
          Object.entries(controlsObj).map(([k, v]) => [
            k,
            expect.toEqualControl(v, { skip: ['parent'] }),
          ])
        );
        const controlsStore = new Map(
          Object.entries(controlsObj).map(([k, v]) => [
            k,
            expect.toEqualControl(v, { skip: ['parent'] }),
          ])
        );

        expect(a).toImplementObject({
          controls,
          controlsStore,
          rawValue: value,
          value,
        });

        testAllDefaultsExcept(
          a,
          'controls',
          'controlsStore',
          'rawValue',
          'value'
        );

        expect(result.status).toEqual('PROCESSED');
        expect(result.result).toEqual({
          type: 'StateChange',
          source: 'mySource',
          meta: {},
          trigger: { label: expect.any(String), source: expect.any(Symbol) },
          changes: new Map<string, any>([
            ['controls', controls],
            ['controlsStore', controlsStore],
            ['rawValue', value],
            ['value', value],
          ]),
        });
      });
    });
  });

  describe('replayState()', () => {
    it('preserveControls = true', async () => {
      const aControls = {
        two: new FormControl('', {
          validators: (c) =>
            c.rawValue.length > 0 ? null : { required: true },
        }),
      };

      const a = new FormGroup(aControls);

      const bControls = { one: a };

      const b = new FormGroup(bControls);

      await wait(0);

      const replay = b.replayState({ preserveControls: true });

      expect(b.valid).toEqual(false);
      expect(b.value).toEqual({ one: { two: '' } });
      expect(b.errors).toEqual({ required: true });

      // Because `preserveControls === true`, this call to `b.setValue()`
      // changes the `replay` variable state.
      b.setValue({ one: { two: 'hi' } });

      expect(b.valid).toEqual(true);
      expect(b.value).toEqual({ one: { two: 'hi' } });
      expect(b.errors).toEqual(null);

      const event1 = await replay.toPromise();

      b.processEvent(event1);

      expect(b.valid).toEqual(true);
      expect(b.value).toEqual({ one: { two: 'hi' } });
      expect(b.errors).toEqual(null);
      expect(b.controls.one).toBe(bControls.one);
    });

    it('preserveControls = false', async () => {
      const aControls = {
        two: new FormControl('', {
          validators: (c) =>
            c.rawValue.length > 0 ? null : { required: true },
        }),
      };

      const a = new FormGroup(aControls);

      const bControls = { one: a };

      const b = new FormGroup(bControls);

      await wait(0);

      expect(b.valid).toEqual(false);
      expect(b.value).toEqual({ one: { two: '' } });
      expect(b.errors).toEqual({ required: true });

      const replay = b.replayState({ preserveControls: false });

      b.setValue({ one: { two: 'hi' } });

      expect(b.valid).toEqual(true);
      expect(b.value).toEqual({ one: { two: 'hi' } });
      expect(b.errors).toEqual(null);

      const event1 = await replay.toPromise();

      b.processEvent(event1);

      const clonedTwo = b.controls.one.controls.two;
      const originalTwo = aControls.two;

      expect(clonedTwo).not.toBe(originalTwo);
      expect(clonedTwo.validatorStore.get(CONTROL_SELF_ID)).toEqual(
        expect.any(Function)
      );
      expect(originalTwo.validatorStore.get(CONTROL_SELF_ID)).toEqual(
        expect.any(Function)
      );

      expect(b.valid).toEqual(false);
      expect(b.value).toEqual({ one: { two: '' } });
      expect(b.errors).toEqual({ required: true });
      expect(b.controls.one).not.toBe(bControls.one);

      b.setValue({ one: { two: 'hi' } });

      expect(b.valid).toEqual(true);
      expect(b.value).toEqual({ one: { two: 'hi' } });
      expect(b.errors).toEqual(null);
    });

    it('controls preserveControls = false', async () => {
      const aControls = {
        two: new FormControl('', {
          validators: (c) =>
            c.rawValue.length > 0 ? null : { required: true },
        }),
      };

      const a = new FormGroup(aControls);

      const bControls = { one: a };

      const b = new FormGroup(bControls);

      await wait(0);

      const replay = b.replayState({ preserveControls: false });

      const event1 = await replay.toPromise();

      const controlsStore = event1.changes.get(
        'controlsStore'
      ) as typeof b['controlsStore'];

      const controlTwo = controlsStore.get('one')!.controlsStore.get('two')!;

      expect(controlTwo).not.toBe(aControls.two);
      expect(controlTwo.value).toEqual('');
    });
  });

  describe('children', () => {
    describe('markDisabled', () => {
      it('one child', async () => {
        const aControls = {
          two: new FormControl(),
        };

        const a = new FormGroup(aControls);

        const bControls = { one: a };

        const b = new FormGroup(bControls);

        await wait(0);

        expect(b.rawValue).toEqual({ one: { two: null } });
        expect(b.value).toEqual({ one: { two: null } });

        expect(b.controls).toEqual(bControls);
        expect(b.controlsStore).toEqual(new Map(Object.entries(bControls)));
        expect(b.size).toEqual(1);

        testAllDefaultsExcept(
          b,
          'rawValue',
          'value',
          'controls',
          'controlsStore',
          'size'
        );

        aControls.two.markDisabled(true);

        expect(b).toImplementObject({
          rawValue: { one: { two: null } },
          value: {},
          disabled: true,
          selfDisabled: false,
          childDisabled: true,
          childrenDisabled: true,
          enabled: false,
          selfEnabled: true,
          childEnabled: false,
          childrenEnabled: false,
          controls: bControls,
          controlsStore: new Map(Object.entries(bControls)),
          size: 1,
          status: 'DISABLED',
        });

        testAllDefaultsExcept(
          b,
          'rawValue',
          'value',
          'controls',
          'controlsStore',
          'size',
          'status',
          'disabled',
          'selfDisabled',
          'childDisabled',
          'childrenDisabled',
          'enabled',
          'selfEnabled',
          'childEnabled',
          'childrenEnabled'
        );
      });

      it('multiple children', async () => {
        const aControls = {
          aOne: new FormControl('aOne', {
            disabled: true,
            touched: true,
          }),
          aTwo: new FormControl('aTwo', {
            dirty: true,
          }),
        };

        const a = new FormGroup(aControls);

        await wait(0);

        expect(a.rawValue).toEqual({ aOne: 'aOne', aTwo: 'aTwo' });

        expect(a.value).toEqual({ aTwo: 'aTwo' });

        expect(a.disabled).toEqual(false);
        expect(a.selfDisabled).toEqual(false);
        expect(a.childDisabled).toEqual(true);
        expect(a.childrenDisabled).toEqual(false);

        expect(a.enabled).toEqual(true);
        expect(a.selfEnabled).toEqual(true);
        expect(a.childEnabled).toEqual(true);
        expect(a.childrenEnabled).toEqual(false);

        expect(a.dirty).toEqual(true);
        expect(a.selfDirty).toEqual(false);
        expect(a.childDirty).toEqual(true);
        expect(a.childrenDirty).toEqual(true);

        expect(a.controls).toEqual(aControls);
        expect(a.controlsStore).toEqual(new Map(Object.entries(aControls)));
        expect(a.size).toEqual(2);

        testAllDefaultsExcept(
          a,
          'rawValue',
          'value',
          'controls',
          'controlsStore',
          'size',
          'dirty',
          'selfDirty',
          'childDirty',
          'childrenDirty',
          'disabled',
          'selfDisabled',
          'childDisabled',
          'childrenDisabled',
          'enabled',
          'selfEnabled',
          'childEnabled',
          'childrenEnabled'
        );

        const bControls = {
          bOne: a,
          bTwo: new FormControl('bTwo', {
            readonly: true,
          }),
        };

        const b = new FormGroup(bControls);

        await wait(0);

        expect(b.rawValue).toEqual({
          bOne: { aOne: 'aOne', aTwo: 'aTwo' },
          bTwo: 'bTwo',
        });

        expect(b.value).toEqual({
          bOne: { aTwo: 'aTwo' },
          bTwo: 'bTwo',
        });

        expect(b.dirty).toEqual(true);
        expect(b.selfDirty).toEqual(false);
        expect(b.childDirty).toEqual(true);
        expect(b.childrenDirty).toEqual(false);

        expect(b.disabled).toEqual(false);
        expect(b.selfDisabled).toEqual(false);
        expect(b.childDisabled).toEqual(false);
        expect(b.childrenDisabled).toEqual(false);

        expect(b.enabled).toEqual(true);
        expect(b.selfEnabled).toEqual(true);
        expect(b.childEnabled).toEqual(true);
        expect(b.childrenEnabled).toEqual(true);

        expect(b.readonly).toEqual(false);
        expect(b.selfReadonly).toEqual(false);
        expect(b.childReadonly).toEqual(true);
        expect(b.childrenReadonly).toEqual(false);

        expect(b.controls).toEqual(bControls);
        expect(b.controlsStore).toEqual(new Map(Object.entries(bControls)));
        expect(b.size).toEqual(2);

        testAllDefaultsExcept(
          b,
          'rawValue',
          'value',
          'controls',
          'controlsStore',
          'size',
          'dirty',
          'selfDirty',
          'childDirty',
          'childrenDirty',
          'readonly',
          'selfReadonly',
          'childReadonly',
          'childrenReadonly',
          'disabled',
          'selfDisabled',
          'childDisabled',
          'childrenDisabled',
          'enabled',
          'selfEnabled',
          'childEnabled',
          'childrenEnabled'
        );

        aControls.aTwo.markDisabled(true);

        expect(a.rawValue).toEqual({ aOne: 'aOne', aTwo: 'aTwo' });
        expect(a.value).toEqual({});

        expect(a.disabled).toEqual(true);
        expect(a.selfDisabled).toEqual(false);
        expect(a.childDisabled).toEqual(true);
        expect(a.childrenDisabled).toEqual(true);

        expect(a.enabled).toEqual(false);
        expect(a.selfEnabled).toEqual(true);
        expect(a.childEnabled).toEqual(false);
        expect(a.childrenEnabled).toEqual(false);

        expect(a.controls).toEqual(aControls);
        expect(a.controlsStore).toEqual(new Map(Object.entries(aControls)));
        expect(a.size).toEqual(2);
        expect(a.status).toEqual('DISABLED');

        testAllDefaultsExcept(
          a,
          'rawValue',
          'value',
          'controls',
          'controlsStore',
          'size',
          'status',
          'disabled',
          'selfDisabled',
          'childDisabled',
          'childrenDisabled',
          'enabled',
          'selfEnabled',
          'childEnabled',
          'childrenEnabled',
          'parent'
        );

        expect(b.rawValue).toEqual({
          bOne: { aOne: 'aOne', aTwo: 'aTwo' },
          bTwo: 'bTwo',
        });

        expect(b.value).toEqual({ bTwo: 'bTwo' });

        expect(b.dirty).toEqual(false);
        expect(b.selfDirty).toEqual(false);
        expect(b.childDirty).toEqual(false);
        expect(b.childrenDirty).toEqual(false);

        expect(b.disabled).toEqual(false);
        expect(b.selfDisabled).toEqual(false);
        expect(b.childDisabled).toEqual(true);
        expect(b.childrenDisabled).toEqual(false);

        expect(b.enabled).toEqual(true);
        expect(b.selfEnabled).toEqual(true);
        expect(b.childEnabled).toEqual(true);
        expect(b.childrenEnabled).toEqual(false);

        expect(b.readonly).toEqual(true);
        expect(b.selfReadonly).toEqual(false);
        expect(b.childReadonly).toEqual(true);
        expect(b.childrenReadonly).toEqual(true);

        expect(b.controls).toEqual(bControls);
        expect(b.controlsStore).toEqual(new Map(Object.entries(bControls)));
        expect(b.size).toEqual(2);

        testAllDefaultsExcept(
          b,
          'rawValue',
          'value',
          'controls',
          'controlsStore',
          'size',
          'dirty',
          'selfDirty',
          'childDirty',
          'childrenDirty',
          'readonly',
          'selfReadonly',
          'childReadonly',
          'childrenReadonly',
          'disabled',
          'selfDisabled',
          'childDisabled',
          'childrenDisabled',
          'enabled',
          'selfEnabled',
          'childEnabled',
          'childrenEnabled'
        );
      });
    });
  });

  describe('setValue', () => {
    it('with validator', async () => {
      const aControls = {
        one: new FormControl('', {
          validators: (c) =>
            c.rawValue.length > 0 ? null : { required: true },
        }),
      };

      const a = new FormGroup(aControls);

      await wait(0);

      expect(a.rawValue).toEqual({ one: '' });
      expect(a.value).toEqual({ one: '' });
      expect(a.valid).toEqual(false);
      expect(a.childValid).toEqual(false);
      expect(a.childrenValid).toEqual(false);
      expect(a.selfValid).toEqual(true);
      expect(a.invalid).toEqual(true);
      expect(a.childInvalid).toEqual(true);
      expect(a.childrenInvalid).toEqual(true);
      expect(a.selfInvalid).toEqual(false);
      expect(a.status).toEqual('INVALID');
      expect(a.errors).toEqual({ required: true });
      expect(a.childrenErrors).toEqual({ required: true });

      expect(a.controls).toEqual(aControls);
      expect(a.controlsStore).toEqual(new Map(Object.entries(aControls)));
      expect(a.size).toEqual(1);

      testAllDefaultsExcept(
        a,
        'rawValue',
        'value',
        'controls',
        'controlsStore',
        'size',
        'parent',
        'status',
        'valid',
        'childValid',
        'childrenValid',
        'selfValid',
        'invalid',
        'childInvalid',
        'childrenInvalid',
        'selfInvalid',
        'errors',
        'childrenErrors'
      );

      aControls.one.setValue('hi');

      expect(a.rawValue).toEqual({ one: 'hi' });
      expect(a.value).toEqual({ one: 'hi' });
      expect(a.controls).toEqual(aControls);
      expect(a.controlsStore).toEqual(new Map(Object.entries(aControls)));
      expect(a.size).toEqual(1);

      testAllDefaultsExcept(
        a,
        'rawValue',
        'value',
        'controls',
        'controlsStore',
        'size'
      );
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
      expect(a).toImplementObject({
        rawValue: { one: 'one', two: 2 },
        value: { one: 'one', two: 2 },
      });
      expect(b).toImplementObject({ rawValue: {}, value: {} });
      expect(c).toImplementObject({
        rawValue: { three: ['one'], four: { one: 'one', two: 2 } },
        value: { three: ['one'], four: { one: 'one', two: 2 } },
      });
    });

    it(`a to b`, () => {
      a.replayState().subscribe((e) => b.processEvent(e));

      expect(b).toEqualControl(a, {
        skip: ['parent'],
      });

      const [end] = subscribeToControlEventsUntilEnd(a, b);

      const newValue = { one: 'two', two: 3 };

      a.setValue(newValue);

      expect(b).toEqualControl(a, {
        skip: ['parent'],
      });

      expect(c.rawValue).toEqual({ three: ['one'], four: newValue });

      end.next();
      end.complete();
    });

    it(`a & b`, async () => {
      a.replayState().subscribe((e) => b.processEvent(e));

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

      expect(c.rawValue).toEqual({ three: ['one'], four: value1 });

      const value2 = {
        one: 'three',
        two: 4,
      };

      b.setValue(value2);

      expect(a).toEqualControl(b, {
        skip: ['parent'],
      });

      expect(c.rawValue).toEqual({ three: ['one'], four: value2 });

      end.next();
      end.complete();
    });

    it('c to b', () => {
      c.replayState().subscribe((e) => b.processEvent(e));

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

      expect(a.rawValue).toEqual(newValue.four);

      end.next();
      end.complete();
    });

    describe('c & b', () => {
      // a = new FormGroup({
      //   one: new FormControl('one'),
      //   two: new FormControl(2),
      // });

      // b = new FormGroup();

      // c = new FormGroup({
      //   three: new FormControl(['one']),
      //   four: a,
      // });
      // it.only(`setValue on parent`, async () => {
      //   // const d = new FormGroup({
      //   //   three: new FormControl(['one']),
      //   //   four: new FormGroup({
      //   //     one: new FormControl('one'),
      //   //     two: new FormControl(2),
      //   //   })
      //   // });

      //   const d = new FormGroup({
      //     one: new FormGroup({
      //       'one.a': new FormControl('original'),
      //       'one.b': new FormControl('original'),
      //     }),
      //     two: new FormControl('original'),
      //   });

      //   // const d = new FormGroup({
      //   //   one: new FormControl('original'),
      //   //   // two: new FormControl(['two']),
      //   // });

      //   d.replayState().subscribe((e) => b.processEvent(e));

      //   console.log('0 d.value', d.value);
      //   console.log('0 b.value', b.value);

      //   // const [end] = subscribeToControlEventsUntilEnd(c, b);
      //   // subscribeToControlEventsUntilEnd(b, c, end);

      //   const [end] = subscribeToControlEventsUntilEnd(b, d);
      //   subscribeToControlEventsUntilEnd(d, b, end);

      //   // AbstractControl.debugCallback = function (event) {
      //   //   console.log(
      //   //     inspect(
      //   //       {
      //   //         label: `${this.id.toString()} event`,
      //   //         event,
      //   //       },
      //   //       false,
      //   //       null
      //   //     )
      //   //   );
      //   // };

      //   const value1 = {
      //     one: {
      //       'one.a': 'changed',
      //       'one.b': 'changed',
      //     },
      //     two: 'changed',
      //   };

      //   // const value1 = {
      //   //   three: ['two'],
      //   //   four: {
      //   //     one: 'three',
      //   //     two: 4,
      //   //   },
      //   // };

      //   const promise0 = merge(b.events, d.events)
      //     .pipe(takeUntil(end), toArray())
      //     .toPromise();

      //   const [promise1] = getControlEventsUntilEnd(b, end);
      //   const [promise2] = getControlEventsUntilEnd(d, end);

      //   b.setValue(value1);

      //   end.next();
      //   end.complete();

      //   console.log('1 d.value', d.value);
      //   console.log('1 b.value', b.value);

      //   // const [
      //   //   event1,
      //   //   event2,
      //   //   event3,
      //   //   event4,
      //   //   event5,
      //   //   event6,
      //   //   event7,
      //   //   event8,
      //   // ] = await promise1;
      //   // const [
      //   //   event11,
      //   //   event12,
      //   //   event13,
      //   //   event14,
      //   //   event15,
      //   //   event16,
      //   //   event17,
      //   //   event18,
      //   // ] = await promise2;

      //   // console.log('event1', inspect(event1, false, null));
      //   // console.log('event2', inspect(event2, false, null));
      //   // console.log('event3', inspect(event3, false, null));
      //   // console.log('event4', inspect(event4, false, null));
      //   // console.log('event5', inspect(event5, false, null));
      //   // console.log('event6', inspect(event6, false, null));
      //   // console.log('event7', inspect(event7, false, null));
      //   // console.log('event8', inspect(event8, false, null));

      //   // console.log('');
      //   // console.log('');
      //   // console.log('');

      //   // console.log('event11', inspect(event11, false, null));
      //   // console.log('event12', inspect(event12, false, null));
      //   // console.log('event13', inspect(event13, false, null));
      //   // console.log('event14', inspect(event14, false, null));
      //   // console.log('event15', inspect(event15, false, null));
      //   // console.log('event16', inspect(event16, false, null));
      //   // console.log('event17', inspect(event17, false, null));
      //   // console.log('event18', inspect(event18, false, null));

      //   console.log('');
      //   console.log('');
      //   console.log('');

      //   const [
      //     event21,
      //     event22,
      //     event23,
      //     event24,
      //     event25,
      //     event26,
      //     event27,
      //     event28,
      //     event29,
      //     event30,
      //     event31,
      //     event32,
      //     event33,
      //     event34,
      //     event35,
      //     event36,
      //     event37,
      //     event38,
      //     event39,
      //   ] = await promise0;

      //   console.log('event21', inspect(event21, false, null));
      //   console.log('event22', inspect(event22, false, null));
      //   console.log('event23', inspect(event23, false, null));
      //   console.log('event24', inspect(event24, false, null));
      //   console.log('event25', inspect(event25, false, null));
      //   console.log('event26', inspect(event26, false, null));
      //   console.log('event27', inspect(event27, false, null));
      //   console.log('event28', inspect(event28, false, null));
      //   console.log('event29', inspect(event29, false, null));
      //   console.log('event30', inspect(event30, false, null));
      //   console.log('event31', inspect(event31, false, null));
      //   console.log('event32', inspect(event32, false, null));
      //   console.log('event33', inspect(event33, false, null));
      //   console.log('event34', inspect(event34, false, null));
      //   console.log('event35', inspect(event35, false, null));
      //   console.log('event36', inspect(event36, false, null));
      //   console.log('event37', inspect(event37, false, null));
      //   console.log('event38', inspect(event38, false, null));
      //   console.log('event39', inspect(event39, false, null));

      //   // console.log('1 a.value', a.value);
      //   // console.log('1 b.value', b.value);
      //   // console.log('1 c.value', c.value);

      //   expect(b).toEqualControl(d);

      //   // expect(a.rawValue).toEqual(value1.four);

      //   // const value2 = {
      //   //   three: ['three'],
      //   //   four: {
      //   //     one: 'one',
      //   //     two: 5,
      //   //   },
      //   // };

      //   await wait(0);

      //   // console.warn('now!');
      //   // // console.log('a', a.id);
      //   // // console.log('b', b.id);
      //   // // console.log('c', c.id);
      //   // AbstractControl.debugCallback = function (event) {
      //   //   console.log(
      //   //     inspect(
      //   //       {
      //   //         label: `${this.id.toString()} event`,
      //   //         event,
      //   //       },
      //   //       false,
      //   //       null
      //   //     )
      //   //   );
      //   // };

      //   // b.setValue(value2);

      //   // console.log('2 a.value', a.value);
      //   // console.log('2 b.value', b.value);
      //   // console.log('2 c.value', c.value);

      //   // expect(c).toEqualControl(b);

      //   // expect(a.rawValue).toEqual(value2.four);

      //   // end.next();
      //   // end.complete();
      // });

      function syncControls(
        original: AbstractControl,
        alternate: AbstractControl
      ): Subject<any> {
        // original.replayState().subscribe((e) => alternate.processEvent(e));

        const [end] = subscribeToControlEventsUntilEnd(original, alternate);

        subscribeToControlEventsUntilEnd(alternate, original, end);

        return end;
      }

      it(`setValue on parent 2`, async () => {
        const originalControl = new FormGroup(
          {
            one: new FormGroup(
              {
                'one.a': new FormControl('original', { id: 'oOne.a' }),
                'one.b': new FormControl('original', { id: 'oOne.b' }),
              },
              {
                id: 'oOne',
              }
            ),
            two: new FormControl('original', { id: 'oTwo' }),
          },
          {
            id: 'oRoot',
          }
        );

        const alternateControl = new FormGroup(
          {
            one: new FormGroup(
              {
                'one.a': new FormControl('original', { id: 'aOne.a' }),
                'one.b': new FormControl('original', { id: 'aOne.b' }),
              },
              {
                id: 'aOne',
              }
            ),
            two: new FormControl('original', { id: 'aTwo' }),
          },
          {
            id: 'aRoot',
          }
        );

        const end = syncControls(originalControl, alternateControl);

        const value1 = {
          one: {
            'one.a': 'value1',
            'one.b': 'value1',
          },
          two: 'value1',
        };

        alternateControl.setValue(value1);

        expect(alternateControl).toEqualControl(originalControl);

        const value2 = {
          one: {
            'one.a': 'value2',
            'one.b': 'value2',
          },
          two: 'value2',
        };

        originalControl.setValue(value2);

        expect(originalControl).toEqualControl(alternateControl);

        await wait(0);

        end.next();
        end.complete();
      });

      it(`setValue on child`, async () => {
        c.replayState().subscribe((e) => b.processEvent(e));

        const [end] = subscribeToControlEventsUntilEnd(c, b);
        subscribeToControlEventsUntilEnd(b, c, end);

        const child = b.get('four', 'one')!;

        child.setValue('threvinty');

        expect(child.rawValue).toEqual('threvinty');
        expect(b.rawValue).toEqual({
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

        expect(child2.rawValue).toEqual(3);
        expect(c.rawValue).toEqual({
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
        c.replayState().subscribe((e) => b.processEvent(e));

        c.events
          .pipe(
            map((e) => {
              if (!isStateChange(e)) return e;

              return transformRawValueStateChange(
                e,
                (rawValue: typeof c['rawValue']) => {
                  return {
                    ...rawValue,
                    four: {
                      ...rawValue.four,
                      one: rawValue.four.one.toUpperCase(),
                    },
                  };
                }
              );
            })
          )
          .subscribe((e) => b.processEvent(e));

        b.events
          .pipe(
            map((e) => {
              if (!isStateChange(e)) return e;

              return transformRawValueStateChange(
                e,
                (rawValue: typeof b['rawValue']) => {
                  return {
                    ...rawValue,
                    four: {
                      ...rawValue.four,
                      one: rawValue.four.one.toLowerCase(),
                    },
                  };
                }
              );
            })
          )
          .subscribe((e) => c.processEvent(e));

        const child = c.get('four', 'one')!;
        const child2 = b.get('four', 'one')!;

        child.setValue('threVINTY');

        expect(child2.value).toEqual('THREVINTY');
        expect(child.value).toEqual('threvinty');

        expect(b.value).toEqual({
          three: ['one'],
          four: {
            one: 'THREVINTY',
            two: 2,
          },
        });

        expect(b.rawValue).toEqual({
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

        expect(c.rawValue).toEqual({
          three: ['one'],
          four: {
            one: 'threvinty',
            two: 2,
          },
        });

        expect(c).toEqualControl(b, {
          skip: ['parent', '_rawValue', 'rawValue', '_value', 'value'],
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

        expect(b.rawValue).toEqual({
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

        expect(c.rawValue).toEqual({
          three: ['one'],
          four: {
            one: 'threvinty',
            two: 3,
          },
        });

        expect(b).toEqualControl(c, {
          skip: ['parent', '_rawValue', 'rawValue', '_value', 'value'],
        });
      });
    });
  });
});

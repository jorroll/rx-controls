import { merge, Subject } from 'rxjs';
import { skip, take, takeUntil, toArray } from 'rxjs/operators';
import { AbstractControl } from './abstract-control';
import { FormControl } from './form-control';
import { FormGroup } from './form-group';
import {
  testAllControlContainerDefaultsExcept,
  wait,
  logControlEventsUntilEnd,
  getControlEventsUntilEnd,
} from './test-util';

describe('FormGroup', () => {
  beforeEach(() => {
    AbstractControl.eventId(0);
  });

  describe('initialization', () => {
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
  let a: FormGroup<any>;

  let b: FormGroup<{
    three: FormControl<string[]>;
    four: typeof a;
  }>;

  beforeEach(() => {
    AbstractControl.eventId(0);

    a = new FormGroup({
      one: new FormControl('one'),
      two: new FormControl(2),
    });

    b = new FormGroup({
      three: new FormControl(['one']),
      four: a,
    });
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
    it('works', async () => {
      b.patchValue({
        four: {
          one: 'two' as any,
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
        errorsStoreEvent,
        validatorStoreEvent,
        pendingStoreEvent,
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
        [errorsStoreEvent, { errorsStore: expect.any(Function) }] as const,
        [
          validatorStoreEvent,
          { validatorStore: expect.any(Function) },
        ] as const,
        [pendingStoreEvent, { pendingStore: expect.any(Function) }] as const,
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

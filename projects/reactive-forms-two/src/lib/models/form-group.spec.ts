import { merge } from 'rxjs';
import { skip, take } from 'rxjs/operators';
import { FormControl } from './form-control';
import { FormGroup } from './form-group';

describe('FormGroup', () => {
  describe('initialization', () => {
    describe('defaults', () => {
      it('value', () => {
        const c = new FormGroup();
        expect(c.value).toEqual({});
      });

      it('enabledValue', () => {
        const c = new FormGroup();
        expect(c.enabledValue).toEqual({});
      });

      it('controls', () => {
        const c = new FormGroup();
        expect(c.controls).toEqual({});
      });

      it('controlsStore', () => {
        const c = new FormGroup();
        expect(c.controlsStore).toEqual(new Map());
      });

      it('size', () => {
        const c = new FormGroup();
        expect(c.size).toEqual(0);
      });

      it('id', () => {
        const c = new FormGroup();
        expect(typeof c.id).toEqual('symbol');
      });

      it('parent', () => {
        const c = new FormGroup();
        expect(c.parent).toEqual(null);
      });

      it('data', () => {
        const c = new FormGroup();
        expect(c.data).toEqual(undefined);
      });

      it('enabled', () => {
        const c = new FormGroup();
        expect(c.enabled).toEqual(true);
      });

      it('disabled', () => {
        const c = new FormGroup();
        expect(c.disabled).toEqual(false);
      });
    });

    describe('options', () => {
      function testAllDefaultsExcept(
        c: FormGroup<any>,
        ...skipTests: string[]
      ): void {
        if (!skipTests.includes('value')) {
          expect(c.value).toEqual({});
        }
        if (!skipTests.includes('enabledValue')) {
          expect(c.enabledValue).toEqual({});
        }
        if (!skipTests.includes('controls')) {
          expect(c.controls).toEqual({});
        }
        if (!skipTests.includes('controlsStore')) {
          expect(c.controlsStore).toEqual(new Map());
        }
        if (!skipTests.includes('size')) {
          expect(c.size).toEqual(0);
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
        const controls = {
          one: new FormControl('one'),
          two: new FormControl(2),
        };

        const c = new FormGroup(controls);

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

      it('disabled', () => {
        const c = new FormGroup(
          {},
          {
            disabled: true,
          }
        );

        expect(c.enabled).toEqual(false);
        expect(c.disabled).toEqual(true);
        testAllDefaultsExcept(c, 'enabled', 'disabled');
      });
    });
  });

  describe('setValue', () => {
    // let g: FormGroup;
    let a: FormGroup<{
      one: FormControl<string>;
      two: FormControl<number>;
    }>;

    let b: FormGroup<{
      three: FormControl<string[]>;
      four: typeof a;
    }>;

    beforeEach(() => {
      a = new FormGroup({
        one: new FormControl('one'),
        two: new FormControl(2),
      });

      b = new FormGroup({
        three: new FormControl(['one']),
        four: a,
      });
    });

    it('starting value', () => {
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

    it('should fire a StateChange event', () => {
      const newValue = {
        one: 'two',
        two: 3,
      };

      const promise1 = a.events.pipe(take(1)).forEach((event) => {
        expect(event).toEqual({
          source: a.id,
          type: 'StateChange',
          eventId: expect.any(Number),
          idOfOriginatingEvent: expect.any(Number),
          change: {
            value: expect.any(Function),
          },
          sideEffects: [],
          meta: {},
        });
      });

      const promise2 = a.events.pipe(skip(1), take(1)).forEach((event) => {
        expect(event).toEqual({
          source: a.id,
          type: 'ValidationComplete',
          eventId: expect.any(Number),
          idOfOriginatingEvent: expect.any(Number),
          value: newValue,
          meta: {},
        });
      });

      a.setValue(newValue);
      expect(a.controls.one.value).toEqual(newValue.one);
      expect(a.controls.two.value).toEqual(newValue.two);
      expect(a.value).toEqual(newValue);
      expect(b.value).toEqual({ three: ['one'], four: newValue });

      return Promise.all([promise1, promise2]);
    });
  });

  describe('patchValue', () => {
    // let g: FormGroup;
    let a: FormGroup<{
      one: FormControl<string>;
      two: FormControl<number>;
    }>;

    let b: FormGroup<{
      three: FormControl<string[]>;
      four: typeof a;
    }>;

    beforeEach(() => {
      a = new FormGroup({
        one: new FormControl('one'),
        two: new FormControl(2),
      });

      b = new FormGroup({
        three: new FormControl(['one']),
        four: a,
      });
    });

    it('starting value', () => {
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

    it('works', () => {
      const newValue = {
        one: 'two',
        two: 3,
      };

      a.patchValue(newValue);
      expect(a.value).toEqual(newValue);
      expect(a.controls.one.value).toEqual(newValue.one);
      expect(a.controls.two.value).toEqual(newValue.two);
    });
  });
});

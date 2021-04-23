import { AbstractControl } from './abstract-control/abstract-control';
import runAbstractControlBaseTestSuite from './abstract-control/abstract-control-base-tests';
import { FormControl } from './form-control';
import { FormArray } from './form-array';
import {
  testAllAbstractControlContainerDefaultsExcept,
  wait,
  testAllAbstractControlDefaultsExcept,
} from './test-util';
import runAbstractControlContainerBaseTestSuite from './abstract-control-container/abstract-control-container-base-tests';
import runSharedTestSuite from './shared-tests';
import { CONTROL_SELF_ID } from './abstract-control/abstract-control-base';

runAbstractControlContainerBaseTestSuite('FormArray', (args = {}) => {
  const c = new FormArray(undefined, args.options);

  if (args.children) {
    for (let i = 0; i < args.children; i++) {
      c.push(new FormControl(i));
    }
  }

  return c;
});

runAbstractControlBaseTestSuite(
  'FormArray',
  (args) => new FormArray(undefined, args?.options)
);

runSharedTestSuite(
  'FormArray',
  (args) => new FormArray(undefined, args?.options),
  {
    controlContainer: true,
  }
);

function testAllDefaultsExcept(
  c: FormArray<any>,
  ...skipTests: Array<keyof FormArray>
) {
  testAllAbstractControlDefaultsExcept(c, ...skipTests);
  testAllAbstractControlContainerDefaultsExcept(c, ...skipTests);

  if (!skipTests.includes('rawValue')) {
    expect(c.rawValue).toEqual([]);
  }

  if (!skipTests.includes('value')) {
    expect(c.value).toEqual([]);
  }

  if (!skipTests.includes('controls')) {
    expect(c.controls).toEqual([]);
  }
}

describe('FormArray', () => {
  beforeEach(() => {
    // AbstractControl.eventId(0);
  });

  describe('initialization', () => {
    it('defaults', () => {
      testAllDefaultsExcept(new FormArray());
    });

    describe('options', () => {
      it('value', async () => {
        const controls = [new FormControl('one'), new FormControl(2)];

        const c = new FormArray(controls);

        // only exists because, without it, jest sometimes suppresses error messages
        await wait(0);

        expect(c.rawValue).toEqual(['one', 2]);
        expect(c.value).toEqual(['one', 2]);
        expect(c.controls).toEqual(controls);
        expect(c.controlsStore).toEqual(
          new Map(Object.entries(controls).map(([k, c]) => [parseInt(k), c]))
        );
        expect(c.size).toEqual(2);

        testAllDefaultsExcept(
          c,
          'rawValue',
          'value',
          'controls',
          'controlsStore',
          'size'
        );
      });
    });
  });

  describe('replayState()', () => {
    it('preserveControls = true', async () => {
      const aControls = [
        new FormControl('', {
          validators: (c) => (c.value.length > 0 ? null : { required: true }),
        }),
      ];

      const a = new FormArray(aControls);

      const bControls = [a];

      const b = new FormArray(bControls);

      await wait(0);

      const replay = b.replayState({ preserveControls: true });

      expect(b.valid).toEqual(false);
      expect(b.value).toEqual([['']]);
      expect(b.errors).toEqual({ required: true });

      b.setValue([['hi']]);

      expect(b.valid).toEqual(true);
      expect(b.value).toEqual([['hi']]);
      expect(b.errors).toEqual(null);

      const event1 = await replay.toPromise();

      b.processEvent(event1);

      expect(b.valid).toEqual(true);
      expect(b.value).toEqual([['hi']]);
      expect(b.errors).toEqual(null);
      expect(b.controls[0]).toBe(bControls[0]);
    });

    it('preserveControls = false', async () => {
      const aControls = [
        new FormControl('', {
          validators: (c) => (c.value.length > 0 ? null : { required: true }),
        }),
      ];

      const a = new FormArray(aControls);

      const bControls = [a];

      const b = new FormArray(bControls);

      await wait(0);

      expect(b.valid).toEqual(false);
      expect(b.value).toEqual([['']]);
      expect(b.errors).toEqual({ required: true });

      const replay = b.replayState({ preserveControls: false });

      b.setValue([['hi']]);

      expect(b.valid).toEqual(true);
      expect(b.value).toEqual([['hi']]);
      expect(b.errors).toEqual(null);

      const event1 = await replay.toPromise();

      b.processEvent(event1);

      const clonedTwo = b.controls[0].controls[0];
      const originalTwo = aControls[0];

      expect(clonedTwo).not.toBe(originalTwo);
      expect(clonedTwo.validatorStore.get(CONTROL_SELF_ID)).toEqual(
        expect.any(Function)
      );
      expect(originalTwo.validatorStore.get(CONTROL_SELF_ID)).toEqual(
        expect.any(Function)
      );

      expect(b.valid).toEqual(false);
      expect(b.value).toEqual([['']]);
      expect(b.errors).toEqual({ required: true });
      expect(b.controls[0]).not.toBe(bControls[0]);

      b.setValue([['hi']]);

      expect(b.valid).toEqual(true);
      expect(b.value).toEqual([['hi']]);
      expect(b.errors).toEqual(null);
    });
  });
});

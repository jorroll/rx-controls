import {
  IControlEvent,
  IControlEventOptions,
  IControlStateChangeEvent,
} from './abstract-control/abstract-control';
import { pluckOptions, transformRawValueStateChange } from './util';

// describe('isMapEqual', () => {
//   test('true', () => {
//     const one = new Map([['one', 1]]);
//     const two = new Map([['one', 1]]);

//     expect(isMapEqual(one, two)).toBe(true);
//   });

//   test('false', () => {
//     const one = new Map([['one', 1]]);
//     const two = new Map([['one', 2]]);
//     const three = new Map([['three', 2]]);

//     expect(isMapEqual(one, two)).toBe(false);
//     expect(isMapEqual(one, three)).toBe(false);
//   });
// });

describe(`pluckOptions`, () => {
  it('', () => {
    const options: Partial<IControlEvent> = {
      type: 'TestEvent',
      meta: {
        one: 1,
      },
      source: 'one',
      noObserve: true,
    };

    const pluckedOptions: Partial<IControlEventOptions> = {
      source: 'one',
      meta: { one: 1 },
      noObserve: true,
    };

    expect(pluckOptions(options)).toEqual(pluckedOptions);

    expect(pluckOptions(options)).toEqual(pluckedOptions);

    delete options.source;
    delete pluckedOptions.source;

    expect(pluckOptions(options)).toEqual(pluckedOptions);

    delete options.meta;
    delete pluckedOptions.meta;

    expect(pluckOptions(options)).toEqual(pluckedOptions);

    delete options.noObserve;
    delete pluckedOptions.noObserve;

    expect(pluckOptions(options)).toEqual(pluckedOptions);
  });
});

// describe(`removeElFromArray`, () => {
//   it('', () => {
//     const id1 = Symbol('TestId-1');
//     const id2 = Symbol('TestId-2');
//     const id3 = Symbol('TestId-3');
//     const array = [id1, id2, id3];

//     removeElFromArray(id2, array);

//     expect(array).toEqual([id1, id3]);
//   });
// });

// describe('mapIsProperty', () => {
//   test('true', () => {
//     const one = new Map([['one', true]]);
//     const two = new Map();

//     expect(mapIsProperty(one)).toBe(true);
//     expect(mapIsProperty(two)).toBe(true);
//   });

//   test('false', () => {
//     const one = new Map([['one', new Map()]]);

//     expect(mapIsProperty(one)).toBe(false);
//   });
// });
describe('transformRawValueStateChange', () => {
  it('', () => {
    const source = Symbol('one');

    const event: IControlStateChangeEvent = {
      trigger: { label: 'test', source },
      source,
      meta: {},
      type: 'StateChange',
      changes: new Map([
        ['rawValue', { one: 1, two: { three: 3 } }],
        ['value', { one: 1, two: { three: 3 } }],
      ]),
      childEvents: {
        two: {
          trigger: { label: 'test', source },
          source,
          meta: {},
          type: 'StateChange',
          changes: new Map([
            ['rawValue', { three: 3 }],
            ['value', { three: 3 }],
          ]),
          childEvents: {
            three: {
              trigger: { label: 'test', source },
              source,
              meta: {},
              type: 'StateChange',
              changes: new Map([
                ['rawValue', 3],
                ['value', 3],
              ]),
            },
          },
        },
      },
    };

    const newEvent = transformRawValueStateChange(
      event,
      (rawValue: { one: number; two: { three: number } }) => {
        return {
          ...rawValue,
          two: {
            three: rawValue.two.three + 1,
          },
        };
      }
    );

    expect(newEvent).toEqual<IControlStateChangeEvent>({
      trigger: { label: 'test', source },
      source,
      meta: {},
      type: 'StateChange',
      changes: new Map([
        ['rawValue', { one: 1, two: { three: 4 } }],
        ['value', { one: 1, two: { three: 3 } }],
      ]),
      childEvents: {
        two: {
          trigger: { label: 'test', source },
          source,
          meta: {},
          type: 'StateChange',
          changes: new Map([
            ['rawValue', { three: 4 }],
            ['value', { three: 3 }],
          ]),
          childEvents: {
            three: {
              trigger: { label: 'test', source },
              source,
              meta: {},
              type: 'StateChange',
              changes: new Map([
                ['rawValue', 4],
                ['value', 3],
              ]),
            },
          },
        },
      },
    });
  });
});

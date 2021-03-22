import { IControlStateChangeEvent } from './abstract-control/abstract-control';
import { getSortedChanges, transformRawValueStateChange } from './util';

describe('transformRawValueStateChange', () => {
  it('', () => {
    const source = Symbol('one');

    const event: IControlStateChangeEvent = {
      debugPath: 'test',
      controlId: source,
      source,
      meta: {},
      type: 'StateChange',
      changes: {
        rawValue: { one: 1, two: { three: 3 } },
        value: { one: 1, two: { three: 3 } },
      },
      childEvents: {
        two: {
          debugPath: 'test',
          controlId: source,
          source,
          meta: {},
          type: 'StateChange',
          changes: {
            rawValue: { three: 3 },
            value: { three: 3 },
          },
          childEvents: {
            three: {
              debugPath: 'test',
              controlId: source,
              source,
              meta: {},
              type: 'StateChange',
              changes: {
                rawValue: 3,
                value: 3,
              },
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
      debugPath: 'test',
      controlId: source,
      source,
      meta: {},
      type: 'StateChange',
      changes: {
        rawValue: { one: 1, two: { three: 4 } },
        value: { one: 1, two: { three: 3 } },
      },
      childEvents: {
        two: {
          debugPath: 'test',
          controlId: source,
          source,
          meta: {},
          type: 'StateChange',
          changes: {
            rawValue: { three: 4 },
            value: { three: 3 },
          },
          childEvents: {
            three: {
              debugPath: 'test',
              controlId: source,
              source,
              meta: {},
              type: 'StateChange',
              changes: {
                rawValue: 4,
                value: 3,
              },
            },
          },
        },
      },
    });
  });
});

describe('getSortedChanges', () => {
  it('', () => {
    const PROPS = ['one', 'two', 'three', 'four'];
    const PROPS_INDEX = Object.fromEntries(PROPS.map((p, i) => [p, i]));

    expect(
      getSortedChanges(PROPS_INDEX, {
        three: 'a',
        two: 'b',
        four: 'c',
      })
    ).toEqual([
      ['two', 'b'],
      ['three', 'a'],
      ['four', 'c'],
    ]);

    expect(
      getSortedChanges(PROPS_INDEX, {
        four: 'c',
        three: 'a',
        two: 'b',
      })
    ).toEqual([
      ['two', 'b'],
      ['three', 'a'],
      ['four', 'c'],
    ]);

    expect(
      getSortedChanges(PROPS_INDEX, {
        two: 'b',
        four: 'c',
        three: 'a',
      })
    ).toEqual([
      ['two', 'b'],
      ['three', 'a'],
      ['four', 'c'],
    ]);
  });
});

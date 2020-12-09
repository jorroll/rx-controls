import {
  IControlEvent,
  IControlEventOptions,
} from './abstract-control/abstract-control';
import { pluckOptions } from './util';

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
      eventId: 1,
      idOfOriginatingEvent: 1,
      meta: {
        one: 1,
      },
      source: 'one',
      noEmit: true,
    };

    const pluckedOptions: Partial<IControlEventOptions> = {
      source: 'one',
      idOfOriginatingEvent: 1,
      meta: { one: 1 },
      noEmit: true,
    };

    expect(pluckOptions(options)).toEqual(pluckedOptions);

    delete options.idOfOriginatingEvent;
    delete pluckedOptions.idOfOriginatingEvent;

    expect(pluckOptions(options)).toEqual(pluckedOptions);

    delete options.source;
    delete pluckedOptions.source;

    expect(pluckOptions(options)).toEqual(pluckedOptions);

    delete options.meta;
    delete pluckedOptions.meta;

    expect(pluckOptions(options)).toEqual(pluckedOptions);

    delete options.noEmit;
    delete pluckedOptions.noEmit;

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

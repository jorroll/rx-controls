import {
  AbstractControl,
  IControlEvent,
  IControlStateChangeEvent,
} from './abstract-control/abstract-control';

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U> ? U[] : T[P];
};

// type PickUndefinedKeys<T> = {
//   [K in keyof T]: undefined extends T[K] ? K : never;
// }[keyof T];

// type PickRequiredKeys<T> = {
//   [K in keyof T]: undefined extends T[K] ? never : K;
// }[keyof T];

// type SelectOptional<T extends {}> = Pick<
//   T,
//   Exclude<PickUndefinedKeys<T>, undefined>
// >;

// type SelectRequired<T extends {}> = Pick<
//   T,
//   Exclude<PickRequiredKeys<T>, undefined>
// >;

export function isTruthy<T>(value: T): value is NonNullable<T> {
  return !!value;
}

export function isStateChange<
  T extends IControlStateChangeEvent = IControlStateChangeEvent
>(event: IControlEvent): event is T {
  return event.type === 'StateChange';
}

export function getSimpleStateChangeEventArgs<T extends AbstractControl>(
  control: T,
  changedProps: Array<keyof T & string>
) {
  return {
    type: 'StateChange' as const,
    // subtype: 'Self' as const,
    changes: Object.fromEntries(changedProps.map((p) => [p, control[p]])),
  };
}

export function getSimpleChildStateChangeEventArgs<T extends AbstractControl>(
  control: T,
  childEvents: { [key: string]: IControlStateChangeEvent },
  changedProps: Array<keyof T & string>
) {
  return {
    type: 'StateChange' as const,
    // subtype: 'Child' as const,
    childEvents,
    changes: Object.fromEntries(changedProps.map((p) => [p, control[p]])),
  };
}

// This function needs to be updated to also transform an AbstractControlContainer's
// `value` in addition to it's `rawValue`. At the moment this function is not used
// or exposed
export function transformRawValueStateChange<RawValue, NewRawValue>(
  event: IControlStateChangeEvent,
  fn: (rawValue: RawValue) => NewRawValue
) {
  if (event.changes.rawValue === undefined) return event;

  const oldRawValue = event.changes.rawValue as any;
  const newRawValue = fn(oldRawValue) as any;
  const newChanges = { ...event.changes, rawValue: newRawValue };
  const newEvent = { ...event, changes: newChanges };

  if (event.childEvents) {
    const originalEntries = Object.entries(event.childEvents);
    const newEntries: Array<[string, IControlStateChangeEvent]> = [];

    for (const [key, childEvent] of originalEntries) {
      if ((oldRawValue as { [key: string]: unknown })[key] === undefined) {
        continue;
      }

      const childRawValue = newRawValue[key];
      const newChildEvent = transformRawValueStateChange(
        childEvent,
        () => childRawValue
      );

      newEntries.push([key, newChildEvent]);
    }

    if (originalEntries.length > 0) {
      newEvent.childEvents = Object.fromEntries(newEntries);
    }
  }

  return newEvent;
}

export function getSortedChanges(
  index: { [key: string]: number },
  changes: { [key: string]: unknown }
) {
  return Object.entries(changes).sort(([a], [b]) => {
    const a1 = index[a];
    const b1 = index[b];

    if (a1 === b1) return 0;
    if (a1 > b1) return 1;
    return -1;
  });
}

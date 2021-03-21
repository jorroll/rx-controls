import {
  AbstractControl,
  ControlId,
  IControlEvent,
  IControlEventOptions,
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

// export function cloneJSON<T>(item: T): T {
//   return JSON.parse(JSON.stringify(item));
// }

// export function capitalize(t: string) {
//   return t[0].toUpperCase() + t.slice(1);
// }

// export function isMapEqual(
//   cononical: ReadonlyMap<any, any>,
//   other: ReadonlyMap<any, any>
// ): boolean {
//   if (cononical.size !== other.size) return false;

//   for (const [k, v] of cononical) {
//     if (v !== other.get(k)) return false;
//   }

//   return true;
// }

export function isTruthy<T>(value: T): value is NonNullable<T> {
  return !!value;
}

export function isStateChange<
  T extends IControlStateChangeEvent = IControlStateChangeEvent
>(event: IControlEvent): event is T {
  return event.type === 'StateChange';
}

// export function pluckOptions({
//   source,
//   meta,
//   noObserve: noEmit,
//   trigger,
//   [AbstractControl.NO_EVENT]: partial,
// }: IControlEventOptions = {}) {
//   const options = {} as IControlEventOptions;

//   if (source) options.source = source;
//   if (meta) options.meta = meta;
//   if (noEmit) options.noObserve = noEmit;
//   if (trigger) options.trigger = trigger;
//   if (partial) options[AbstractControl.NO_EVENT] = partial;

//   return options;
// }

// export function removeElFromArray<T>(el: T, array: T[]) {
//   const i = array.indexOf(el);

//   if (!Number.isInteger(i)) {
//     throw new Error('Provided element not found in array');
//   }

//   array.splice(i, 1);
//   return array;
// }

export function getSimpleStateChangeEventArgs<T extends AbstractControl>(
  control: T,
  changedProps: Array<keyof T & string>
) {
  return {
    type: 'StateChange' as const,
    // subtype: 'Self' as const,
    changes: new Map(changedProps.map((p) => [p, control[p]])),
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
    changes: new Map(changedProps.map((p) => [p, control[p]])),
  };
}

// export const getSimpleContainerStateChangeEventArgs: <
//   Controls extends GenericControlsObject,
//   D
// >(
//   change: IControlContainerStateChange<Controls, D>
// ) => {
//   type: 'StateChange';
//   subtype: 'Self';
//   change: IControlContainerStateChange<Controls, D>;
//   changedProps: never[];
// } = getSimpleStateChangeEventArgs;

// export function mapIsProperty(a: Map<any, any>) {
//   if (a.size === 0) return true;

//   for (const [, v] of a) {
//     return !(v instanceof Map);
//   }
// }

// export function buildReplayStateEvent<
//   C extends IControlStateChanges<any, any>
// >(args: {
//   change: {
//     change: C;
//     changedProps: string[];
//   };
//   id: ControlId;
//   options?: IControlEventOptions;
// }) {
//   let eventId: number;

//   return {
//     source: args.id,
//     meta: {},
//     ...pluckOptions(args.options),
//     eventId: (eventId = AbstractControl.eventId()),
//     idOfOriginatingEvent: eventId,
//     type: 'StateChange' as const,
//     subtype: 'Self' as const,
//     ...args.change,
//   };
// }

export function transformRawValueStateChange<RawValue, NewRawValue>(
  event: IControlStateChangeEvent,
  fn: (rawValue: RawValue) => NewRawValue
) {
  if (!event.changes.has('rawValue')) return event;

  const oldRawValue = event.changes.get('rawValue') as any;
  const newRawValue = fn(oldRawValue) as any;
  const newChanges = new Map(event.changes).set('rawValue', newRawValue);

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

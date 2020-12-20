import {
  IControlEventArgs,
  IControlEventOptions,
  IControlStateChange,
  IControlStateChangeEvent,
} from './abstract-control/abstract-control';
import {
  GenericControlsObject,
  IControlContainerStateChange,
} from './abstract-control-container/abstract-control-container';

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
>(event: IControlEventArgs): event is T {
  return event.type === 'StateChange';
}

export function pluckOptions({
  source,
  // eventId,
  idOfOriginatingEvent,
  meta,
  noEmit,
}: IControlEventOptions = {}) {
  const options = {} as IControlEventOptions;

  // if (eventId) options.eventId = eventId;
  if (source) options.source = source;
  if (meta) options.meta = meta;
  if (noEmit) options.noEmit = noEmit;
  if (idOfOriginatingEvent) options.idOfOriginatingEvent = idOfOriginatingEvent;

  return options;
}

// export function removeElFromArray<T>(el: T, array: T[]) {
//   const i = array.indexOf(el);

//   if (!Number.isInteger(i)) {
//     throw new Error('Provided element not found in array');
//   }

//   array.splice(i, 1);
//   return array;
// }

export function getSimpleStateChangeEventArgs<V, D>(
  change: IControlStateChange<V, D>
) {
  return {
    type: 'StateChange' as const,
    subtype: 'Self' as const,
    change,
    changedProps: [],
  };
}

export const getSimpleContainerStateChangeEventArgs: <
  Controls extends GenericControlsObject,
  D
>(
  change: IControlContainerStateChange<Controls, D>
) => {
  type: 'StateChange';
  subtype: 'Self';
  change: IControlContainerStateChange<Controls, D>;
  changedProps: never[];
} = getSimpleStateChangeEventArgs;

// export function mapIsProperty(a: Map<any, any>) {
//   if (a.size === 0) return true;

//   for (const [, v] of a) {
//     return !(v instanceof Map);
//   }
// }

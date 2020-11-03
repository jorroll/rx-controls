import {
  IControlEventArgs,
  IControlEventOptions,
  ControlId,
} from './abstract-control';

import { IControlStateChangeEvent } from './control-base';

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U> ? U[] : T[P];
};

export function cloneJSON<T>(item: T): T {
  return JSON.parse(JSON.stringify(item));
}

export function capitalize(t: string) {
  return t[0].toUpperCase() + t.slice(1);
}

export function isMapEqual(
  cononical: ReadonlyMap<any, any>,
  other: ReadonlyMap<any, any>
): boolean {
  if (cononical.size !== other.size) return false;

  for (const [k, v] of cononical) {
    if (v !== other.get(k)) return false;
  }

  return true;
}

export function isTruthy<T>(value: T): value is NonNullable<T> {
  return !!value;
}

export function isProcessed(
  id: symbol | string,
  options?: { processed?: Array<symbol | string> }
) {
  return !!(options && options.processed && options.processed.includes(id));
}

export function isStateChange(
  event: IControlEventArgs
): event is IControlStateChangeEvent<unknown> {
  return event.type === 'StateChange';
}

export function pluckOptions({
  source,
  // eventId,
  idOfOriginatingEvent,
  meta,
  noEmit,
}: IControlEventOptions = {}) {
  const options = {} as Partial<Omit<IControlEventArgs, 'type'>>;

  // if (eventId) options.eventId = eventId;
  if (source) options.source = source;
  if (meta) options.meta = meta;
  if (noEmit) options.noEmit = noEmit;
  if (idOfOriginatingEvent) options.idOfOriginatingEvent = idOfOriginatingEvent;

  return options;
}

// export function mapIsProperty(a: Map<any, any>) {
//   if (a.size === 0) return true;

//   for (const [, v] of a) {
//     return !(v instanceof Map);
//   }
// }

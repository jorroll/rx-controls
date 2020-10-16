import {
  IControlEventArgs,
  IControlEventOptions,
  ControlId,
} from './abstract-control';

import { IStateChange, IControlStateChangeEvent } from './control-base';

export function cloneJSON<T>(item: T): T {
  return JSON.parse(JSON.stringify(item));
}

export function capitalize(t: string) {
  return t[0].toUpperCase() + t.slice(1);
}

// export function isMapEqual(
//   cononical: ReadonlyMap<any, any>,
//   other: ReadonlyMap<any, any>,
// ): boolean {
//   if (cononical.size !== other.size) return false;

//   for (const [k, v] of cononical) {
//     const vv = other.get(k);

//     if (v !== vv) return false;
//   }

//   return true;
// }

export function isTruthy<T>(value: T): value is NonNullable<T> {
  return !!value;
}

export function isProcessed(
  id: symbol | string,
  options?: { processed?: Array<symbol | string> },
) {
  return !!(options && options.processed && options.processed.includes(id));
}

export function isStateChange(
  event: IControlEventArgs,
): event is IControlStateChangeEvent {
  return event.type === 'StateChange';
}

export function pluckOptions({
  source,
  // processed,
  eventId,
  meta,
  noEmit,
}: IControlEventOptions = {}) {
  const options = {} as Partial<Omit<IControlEventArgs, 'type'>>;

  if (eventId) options.eventId = eventId;
  if (source) options.sourceControlId = source;
  // if (processed) options.processed = processed.slice();
  if (meta) options.meta = meta;
  if (noEmit) options.noEmit = noEmit;

  return options;
}

// export function mapIsProperty(a: Map<any, any>) {
//   if (a.size === 0) return true;

//   for (const [, v] of a) {
//     return !(v instanceof Map);
//   }
// }

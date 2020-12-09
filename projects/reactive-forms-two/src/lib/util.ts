import * as _isEqual from 'fast-deep-equal/es6';

export const isEqual: {
  <T>(a: T, b: T): boolean;
  (a: unknown, b: unknown): boolean;
} = _isEqual as any;

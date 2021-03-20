// import * as _isEqual from 'fast-deep-equal/es6';

export { isEqual } from './models/abstract-control/abstract-control';

// // export const isEqual: {
// //   <T>(a: T, b: T): boolean;
// //   (a: unknown, b: unknown): boolean;
// // } = _isEqual as any;

// // export function isEqual<T>(a: T, b: T): boolean;
// // export function isEqual(a: unknown, b: unknown): boolean;
// // export function isEqual(a: any, b: any, comparer?: ((prop: string) => boolean | undefined)) {
// //   if (comparer) {
// //     const val = comp
// //   }

// //   return _isEqual(a, b);
// // }

// export function isEqual<T>(a: T, b: T): boolean;
// export function isEqual(a: unknown, b: unknown): boolean;
// export function isEqual(a: any, b: any, omit?: string[]) {
//   if (a === b) return true;

//   if (a && b && typeof a == 'object' && typeof b == 'object') {
//     if (a.constructor !== b.constructor) return false;

//     let length, i, keys;
//     if (Array.isArray(a)) {
//       length = a.length;
//       if (length != b.length) return false;
//       for (i = length; i-- !== 0;)
//         if (!isEqual(a[i], b[i])) return false;
//       return true;
//     }

//     if ((a instanceof Map) && (b instanceof Map)) {
//       if (a.size !== b.size) return false;
//       for (i of a.entries())
//         if (!b.has(i[0])) return false;
//       for (i of a.entries())
//         if (!isEqual(i[1], b.get(i[0]))) return false;
//       return true;
//     }

//     if ((a instanceof Set) && (b instanceof Set)) {
//       if (a.size !== b.size) return false;
//       for (i of a.entries())
//         if (!b.has(i[0])) return false;
//       return true;
//     }

//     if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
//       length = (a as any).length;
//       if (length != (b as any).length) return false;
//       for (i = length; i-- !== 0;)
//         if ((a as any)[i] !== (b as any)[i]) return false;
//       return true;
//     }

//     if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
//     if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
//     if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

//     keys = Object.keys(a);
//     length = keys.length;
//     if (length !== Object.keys(b).length) return false;

//     for (i = length; i-- !== 0;)
//       if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

//     for (i = length; i-- !== 0;) {
//       var key = keys[i];

//       if (AbstractControl.isAbstractControl(a) && omit?.includes(key)) continue;

//       if (!isEqual(a[key], b[key])) return false;
//     }

//     return true;
//   }

//   // true if both NaN, false otherwise
//   return a!==a && b!==b;
// };

/**
 * Compatibility Layer for Node.js 0.8+
 * Local to this package - contains only needed functions.
 */
import os from 'os';

/**
 * os.tmpdir wrapper for Node.js 0.8+
 * - Uses native os.tmpdir on Node 0.10+
 * - Falls back to os-shim on Node 0.8
 */
var hasTmpdir = typeof os.tmpdir === 'function';

export function tmpdir(): string {
  if (hasTmpdir) {
    return os.tmpdir();
  }
  var osShim = require('os-shim');
  return osShim.tmpdir();
}

/**
 * Object.assign wrapper for Node.js 0.8+
 * - Uses native Object.assign on Node 4.0+
 * - Falls back to manual property copy on Node 0.8-3.x
 */
var hasObjectAssign = typeof Object.assign === 'function';
var _hasOwnProperty = Object.prototype.hasOwnProperty;

export function objectAssign<T, U>(target: T, source: U): T & U {
  if (hasObjectAssign) {
    return Object.assign(target, source);
  }
  for (var key in source) {
    if (_hasOwnProperty.call(source, key)) {
      // biome-ignore lint/suspicious/noExplicitAny: Generic object assignment for Node 0.8 compat
      (target as any)[key] = (source as any)[key];
    }
  }
  return target as T & U;
}

import extname from '../utils/extname.js';
// @ts-ignore
import optionalRequire from '../utils/optionalRequire.cjs';
const fastExtract = optionalRequire('fast-extract');
import type { ExtractCallback } from '../types.js';

export type ExtractMethod = (dest: string, options: object | ExtractCallback, callback?: ExtractCallback) => undefined | Promise<undefined>;

export default function extract(dest: string, options: object | ExtractCallback, callback?: ExtractCallback): undefined | Promise<undefined> {
  if (typeof options === 'function') {
    callback = options as ExtractCallback;
    options = null;
  }
  options = options || {};

  if (!fastExtract) {
    console.log('Warning fast-extract not found so compressed file downloaded only without extraction. Require fast-extract for built-in extraction');
    return this.file(dest, callback);
  }

  if (typeof callback === 'function') {
    options = { ...this.options, ...options };
    return this.stream(options, (err, res) => {
      if (err) return callback(err);

      const type = extname(res.basename, options);
      if (!type) return callback(new Error(`Cannot determine extract type for ${res.basename}`));
      fastExtract(res, dest, Object.assign({}, options, { type: type }), callback);
    });
  }
  return new Promise((resolve, reject) => {
    this.extract(dest, options, (err) => {
      err ? reject(err) : resolve(undefined);
    });
  }) as Promise<undefined>;
}

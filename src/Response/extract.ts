import type fastExtractT from 'fast-extract';
import extname from '../utils/extname.ts';
import optionalRequire from '../utils/optionalRequire.ts';

const fastExtract = optionalRequire('fast-extract');

import type { Callback, Options } from '../types.ts';

function worker(dest: string, options: Options, callback: Callback) {
  if (!fastExtract) {
    console.log('Warning fast-extract not found so compressed file downloaded only without extraction. Require fast-extract for built-in extraction');
    return this.file(dest, callback);
  }

  this.stream(options, (err, res) => {
    if (err) return callback(err);

    const type = extname(res.basename, options);
    if (!type) return callback(new Error(`Cannot determine extract type for ${res.basename}`));
    (fastExtract as typeof fastExtractT)(res, dest, { ...options, type }, callback);
  });
}

export default function extract(dest: string, options: Options | Callback, callback?: Callback): undefined | Promise<undefined> {
  if (typeof options === 'function') {
    callback = options as Callback;
    options = null;
  }
  options = options || {};

  if (typeof callback === 'function') return worker.call(this, dest, options, callback);
  return new Promise((resolve, reject) => worker.call(this, dest, options, (err?: Error) => (err ? reject(err) : resolve(undefined))));
}

import type fastExtractT from 'fast-extract';
import extname from '../lib/extname.ts';
import optionalRequire from '../lib/optionalRequire.ts';

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

export default function extract(dest: string, callback: Callback): void;
export default function extract(dest: string, options: Options, callback: Callback): void;
export default function extract(dest: string, options?: Options): Promise<void>;
export default function extract(dest: string, options: Options | Callback, callback?: Callback): void | Promise<void> {
  callback = typeof options === 'function' ? options : callback;
  options = typeof options === 'function' ? {} : ((options || {}) as Options);

  if (typeof callback === 'function') return worker.call(this, dest, options, callback);
  return new Promise((resolve, reject) => worker.call(this, dest, options, (err?: Error) => (err ? reject(err) : resolve())));
}

import oo from 'on-one';

import type { PipeCallback } from '../types.ts';
import pump from '../utils/pump.ts';

function worker(dest, callback) {
  return this.stream((err, res) => {
    if (err) {
      !dest.end || dest.end(); // cancel streaming to dest
      return callback(err);
    }

    res = pump(res, dest);
    oo(res, ['error', 'end', 'close', 'finish'], callback);
  });
}

export default function pipe(dest: NodeJS.WritableStream, callback?: PipeCallback): undefined | Promise<undefined> {
  if (typeof callback === 'function') return worker.call(this, dest, callback) as undefined;
  return new Promise((resolve, reject) => worker.call(this, dest, (err, res) => (err ? reject(err) : resolve(res))));
}

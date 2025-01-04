import type { WriteStream } from 'fs';
import eos from 'end-of-stream';

import type { PipeCallback } from '../types';
import pump from '../utils/pump';

function worker(dest, callback) {
  return this.stream((err, res) => {
    if (err) {
      !dest.end || dest.end(); // cancel streaming to dest
      return callback(err);
    }

    res = pump(res, dest);
    eos(res, callback);
  });
}

export default function pipe(dest: WriteStream, callback?: PipeCallback): undefined | Promise<undefined> {
  if (typeof callback === 'function') return worker.call(this, dest, callback) as undefined;
  return new Promise((resolve, reject) => worker.call(this, dest, (err, res) => (err ? reject(err) : resolve(res))));
}

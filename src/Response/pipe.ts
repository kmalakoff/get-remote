import type { WriteStream } from 'fs';
import once from 'call-once-fn';

import type { PipeCallback } from '../types';
import pump from '../utils/pump';

function worker(dest, callback) {
  return this.stream((err, res) => {
    if (err) {
      !dest.end || dest.end(); // cancel streaming to dest
      return callback(err);
    }

    res = pump(res, dest);
    const end = once(callback);
    res.on('error', end);
    res.on('end', end);
    res.on('close', end);
    res.on('finish', end);
  });
}

export default function pipe(dest: WriteStream, callback?: PipeCallback): undefined | Promise<undefined> {
  if (typeof callback === 'function') return worker.call(this, dest, callback) as undefined;
  return new Promise((resolve, reject) => worker.call(this, dest, (err, res) => (err ? reject(err) : resolve(res))));
}

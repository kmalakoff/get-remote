import type { WriteStream } from 'fs';
import eos from 'end-of-stream';
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
import Promise from 'pinkie-promise';

import type { PipeCallback } from '../types.js';
import pump from '../utils/pump.js';

export default function pipe(dest: WriteStream, callback?: PipeCallback): undefined | Promise<undefined> {
  if (typeof callback === 'function') {
    return this.stream((err, res) => {
      if (err) {
        !dest.end || dest.end(); // cancel streaming to dest
        return callback(err);
      }

      res = pump(res, dest);
      eos(res, callback);
    });
  }
  return new Promise((resolve, reject) => {
    this.pipe(dest, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
}

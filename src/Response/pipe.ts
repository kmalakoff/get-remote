import eos from 'end-of-stream';

import pump from '../utils/pump.js';

export default function pipe(dest, callback) {
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

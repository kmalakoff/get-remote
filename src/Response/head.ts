import type { HeadCallback, HeadResponse } from '../types.ts';

function worker(callback) {
  this.stream({ method: 'HEAD' }, (err, res) => {
    if (err) return callback(err);

    res.resume(); // Discard response
    callback(null, { statusCode: res.statusCode, headers: res.headers });
  });
}

export default function head(callback?: HeadCallback): undefined | Promise<HeadResponse> {
  if (typeof callback === 'function') return worker.call(this, callback) as undefined;
  return new Promise((resolve, reject) => worker.call(this, (err, res) => (err ? reject(err) : resolve(res))));
}

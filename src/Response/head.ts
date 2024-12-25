// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
import Promise from 'pinkie-promise';
import type { HeadCallback, HeadResponse } from '../types.js';

export default function head(callback?: HeadCallback): undefined | Promise<HeadResponse> {
  if (typeof callback === 'function') {
    return this.stream({ method: 'HEAD' }, (err, res) => {
      if (err) return callback(err);

      res.resume(); // Discard response
      callback(null, { statusCode: res.statusCode, headers: res.headers });
    });
  }
  return new Promise((resolve, reject) => {
    this.head((err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
}

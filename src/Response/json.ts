// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
import Promise from 'pinkie-promise';
import type { JSONCallback, JSONResponse } from '../types.js';

export default function json(callback?: JSONCallback): undefined | Promise<JSONResponse> {
  if (typeof callback === 'function') {
    return this.text((err, res) => {
      if (err) return callback(err);

      try {
        res.body = JSON.parse(res.body);
        return callback(null, res);
      } catch (err) {
        return callback(err);
      }
    });
  }
  return new Promise((resolve, reject) => {
    this.json((err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
}

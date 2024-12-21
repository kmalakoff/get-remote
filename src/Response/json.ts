import type { JSONCallback, JSONStream } from '../types.js';
export type JSONMethod = (callback?: JSONCallback) => undefined | Promise<JSONStream>;

export default function json(callback?: JSONCallback): undefined | Promise<JSONStream> {
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
  }) as Promise<JSONStream>;
}

import type { JSONCallback, JSONResponse } from '../types';

function worker(callback) {
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

export default function json(callback?: JSONCallback): undefined | Promise<JSONResponse> {
  if (typeof callback === 'function') return worker.call(this, callback);
  return new Promise((resolve, reject) => worker.call(this, (err, res) => (err ? reject(err) : resolve(res))));
}

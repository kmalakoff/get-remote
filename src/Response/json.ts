import type { JSONCallback, JSONResponse } from '../types.ts';
import type Response from './index.ts';

function worker(this: Response, callback: JSONCallback) {
  return this.text((err, res) => {
    if (err) return callback(err);
    if (!res) return callback(new Error('No response'));

    try {
      const body = JSON.parse(res.body);
      return callback(undefined, { statusCode: res.statusCode, headers: res.headers, body } as JSONResponse);
    } catch (err) {
      return callback(err as Error);
    }
  });
}

export default function json(this: Response, callback: JSONCallback): void;
export default function json(this: Response): Promise<JSONResponse>;
export default function json(this: Response, callback?: JSONCallback): void | Promise<JSONResponse> {
  if (typeof callback === 'function') return worker.call(this, callback);
  return new Promise((resolve, reject) => worker.call(this, (err, res) => (err ? reject(err) : resolve(res!))));
}

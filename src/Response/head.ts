import type { HeadCallback, HeadResponse } from '../types.ts';
import type Response from './index.ts';

function worker(this: Response, callback: HeadCallback) {
  this.stream({ method: 'HEAD' }, (err, res) => {
    if (err) return callback(err);
    if (!res) return callback(new Error('No response'));

    res.resume(); // Discard response
    callback(undefined, { statusCode: res.statusCode!, headers: res.headers! });
  });
}

export default function head(this: Response, callback: HeadCallback): void;
export default function head(this: Response): Promise<HeadResponse>;
export default function head(this: Response, callback?: HeadCallback): void | Promise<HeadResponse> {
  if (typeof callback === 'function') return worker.call(this, callback);
  return new Promise((resolve, reject) => worker.call(this, (err, res) => (err ? reject(err) : resolve(res!))));
}

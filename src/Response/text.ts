import oo from 'on-one';

import type { TextCallback, TextResponse } from '../types.ts';
import type Response from './index.ts';

function worker(this: Response, callback: TextCallback) {
  return this.stream((err, res) => {
    if (err) return callback(err);
    if (!res) return callback(new Error('No response'));

    // collect text
    let result = '';
    res.on('data', (chunk: Buffer | string) => {
      result += chunk.toString();
    });
    oo(res, ['error', 'end', 'close', 'finish'], (err: Error | null) => {
      err ? callback(err) : callback(undefined, { statusCode: res.statusCode as number, headers: res.headers as object, body: result });
    });
  });
}

export default function text(this: Response, callback: TextCallback): void;
export default function text(this: Response): Promise<TextResponse>;
export default function text(this: Response, callback?: TextCallback): void | Promise<TextResponse> {
  if (typeof callback === 'function') return worker.call(this, callback);
  return new Promise((resolve, reject) => worker.call(this, (err, res) => (err ? reject(err) : resolve(res as TextResponse))));
}

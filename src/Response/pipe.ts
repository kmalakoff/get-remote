import oo from 'on-one';
import pump from '../lib/pump.ts';
import type { PipeCallback } from '../types.ts';
import type Response from './index.ts';

function worker(this: Response, dest: NodeJS.WritableStream, callback: PipeCallback) {
  return this.stream((err, res) => {
    if (err) {
      !dest.end || dest.end(); // cancel streaming to dest
      return callback(err);
    }
    if (!res) return callback(new Error('No response'));

    const piped = pump(res, dest);
    oo(piped, ['error', 'end', 'close', 'finish'], (err: Error | null) => callback(err));
  });
}

export default function pipe(this: Response, dest: NodeJS.WritableStream, callback: PipeCallback): void;
export default function pipe(this: Response, dest: NodeJS.WritableStream): Promise<void>;
export default function pipe(this: Response, dest: NodeJS.WritableStream, callback?: PipeCallback): void | Promise<void> {
  if (typeof callback === 'function') return worker.call(this, dest, callback);
  return new Promise((resolve, reject) => worker.call(this, dest, (err) => (err ? reject(err) : resolve())));
}

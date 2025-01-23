import oo from 'on-one';

import type { TextCallback, TextResponse } from '../types';

function worker(callback) {
  return this.stream((err, res) => {
    if (err) return callback(err);

    // collect text
    let result = '';
    res.on('data', (chunk) => {
      result += chunk.toString();
    });
    oo(res, ['error', 'end', 'close', 'finish'], (err) => {
      err ? callback(err) : callback(null, { statusCode: res.statusCode, headers: res.headers, body: result });
    });
  });
}

export default function text(callback?: TextCallback): undefined | Promise<TextResponse> {
  if (typeof callback === 'function') return worker.call(this, callback) as undefined;
  return new Promise((resolve, reject) => worker.call(this, (err, res) => (err ? reject(err) : resolve(res))));
}

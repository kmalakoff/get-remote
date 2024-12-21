import eos from 'end-of-stream';

import type { TextCallback, TextResponse } from '../types.js';

export default function text(callback?: TextCallback): undefined | Promise<TextResponse> {
  if (typeof callback === 'function') {
    return this.stream((err, res) => {
      if (err) return callback(err);

      // collect text
      let result = '';
      res.on('data', (chunk) => {
        result += chunk.toString();
      });
      eos(res, (err) => {
        err ? callback(err) : callback(null, { statusCode: res.statusCode, headers: res.headers, body: result });
      });
    });
  }
  return new Promise((resolve, reject) => {
    this.text((err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
}

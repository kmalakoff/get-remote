import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp-classic';
import oo from 'on-one';

import getBasename from '../sourceStats/basename.js';
import type { FileCallback } from '../types.js';
import pump from '../utils/pump.js';

import type { Options } from '../types.js';

export type Callback = (error?: Error, fullPath?: string) => undefined;

function worker(dest: string, options: Options, callback: Callback) {
  options = { ...this.options, ...options };
  return this.stream(options, (err, res) => {
    if (err) return callback(err);

    const basename = getBasename(res, options, this.endpoint);
    const fullPath = basename === undefined ? dest : path.join(dest, basename);

    mkdirp(path.dirname(fullPath), (err?: Error) => {
      if (err) return callback(err);

      // write to file
      res = pump(res, fs.createWriteStream(fullPath));
      oo(res, ['error', 'end', 'close', 'finish'], (err?: Error) => {
        err ? callback(err) : callback(null, fullPath);
      });
    });
  });
}

export default function file(dest: string, options?: object | FileCallback, callback?: FileCallback | undefined): undefined | Promise<string> {
  if (typeof options === 'function') {
    callback = options as FileCallback;
    options = null;
  }
  options = options || {};

  if (typeof callback === 'function') return worker.call(this, dest, options, callback);
  return new Promise((resolve, reject) => worker.call(this, dest, options, (err, res) => (err ? reject(err) : resolve(res))));
}

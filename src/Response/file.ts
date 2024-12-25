import fs from 'fs';
import path from 'path';
import eos from 'end-of-stream';
import mkdirp from 'mkdirp-classic';
// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
import Promise from 'pinkie-promise';

import statsBasename from '../sourceStats/basename.js';
import type { FileCallback } from '../types.js';
import pump from '../utils/pump.js';

export default function file(dest: string, options?: object | FileCallback, callback?: FileCallback | undefined): undefined | Promise<string> {
  if (typeof options === 'function') {
    callback = options as FileCallback;
    options = null;
  }
  options = options || {};

  if (typeof callback === 'function') {
    options = { ...this.options, ...options };
    return this.stream(options, (err, res) => {
      if (err) return callback(err);

      const basename = statsBasename(options, res, this.endpoint);
      const fullPath = basename === undefined ? dest : path.join(dest, basename);

      mkdirp(path.dirname(fullPath), (err) => {
        if (err) return callback(err);

        // write to file
        res = pump(res, fs.createWriteStream(fullPath));
        eos(res, (err) => {
          err ? callback(err) : callback(null, fullPath);
        });
      });
    });
  }

  return new Promise((resolve, reject) => {
    this.file(dest, options, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
}

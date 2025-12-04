import fs from 'fs';
import { rm } from 'fs-remove-compat';
import mkdirp from 'mkdirp-classic';
import oo from 'on-one';
import path from 'path';
import tempSuffix from 'temp-suffix';
import pump from '../lib/pump.ts';
import getBasename from '../sourceStats/basename.ts';
import type { FileCallback, Options } from '../types.ts';

export type Callback = (error?: Error, fullPath?: string) => undefined;

function worker(dest: string, options: Options, callback: Callback) {
  options = { ...this.options, ...options };
  return this.stream(options, (err, res) => {
    if (err) return callback(err);

    const basename = getBasename(res, options, this.endpoint);
    const fullPath = basename === undefined ? dest : path.join(dest, basename);
    const tempPath = tempSuffix(fullPath);

    mkdirp(path.dirname(tempPath), (err?: Error) => {
      if (err) return callback(err);

      // write to temp file
      res = pump(res, fs.createWriteStream(tempPath));
      oo(res, ['error', 'end', 'close', 'finish'], (err?: Error) => {
        if (err) {
          rm(tempPath, () => callback(err));
          return;
        }

        // atomic rename to final destination
        mkdirp(path.dirname(fullPath), (err?: Error) => {
          if (err && (err as NodeJS.ErrnoException).code !== 'EEXIST') {
            rm(tempPath, () => callback(err));
            return;
          }
          fs.rename(tempPath, fullPath, (err?: Error) => {
            if (err) {
              const code = (err as NodeJS.ErrnoException).code;
              // On Windows, EPERM can occur if dest is locked by another process
              // EEXIST/ENOTEMPTY means another process won the race - that's ok
              if (code === 'EPERM' || code === 'EEXIST' || code === 'ENOTEMPTY') {
                rm(tempPath, () => callback(null, fullPath));
                return;
              }
              rm(tempPath, () => callback(err));
              return;
            }
            callback(null, fullPath);
          });
        });
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

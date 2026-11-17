import fs from 'fs';
import { rm } from 'fs-remove-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import tempSuffix from 'temp-suffix';
import pump from '../lib/pump.ts';
import getBasename from '../sourceStats/basename.ts';
import type { FileCallback, Options } from '../types.ts';
import type Response from './index.ts';

export type Callback = (error?: Error | null, fullPath?: string) => void;

function worker(this: Response, dest: string, options: Options, callback: Callback) {
  options = { ...this.options, ...options };
  return this.stream(options as import('../types.ts').StreamOptions, (err, res) => {
    if (err) return callback(err);
    if (!res) return callback(new Error('No response'));

    const basename = getBasename(res, options, this.endpoint);
    const fullPath = basename === undefined ? dest : path.join(dest, basename);
    const tempPath = tempSuffix(fullPath);

    const responseStream = res; // capture narrowed value before entering closures
    mkdirp(path.dirname(tempPath), (err) => {
      if (err) return callback(err);

      // write to temp file. pump's callback reports a cut-off response (the file stream can emit 'close' before that error).
      // Older Node reports a cut-off only through the response's 'aborted' event, so that counts too (first outcome wins).
      let finished = false;
      const writeStream = fs.createWriteStream(tempPath);
      const finish = (err?: Error | null) => {
        if (finished) return;
        finished = true;
        if (err) return rm(tempPath, () => callback(err));

        // atomic rename to final destination
        mkdirp(path.dirname(fullPath), (err) => {
          if (err && (err as NodeJS.ErrnoException).code !== 'EEXIST') {
            rm(tempPath, () => callback(err));
            return;
          }
          fs.rename(tempPath, fullPath, (err) => {
            if (err) {
              const code = (err as NodeJS.ErrnoException).code;
              // On Windows, EPERM can occur if dest is locked by another process
              // EEXIST/ENOTEMPTY means another process won the race - that's ok
              // trust that only if a regular file is at dest
              if (code === 'EPERM' || code === 'EEXIST' || code === 'ENOTEMPTY') {
                return fs.stat(fullPath, (statErr, stats) => {
                  if (statErr || !stats.isFile()) return rm(tempPath, () => callback(err));
                  rm(tempPath, () => callback(undefined, fullPath));
                });
              }
              return rm(tempPath, () => callback(err));
            }
            callback(undefined, fullPath);
          });
        });
      };
      responseStream.on('aborted', () => {
        if (finished || (responseStream as unknown as { complete?: boolean }).complete) return; // complete: the whole body arrived before the socket closed
        const ws = writeStream as fs.WriteStream & { destroy?: () => void };
        ws.destroy ? ws.destroy() : ws.end();
        finish(new Error('Response aborted before the download completed'));
      });
      pump(responseStream, writeStream, finish);
    });
  });
}

export default function file(dest: string, callback: FileCallback): void;
export default function file(dest: string, options: Options, callback: FileCallback): void;
export default function file(dest: string, options?: Options): Promise<string>;
export default function file(this: Response, dest: string, options?: Options | FileCallback, callback?: FileCallback): void | Promise<string> {
  callback = typeof options === 'function' ? options : callback;
  options = typeof options === 'function' ? {} : ((options || {}) as Options);

  if (typeof callback === 'function') return worker.call(this, dest, options, callback);
  return new Promise((resolve, reject) => worker.call(this, dest, options, (err, res) => (err ? reject(err) : resolve(res as string))));
}

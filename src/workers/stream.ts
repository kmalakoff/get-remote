import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp-classic';
import suffix from 'temp-suffix';

import os from 'os';
import osShim from 'os-shim';
const tmpdir = os.tmpdir || osShim.tmpdir;

import Response from '../Response/index.js';
import type { Options, ReadStream, StreamOptions, WriteStream } from '../types.js';

export type Callback = (error?: Error, res?: ReadStream) => undefined;

export default function streamCompat(args: [endpoint: string, options: Options], options: StreamOptions, callback: Callback): undefined {
  delete args[1].progress;

  if (options.method === 'HEAD') {
    new Response(args[0], args[1]).stream(options, (err, res) => {
      if (err) return callback(err);

      res.resume(); // Discard response
      callback(null, { statusCode: res.statusCode, headers: res.headers } as ReadStream);
    });
  } else {
    const name = 'get-remote';
    const filename = path.join(tmpdir(), name, suffix('compat'));
    mkdirp.sync(path.dirname(filename));
    const res = fs.createWriteStream(filename) as WriteStream;

    new Response(args[0], args[1]).pipe(res, (err?: Error) => {
      if (err) return callback(err);

      err ? callback(err) : callback(null, { statusCode: res.statusCode, headers: res.headers, filename: filename } as ReadStream);
    });
  }
}

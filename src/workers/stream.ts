import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp-classic';
import suffix from 'temp-suffix';

import os from 'os';
import osShim from 'os-shim';
const tmpdir = os.tmpdir || osShim.tmpdir;

import Response from '../Response/index.js';

export interface WriteStream extends fs.WriteStream {
  statusCode: number;
  headers: object;
}

export default function streamCompat(args, options, callback) {
  delete args[1].progress;

  if (options.method === 'HEAD') {
    new Response(args[0], args[1]).stream(options, (err, res) => {
      if (err) return callback(err);

      res.resume(); // Discard response
      callback(null, { statusCode: res.statusCode, headers: res.headers });
    });
  } else {
    const name = 'get-remote';
    const filename = path.join(tmpdir(), name, suffix('compat'));
    mkdirp.sync(path.dirname(filename));
    const res = fs.createWriteStream(filename) as WriteStream;

    new Response(args[0], args[1]).pipe(res, (err) => {
      if (err) return callback(err);

      err ? callback(err) : callback(null, { statusCode: res.statusCode, headers: res.headers, filename: filename });
    });
  }
}

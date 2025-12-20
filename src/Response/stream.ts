import once from 'call-once-fn';
import fs from 'fs';
import { rmSync } from 'fs-remove-compat';
import { getFile, head } from 'get-file-compat';
import http from 'http';
import https from 'https';
import Module from 'module';
import oo from 'on-one';
import os from 'os';
import path from 'path';
import suffix from 'temp-suffix';
import url from 'url';

import wrapResponse, { type Callback } from '../lib/wrapResponse.ts';

const URL_REGEX = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
const tmpdir = typeof os.tmpdir === 'function' ? os.tmpdir : _require('os-shim').tmpdir;

// node <= 0.8 does not support https and node 0.12 certs cannot be trusted
const major = +process.versions.node.split('.')[0];
const minor = +process.versions.node.split('.')[1];
const noHTTPS = major === 0 && (minor <= 8 || minor === 12);

const responsePath = path.join(__dirname, '..', '..', 'cjs', 'Response', 'index.js');
let Response = null;

import type { ReadStream, StreamCallback, StreamOptions } from '../types.ts';

function worker(options, callback) {
  options = { ...this.options, ...options } as StreamOptions;

  // HEAD requests - use head() which handles noHTTPS internally
  if (options.method === 'HEAD') {
    head(this.endpoint, (err, result) => {
      if (err) return callback(err);
      const headResult = { ...result, resume: () => {} };
      callback(null, headResult as unknown as ReadStream);
    });
    return;
  }

  // Non-HEAD on legacy Node - use getFile() which handles noHTTPS internally
  if (noHTTPS) {
    const tempPath = path.join(tmpdir(), 'get-remote', suffix('compat'));
    getFile(this.endpoint, tempPath, (err, result) => {
      if (err) return callback(err);
      const res = fs.createReadStream(result.path) as ReadStream;
      res.headers = result.headers;
      res.statusCode = result.statusCode;
      oo(res, ['error', 'end', 'close', 'finish'], () => {
        rmSync(result.path); // clean up
      });
      wrapResponse(res, this, options, callback);
    });
    return;
  }

  // url.parse replacement
  const parsed = URL_REGEX.exec(this.endpoint);
  const protocol = parsed[1];
  const host = parsed[4];
  const urlPath = parsed[5] + (parsed[6] || '');

  const secure = protocol === 'https:';
  const requestOptions = { host, path: urlPath, port: secure ? 443 : 80, method: 'GET', ...options };
  const req = secure ? https.request(requestOptions) : http.request(requestOptions);
  const end = once(callback) as Callback;
  req.on('response', (res) => {
    // Follow 3xx redirects
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume(); // Discard response
      if (!Response) Response = _require(responsePath).default; // break cycle

      return new Response(res.headers.location, options).stream(end);
    }

    // Not successful
    if (res.statusCode < 200 || res.statusCode >= 300) {
      res.resume(); // Discard response
      return end(new Error(`Response code ${res.statusCode} (${http.STATUS_CODES[res.statusCode]})`));
    }
    wrapResponse(res as unknown as ReadStream, this, options, end);
  });
  req.on('error', end);
  req.end();
}

export default function stream(callback: StreamCallback): void;
export default function stream(options: StreamOptions, callback: StreamCallback): void;
export default function stream(options?: StreamOptions): Promise<ReadStream>;
export default function stream(options?: StreamOptions | StreamCallback, callback?: StreamCallback): void | Promise<ReadStream> {
  callback = typeof options === 'function' ? options : callback;
  options = typeof options === 'function' ? {} : ((options || {}) as StreamOptions);

  if (typeof callback === 'function') return worker.call(this, options, callback);
  return new Promise((resolve, reject) => worker.call(this, options, (err, res) => (err ? reject(err) : resolve(res))));
}

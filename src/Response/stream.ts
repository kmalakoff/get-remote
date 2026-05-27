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
import type { Callback } from '../lib/wrapResponse.ts';
import wrapResponse from '../lib/wrapResponse.ts';

const URL_REGEX = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
const tmpdir = typeof os.tmpdir === 'function' ? os.tmpdir : _require('os-shim').tmpdir;

// node 0.x does not support https or has untrusted certs
const major = +process.versions.node.split('.')[0];
const noHTTPS = major === 0;

const responsePath = path.join(__dirname, '..', '..', 'cjs', 'Response', 'index.js');
let Response: typeof import('./index.ts').default | null = null;

import type { OptionsInternal, ReadStream, StreamCallback, StreamOptions } from '../types.ts';
import type ResponseClass from './index.ts';

function worker(this: ResponseClass, options: StreamOptions, callback: StreamCallback) {
  const mergedOptions: OptionsInternal = { ...this.options, ...options } as OptionsInternal;

  // HEAD requests - use head() which handles noHTTPS internally
  if (options.method === 'HEAD') {
    head(this.endpoint, (err, result) => {
      if (err) return callback(err);
      if (!result) return callback(new Error('No result'));
      if (result.statusCode < 200 || result.statusCode >= 300) {
        return callback(new Error(`Response code ${result.statusCode} (${http.STATUS_CODES[result.statusCode]})`));
      }
      const headResult = { ...result, resume: () => {} };
      callback(undefined, headResult as unknown as ReadStream);
    });
    return;
  }

  // Non-HEAD on legacy Node - use getFile() which handles noHTTPS internally
  if (noHTTPS) {
    const tempPath = path.join(tmpdir(), 'get-remote', suffix('compat'));
    getFile(this.endpoint, tempPath, (err, result) => {
      if (err) return callback(err);
      if (!result) return callback(new Error('No result'));
      if (result.statusCode < 200 || result.statusCode >= 300) {
        rmSync(result.path);
        return callback(new Error(`Response code ${result.statusCode} (${http.STATUS_CODES[result.statusCode]})`));
      }
      const res = fs.createReadStream(result.path) as ReadStream;
      res.headers = result.headers;
      res.statusCode = result.statusCode;
      oo(res, ['error', 'end', 'close', 'finish'], () => {
        rmSync(result.path); // clean up
      });
      wrapResponse(res, this, mergedOptions, callback);
    });
    return;
  }

  // url.parse replacement
  const parsed = URL_REGEX.exec(this.endpoint);
  if (!parsed) return callback(new Error('Invalid URL'));
  const protocol = parsed[1];
  const host = parsed[4];
  const urlPath = parsed[5] + (parsed[6] || '');

  const secure = protocol === 'https:';
  const requestOptions: http.RequestOptions = { host, path: urlPath, port: secure ? 443 : 80, method: options.method || 'GET' };
  const req = secure ? https.request(requestOptions) : http.request(requestOptions);
  const end: Callback = (err?: Error | null, res?: ReadStream) => callback(err, res);
  req.on('response', (res: http.IncomingMessage) => {
    // Follow 3xx redirects
    if (res.statusCode !== undefined && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume(); // Discard response
      if (!Response) Response = _require(responsePath).default; // break cycle
      const Cls = Response as typeof import('./index.ts').default;
      return new Cls(res.headers.location, mergedOptions).stream(end);
    }

    // Not successful
    if (res.statusCode === undefined || res.statusCode < 200 || res.statusCode >= 300) {
      res.resume(); // Discard response
      return end(new Error(`Response code ${res.statusCode} (${http.STATUS_CODES[res.statusCode as unknown as number]})`));
    }
    wrapResponse(res as unknown as ReadStream, this, mergedOptions, end);
  });
  req.on('error', end);
  req.end();
}

export default function stream(this: ResponseClass, callback: StreamCallback): void;
export default function stream(this: ResponseClass, options: StreamOptions, callback: StreamCallback): void;
export default function stream(this: ResponseClass, options?: StreamOptions): Promise<ReadStream>;
export default function stream(this: ResponseClass, options?: StreamOptions | StreamCallback, callback?: StreamCallback): void | Promise<ReadStream> {
  callback = typeof options === 'function' ? options : callback;
  options = typeof options === 'function' ? {} : ((options || {}) as StreamOptions);

  if (typeof callback === 'function') return worker.call(this, options, callback);
  return new Promise((resolve, reject) => worker.call(this, options, (err, res) => (err ? reject(err) : resolve(res as ReadStream))));
}

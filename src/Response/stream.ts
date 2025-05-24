import fs from 'fs';
import http from 'http';
import https from 'https';
import Module from 'module';
import path from 'path';
import url from 'url';
import once from 'call-once-fn';
import oo from 'on-one';
import rimraf2 from 'rimraf2';

import wrapResponse from '../utils/wrapResponse.js';

const URL_REGEX = /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);

// node <= 0.8 does not support https and node 0.12 certs cannot be trusted
const major = +process.versions.node.split('.')[0];
const minor = +process.versions.node.split('.')[1];
const noHTTPS = major === 0 && (minor <= 8 || minor === 12);

const workerPath = path.join(__dirname, '..', 'workers', 'stream.js');
let execPath = null;
let Response = null;

import type { StreamCallback, StreamOption, StreamResponse } from '../types.js';

function worker(options, callback) {
  options = { ...this.options, ...options };

  // node <=0.8 does not support https
  if (noHTTPS) {
    if (!execPath) {
      const satisfiesSemverSync = _require('node-exec-path').satisfiesSemverSync;
      execPath = satisfiesSemverSync('>0'); // must be more than node 0.12
      if (!execPath) return callback(new Error('get-remote needs a version of node >0 to use https'));
    }

    try {
      const streamInfo = _require('function-exec-sync')({ execPath, callbacks: true }, workerPath, [this.endpoint, this.options], options);
      if ((options as StreamOption).method === 'HEAD') {
        streamInfo.resume = () => {};
        callback(null, streamInfo);
      } else {
        const res = fs.createReadStream(streamInfo.filename) as StreamResponse;
        res.headers = streamInfo.headers;
        res.statusCode = streamInfo.statusCode;
        oo(res, ['error', 'end', 'close', 'finish'], () => {
          rimraf2.sync(streamInfo.filename, { disableGlob: true }); // clean up
        });
        wrapResponse(res, this, options, callback);
      }
    } catch (err) {
      callback(err);
    }
    return;
  }

  // url.parse replacement
  const parsed = URL_REGEX.exec(this.endpoint);
  const protocol = parsed[1];
  const host = parsed[4];
  const path = parsed[5];

  const secure = protocol === 'https:';
  const requestOptions = { host, path, port: secure ? 443 : 80, method: 'GET', ...options };
  const req = secure ? https.request(requestOptions) : http.request(requestOptions);
  const end = once(callback);
  req.on('response', (res) => {
    // Follow 3xx redirects
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume(); // Discard response
      if (!Response) Response = _require('./index.js').default; // break cycle

      return new Response(res.headers.location, options).stream(end);
    }

    // Not successful
    if (res.statusCode < 200 || res.statusCode >= 300) {
      res.resume(); // Discard response
      return end(new Error(`Response code ${res.statusCode} (${http.STATUS_CODES[res.statusCode]})`));
    }
    wrapResponse(res, this, options, end);
  });
  req.on('error', end);
  req.end();
}

export default function stream(options?: StreamOption | StreamCallback, callback?: StreamCallback): undefined | Promise<StreamResponse> {
  if (typeof options === 'function') {
    callback = options as StreamCallback;
    options = null;
  }
  options = options || {};

  if (typeof callback === 'function') return worker.call(this, options, callback) as undefined;
  return new Promise((resolve, reject) => worker.call(this, options, (err, res) => (err ? reject(err) : resolve(res))));
}

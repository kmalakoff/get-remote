import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import url from 'url';
import eos from 'end-of-stream';
import rimraf2 from 'rimraf2';

import wrapResponse from '../utils/wrapResponse.js';
import Response from './index.js';

// @ts-ignore
import lazy from '../lib/lazy.cjs';
const functionExec = lazy('function-exec-sync');
const nodeExecPath = lazy('node-exec-path');

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));

// node <= 0.8 does not support https and node 0.12 certs cannot be trusted
const major = +process.versions.node.split('.')[0];
const minor = +process.versions.node.split('.')[1];
const noHTTPS = major === 0 && (minor <= 8 || minor === 12);

const streamCompat = path.resolve(__dirname, '..', 'utils', 'streamCompat.js');
let execPath = null;

import type { StreamCallback, StreamOption, StreamResponse } from '../types.js';

export default function stream(options?: StreamOption | StreamCallback, callback?: StreamCallback): undefined | Promise<StreamResponse> {
  if (typeof options === 'function') {
    callback = options as StreamCallback;
    options = null;
  }
  options = options || {};

  if (typeof callback === 'function') {
    options = { ...this.options, ...options };

    // node <=0.8 does not support https
    if (noHTTPS) {
      if (!execPath) {
        const satisfiesSemverSync = nodeExecPath().satisfiesSemverSync;
        execPath = satisfiesSemverSync('>0.12'); // must be more than node 0.12
        if (!execPath) {
          callback(new Error('get-remote on node versions without https need a version of node >=0.10.0 to call using https'));
          return;
        }
      }

      try {
        const streamInfo = functionExec()({ execPath: execPath, callbacks: true }, streamCompat, [this.endpoint, this.options], options);
        if ((options as StreamOption).method === 'HEAD') {
          streamInfo.resume = () => {};
          callback(null, streamInfo);
        } else {
          const res = fs.createReadStream(streamInfo.filename) as StreamResponse;
          res.headers = streamInfo.headers;
          res.statusCode = streamInfo.statusCode;
          eos(res, () => {
            rimraf2.sync(streamInfo.filename, { disableGlob: true }); // clean up
          });
          wrapResponse(res, this, options, callback);
        }
      } catch (err) {
        callback(err);
      }
      return;
    }

    const parsed = url.parse(this.endpoint);
    const secure = parsed.protocol === 'https:';
    const requestOptions = Object.assign({ host: parsed.host, path: parsed.path, port: secure ? 443 : 80, method: 'GET' }, options);
    const req = secure ? https.request(requestOptions) : http.request(requestOptions);
    req.on('response', (res) => {
      // Follow 3xx redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume(); // Discard response

        return new Response(res.headers.location, options).stream(callback);
      }

      // Not successful
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume(); // Discard response
        return callback(new Error(`Response code ${res.statusCode} (${http.STATUS_CODES[res.statusCode]})`));
      }
      wrapResponse(res, this, options, callback);
    });
    req.on('error', callback);
    req.end();
    return;
  }

  return new Promise((resolve, reject) => {
    this.stream(options, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
}

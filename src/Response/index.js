const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const eos = require('end-of-stream');
const rimraf = require('rimraf');
const wrapResponse = require('../utils/wrapResponse');

// node 0.8 does not support https
const major = +process.versions.node.split('.')[0];
const minor = +process.versions.node.split('.')[1];
const noHTTPS = major === 0 && minor <= 8;

const streamCompat = path.resolve(__dirname, '..', 'utils', 'streamCompat.js');
let execPath = null;

function Response(endpoint, options) {
  this.endpoint = endpoint;
  this.options = options || {};
}

let functionExec = null; // break dependencies
Response.prototype.stream = function stream(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  if (typeof callback === 'function') {
    options = Object.assign({}, this.options, options || {});

    // node <=0.8 does not support https
    if (noHTTPS) {
      if (!functionExec) functionExec = require('function-exec-sync'); // break dependencies
      if (!execPath) {
        const satisfiesSemverSync = require('node-exec-path').satisfiesSemverSync;
        execPath = satisfiesSemverSync('>=0.10.0'); // must be more than node 0.8
        if (!execPath) return callback(new Error('get-remote on node versions without https need a version of node >=0.10.0 to call using https'));
      }

      try {
        const streamInfo = functionExec({ execPath: execPath, callbacks: true }, streamCompat, [this.endpoint, this.options], options);
        if (options.method === 'HEAD') {
          streamInfo.resume = () => {};
          callback(null, streamInfo);
        } else {
          const res = fs.createReadStream(streamInfo.filename);
          res.headers = streamInfo.headers;
          res.statusCode = streamInfo.statusCode;
          eos(res, () => {
            rimraf.sync(streamInfo.filename); // clean up
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
};

Response.prototype.extract = require('./extract');
Response.prototype.file = require('./file');
Response.prototype.head = require('./head');
Response.prototype.json = require('./json');
Response.prototype.pipe = require('./pipe');
Response.prototype.text = require('./text');

module.exports = Response;

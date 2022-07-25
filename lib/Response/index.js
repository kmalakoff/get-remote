var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var path = require('path');
var assign = require('just-extend');
var eos = require('end-of-stream');
var wrapResponse = require('../utils/wrapResponse');

// node 0.8 does not support https
var major = +process.versions.node.split('.')[0];
var minor = +process.versions.node.split('.')[1];
var call = null; // break dependencies
const rimraf = require('rimraf');
var streamCompat = path.dirname(__dirname) + '/utils/streamCompat.js';

function Response(endpoint, options) {
  this.endpoint = endpoint;
  this.options = options || {};
}

Response.prototype.stream = function stream(options, callback) {
  if (!call) call = require('node-version-call'); // break dependencies

  if (typeof options === 'function') {
    callback = options;
    options = null;
  }

  var self = this;
  if (typeof callback === 'function') {
    options = assign({}, this.options, options || {});

    // node 0.8 does not support https
    if (major === 0 && minor <= 8) {
      try {
        var streamInfo = call({ version: 'lts', callbacks: true }, streamCompat, [self.endpoint, self.options], options);
        if (options.method === 'HEAD') {
          streamInfo.resume = function () {};
          callback(null, streamInfo);
        } else {
          var res = fs.createReadStream(streamInfo.filename);
          res.headers = streamInfo.headers;
          res.statusCode = streamInfo.statusCode;
          eos(res, function () {
            rimraf.sync(streamInfo.filename); // clean up
          });
          wrapResponse(res, self, options, callback);
        }
      } catch (err) {
        callback(err);
      }
      return;
    }

    var parsed = url.parse(this.endpoint); // eslint-disable-line n/no-deprecated-api
    var secure = parsed.protocol === 'https:';
    var requestOptions = assign({ host: parsed.host, path: parsed.path, port: secure ? 443 : 80, method: 'GET' }, options);
    var req = secure ? https.request(requestOptions) : http.request(requestOptions);
    req.on('response', function (res) {
      // Follow 3xx redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume(); // Discard response
        return new Response(res.headers.location, options).stream(callback);
      }

      // Not successful
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume(); // Discard response
        return callback(new Error('Response code ' + res.statusCode + ' (' + http.STATUS_CODES[res.statusCode] + ')'));
      }

      wrapResponse(res, self, options, callback);
    });
    req.on('error', callback);
    req.end();
    return;
  }

  return new Promise(function (resolve, reject) {
    self.stream(options, function (err, res) {
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

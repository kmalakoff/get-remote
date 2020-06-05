var path = require('path');
var http = require('http');
var https = require('https');
var once = require('once');
var url = require('url');
var progressStream = require('progress-stream');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');

var inferFilename = require('./inferFilename');

function Response(endpoint, options) {
  if (this === global) return new Response(endpoint, options);
  this.endpoint = endpoint;
  this.options = options;
}

Response.prototype.stream = function (callback) {
  var self = this;
  if (typeof callback !== 'function') {
    return new Promise(function (resolve, reject) {
      self.stream(function (err, res) {
        err ? reject(err) : resolve(res);
      });
    });
  }

  // eslint-disable-next-line node/no-deprecated-api
  var parsed = url.parse(this.endpoint);
  var req =
    parsed.protocol === 'https:'
      ? https.request({ host: parsed.host, path: parsed.path, port: 443, method: 'GET', highWaterMark: this.options.highWaterMark })
      : http.request({ host: parsed.host, path: parsed.path, port: 80, method: 'GET', highWaterMark: this.options.highWaterMark });
  req.on('response', function (res) {
    if (res.statusCode >= 200 && res.statusCode < 300) return callback(null, res);

    // Follow 3xx redirects
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume(); // Discard response
      return new Response(res.headers.location, self.options).stream(callback);
    }

    // Not successful
    res.resume(); // Discard response
    return callback(new Error('Response code ' + res.statusCode + ' (' + http.STATUS_CODES[res.statusCode] + ')'));
  });
  req.on('error', callback);
  req.end();
};

Response.prototype.writeFile = function (dest, callback) {
  if (typeof callback !== 'function') {
    var self = this;
    return new Promise(function (resolve, reject) {
      self.writeFile(dest, function (err, res) {
        err ? reject(err) : resolve(res);
      });
    });
  }

  var endpoint = this.endpoint;
  var options = this.options;
  this.stream(function (err, res) {
    if (err) return callback(err);

    var filename = inferFilename(endpoint, options, res);
    var entry = {
      basename: filename,
      fullPath: path.join(dest, filename),
    };

    // add progress update
    if (options.progress) {
      var progress = progressStream({
        length: res.headers['content-length'] || 0,
        time: options.time,
      });
      progress.on('progress', function (update) {
        update.basename = entry.basename;
        update.fullPath = entry.fullPath;
        update.progress = 'download';
        options.progress(update);
      });
      res = res.pipe(progress);
    }

    // write to file
    callback = once(callback);
    res = res.pipe(fsWriteStreamAtomic(entry.fullPath));
    res.on('error', callback);
    res.on('close', function () {
      callback(null, filename);
    });
  });
};

module.exports = Response;

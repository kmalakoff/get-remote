var path = require('path');
var http = require('http');
var https = require('https');
var once = require('once');
var url = require('url');
var progressStream = require('progress-stream');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');

var inferBasename = require('./inferBasename');

function Response(endpoint, options) {
  if (this === global) return new Response(endpoint, options);
  this.endpoint = endpoint;
  this.options = options || {};
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
  var options = this.options;
  var req =
    parsed.protocol === 'https:'
      ? https.request({ host: parsed.host, path: parsed.path, port: 443, method: 'GET', highWaterMark: options.highWaterMark })
      : http.request({ host: parsed.host, path: parsed.path, port: 80, method: 'GET', highWaterMark: options.highWaterMark });
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
    var basename = inferBasename(self.endpoint, options, res);

    // add progress
    if (options.progress) {
      var progress = progressStream({
        length: res.headers['content-length'] || 0,
        time: options.time,
      });
      progress.on('progress', function (update) {
        update.basename = basename;
        update.progress = 'download';
        options.progress(update);
      });
      res = res.pipe(progress);
    }

    res.basename = basename;
    return callback(null, res);
  });
  req.on('error', callback);
  req.end();
};

Response.prototype.pipe = function (dest, callback) {
  var self = this;
  if (typeof callback !== 'function') {
    return new Promise(function (resolve, reject) {
      self.pipe(dest, function (err, res) {
        err ? reject(err) : resolve(res);
      });
    });
  }

  this.stream(function (err, res) {
    if (err) return callback(err);

    // pipe
    callback = once(callback);
    res = res.pipe(dest);
    res.on('error', callback);
    res.on('close', function () {
      callback();
    });
  });
};

Response.prototype.file = function (dest, callback) {
  var self = this;
  if (typeof callback !== 'function') {
    return new Promise(function (resolve, reject) {
      self.file(dest, function (err, res) {
        err ? reject(err) : resolve(res);
      });
    });
  }

  this.stream(function (err, res) {
    if (err) return callback(err);

    var basename = inferBasename(self.endpoint, self.options, res);
    var fullPath = path.join(dest, basename);

    // write to file
    callback = once(callback);
    res = res.pipe(fsWriteStreamAtomic(fullPath));
    res.on('error', callback);
    res.on('close', function () {
      callback(null, basename);
    });
  });
};

module.exports = Response;

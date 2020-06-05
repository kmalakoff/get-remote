var path = require('path');
var fs = require('fs');
var http = require('http');
var https = require('https');
var once = require('once');
var url = require('url');
var progressStream = require('progress-stream');
var assign = require('object-assign');
var fastExtract = require('./optionalRequire')('fast-extract');

var inferBasename = require('./inferBasename');
var completeExtname = require('./completeExtname');

function Response(endpoint, options) {
  if (this === global) return new Response(endpoint, options);
  this.endpoint = endpoint;
  this.options = options || {};
}

Response.prototype.stream = function stream(callback) {
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

Response.prototype.head = function head(callback) {
  var self = this;
  if (typeof callback !== 'function') {
    return new Promise(function (resolve, reject) {
      self.head(function (err, res) {
        err ? reject(err) : resolve(res);
      });
    });
  }

  this.stream(function (err, res) {
    if (err) return callback(err);

    res.resume(); // Discard response
    callback(null, { statusCode: res.statusCode, headers: res.headers });
  });
};

Response.prototype.text = function text(callback) {
  var self = this;
  if (typeof callback !== 'function') {
    return new Promise(function (resolve, reject) {
      self.text(function (err, res) {
        err ? reject(err) : resolve(res);
      });
    });
  }

  this.stream(function (err, res) {
    if (err) return callback(err);

    // extract text
    callback = once(callback);
    var result = '';
    res.on('data', function (chunk) {
      result += chunk.toString();
    });
    res.on('error', callback);
    res.on('close', function () {
      callback(null, { statusCode: res.statusCode, headers: res.headers, body: result });
    });
  });
};

Response.prototype.json = function json(callback) {
  var self = this;
  if (typeof callback !== 'function') {
    return new Promise(function (resolve, reject) {
      self.head(function (err, res) {
        err ? reject(err) : resolve(res);
      });
    });
  }

  this.text(function (err, res) {
    if (err) return callback(err);

    try {
      res.body = JSON.parse(res.body);
    } catch (err) {
      return callback(err);
    }
    callback(null, res);
  });
};

Response.prototype.file = function file(dest, callback) {
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
    res = res.pipe(fs.createWriteStream(fullPath));
    res.on('error', callback);
    res.on('close', function () {
      callback(null, basename);
    });
  });
};

Response.prototype.pipe = function pipe(dest, callback) {
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

Response.prototype.extract = function extract(dest, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};
  if (!fastExtract) {
    console.log('Warning fast-extract not found so compressed file downloaded only without extraction. Require fast-extract for built-in extraction');
    return this.file(dest, callback);
  }

  var self = this;
  if (typeof callback !== 'function') {
    return new Promise(function (resolve, reject) {
      self.extract(dest, options, function (err, res) {
        err ? reject(err) : resolve(res);
      });
    });
  }

  this.stream(function (err, res) {
    if (err) return callback(err);

    var extension = completeExtname(res.basename, options);
    if (!extension) return callback(new Error('Cannot determine extract type for ' + res.basename));
    fastExtract(res, dest, assign({}, options, { extension: extension, highWaterMark: self.options.highWaterMark }), callback);
  });
};

module.exports = Response;

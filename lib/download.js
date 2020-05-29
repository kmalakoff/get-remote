var path = require('path');
var http = require('http');
var https = require('https');
var once = require('once');
var url = require('url');
var assign = require('object-assign');
var fastExtract = require('fast-extract');
var progressStream = require('progress-stream');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');

var inferFilename = require('./inferFilename');
var completeExtname = require('./completeExtname');

module.exports = function download(src, dest, options, callback) {
  callback = once(callback);

  // eslint-disable-next-line node/no-deprecated-api
  var parsed = url.parse(src);
  var req =
    parsed.protocol === 'https:'
      ? https.request({ host: parsed.host, path: parsed.path, port: 443, method: 'GET', highWaterMark: options.highWaterMark })
      : http.request({ host: parsed.host, path: parsed.path, port: 80, method: 'GET', highWaterMark: options.highWaterMark });

  req.on('response', function (res) {
    // Follow 3xx redirects
    if (res.statusCode >= 300 && res.statusCode < 400 && 'location' in res.headers) {
      src = res.headers.location;
      res.resume(); // Discard response
      return download(src, dest, options, callback);
    }
    // Only download if successful
    else if (res.statusCode !== 200) {
      res.resume(); // Discard response
      return callback(new Error('Response code ' + res.statusCode + ' (' + http.STATUS_CODES[res.statusCode] + ')'));
    }
    if (!dest) return callback(null, res);

    var filename = inferFilename(src, options, res);
    var entry = {
      basename: filename,
      fullPath: path.join(dest, filename),
    };
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
    if (options.extract) {
      var extension = completeExtname(filename, options);
      if (!extension) return callback(new Error('Cannot determine extract type for ' + filename));
      fastExtract(res, dest, assign({}, options, { filename: filename, extension: extension, highWaterMark: options.highWaterMark }), callback);
    } else {
      res = res.pipe(fsWriteStreamAtomic(entry.fullPath));
      res.on('error', callback);
      res.on('close', function () {
        callback(null, filename);
      });
    }
  });
  req.on('error', callback);
  req.end();
};

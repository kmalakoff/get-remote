var path = require('path');
var http = require('http');
var https = require('https');
var once = require('once');
var url = require('url');
var isArray = require('isarray');
var contentDisposition = require('content-disposition');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');

var filenameRegex = require('./filenameRegex');

module.exports = function download(src, dest, options, callback) {
  callback = once(callback);

  // eslint-disable-next-line node/no-deprecated-api
  var parsed = url.parse(src);
  var req =
    parsed.protocol === 'https:'
      ? https.request({ host: parsed.host, path: parsed.path, port: 443, method: 'GET' })
      : http.request({ host: parsed.host, path: parsed.path, port: 80, method: 'GET' });

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

    if (options.progress) {
      var progress = typeof options.progress === 'function' ? options.progress(res, src) : options.progress;
      if (progress) res = res.pipe(progress);
    }

    if (!dest) return callback(null, res);
    else if (typeof dest === 'string') {
      var filename = options.filename;
      if (!filename && res.headers && res.headers['content-disposition']) {
        var information = contentDisposition.parse(res.headers['content-disposition']);
        filename = information.parameters.filename;
      }
      if (!filename) {
        filename = path.basename(src.split('?')[0]);
        filename = filename.replace(filenameRegex.posix, '!');
        filename = filename.replace(filenameRegex.windows, '!');
      }
      res = res.pipe(fsWriteStreamAtomic(path.join(dest, filename)));
    } else if (!isArray(dest)) res = res.pipe(dest);
    else {
      for (var index = 0; index < dest.length; index++) res = res.pipe(dest[index]);
    }

    res.on('error', callback).on('close', callback.bind(null, null));
  });
  req.on('error', function (err) {
    console.log(err.message);
    callback(err);
  });
  req.end();
};

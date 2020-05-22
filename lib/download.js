var path = require('path');
var http = require('http');
var https = require('https');
var once = require('once');
var url = require('url');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');

var inferFilename = require('./inferFilename');
var inferExtractors = require('./inferExtractors');

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

    // caller will process the stream
    if (!dest) return callback(null, res);

    // infer and add extractors
    var filename = inferFilename(src, options, res);
    if (options.extract) {
      var extractors = inferExtractors(filename, dest, options, res);
      if (!extractors) return callback(new Error('Cannot infer extractor for ' + src));
      if (extractors.length) {
        for (var index = 0; index < extractors.length; index++) res = res.pipe(extractors[index]);
      } else res = res.pipe(fsWriteStreamAtomic(path.join(dest, filename)));
    } else res = res.pipe(fsWriteStreamAtomic(path.join(dest, filename)));
    res.on('error', callback);
    res.on('close', function () {
      callback(null, filename);
    });
  });
  req.on('error', callback);
  req.end();
};

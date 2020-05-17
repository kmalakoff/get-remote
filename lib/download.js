var mkdirp = require('mkdirp');
var path = require('path');
var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var callOnce = require('call-once-fn');

var errorCleanFn = require('./errorCleanFn');

module.exports = function download(src, dest, options, callback) {
  mkdirp(path.dirname(dest), function (err) {
    if (err) return callback(err);

    errorCleanFn(dest, function (callback) {
      callback = callOnce(callback);

      // eslint-disable-next-line node/no-deprecated-api
      var parsed = url.parse(src);
      var req =
        parsed.protocol === 'https:'
          ? https.request({ host: parsed.host, path: parsed.path, port: 443 })
          : http.request({ host: parsed.host, path: parsed.path, port: 80 });

      req.on('response', function (res) {
        // Follow 3xx redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && 'location' in res.headers) {
          src = res.headers.location;
          res.resume(); // Discard response
          return download(src, dest, options, callback);
        }

        if (options.progress) {
          var progress = typeof options.progress === 'function' ? options.progress(res) : options.progress;
          res = res.pipe(progress);
        }
        res
          .pipe(fs.createWriteStream(dest))
          .on('error', callback)
          .on('close', function () {
            callback();
          });
      });
      req.on('error', callback);
      req.end();
    })(callback);
  });
};

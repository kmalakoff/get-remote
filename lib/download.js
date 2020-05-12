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
        res
          .pipe(fs.createWriteStream(dest))
          .on('error', callback)
          .on('close', function () {
            callback();
          });
      });
      req.end();
    })(callback);
  });
};

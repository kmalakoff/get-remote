var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var callOnce = require('call-once-fn');

var errorCleanFn = require('./errorCleanFn');
var decompressResponse = require('./decompressResponse');

module.exports = function download(src, dest, options, callback) {
  errorCleanFn(dest, function (callback) {
    callback = callOnce(callback);

    // eslint-disable-next-line node/no-deprecated-api
    var parsed = url.parse(src);
    parsed.headers = { 'Accept-Encoding': 'br,gzip,deflate' };
    var req =
      parsed.protocol === 'https:'
        ? https.request({ host: parsed.host, path: parsed.path, port: 443, headers: parsed.headers })
        : http.request({ host: parsed.host, path: parsed.path, port: 80, headers: parsed.headers });

    req.on('response', function (res) {
      decompressResponse(res)
        .pipe(fs.createWriteStream(dest))
        .on('error', callback)
        .on('close', function () {
          callback();
        });
    });
    req.end();
  })(callback);
};

var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var crypto = require('crypto');

var download = require('./download');
var decompress = require('./decompress');

var TMP_DIR = path.join(require('osenv').home(), '.tmp');

module.exports = function both(src, dest, options, callback) {
  mkdirp(TMP_DIR, function (err) {
    if (err) return callback(err);

    var tmpBasename = crypto
      .createHash('md5')
      .update(src)
      .update('' + new Date().valueOf())
      .digest('hex')
      .slice(0, 16);
    var tmpPath = path.join(TMP_DIR, tmpBasename);
    download(src, tmpPath, options, function (err) {
      if (err) return callback(err);

      decompress(tmpPath, dest, options, function (err) {
        fs.unlink(tmpPath, callback.bind(null, err));
      });
    });
  });
};

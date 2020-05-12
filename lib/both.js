var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var uuid = require('uuid');

var download = require('./download');
var decompress = require('./decompress');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '.tmp'));

module.exports = function both(src, dest, options, callback) {
  mkdirp(TMP_DIR, function (err) {
    if (err) return callback(err);

    var tempFile = path.join(TMP_DIR, uuid.v4());
    download(src, tempFile, options, function (err) {
      if (err) return callback(err);

      decompress(tempFile, dest, options, function (err) {
        fs.unlink(tempFile, callback.bind(null, err));
      });
    });
  });
};

var path = require('path');
var fs = require('fs');
var uuid = require('uuid');

var download = require('./download');
var decompress = require('./decompress');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '.tmp'));

module.exports = function both(src, dest, options, callback) {
  fs.mkdir(TMP_DIR, function (err) {
    err = null;
    var tempFile = path.join(TMP_DIR, uuid.v4());

    download(src, tempFile, options, function (err) {
      if (err) return callback(err);

      decompress(tempFile, dest, options, function (err) {
        fs.unlink(tempFile, callback.bind(null, err));
      });
    });
  });
};

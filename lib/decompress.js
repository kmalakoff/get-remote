var fs = require('fs');

var errorCleanFn = require('./errorCleanFn');

var decompress = null;
function lazyDecompress() {
  if (!decompress) decompress = require('decompress');
  return decompress;
}

module.exports = function dest(src, dest, options, callback) {
  errorCleanFn(dest, function (callback) {
    fs.readFile(src, function (err, contents) {
      if (err) return callback(err);

      lazyDecompress()(contents, dest, options)
        .then(function () {
          callback();
        })
        .catch(callback);
    });
  })(callback);
};

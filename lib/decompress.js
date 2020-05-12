const fs = require('fs');
const decompress = require('decompress');

var errorCleanFn = require('./errorCleanFn');

module.exports = function dest(src, dest, options, callback) {
  errorCleanFn(dest, function (callback) {
    fs.readFile(src, function (err, contents) {
      if (err) return callback(err);

      decompress(contents, dest, options)
        .then(function () {
          callback();
        })
        .catch(callback);
    });
  })(callback);
};

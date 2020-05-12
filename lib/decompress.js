const fs = require('fs');
const decompress = require('decompress');

var errorCleanFn = require('./errorCleanFn');

module.exports = function dest(src, dest, options, callback) {
  errorCleanFn(dest, function (callback) {
    fs.readFile(src, function (err, contents) {
      if (err) return callback(err);

      decompress(contents, dest, { strip: 1 })
        .then(function () {
          callback();
        })
        .catch(callback);
    });
  })(callback);
};

// var DecompressZip = require('decompress-zip');
// var callOnce = require('call-once-fn');

// var errorCleanFn = require('./errorCleanFn');

// module.exports = function dest(src, dest, options, callback) {
//   errorCleanFn(dest, function (callback) {
//     callback = callOnce(callback);
//     var unzipper = new DecompressZip(src);
//     unzipper.on('error', callback);
//     unzipper.on('extract', callback.bind(null, null));
//     unzipper.extract({ path: dest });
//   })(callback);
// };

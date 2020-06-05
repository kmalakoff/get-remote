var assign = require('object-assign');
var fastExtract = require('../optionalRequire')('fast-extract');

var completeExtname = require('../completeExtname');

module.exports = function extract(dest, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};
  if (!fastExtract) {
    console.log('Warning fast-extract not found so compressed file downloaded only without extraction. Require fast-extract for built-in extraction');
    return this.file(dest, callback);
  }

  var self = this;
  if (typeof callback !== 'function') {
    return new Promise(function (resolve, reject) {
      self.extract(dest, options, function (err, res) {
        err ? reject(err) : resolve(res);
      });
    });
  }

  this.stream(function (err, res) {
    if (err) return callback(err);

    var extension = completeExtname(res.basename, options);
    if (!extension) return callback(new Error('Cannot determine extract type for ' + res.basename));
    fastExtract(res, dest, assign({}, options, { extension: extension, highWaterMark: self.options.highWaterMark }), callback);
  });
};

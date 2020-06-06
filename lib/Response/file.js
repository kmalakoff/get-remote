var path = require('path');
var fs = require('fs');
var assign = require('object-assign');
var eos = require('end-of-stream');

var inferBasename = require('../inferBasename');

module.exports = function file(dest, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }

  var self = this;
  if (typeof callback === 'function') {
    options = assign({}, this.options, options || {});
    return this.stream(options, function (err, res) {
      if (err) return callback(err);

      var basename = inferBasename(self.endpoint, options, res);
      var fullPath = path.join(dest, basename);

      // write to file
      res = res.pipe(fs.createWriteStream(fullPath));
      eos(res, function (err) {
        err ? callback(err) : callback(null, basename);
      });
    });
  }

  return new Promise(function (resolve, reject) {
    self.file(dest, options, function (err, res) {
      err ? reject(err) : resolve(res);
    });
  });
};

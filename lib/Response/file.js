var path = require('path');
var fs = require('fs');
var eos = require('end-of-stream');

var inferBasename = require('../inferBasename');

module.exports = function file(dest, callback) {
  var self = this;
  if (typeof callback !== 'function') {
    return new Promise(function (resolve, reject) {
      self.file(dest, function (err, res) {
        err ? reject(err) : resolve(res);
      });
    });
  }

  this.stream(function (err, res) {
    if (err) return callback(err);

    var basename = inferBasename(self.endpoint, self.options, res);
    var fullPath = path.join(dest, basename);

    // write to file
    res = res.pipe(fs.createWriteStream(fullPath));
    eos(res, function (err) {
      err ? callback(err) : callback(null, basename);
    });
  });
};

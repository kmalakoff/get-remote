const path = require('path');
const fs = require('fs');
const eos = require('end-of-stream');
const mkpath = require('mkpath');

const statsBasename = require('../sourceStats/basename');
const pump = require('../utils/pump');

module.exports = function file(dest, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  if (typeof callback === 'function') {
    options = Object.assign({}, this.options, options || {});
    return this.stream(options, (err, res) => {
      if (err) return callback(err);

      const basename = statsBasename(options, res, this.endpoint);
      const fullPath = basename === undefined ? dest : path.join(dest, basename);

      mkpath(path.dirname(fullPath), (err) => {
        if (err) return callback(err);

        // write to file
        res = pump(res, fs.createWriteStream(fullPath));
        eos(res, (err) => {
          err ? callback(err) : callback(null, fullPath);
        });
      });
    });
  }

  return new Promise((resolve, reject) => {
    this.file(dest, options, (err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
};

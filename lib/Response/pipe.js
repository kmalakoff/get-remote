var eos = require('end-of-stream');

module.exports = function pipe(dest, callback) {
  var self = this;
  if (typeof callback !== 'function') {
    return new Promise(function (resolve, reject) {
      self.pipe(dest, function (err, res) {
        err ? reject(err) : resolve(res);
      });
    });
  }

  this.stream(function (err, res) {
    if (err) return callback(err);

    // pipe
    res = res.pipe(dest);
    eos(res, callback);
  });
};

var eos = require('end-of-stream');

module.exports = function pipe(dest, callback) {
  if (typeof callback === 'function') {
    return this.stream(function (err, res) {
      if (err) return callback(err);

      // pipe
      res = res.pipe(dest);
      eos(res, callback);
    });
  }

  var self = this;
  return new Promise(function (resolve, reject) {
    self.pipe(dest, function (err, res) {
      err ? reject(err) : resolve(res);
    });
  });
};

var assign = require('object-assign');

module.exports = function head(callback) {
  var self = this;
  if (typeof callback !== 'function') {
    return new Promise(function (resolve, reject) {
      self.head(function (err, res) {
        err ? reject(err) : resolve(res);
      });
    });
  }

  var options = assign({}, this.options, { method: 'HEAD' });
  this.stream(options, function (err, res) {
    if (err) return callback(err);

    res.resume(); // Discard response
    callback(null, { statusCode: res.statusCode, headers: res.headers });
  });
};

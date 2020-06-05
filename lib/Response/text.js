var eos = require('end-of-stream');

module.exports = function text(callback) {
  var self = this;
  if (typeof callback !== 'function') {
    return new Promise(function (resolve, reject) {
      self.text(function (err, res) {
        err ? reject(err) : resolve(res);
      });
    });
  }

  this.stream(function (err, res) {
    if (err) return callback(err);

    // extract text
    var result = '';
    res.on('data', function (chunk) {
      result += chunk.toString();
    });
    eos(res, function (err) {
      err ? callback(err) : callback(null, { statusCode: res.statusCode, headers: res.headers, body: result });
    });
  });
};

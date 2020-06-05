module.exports = function json(callback) {
  var self = this;
  if (typeof callback !== 'function') {
    return new Promise(function (resolve, reject) {
      self.head(function (err, res) {
        err ? reject(err) : resolve(res);
      });
    });
  }

  this.text(function (err, res) {
    if (err) return callback(err);

    try {
      res.body = JSON.parse(res.body);
    } catch (err) {
      return callback(err);
    }
    callback(null, res);
  });
};

module.exports = function json(callback) {
  if (typeof callback === 'function') {
    return this.text(function (err, res) {
      if (err) return callback(err);

      try {
        res.body = JSON.parse(res.body);
      } catch (err) {
        return callback(err);
      }
      callback(null, res);
    });
  }

  var self = this;
  return new Promise(function (resolve, reject) {
    self.json(function (err, res) {
      err ? reject(err) : resolve(res);
    });
  });
};

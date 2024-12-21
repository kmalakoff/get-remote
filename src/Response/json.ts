export default function json(callback) {
  if (typeof callback === 'function') {
    return this.text((err, res) => {
      if (err) return callback(err);

      try {
        res.body = JSON.parse(res.body);
        return callback(null, res);
      } catch (err) {
        return callback(err);
      }
    });
  }
  return new Promise((resolve, reject) => {
    this.json((err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
}

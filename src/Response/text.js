const eos = require('end-of-stream');

module.exports = function text(callback) {
  if (typeof callback === 'function') {
    return this.stream((err, res) => {
      if (err) return callback(err);

      // collect text
      let result = '';
      res.on('data', (chunk) => {
        result += chunk.toString();
      });
      eos(res, (err) => {
        err ? callback(err) : callback(null, { statusCode: res.statusCode, headers: res.headers, body: result });
      });
    });
  }
  return new Promise((resolve, reject) => {
    this.text((err, res) => {
      err ? reject(err) : resolve(res);
    });
  });
};

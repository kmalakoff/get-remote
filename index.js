var download = require('./lib/download');

function getRemote(src, dest, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};
  if (typeof callback === 'function') return download(src, dest, options, callback);
  return new Promise(function (resolve, reject) {
    getRemote(src, dest, options, function (err, res) {
      err ? reject(err) : resolve(res);
    });
  });
}

module.exports = getRemote;

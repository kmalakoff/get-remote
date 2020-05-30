var download = require('./lib/download');

function getRemote(endpoint, dest, options, callback) {
  if (arguments.length === 2 && typeof dest !== 'string') {
    callback = options;
    options = dest;
    dest = null;
  }

  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};
  if (typeof callback === 'function') return download(endpoint, dest, options, callback);
  return new Promise(function (resolve, reject) {
    getRemote(endpoint, dest, options, function (err, res) {
      err ? reject(err) : resolve(res);
    });
  });
}

module.exports = getRemote;

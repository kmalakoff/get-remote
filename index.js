var isArray = require('isarray');
var download = require('./lib/download');

function getRemote(src, dest, options, callback) {
  if (arguments.length === 2 && typeof dest !== 'string' && !isArray(dest)) {
    callback = options;
    options = dest;
    dest = null;
  }

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

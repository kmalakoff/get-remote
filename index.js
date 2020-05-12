var both = require('./lib/both');
var downloadOnly = require('./lib/download');

function download(src, dest, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};
  if (typeof callback === 'function') {
    return options.extract ? both(src, dest, options, callback) : downloadOnly(src, dest, options, callback);
  }
  return new Promise(function (resolve, reject) {
    download(src, dest, options, callback, function downloadCallback(err, res) {
      err ? reject(err) : resolve(res);
    });
  });
}

module.exports = download;

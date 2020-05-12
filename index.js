var both = require('./lib/both');

module.exports = function downloadDecompress(src, dest, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  both(src, dest, options || {}, callback);
};

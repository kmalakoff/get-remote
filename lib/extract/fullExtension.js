var extname = require('path-complete-extname');

module.exports = function fullExtension(filename, options) {
  var extension = typeof options.extract === 'string' ? extname('_' + options.extract) : null;
  if (!extension) extension = extname(filename);
  return extension;
};

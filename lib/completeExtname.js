var path = require('path');

module.exports = function completeExtname(fullPath, options) {
  if (options.extension) return options.extension;
  var basename = path.basename(fullPath);
  var index = basename.indexOf('.');
  var extension = ~index ? basename.slice(index) : null;
  if (!extension && typeof options.extract === 'string') extension = options.extract;
  return extension;
};

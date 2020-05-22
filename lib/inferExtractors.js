var path = require('path');
var unzip = require('node-unzip-2');
var fstream = require('fstream');

module.exports = function inferExtractors(filename, dest, options) {
  var extension = null;
  if (typeof options.extract === 'string') extension = options.extract;
  if (!extension) extension = path.extname(filename);
  if (!extension) return null;

  switch (extension) {
    case '.zip':
      return [unzip.Parse(), fstream.Writer(dest)];
    default:
      return [];
  }
};

var assign = require('object-assign');
var fastExtract = require('fast-extract');

var inferFilename = require('./inferFilename');
var completeExtname = require('./completeExtname');

module.exports = function extract(src, dest, options, res, callback) {
  var filename = inferFilename(src, options, res);
  var extension = completeExtname(filename);
  if (!extension) return callback(new Error('Cannot determine extract type for ' + src));
  fastExtract(res, dest, assign({}, options, { filename: filename, extension: extension }), callback);
};

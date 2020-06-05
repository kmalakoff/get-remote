// var assign = require('object-assign');
// var fastExtract = require('fast-extract');

// var completeExtname = require('./lib/completeExtname');
// var inferBasename = require('./lib/inferBasename');
// options = options || {};
// var response =
// if (!dest) return response.stream(callback);
// if (!options.extract) return response.file(dest, callback);

// // extract
// response.stream(function (err, res) {
//   if (err) return callback(err);
//   var filename = inferBasename(endpoint, options, res);
//   var extension = completeExtname(filename, options);
//   if (!extension) return callback(new Error('Cannot determine extract type for ' + filename));
//   fastExtract(res, dest, assign({}, options, { filename: filename, extension: extension, highWaterMark: options.highWaterMark }), callback);
// });

var Response = require('./lib/Response');

module.exports = function getRemote(endpoint, options) {
  return new Response(endpoint, options);
};

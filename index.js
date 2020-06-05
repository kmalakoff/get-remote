var assign = require('object-assign');
var fastExtract = require('fast-extract');

var completeExtname = require('./lib/completeExtname');
var inferFilename = require('./lib/inferFilename');
var Response = require('./lib/Response');

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
  if (typeof callback !== 'function') {
    return new Promise(function (resolve, reject) {
      getRemote(endpoint, dest, options, function (err, res) {
        err ? reject(err) : resolve(res);
      });
    });
  }

  options = options || {};
  var response = new Response(endpoint, options);
  if (!dest) return response.stream(callback);
  if (!options.extract) return response.writeFile(dest, callback);

  // extract
  response.stream(function (err, res) {
    if (err) return callback(err);
    var filename = inferFilename(endpoint, options, res);
    var extension = completeExtname(filename, options);
    if (!extension) return callback(new Error('Cannot determine extract type for ' + filename));
    fastExtract(res, dest, assign({}, options, { filename: filename, extension: extension, highWaterMark: options.highWaterMark }), callback);
  });
}

module.exports = getRemote;

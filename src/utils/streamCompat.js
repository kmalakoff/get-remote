const fs = require('fs');
const path = require('path');
const tmpdir = require('os').tmpdir || require('os-shim').tmpdir;
const suffix = require('temp-suffix');
const mkdirp = require('mkdirp');

const Response = require('../Response');

module.exports = function streamCompat(args, options, callback) {
  args[1].progress = undefined;

  if (options.method === 'HEAD') {
    new Response(args[0], args[1]).stream(options, (err, res) => {
      if (err) return callback(err);

      res.resume(); // Discard response
      callback(null, { statusCode: res.statusCode, headers: res.headers });
    });
  } else {
    const name = 'get-remote';
    const filename = path.join(tmpdir(), name, suffix('compat'));
    mkdirp.sync(path.dirname(filename));
    const res = fs.createWriteStream(filename);

    new Response(args[0], args[1]).pipe(res, (err) => {
      if (err) return callback(err);

      err ? callback(err) : callback(null, { statusCode: res.statusCode, headers: res.headers, filename: filename });
    });
  }
};

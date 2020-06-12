var http = require('http');
var https = require('https');
var url = require('url');
var assign = require('object-assign');
var progressStream = require('progress-stream');
var PassThrough = require('stream').PassThrough || require('readable-stream').PassThrough;

var pump = require('../pump');
var sourceStats = require('../sourceStats');

function Response(endpoint, options) {
  this.endpoint = endpoint;
  this.options = options || {};
}

Response.prototype.stream = function stream(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }

  var self = this;
  if (typeof callback === 'function') {
    options = assign({}, this.options, options || {});
    var parsed = url.parse(this.endpoint); // eslint-disable-line node/no-deprecated-api
    var secure = parsed.protocol === 'https:';
    var requestOptions = assign({ host: parsed.host, path: parsed.path, port: secure ? 443 : 80, method: 'GET' }, options);
    var req = secure ? https.request(requestOptions) : http.request(requestOptions);
    req.on('response', function (res) {
      // Follow 3xx redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume(); // Discard response
        return new Response(res.headers.location, options).stream(callback);
      }

      // Not successful
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume(); // Discard response
        return callback(new Error('Response code ' + res.statusCode + ' (' + http.STATUS_CODES[res.statusCode] + ')'));
      }

      // add a puasable PassThrough stream to workaround streams 1 not starting streams paused
      if (!res.unpipe) res = pump(res, new PassThrough());

      sourceStats(res, options, self.endpoint, function (err, stats) {
        if (err) return callback(err);

        // add progress
        if (options.progress) {
          var progress = progressStream(
            {
              length: stats.size || 0,
              time: options.time,
            },
            function (update) {
              options.progress(assign({ progress: 'download' }, update, stats));
            }
          );
          res = pump(res, progress);
        }

        // store stats on the source
        res = assign(res, stats);
        return callback(null, res);
      });
    });
    req.on('error', callback);
    return req.end();
  }

  return new Promise(function (resolve, reject) {
    self.stream(options, function (err, res) {
      err ? reject(err) : resolve(res);
    });
  });
};

Response.prototype.extract = require('./extract');
Response.prototype.file = require('./file');
Response.prototype.head = require('./head');
Response.prototype.json = require('./json');
Response.prototype.pipe = require('./pipe');
Response.prototype.text = require('./text');

module.exports = Response;

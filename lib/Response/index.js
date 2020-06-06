var http = require('http');
var https = require('https');
var url = require('url');
var assign = require('object-assign');
var progressStream = require('progress-stream');

var inferBasename = require('../inferBasename');

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

      var basename = inferBasename(self.endpoint, options, res);

      // add progress
      if (options.progress) {
        var progress = progressStream({
          length: res.headers['content-length'] || 0,
          time: options.time,
        });
        progress.on('progress', function (update) {
          update.basename = basename;
          update.progress = 'download';
          options.progress(update);
        });
        res = res.pipe(progress);
      }

      res.basename = basename;
      return callback(null, res);
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

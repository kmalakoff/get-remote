var path = require('path');
var contentDisposition = require('content-disposition');

// eslint-disable-next-line no-control-regex
var POSIX = /[<>:"\\/\\|?*\x00-\x1F]/g;
var WINDOWS = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;

module.exports = function inferBasename(endpoint, options, res) {
  var basename = options.basename || options.filename;
  if (basename) return basename;

  if (res.headers && res.headers['content-disposition']) {
    var information = contentDisposition.parse(res.headers['content-disposition']);
    return information.parameters.filename;
  }

  // use the source path
  basename = path.basename(endpoint.split('?')[0]);
  basename = basename.replace(POSIX, '!');
  basename = basename.replace(WINDOWS, '!');
  return basename;
};

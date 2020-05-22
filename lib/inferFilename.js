var path = require('path');
var contentDisposition = require('content-disposition');

// eslint-disable-next-line no-control-regex
var POSIX = /[<>:"\\/\\|?*\x00-\x1F]/g;
var WINDOWS = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;

module.exports = function inferFilename(src, options, res) {
  var filename = options.filename;
  if (filename) return filename;

  if (res.headers && res.headers['content-disposition']) {
    var information = contentDisposition.parse(res.headers['content-disposition']);
    return information.parameters.filename;
  }

  // use the source path
  filename = path.basename(src.split('?')[0]);
  filename = filename.replace(POSIX, '!');
  filename = filename.replace(WINDOWS, '!');
  return filename;
};

var path = require('path');
var extname = require('path-complete-extname');
var unzip = require('node-unzip-2');
var tar = require('tar');
var xz = require('xz');
var bz2 = require('unbzip2-stream');
var fstream = require('fstream');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');

module.exports = function inferExtractors(filename, dest, options) {
  var extension = null;
  if (typeof options.extract === 'string') extension = options.extract;
  if (!extension) extension = extname(filename);
  if (!extension) return null;

  switch (extension) {
    case '.zip':
      return [unzip.Parse(), fstream.Writer(dest)];
    case '.tar.xz':
      return [
        new xz.Decompressor(),
        tar.extract({
          // strip: 1,
          cwd: dest,
        }),
      ];
    case '.tar.bz2':
      return [
        bz2(),
        tar.extract({
          // strip: 1,
          cwd: dest,
        }),
      ];

    case '.tar.gz':
    case '.tar':
    case '.tgz':
      return tar.extract({
        // strip: 1,
        cwd: dest,
      });
    default:
      return fsWriteStreamAtomic(path.join(dest, filename));
  }
};

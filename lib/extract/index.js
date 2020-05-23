var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp-classic');
// var PassThrough = require('stream').PassThrough;
var DecompressZip = require('decompress-zip');
var unzip = require('unzip-stream');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');
var crypto = require('crypto');

var fullExtension = require('./fullExtension');
var streamExtractors = require('./streamExtractors');
var inferFilename = require('../inferFilename');

var TMP_DIR = path.resolve(path.join(require('osenv').home(), '.tmp'));

module.exports = function extract(src, dest, options, res, callback) {
  // var tmpBasename = crypto
  //   .createHash('md5')
  //   .update(dest)
  //   .update('' + new Date().valueOf())
  //   .digest('hex')
  //   .slice(0, 16);
  // var tempTarget = path.join(TMP_DIR, tmpBasename);

  var filename = inferFilename(src, options, res);
  var extension = fullExtension(filename, filename);
  if (!extension) return callback(new Error('Cannot determine extract type for ' + src));

  if (extension === '.zip') {
    // mkdirp(path.basename(tempTarget), function () {
    //   res.pipe(fs.createWriteStream(dest));
    //   res.on('error', function (err) {
    //     callback(err);
    //   });
    //   res.on('close', function () {
    //     var zip = new DecompressZip(src);
    //     // zip.on('progress', function (i, numFiles) {});
    //     zip.on('extract', function () {
    //       callback(null, filename);
    //     });
    //     zip.on('error', callback);
    //     zip.extract({ path: dest, strip: options.strip || 0 });
    //   });
    // });

    res = res.pipe(unzip.Extract({ path: dest, strip: options.strip || 0 }));
    res.on('error', callback);
    return res.on('close', function () {
      callback(null, filename);
    });
  } else {
    var extractors = streamExtractors(extension, dest, options, res);
    if (!extractors.length) extractors.push(fsWriteStreamAtomic(path.join(dest, filename)));
    for (var index = 0; index < extractors.length; index++) res = res.pipe(extractors[index]);
    res.on('error', callback);
    res.on('close', function () {
      callback(null, filename);
    });
  }
};

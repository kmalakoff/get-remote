var path = require('path');
// var PassThrough = require('stream').PassThrough;
// var dezip = require('decompress-zip');
var unzip = require('unzip-stream');
var fsWriteStreamAtomic = require('fs-write-stream-atomic');

var fullExtension = require('./fullExtension');
var streamExtractors = require('./streamExtractors');
var inferFilename = require('../inferFilename');

module.exports = function extract(src, dest, options, res, callback) {
  var filename = inferFilename(src, options, res);
  var extension = fullExtension(filename, filename);
  if (!extension) return callback(new Error('Cannot determine extract type for ' + src));

  if (extension === '.zip') {
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
    return res.on('close', function () {
      callback(null, filename);
    });
  }
};

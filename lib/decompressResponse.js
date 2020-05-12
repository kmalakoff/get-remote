var zlib = require('zlib');
var PassThrough = require('stream').PassThrough;

var DECOMPRESSORS = {
  br: zlib.createBrotliDecompress,
  gzip: zlib.createGunzip,
  deflate: zlib.createInflate,
};

module.exports = function decompressResponse(res) {
  var Decompressor = DECOMPRESSORS[res.headers['content-encoding']];
  if (!Decompressor) return res;

  var stream = new PassThrough();
  var decompress = new Decompressor();
  decompress.on('error', function (err) {
    if (err.code === 'Z_BUF_ERROR') return stream.end();
    stream.emit('error', err);
  });
  return decompress.pipe(stream);
};

// var unzip = require('unzip-stream');
var tar = require('tar');
var xz = require('xz');
var bz2 = require('unbzip2-stream');

module.exports = function inferExtractors(extension, dest, options) {
  var parts = extension.split('.').reverse();
  var extractors = [];
  for (var index = 0; index < parts.length; index++) {
    switch (parts[index]) {
      // case 'zip':
      //   // var stream = new PassThrough();
      //   // var decompress = new Decompressor();
      //   // decompress.on('error', function (err) {
      //   //   if (err.code === 'Z_BUF_ERROR') return stream.end();
      //   //   stream.emit('error', err);
      //   // });
      //   // return decompress.pipe(stream);

      //   extractors.push(unzip.Extract({ path: dest, strip: options.strip || 0 }));
      //   break;
      case 'xz':
        extractors.push(new xz.Decompressor());
        break;
      case 'bz2':
        extractors.push(bz2());
        break;
      case 'tar':
      case 'tgz':
        extractors.push(
          tar.extract({
            strip: options.strip || 0,
            cwd: dest,
          })
        );
        break;
    }
  }
  return extractors;
};

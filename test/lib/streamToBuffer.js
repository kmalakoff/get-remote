var once = require('once');

module.exports = function toBuffer(stream, callback) {
  callback = once(callback);

  var bufs = [];
  stream.on('data', function (data) {
    bufs.push(data);
  });
  stream.on('error', callback);
  stream.on('end', function () {
    callback(null, Buffer.concat(bufs));
  });
};

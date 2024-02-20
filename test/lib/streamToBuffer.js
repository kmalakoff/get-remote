const eos = require('end-of-stream');

module.exports = function streamToBuffer(stream, callback) {
  const chunks = [];
  stream.on('data', (chunk) => {
    chunks.push(chunk);
  });
  eos(stream, (err) => {
    err ? callback(err) : callback(null, Buffer.concat(chunks));
  });
};

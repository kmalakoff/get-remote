import eos from 'end-of-stream';

function worker(stream, callback) {
  const chunks = [];
  stream.on('data', (chunk) => {
    chunks.push(chunk);
  });
  eos(stream, (err) => {
    err ? callback(err) : callback(null, Buffer.concat(chunks));
  });
}

export default function streamToBuffer(stream, callback?) {
  if (typeof callback === 'function') return worker(stream, callback);
  return new Promise(function validatePromise(resolve, reject) {
    worker(stream, function validateCallback(err, buffer) {
      err ? reject(err) : resolve(buffer);
    });
  });
}

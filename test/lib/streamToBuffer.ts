import oo from 'on-one';

function worker(stream, callback) {
  const chunks = [];
  stream.on('data', (chunk) => {
    chunks.push(chunk);
  });
  oo(stream, ['error', 'end', 'close', 'finish'], (err) => {
    err ? callback(err) : callback(null, Buffer.concat(chunks));
  });
}

export default function streamToBuffer(stream, callback?) {
  if (typeof callback === 'function') return worker(stream, callback);
  return new Promise((resolve, reject) => worker(stream, (err, buffer) => (err ? reject(err) : resolve(buffer))));
}

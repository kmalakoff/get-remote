import once from 'call-once-fn';

function worker(stream, callback) {
  const chunks = [];
  stream.on('data', (chunk) => {
    chunks.push(chunk);
  });
  const end = once((err) => (err ? callback(err) : callback(null, Buffer.concat(chunks))));
  stream.on('error', end);
  stream.on('end', end);
  stream.on('close', end);
  stream.on('finish', end);
}

export default function streamToBuffer(stream, callback?) {
  if (typeof callback === 'function') return worker(stream, callback);
  return new Promise((resolve, reject) => worker(stream, (err, buffer) => (err ? reject(err) : resolve(buffer))));
}

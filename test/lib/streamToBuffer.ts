import oo from 'on-one';

function worker(stream, callback) {
  const chunks = [];
  stream.on('data', (chunk) => {
    chunks.push(chunk);
  });
  // NOTE: Do not listen for 'finish' - it's a writable-side event that can fire
  // before 'data' events on the readable side (especially on Node 0.8 with
  // readable-stream's PassThrough). Only listen for 'end' (readable complete)
  // and 'close' (stream destroyed).
  oo(stream, ['error', 'end', 'close'], (err?: Error) => {
    err ? callback(err) : callback(null, Buffer.concat(chunks));
  });
}

export default function streamToBuffer(stream, callback?) {
  if (typeof callback === 'function') return worker(stream, callback);
  return new Promise((resolve, reject) => worker(stream, (err, buffer) => (err ? reject(err) : resolve(buffer))));
}

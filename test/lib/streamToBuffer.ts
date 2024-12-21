import eos from 'end-of-stream';

export default function streamToBuffer(stream, callback) {
  const chunks = [];
  stream.on('data', (chunk) => {
    chunks.push(chunk);
  });
  eos(stream, (err) => {
    err ? callback(err) : callback(null, Buffer.concat(chunks));
  });
}

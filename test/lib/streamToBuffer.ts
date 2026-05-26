import oo from 'on-one';

function worker(stream: NodeJS.ReadableStream, callback: (err: Error | null, buffer?: Buffer) => void) {
  const chunks: Buffer[] = [];
  stream.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });
  oo(stream, ['error', 'end', 'close'], (err: Error | null) => {
    err ? callback(err) : callback(null, Buffer.concat(chunks));
  });
}

export default function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer>;
export default function streamToBuffer(stream: NodeJS.ReadableStream, callback: (err: Error | null, buffer?: Buffer) => void): void;
export default function streamToBuffer(stream: NodeJS.ReadableStream, callback?: (err: Error | null, buffer?: Buffer) => void): void | Promise<Buffer> {
  if (typeof callback === 'function') return worker(stream, callback);
  return new Promise<Buffer>((resolve, reject) => worker(stream, (err: Error | null, buffer?: Buffer) => (err ? reject(err) : resolve(buffer as Buffer))));
}

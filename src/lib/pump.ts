import pumpModule from 'pump';

import type { ReadStream, WriteStream } from '../types.ts';

export default function pipe(from: ReadStream, to: WriteStream, callback?: (err?: Error | null) => void): ReadStream {
  if (from.headers) to.headers = to.headers === undefined ? from.headers : { ...from.headers, ...to.headers };
  if (from.statusCode) to.statusCode = from.statusCode;
  return (callback ? pumpModule(from, to, callback) : pumpModule(from, to)) as ReadStream;
}

import pump from 'pump';

import type { ReadStream, WriteStream } from '../types.js';

export default function pipe(from: ReadStream, to: WriteStream): ReadStream {
  if (from.headers) to.headers = to.headers === undefined ? from.headers : { ...from.headers, ...to.headers };
  if (from.statusCode) to.statusCode = from.statusCode;
  return pump(from, to);
}

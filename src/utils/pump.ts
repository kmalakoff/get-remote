import pump from 'pump';

export default function pipe(from, to) {
  if (from.headers) to.headers = to.headers === undefined ? from.headers : Object.assign({}, from.headers, to.headers || {});
  if (from.statusCode) to.statusCode = from.statusCode;
  return pump(from, to);
}

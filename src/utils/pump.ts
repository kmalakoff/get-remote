import pump from 'pump';

export default function pipe(from, to) {
  if (from.headers) to.headers = to.headers === undefined ? from.headers : { ...from.headers, ...to.headers };
  if (from.statusCode) to.statusCode = from.statusCode;
  return pump(from, to);
}

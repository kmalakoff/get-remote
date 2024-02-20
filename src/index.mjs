import './polyfills.cjs';
import Response from './Response';

export { default as Response } from './Response';
export default function getRemote(endpoint, options) {
  return new Response(endpoint, options);
}

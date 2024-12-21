import './polyfills.cjs';
import Response from './Response/index.js';
export { default as Response } from './Response/index.js';

export default function getRemote(endpoint, options) {
  return new Response(endpoint, options);
}

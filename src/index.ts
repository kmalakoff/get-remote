import Response from './Response/index.js';
export * from './types.js';
export { default as Response } from './Response/index.js';

export default function getRemote(endpoint: string, options: object = {}) {
  return new Response(endpoint, options);
}

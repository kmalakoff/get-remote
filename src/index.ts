import Response from './Response/index.js';
import type { Options } from './types.js';

export { default as Response } from './Response/index.js';
export type * from './types.js';

export default function getRemote(endpoint: string, options: Options = {}) {
  return new Response(endpoint, options);
}

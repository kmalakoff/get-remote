import Response from './Response/index';
export type * from './types';
export { default as Response } from './Response/index';

export default function getRemote(endpoint: string, options: object = {}) {
  return new Response(endpoint, options);
}

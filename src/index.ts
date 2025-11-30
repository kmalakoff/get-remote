import Response from './Response/index.ts';
import type { Options } from './types.ts';

export type { FileTypeResult } from './lib/fileType.ts';
export { default as fileType } from './lib/fileType.ts';
export { default as Response } from './Response/index.ts';
export { default as getBasename } from './sourceStats/basename.ts';
export type * from './types.ts';

export default function getRemote(endpoint: string, options: Options = {}) {
  return new Response(endpoint, options);
}

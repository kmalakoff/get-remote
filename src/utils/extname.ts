import path from 'path';

import type { Options } from '../types.js';

export default function extname(fullPath: string, options: Options): string {
  if (options.type) return options.type;
  const basename = path.basename(fullPath);
  const index = basename.indexOf('.');
  let type = ~index ? basename.slice(index) : null;
  if (!type && typeof options.extract === 'string') type = options.extract;
  return type;
}

import path from 'path';

export default function extname(fullPath, options) {
  if (options.type) return options.type;
  const basename = path.basename(fullPath);
  const index = basename.indexOf('.');
  let type = ~index ? basename.slice(index) : null;
  if (!type && typeof options.extract === 'string') type = options.extract;
  return type;
}

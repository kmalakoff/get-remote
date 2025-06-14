import getBasename from './basename.js';
import getSize from './size.js';

import type { Options, Source, SourceStats } from '../types.js';

type Callback = (error?: Error, stats?: SourceStats) => undefined;

export default function sourceStats(source: Source, options: Options, endpoint: string, callback: Callback): undefined {
  if (typeof endpoint === 'function') {
    callback = endpoint;
    endpoint = null;
  }

  getSize(source, options, (err, size) => {
    if (err) return callback(err);
    const stats: SourceStats = {};
    const basename = getBasename(source, options, endpoint);
    if (basename !== undefined) stats.basename = basename;
    if (size !== undefined) stats.size = size;
    callback(null, stats);
  });
}

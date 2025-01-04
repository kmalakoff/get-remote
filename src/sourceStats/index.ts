import getBasename from './basename';
import getSize from './size';

export interface Stats {
  size?: number;
  basename?: string;
}

export default function sourceStats(source, options, endpoint, callback) {
  if (typeof endpoint === 'function') {
    callback = endpoint;
    endpoint = null;
  }

  getSize(source, options, (err, size) => {
    if (err) return callback(err);
    const stats: Stats = {};
    const basename = getBasename(source, options, endpoint);
    if (basename !== undefined) stats.basename = basename;
    if (size !== undefined) stats.size = size;
    callback(null, stats);
  });
}

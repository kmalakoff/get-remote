import progressStream from 'progress-stream';
import { PassThrough } from '../compat.ts';
import type { default as Response } from '../Response/index.ts';
import sourceStats from '../sourceStats/index.ts';
import type { OptionsInternal, ReadStream } from '../types.ts';
import pump from './pump.ts';

export type Callback = (error?: Error, res?: ReadStream) => void;

export default function wrapResponse(res: ReadStream, self: Response, options: OptionsInternal, callback: Callback): void {
  // add a pausable PassThrough stream to workaround streams 1 not starting streams paused
  if (!res.unpipe) res = pump(res, new PassThrough());

  sourceStats(res, options, self.endpoint, (err, stats) => {
    if (err) return callback(err);

    // add progress
    if (options.progress) {
      const progress = progressStream(
        {
          length: stats.size || 0,
          time: options.time,
        },
        (update) => {
          options.progress({ progress: 'download', ...update, ...stats });
        }
      );
      res = pump(res, progress);
    }

    // store stats on the source
    res.size = stats.size;
    res.basename = stats.basename;
    return callback(null, res);
  });
}

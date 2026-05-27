import progressStream from 'progress-stream';
import { PassThrough } from '../compat.ts';
import type { default as Response } from '../Response/index.ts';
import sourceStats from '../sourceStats/index.ts';
import type { OptionsInternal, ReadStream } from '../types.ts';
import pump from './pump.ts';

export type Callback = (error?: Error | null, res?: ReadStream) => void;

export default function wrapResponse(res: ReadStream, self: Response, options: OptionsInternal, callback: Callback): void {
  // add a pausable PassThrough stream to workaround streams 1 not starting streams paused
  if (!res.unpipe) res = pump(res, new PassThrough());

  sourceStats(res, options, self.endpoint, (err, stats) => {
    if (err) return callback(err);
    if (!stats) return callback(new Error('No stats'));

    // add progress
    if (options.progress) {
      const progress = progressStream(
        {
          length: stats.size || 0,
          time: options.time,
        },
        (update) => {
          (options.progress as unknown as (p: Record<string, unknown>) => void)({ progress: 'download', ...(update as unknown as Record<string, unknown>), ...(stats as unknown as Record<string, unknown>) });
        }
      );
      res = pump(res, progress);
    }

    // store stats on the source
    res.size = stats.size;
    res.basename = stats.basename;
    return callback(undefined, res);
  });
}

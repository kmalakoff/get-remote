import objectAssign from 'object-assign';
import progressStream from 'progress-stream';
import sourceStats from '../sourceStats/index.js';
import pump from './pump.js';

import { PassThrough as PassThroughStream } from 'stream';
import { PassThrough as PassThroughReadableStream } from 'readable-stream';
const PassThrough = PassThroughStream || PassThroughReadableStream;

import type { default as Response } from '../Response/index.js';
import type { OptionsInternal, ReadStream } from '../types.js';

export type Callback = (error?: Error, res?: ReadStream) => undefined;

export default function wrapResponse(res: ReadStream, self: Response, options: OptionsInternal, callback: Callback): undefined {
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
    return callback(null, objectAssign(res, stats));
  });
}

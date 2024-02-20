const progressStream = require('progress-stream');
const PassThrough = require('stream').PassThrough || require('readable-stream').PassThrough;

const pump = require('./pump');
const sourceStats = require('../sourceStats');

module.exports = function wrapResponse(res, self, options, callback) {
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
          options.progress(Object.assign({ progress: 'download' }, update, stats));
        }
      );
      res = pump(res, progress);
    }

    // store stats on the source
    res = Object.assign(res, stats);
    return callback(null, res);
  });
};

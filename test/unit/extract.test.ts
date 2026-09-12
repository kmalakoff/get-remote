import { createWriteStream } from 'fast-extract';
import { safeRm } from 'fs-remove-compat';
import get from 'get-remote';
import mkdirp from 'mkdirp-classic';
import oo from 'on-one';
import Pinkie from 'pinkie-promise';

import { TARGET, TMP_DIR } from '../lib/constants.ts';
import validateFiles from '../lib/validateFiles.ts';

const URL = 'https://raw.githubusercontent.com/kmalakoff/get-remote/master';

const EXTRACT_TYPES = ['tar', 'tar.bz2', 'tar.gz', 'tgz', 'zip'];
// lzma-native requires Node 10+ (uses N-API features not available in older versions)
const major = +process.versions.node.split('.')[0];
if (major >= 10) {
  try {
    require('lzma-native');
    EXTRACT_TYPES.push('tar.xz');
  } catch (_err) {}
}

function addTests(type) {
  (() => {
    // patch and restore promise
    if (typeof global === 'undefined') return;
    const globalPromise = global.Promise;
    before(() => {
      global.Promise = Pinkie;
    });
    after(() => {
      global.Promise = globalPromise;
    });
  })();

  describe(type, () => {
    it('extract file', (done) => {
      const options = { strip: 1 };
      get(`${URL}/test/data/fixture.${type}`).extract(TARGET, options, (err?: Error) => {
        if (err) {
          done(err);
          return;
        }

        validateFiles(options, type, (err?: Error) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
      });
    });

    it('extract file without type', (done) => {
      const options = { strip: 1, type: type };
      get(`${URL}/test/data/fixture-${type}`).extract(TARGET, options, (err?: Error) => {
        if (err) {
          done(err);
          return;
        }

        validateFiles(options, type, (err?: Error) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
      });
    });

    it('extract file using stream', (done) => {
      get(`${URL}/test/data/fixture-${type}`).stream((err, stream) => {
        if (err) {
          done(err);
          return;
        }

        const options = { strip: 1, type: type };
        const res = stream.pipe(createWriteStream(TARGET, options));
        oo(res, ['error', 'end', 'close', 'finish'], (err?: Error) => {
          if (err) {
            done(err);
            return;
          }

          validateFiles(options, type, (err?: Error) => {
            if (err) {
              done(err);
              return;
            }
            done();
          });
        });
      });
    });

    it('extract file using pipe', (done) => {
      const options = { strip: 1, type: type };
      get(`${URL}/test/data/fixture-${type}`).pipe(createWriteStream(TARGET, options), (err?: Error) => {
        if (err) {
          done(err);
          return;
        }

        validateFiles(options, type, (err?: Error) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
      });
    });
  });
}

describe('extract', () => {
  beforeEach((callback) => {
    safeRm(TMP_DIR, () => {
      mkdirp(TMP_DIR, callback);
    });
  });

  for (let index = 0; index < EXTRACT_TYPES.length; index++) addTests(EXTRACT_TYPES[index]);
});

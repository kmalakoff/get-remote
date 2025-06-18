import { createWriteStream } from 'fast-extract';
// @ts-ignore
import get from 'get-remote';
import mkdirp from 'mkdirp-classic';
import oo from 'on-one';
import Pinkie from 'pinkie-promise';
import requireOptional from 'require_optional';
import rimraf2 from 'rimraf2';

import { TARGET, TMP_DIR } from '../lib/constants';
import validateFiles from '../lib/validateFiles';

const URL = 'https://raw.githubusercontent.com/kmalakoff/get-remote/master';

const EXTRACT_TYPES = ['tar', 'tar.bz2', 'tar.gz', 'tgz', 'zip'];
try {
  const lzmaNative = requireOptional('lzma-native');
  if (lzmaNative) EXTRACT_TYPES.push('tar.xz');
} catch (_err) {}

function addTests(type) {
  (() => {
    // patch and restore promise
    // @ts-ignore
    let rootPromise: Promise;
    before(() => {
      rootPromise = global.Promise;
      // @ts-ignore
      global.Promise = Pinkie;
    });
    after(() => {
      global.Promise = rootPromise;
    });
  })();

  describe(type, () => {
    it('extract file', (done) => {
      const options = { strip: 1 };
      get(`${URL}/test/data/fixture.${type}`).extract(TARGET, options, (err?: Error) => {
        if (err) return done(err.message);

        validateFiles(options, type, (err?: Error) => {
          if (err) return done(err.message);
          done();
        });
      });
    });

    it('extract file without type', (done) => {
      const options = { strip: 1, type: type };
      get(`${URL}/test/data/fixture-${type}`).extract(TARGET, options, (err?: Error) => {
        if (err) return done(err.message);

        validateFiles(options, type, (err?: Error) => {
          if (err) return done(err.message);
          done();
        });
      });
    });

    it('extract file using stream', (done) => {
      get(`${URL}/test/data/fixture-${type}`).stream((err, stream) => {
        if (err) return done(err.message);

        const options = { strip: 1, type: type };
        const res = stream.pipe(createWriteStream(TARGET, options));
        oo(res, ['error', 'end', 'close', 'finish'], (err?: Error) => {
          if (err) return done(err.message);

          validateFiles(options, type, (err?: Error) => {
            if (err) return done(err.message);
            done();
          });
        });
      });
    });

    it('extract file using pipe', (done) => {
      const options = { strip: 1, type: type };
      get(`${URL}/test/data/fixture-${type}`).pipe(createWriteStream(TARGET, options), (err?: Error) => {
        if (err) return done(err.message);

        validateFiles(options, type, (err?: Error) => {
          if (err) return done(err.message);
          done();
        });
      });
    });
  });
}

describe('extract', () => {
  beforeEach((callback) => {
    rimraf2(TMP_DIR, { disableGlob: true }, () => {
      mkdirp(TMP_DIR, callback);
    });
  });

  for (let index = 0; index < EXTRACT_TYPES.length; index++) addTests(EXTRACT_TYPES[index]);
});

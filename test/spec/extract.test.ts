import assert from 'assert';
import eos from 'end-of-stream';
import { createWriteStream } from 'fast-extract';
import mkdirp from 'mkdirp-classic';
import Pinkie from 'pinkie-promise';
import rimraf2 from 'rimraf2';

// @ts-ignore
import get from 'get-remote';
import requireOptional from 'require_optional';

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
      get(`${URL}/test/data/fixture.${type}`).extract(TARGET, options, (err) => {
        if (err) return done(err.message);

        validateFiles(options, type, (err) => {
          if (err) return done(err.message);
          done();
        });
      });
    });

    it('extract file without type', (done) => {
      const options = { strip: 1, type: type };
      get(`${URL}/test/data/fixture-${type}`).extract(TARGET, options, (err) => {
        if (err) return done(err.message);

        validateFiles(options, type, (err) => {
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
        eos(res, (err) => {
          if (err) return done(err.message);

          validateFiles(options, type, (err) => {
            if (err) return done(err.message);
            done();
          });
        });
      });
    });

    it('extract file using pipe', (done) => {
      const options = { strip: 1, type: type };
      get(`${URL}/test/data/fixture-${type}`).pipe(createWriteStream(TARGET, options), (err) => {
        if (err) return done(err.message);

        validateFiles(options, type, (err) => {
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

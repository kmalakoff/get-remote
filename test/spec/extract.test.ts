// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
import Promise from 'pinkie-promise';

import assert from 'assert';
import eos from 'end-of-stream';
import { createWriteStream } from 'fast-extract';
import mkdirp from 'mkdirp-classic';
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
    const root = typeof global !== 'undefined' ? global : window;
    let rootPromise: Promise;
    before(() => {
      rootPromise = root.Promise;
      root.Promise = Promise;
    });
    after(() => {
      root.Promise = rootPromise;
    });
  })();

  describe(type, () => {
    it('extract file', (done) => {
      const options = { strip: 1 };
      get(`${URL}/test/data/fixture.${type}`).extract(TARGET, options, (err) => {
        assert.ok(!err, err ? err.message : '');

        validateFiles(options, type, (err) => {
          assert.ok(!err, err ? err.message : '');
          done();
        });
      });
    });

    it('extract file without type', (done) => {
      const options = { strip: 1, type: type };
      get(`${URL}/test/data/fixture-${type}`).extract(TARGET, options, (err) => {
        assert.ok(!err, err ? err.message : '');

        validateFiles(options, type, (err) => {
          assert.ok(!err, err ? err.message : '');
          done();
        });
      });
    });

    it('extract file using stream', (done) => {
      get(`${URL}/test/data/fixture-${type}`).stream((err, stream) => {
        assert.ok(!err, err ? err.message : '');

        const options = { strip: 1, type: type };
        const res = stream.pipe(createWriteStream(TARGET, options));
        eos(res, (err) => {
          assert.ok(!err, err ? err.message : '');

          validateFiles(options, type, (err) => {
            assert.ok(!err, err ? err.message : '');
            done();
          });
        });
      });
    });

    it('extract file using pipe', (done) => {
      const options = { strip: 1, type: type };
      get(`${URL}/test/data/fixture-${type}`).pipe(createWriteStream(TARGET, options), (err) => {
        assert.ok(!err, err ? err.message : '');

        validateFiles(options, type, (err) => {
          assert.ok(!err, err ? err.message : '');
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

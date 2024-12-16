const assert = require('assert');
const rimraf2 = require('rimraf2');
const mkpath = require('mkpath');
const extract = require('fast-extract');
const eos = require('end-of-stream');

const get = require('get-remote');

const validateFiles = require('../lib/validateFiles');
const constants = require('../lib/constants');
const TMP_DIR = constants.TMP_DIR;
const TARGET = constants.TARGET;
const URL = 'https://raw.githubusercontent.com/kmalakoff/get-remote/master';

const EXTRACT_TYPES = ['tar', 'tar.bz2', 'tar.gz', 'tgz', 'zip'];
try {
  const lzmaNative = require('require_optional')('lzma-native');
  if (lzmaNative) EXTRACT_TYPES.push('tar.xz');
} catch (_err) {}

function addTests(type) {
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
        const res = stream.pipe(extract.createWriteStream(TARGET, options));
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
      get(`${URL}/test/data/fixture-${type}`).pipe(extract.createWriteStream(TARGET, options), (err) => {
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
      mkpath(TMP_DIR, callback);
    });
  });

  for (let index = 0; index < EXTRACT_TYPES.length; index++) addTests(EXTRACT_TYPES[index]);
});

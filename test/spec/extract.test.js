var assert = require('assert');
var rimraf = require('rimraf');
var mkpath = require('mkpath');
var extract = require('fast-extract');
var eos = require('end-of-stream');

var get = require('../..');

var validateFiles = require('../lib/validateFiles');
var constants = require('../lib/constants');
var TMP_DIR = constants.TMP_DIR;
var TARGET = constants.TARGET;
var URL = 'https://raw.githubusercontent.com/kmalakoff/get-remote/master';

var major = +process.versions.node.split('.')[0];
var minor = +process.versions.node.split('.')[1];
var EXTRACT_TYPES = ['tar', 'tar.bz2', 'tar.gz', 'tgz', 'zip'];
if (major === 0 && minor <= 8) EXTRACT_TYPES.pop(); //  TODO: fix zip on node 0.8
try {
  var lzmaNative = require('require_optional')('lzma-native');
  if (lzmaNative) EXTRACT_TYPES.push('tar.xz');
} catch (err) {}

function addTests(type) {
  describe(type, function () {
    it('extract file', function (done) {
      var options = { strip: 1 };
      get(URL + '/test/data/fixture.' + type).extract(TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, type, function (err) {
          assert.ok(!err);
          done();
        });
      });
    });

    it('extract file without type', function (done) {
      var options = { strip: 1, type: type };
      get(URL + '/test/data/fixture-' + type).extract(TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, type, function (err) {
          assert.ok(!err);
          done();
        });
      });
    });

    it('extract file using stream', function (done) {
      get(URL + '/test/data/fixture-' + type).stream(function (err, stream) {
        assert.ok(!err);

        var options = { strip: 1, type: type };
        var res = stream.pipe(extract.createWriteStream(TARGET, options));
        eos(res, function (err) {
          assert.ok(!err);

          validateFiles(options, type, function (err) {
            assert.ok(!err);
            done();
          });
        });
      });
    });

    it('extract file using pipe', function (done) {
      var options = { strip: 1, type: type };
      get(URL + '/test/data/fixture-' + type).pipe(extract.createWriteStream(TARGET, options), function (err) {
        assert.ok(!err);

        validateFiles(options, type, function (err) {
          assert.ok(!err);
          done();
        });
      });
    });
  });
}

describe('extract', function () {
  beforeEach(function (callback) {
    rimraf(TMP_DIR, function (err) {
      if (err && err.code !== 'EEXIST') return callback(err);
      mkpath(TMP_DIR, callback);
    });
  });

  for (var index = 0; index < EXTRACT_TYPES.length; index++) addTests(EXTRACT_TYPES[index]);
});

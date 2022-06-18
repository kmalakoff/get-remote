var assert = require('assert');
var path = require('path');
var rimraf = require('rimraf');
var mkpath = require('mkpath');
var nock = require('../lib/nock');
var extract = require('fast-extract');
var eos = require('end-of-stream');

var get = require('../..');

var validateFiles = require('../lib/validateFiles');
var constants = require('../lib/constants');
var TMP_DIR = constants.TMP_DIR;
var TARGET = constants.TARGET;

var EXTRACT_TYPES = ['tar', 'tar.bz2', 'tar.gz', 'tgz', 'zip'];
try {
  var lzmaNative = require('require_optional')('lzma-native');
  if (lzmaNative) EXTRACT_TYPES.push('tar.xz');
} catch (err) {}

function addTests(type) {
  describe(type, function () {
    it('extract file', function (done) {
      var options = { strip: 1 };
      get('http://extractors.com/foo.' + type).extract(TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, type, function (err) {
          assert.ok(!err);
          done();
        });
      });
    });

    it('extract file without type', function (done) {
      var options = { strip: 1, type: type };
      get('http://extractors.com/foo-' + type).extract(TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, type, function (err) {
          assert.ok(!err);
          done();
        });
      });
    });

    it('extract file using stream', function (done) {
      get('http://extractors.com/foo-' + type).stream(function (err, stream) {
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
      get('http://extractors.com/foo-' + type).pipe(extract.createWriteStream(TARGET, options), function (err) {
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
  if (typeof nock !== 'function') return; // TODO: fix

  beforeEach(function (callback) {
    rimraf(TMP_DIR, function (err) {
      if (err && err.code !== 'EEXIST') return callback(err);
      mkpath(TMP_DIR, callback);
    });
  });

  before(function () {
    var endpoint = nock('http://extractors.com').persist();

    for (var index = 0; index < EXTRACT_TYPES.length; index++) {
      var type = EXTRACT_TYPES[index];
      var fixturePath = path.join(__dirname, '..', 'data', 'fixture.' + type);
      endpoint
        .get('/foo.' + type)
        .replyWithFile(200, fixturePath)
        .get('/foo-' + type)
        .replyWithFile(200, fixturePath);
    }
  });

  for (var index = 0; index < EXTRACT_TYPES.length; index++) addTests(EXTRACT_TYPES[index]);
});

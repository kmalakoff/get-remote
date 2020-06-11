var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var mkpath = require('mkpath');
var semver = require('semver');
var extract = require('fast-extract');
var eos = require('end-of-stream');

var get = require('../..');

var EXTRACT_TYPES = ['tar', 'tar.bz2', 'tar.gz', 'tgz', 'zip'];
try {
  var lzmaNative = require('require_optional')('lzma-native');
  if (lzmaNative) EXTRACT_TYPES.push('tar.xz');
} catch (err) {}

function addTests(type) {
  describe(type, function () {
    it('extract file', function (done) {
      get('http://extractors.com/foo.' + type).extract(TARGET, { strip: 1 }, function (err) {
        assert.ok(!err);

        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['file.txt', 'link']);
          assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'file.txt'));
          done();
        });
      });
    });

    it('extract file without type', function (done) {
      get('http://extractors.com/foo-' + type).extract(TARGET, { strip: 1, type: type }, function (err) {
        assert.ok(!err);

        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['file.txt', 'link']);
          assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'file.txt'));
          done();
        });
      });
    });

    it('extract file using stream', function (done) {
      get('http://extractors.com/foo-' + type).stream(function (err, stream) {
        assert.ok(!err);

        var res = stream.pipe(extract.createWriteStream(TARGET, { strip: 1, type: type }));
        eos(res, function (err) {
          assert.ok(!err);

          fs.readdir(TARGET, function (err, files) {
            assert.ok(!err);
            assert.deepEqual(files.sort(), ['file.txt', 'link']);
            assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'file.txt'));
            done();
          });
        });
      });
    });

    it('extract file using pipe', function (done) {
      get('http://extractors.com/foo-' + type).pipe(extract.createWriteStream(TARGET, { strip: 1, type: type }), function (err) {
        assert.ok(!err);

        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['file.txt', 'link']);
          assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'file.txt'));
          done();
        });
      });
    });
  });
}

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));
var TARGET = path.resolve(path.join(TMP_DIR, 'target'));

describe('extract', function () {
  if (semver.lt(process.versions.node, 'v0.10.0')) return; // TODO: fix nock compatability

  // nock patch
  if (!Object.assign) Object.assign = require('object-assign');
  if (!require('timers').setImmediate) require('timers').setImmediate = require('next-tick');
  var nock = require('nock');

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

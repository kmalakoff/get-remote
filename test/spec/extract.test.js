var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var mkpath = require('mkpath');
var semver = require('semver');

var download = require('../..');

var EXTRACT_TYPES = ['tar', 'tar.bz2', 'tar.gz', 'tgz', 'zip'];
try {
  var lzmaNative = require('require_optional')('lzma-native');
  if (lzmaNative) EXTRACT_TYPES.push('tar.xz');
} catch (err) {}

function addTests(extractType) {
  describe(extractType, function () {
    it('extract file', function (done) {
      download('http://extractors.com/foo.' + extractType).extract(TMP_DIR, { strip: 1 }, function (err) {
        assert.ok(!err);

        fs.readdir(TMP_DIR, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['file.txt', 'link']);
          assert.equal(fs.realpathSync(path.join(TMP_DIR, 'link')), path.join(TMP_DIR, 'file.txt'));
          done();
        });
      });
    });

    it('extract file without extension', function (done) {
      download('http://extractors.com/foo-' + extractType).extract(TMP_DIR, { strip: 1, extension: extractType }, function (err) {
        assert.ok(!err);

        fs.readdir(TMP_DIR, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['file.txt', 'link']);
          assert.equal(fs.realpathSync(path.join(TMP_DIR, 'link')), path.join(TMP_DIR, 'file.txt'));
          done();
        });
      });
    });
  });
}

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

describe('extract', function () {
  if (semver.lt(process.versions.node, 'v0.10.0')) return;

  // nock patch
  if (!Object.assign) Object.assign = require('object-assign');
  if (!require('timers').setImmediate) require('timers').setImmediate = require('next-tick');
  var nock = require('nock');

  beforeEach(function (done) {
    rimraf(TMP_DIR, function () {
      mkpath(TMP_DIR, done);
    });
  });

  before(function () {
    var endpoint = nock('http://extractors.com').persist();

    for (var index = 0; index < EXTRACT_TYPES.length; index++) {
      var extractType = EXTRACT_TYPES[index];
      var fixturePath = path.join(__dirname, '..', 'data', 'fixture.' + extractType);
      endpoint
        .get('/foo.' + extractType)
        .replyWithFile(200, fixturePath)
        .get('/foo-' + extractType)
        .replyWithFile(200, fixturePath);
    }
  });

  for (var index = 0; index < EXTRACT_TYPES.length; index++) addTests(EXTRACT_TYPES[index]);
});

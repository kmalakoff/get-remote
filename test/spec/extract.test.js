var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp-classic');
var semver = require('semver');

var download = require('../..');

var EXTRACT_TYPES = ['tar', 'tar.bz2', 'tar.gz', 'tar.xz', 'tgz', 'zip'];
// var EXTRACT_TYPES = ['zip'];

function addTests(extractType) {
  it('extract file (' + extractType + ')', function (done) {
    download('http://extractors.com/foo.' + extractType, TMP_DIR, { strip: 1, extract: true }, function (err) {
      assert.ok(!err);

      fs.readdir(TMP_DIR, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['file.txt', 'link']);
        assert.equal(fs.realpathSync(path.join(TMP_DIR, 'link')), path.join(TMP_DIR, 'file.txt'));
        done();
      });
    });
  });

  it('extract file without extension (' + extractType + ')', function (done) {
    download('http://extractors.com/foo-' + extractType, TMP_DIR, { strip: 1, extract: '.' + extractType, filename: 'fixture.' + extractType }, function (err) {
      assert.ok(!err);

      fs.readdir(TMP_DIR, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['file.txt', 'link']);
        assert.equal(fs.realpathSync(path.join(TMP_DIR, 'link')), path.join(TMP_DIR, 'file.txt'));
        done();
      });
    });
  });
}

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

describe('extract', function () {
  if (semver.lt(process.versions.node, 'v0.10.0')) return;

  // nock patch
  if (!Object.assign) Object.assign = require('object-assign');
  var nock = require('nock');

  beforeEach(function (done) {
    rimraf(TMP_DIR, function () {
      mkdirp(TMP_DIR, done);
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

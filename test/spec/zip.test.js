var assert = require('assert');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp-classic');
var progressStream = require('progress-stream');
var unzip = require('node-unzip-2');
var fstream = require('fstream');
var semver = require('semver');

var download = require('../..');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

describe('zip', function () {
  if (semver.lt(process.versions.node, 'v0.10.0')) return;

  beforeEach(function (done) {
    rimraf(TMP_DIR, function () {
      mkdirp(TMP_DIR, done);
    });
  });

  it('should download unzip over http with redirect', function (done) {
    download('http://codeload.github.com/kmalakoff/get-remote/zip/0.2.1', TMP_DIR, { extract: '.zip' }, function (err) {
      assert.ok(!err);
      var files = fs.readdirSync(path.join(TMP_DIR, 'get-remote-0.2.1'));
      assert.ok(files.length > 1);
      done();
    });
  });

  it('should support manual extraction', function (done) {
    download('http://codeload.github.com/kmalakoff/get-remote/zip/0.2.1', function (err, res) {
      assert.ok(!err);
      res = res.pipe(unzip.Parse()).pipe(fstream.Writer(TMP_DIR));
      res.on('error', done);
      res.on('close', function () {
        var files = fs.readdirSync(path.join(TMP_DIR, 'get-remote-0.2.1'));
        assert.ok(files.length > 1);
        done();
      });
    });
  });

  it('should support promises', function (done) {
    if (typeof Promise === 'undefined') return done(); // no promise support

    download('http://codeload.github.com/kmalakoff/get-remote/zip/0.2.1', TMP_DIR, { extract: '.zip' })
      .then(function () {
        var files = fs.readdirSync(path.join(TMP_DIR, 'get-remote-0.2.1'));
        assert.ok(files.length > 1);
        done();
      })
      .catch(done);
  });
});

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp-classic');
var progressStream = require('progress-stream');
var unzip = require('node-unzip-2');
var fstream = require('fstream');

var download = require('../..');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

describe('get-file', function () {
  beforeEach(function (done) {
    rimraf(TMP_DIR, function () {
      mkdirp(TMP_DIR, done);
    });
  });

  it('should download file over https', function (done) {
    download('https://raw.githubusercontent.com/kmalakoff/get-remote/0.2.1/README.md', TMP_DIR, function (err) {
      assert.ok(!err);
      var files = fs.readdirSync(TMP_DIR);
      assert.ok(files.length === 1);
      done();
    });
  });

  it('should download file over http', function (done) {
    download('http://raw.githubusercontent.com/kmalakoff/get-remote/0.2.1/README.md', TMP_DIR, function (err) {
      assert.ok(!err);
      var files = fs.readdirSync(TMP_DIR);
      assert.ok(files.length === 1);
      done();
    });
  });

  it('should support promises', function (done) {
    if (typeof Promise === 'undefined') return done(); // no promise support

    download('https://raw.githubusercontent.com/kmalakoff/get-remote/0.2.1/README.md', TMP_DIR)
      .then(function (stream) {
        var files = fs.readdirSync(TMP_DIR);
        assert.ok(files.length === 1);
        done();
      })
      .catch(done);
  });

  it('should download with progress', function (done) {
    var progressUpdates = [];

    function createProgressStream(res) {
      var progress = progressStream({
        length: res.headers['content-length'] || 0,
        drain: true,
        speed: 20,
      });
      progress.on('progress', progressUpdates.push.bind(progressUpdates));
      return progress;
    }

    download('http://raw.githubusercontent.com/kmalakoff/get-remote/0.2.1/README.md', TMP_DIR, { progress: createProgressStream }, function (err) {
      assert.ok(!err);
      var files = fs.readdirSync(TMP_DIR);
      assert.ok(files.length === 1);
      assert.ok(progressUpdates.length > 1);
      done();
    });
  });
});

describe('zip', function () {
  it('should download unzip over https', function (done) {
    mkdirp(TMP_DIR, function () {
      var dest = [unzip.Parse(), fstream.Writer(TMP_DIR)];
      download('https://codeload.github.com/kmalakoff/get-remote/zip/0.2.1', dest, function (err) {
        assert.ok(!err);
        var files = fs.readdirSync(path.join(TMP_DIR, 'get-remote-0.2.1'));
        assert.ok(files.length > 1);
        done();
      });
    });
  });

  it('should download unzip over http', function (done) {
    mkdirp(TMP_DIR, function () {
      var dest = [unzip.Parse(), fstream.Writer(TMP_DIR)];
      download('http://codeload.github.com/kmalakoff/get-remote/zip/0.2.1', dest, function (err) {
        assert.ok(!err);
        var files = fs.readdirSync(path.join(TMP_DIR, 'get-remote-0.2.1'));
        assert.ok(files.length > 1);
        done();
      });
    });
  });

  it('should support promises', function (done) {
    if (typeof Promise === 'undefined') return done(); // no promise support

    mkdirp(TMP_DIR, function () {
      var dest = [unzip.Parse(), fstream.Writer(TMP_DIR)];
      download('http://codeload.github.com/kmalakoff/get-remote/zip/0.2.1', dest)
        .then(function () {
          var files = fs.readdirSync(path.join(TMP_DIR, 'get-remote-0.2.1'));
          assert.ok(files.length > 1);
          done();
        })
        .catch(done);
    });
  });

  it('should download with progress', function (done) {
    mkdirp(TMP_DIR, function () {
      var dest = [unzip.Parse(), fstream.Writer(TMP_DIR)];
      var progressUpdates = [];

      function createProgressStream(res) {
        var progress = progressStream({
          length: res.headers['content-length'] || 0,
          drain: true,
          speed: 20,
        });
        progress.on('progress', progressUpdates.push.bind(progressUpdates));
        return progress;
      }

      download('http://codeload.github.com/kmalakoff/get-remote/zip/0.2.1', dest, { progress: createProgressStream }, function (err) {
        assert.ok(!err);
        var files = fs.readdirSync(path.join(TMP_DIR, 'get-remote-0.2.1'));
        assert.ok(files.length > 1);
        done();
      });
    });
  });
});

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp-classic');
var progressStream = require('progress-stream');
var unzip = require('node-unzip-2');
var fstream = require('fstream');

var download = require('../..');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp', 'test'));

describe('download', function () {
  beforeEach(function (done) {
    rimraf(TMP_DIR, function () {
      mkdirp(TMP_DIR, done);
    });
  });

  it('should download file over https', function (done) {
    var fullPath = path.join(TMP_DIR, 'README.md');
    download('https://raw.githubusercontent.com/kmalakoff/get-remote/0.2.1/README.md', fullPath, function (err) {
      assert.ok(!err);
      var files = fs.readdirSync(TMP_DIR);
      assert.ok(files.length === 1);
      done();
    });
  });

  it('should download file over http', function (done) {
    var fullPath = path.join(TMP_DIR, 'README.md');
    download('http://raw.githubusercontent.com/kmalakoff/get-remote/0.2.1/README.md', fullPath, function (err) {
      assert.ok(!err);
      var files = fs.readdirSync(TMP_DIR);
      assert.ok(files.length === 1);
      done();
    });
  });

  it('should support promises', function (done) {
    if (typeof Promise === 'undefined') return done(); // no promise support

    var fullPath = path.join(TMP_DIR, 'README.md');
    download('https://raw.githubusercontent.com/kmalakoff/get-remote/0.2.1/README.md', fullPath)
      .then(function () {
        var files = fs.readdirSync(TMP_DIR);
        assert.ok(files.length === 1);
        done();
      })
      .catch(done);
  });

  it('should download with progress', function (done) {
    var fullPath = path.join(TMP_DIR, 'README.md');
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

    download('http://raw.githubusercontent.com/kmalakoff/get-remote/0.2.1/README.md', fullPath, { progress: createProgressStream }, function (err) {
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
    var fullPath = path.join(TMP_DIR, 'github');
    mkdirp(fullPath, function () {
      var dest = [unzip.Parse(), fstream.Writer(fullPath)];
      download('https://codeload.github.com/kmalakoff/get-remote/zip/0.2.1', dest, function (err) {
        assert.ok(!err);
        var files = fs.readdirSync(path.join(fullPath, 'get-remote-0.2.1'));
        assert.ok(files.length > 1);
        done();
      });
    });
  });

  it('should download unzip over http', function (done) {
    var fullPath = path.join(TMP_DIR, 'github');
    mkdirp(fullPath, function () {
      var dest = [unzip.Parse(), fstream.Writer(fullPath)];
      download('http://codeload.github.com/kmalakoff/get-remote/zip/0.2.1', dest, function (err) {
        assert.ok(!err);
        var files = fs.readdirSync(path.join(fullPath, 'get-remote-0.2.1'));
        assert.ok(files.length > 1);
        done();
      });
    });
  });

  it('should support promises', function (done) {
    if (typeof Promise === 'undefined') return done(); // no promise support

    var fullPath = path.join(TMP_DIR, 'github');
    mkdirp(fullPath, function () {
      var dest = [unzip.Parse(), fstream.Writer(fullPath)];
      download('http://codeload.github.com/kmalakoff/get-remote/zip/0.2.1', dest)
        .then(function () {
          var files = fs.readdirSync(path.join(fullPath, 'get-remote-0.2.1'));
          assert.ok(files.length > 1);
          done();
        })
        .catch(done);
    });
  });

  it('should download with progress', function (done) {
    var fullPath = path.join(TMP_DIR, 'github');
    mkdirp(fullPath, function () {
      var dest = [unzip.Parse(), fstream.Writer(fullPath)];
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
        var files = fs.readdirSync(path.join(fullPath, 'get-remote-0.2.1'));
        assert.ok(files.length > 1);
        done();
      });
    });
  });
});

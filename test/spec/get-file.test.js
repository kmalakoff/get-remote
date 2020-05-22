var assert = require('assert');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp-classic');
var progressStream = require('progress-stream');

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

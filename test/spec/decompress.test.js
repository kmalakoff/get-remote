var assert = require('assert');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var progressStream = require('progress-stream');

var download = require('../..');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp', 'test'));

describe('decompress', function () {
  beforeEach(rimraf.bind(null, TMP_DIR));
  after(rimraf.bind(null, TMP_DIR));

  it('should download zip over https', function (done) {
    var fullPath = path.join(TMP_DIR, 'github.zip');
    download('https://codeload.github.com/kmalakoff/get-remote/zip/0.2.1', fullPath, { extract: true, strip: 1 }, function (err) {
      assert.ok(!err);
      var files = fs.readdirSync(fullPath);
      assert.ok(files.length > 1);
      done();
    });
  });

  it('should download zip over http', function (done) {
    var fullPath = path.join(TMP_DIR, 'github.zip');
    download('http://codeload.github.com/kmalakoff/get-remote/zip/0.2.1', fullPath, { extract: true, strip: 1 }, function (err) {
      assert.ok(!err);
      var files = fs.readdirSync(fullPath);
      assert.ok(files.length > 1);
      done();
    });
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

    download('http://codeload.github.com/kmalakoff/get-remote/zip/0.2.1', fullPath, { extract: true, strip: 1, progress: createProgressStream }, function (
      err
    ) {
      assert.ok(!err);
      var files = fs.readdirSync(TMP_DIR);
      assert.ok(files.length === 1);
      assert.ok(progressUpdates.length > 1);
      done();
    });
  });
});

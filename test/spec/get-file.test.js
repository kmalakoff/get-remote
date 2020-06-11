var assert = require('assert');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var mkpath = require('mkpath');

var get = require('../..');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));
var TARGET = path.resolve(path.join(TMP_DIR, 'target'));

describe('get-file', function () {
  beforeEach(function (callback) {
    rimraf(TMP_DIR, function (err) {
      if (err && err.code !== 'EEXIST') return callback(err);
      mkpath(TMP_DIR, callback);
    });
  });

  it('should get file over https', function (done) {
    mkpath(TARGET, function (err) {
      assert.ok(!err);

      get('https://raw.githubusercontent.com/kmalakoff/get-remote/0.2.1/README.md').file(TARGET, function (err) {
        assert.ok(!err);
        var files = fs.readdirSync(TARGET);
        assert.ok(files.length === 1);
        done();
      });
    });
  });

  it('should get file over http', function (done) {
    mkpath(TARGET, function (err) {
      assert.ok(!err);

      get('http://raw.githubusercontent.com/kmalakoff/get-remote/0.2.1/README.md').file(TARGET, function (err) {
        assert.ok(!err);
        var files = fs.readdirSync(TARGET);
        assert.ok(files.length === 1);
        done();
      });
    });
  });

  it('should support promises', function (done) {
    if (typeof Promise === 'undefined') return done(); // no promise support

    mkpath(TARGET, function (err) {
      assert.ok(!err);

      get('https://raw.githubusercontent.com/kmalakoff/get-remote/0.2.1/README.md')
        .file(TARGET)
        .then(function (stream) {
          var files = fs.readdirSync(TARGET);
          assert.ok(files.length === 1);
          done();
        })
        .catch(done);
    });
  });

  it('should get with progress', function (done) {
    var progressUpdates = [];
    function progress(update) {
      progressUpdates.push(update);
    }

    mkpath(TARGET, function (err) {
      assert.ok(!err);

      get('http://raw.githubusercontent.com/kmalakoff/get-remote/0.2.1/README.md', { progress: progress }).file(TARGET, function (err) {
        assert.ok(!err);
        var files = fs.readdirSync(TARGET);
        assert.ok(files.length === 1);
        assert.ok(progressUpdates.length > 1);
        done();
      });
    });
  });
});

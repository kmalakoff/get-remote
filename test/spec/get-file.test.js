var assert = require('assert');
var fs = require('fs');
var rimraf = require('rimraf');
var mkpath = require('mkpath');

var get = require('../..');

var constants = require('../lib/constants');
var TMP_DIR = constants.TMP_DIR;
var TARGET = constants.TARGET;
var URL = 'https://raw.githubusercontent.com/kmalakoff/get-remote/master';

describe('get-file', function () {
  beforeEach(function (callback) {
    rimraf(TMP_DIR, function () {
      mkpath(TMP_DIR, callback);
    });
  });

  it('should get file over https', function (done) {
    get(URL + '/package.json').file(TARGET, function (err) {
      assert.ok(!err);
      var files = fs.readdirSync(TARGET);
      assert.ok(files.length === 1);
      done();
    });
  });

  it('should get file over http', function (done) {
    get(URL + '/package.json').file(TARGET, function (err) {
      assert.ok(!err);
      var files = fs.readdirSync(TARGET);
      assert.ok(files.length === 1);
      done();
    });
  });

  it('should support promises', function (done) {
    get(URL + '/package.json')
      .file(TARGET)
      .then(function (stream) {
        var files = fs.readdirSync(TARGET);
        assert.ok(files.length === 1);
        done();
      })
      .catch(done);
  });

  it('should get with progress', function (done) {
    var progressUpdates = [];
    function progress(update) {
      progressUpdates.push(update);
    }

    get(URL + '/package.json', { progress: progress }).file(TARGET, function (err) {
      assert.ok(!err);
      var files = fs.readdirSync(TARGET);
      assert.ok(files.length === 1);
      assert.ok(progressUpdates.length > 1);
      done();
    });
  });
});

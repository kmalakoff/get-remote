var assert = require('assert');
var fs = require('fs');
var rimraf = require('rimraf');
var mkpath = require('mkpath');
var isTar = require('is-tar');

// var contentDisposition = require('content-disposition');

var get = require('../..');

var streamToBuffer = require('../lib/streamToBuffer');
var validateFiles = require('../lib/validateFiles');
var constants = require('../lib/constants');
var TMP_DIR = constants.TMP_DIR;
var TARGET = constants.TARGET;
var URL = 'https://raw.githubusercontent.com/kmalakoff/get-remote/master';

describe('download', function () {
  beforeEach(function (callback) {
    rimraf(TMP_DIR, function (err) {
      if (err && err.code !== 'EEXIST') return callback(err);
      mkpath(TMP_DIR, callback);
    });
  });

  it('get as stream', function (done) {
    get(URL + '/test/data/fixture.tar').stream(function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.ok(isTar(buffer));
        done();
      });
    });
  });

  it.skip('get as promise', function (done) {
    get(URL + '/test/data/fixture.tar').stream(function (err, stream) {
      assert.ok(!err);
      assert.ok(isTar(stream));
      done();
    });
  });

  it('get a very large file', function (done) {
    get('https://github.com/kmalakoff/get-remote/archive/refs/tags/v0.6.3.zip').stream(function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.equal(buffer.length, 123087);
        done();
      });
    });
  });

  it('get and rename file', function (done) {
    get(URL + '/test/data/fixture.tar').file(TARGET, { filename: 'bar.tar' }, function (err) {
      assert.ok(!err);
      fs.readdir(TARGET, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['bar.tar']);
        done();
      });
    });
  });

  it('save file', function (done) {
    get(URL + '/test/data/fixture.tar').file(TARGET, function (err) {
      assert.ok(!err);
      fs.readdir(TARGET, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['fixture.tar']);
        done();
      });
    });
  });

  it('extract file', function (done) {
    var options = { strip: 1 };
    get(URL + '/test/data/fixture.tar').extract(TARGET, options, function (err) {
      assert.ok(!err);

      validateFiles(options, 'tar.gz', function (err) {
        assert.ok(!err);
        done();
      });
    });
  });

  it('extract file that is not compressed', function (done) {
    get(URL + '/test/data/fixture.js').extract(TARGET, function (err) {
      assert.ok(!err);

      fs.readdir(TARGET, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['fixture.js']);
        done();
      });
    });
  });

  it('error on 404', function (done) {
    get(URL + '/test/data/404').stream(function (err) {
      assert.ok(err);
      assert.equal(err.message, 'Response code 404 (Not Found)');
      done();
    });
  });

  it.skip('rename to valid filename', function (done) {
    get(URL + '/test/data/fix*ture.tar').file(TARGET, function (err) {
      assert.ok(!err);
      fs.readdir(TARGET, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['fix!ture.tar']);
        done();
      });
    });
  });

  it('follow redirects', function (done) {
    get(URL.replace('https', 'http') + '/test/data/fixture.tar').stream(function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.ok(isTar(buffer));
        done();
      });
    });
  });

  it('follow redirect to https', function (done) {
    get(URL.replace('https', 'http') + '/test/data/fixture.tar').stream(function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.ok(isTar(buffer));
        done();
      });
    });
  });

  it('handle query string', function (done) {
    get(URL + '/test/data/fixture.tar?param=value').file(TARGET, function (err) {
      assert.ok(!err);
      fs.readdir(TARGET, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['fixture.tar']);
        done();
      });
    });
  });

  it.skip('handle content dispositon', function (done) {
    get(URL + '/test/data/fixture-tar').file(TARGET, function (err) {
      assert.ok(!err);
      fs.readdir(TARGET, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['fixture-tar.tar']);
        done();
      });
    });
  });

  it.skip('handle filename from file type', function (done) {
    get('http://foo.bar/filetype').file(TARGET, function (err) {
      assert.ok(!err);
      fs.readdir(TARGET, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['filetype.tar']);
        done();
      });
    });
  });
});

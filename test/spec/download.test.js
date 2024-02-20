const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');
const mkpath = require('mkpath');
const isTar = require('is-tar');

// var contentDisposition = require('content-disposition');

const get = require('get-remote');

const streamToBuffer = require('../lib/streamToBuffer');
const validateFiles = require('../lib/validateFiles');
const constants = require('../lib/constants');
const TMP_DIR = constants.TMP_DIR;
const TARGET = constants.TARGET;
const URL = 'https://raw.githubusercontent.com/kmalakoff/get-remote/master';

describe('download', () => {
  beforeEach((callback) => {
    rimraf(TMP_DIR, () => {
      mkpath(TMP_DIR, callback);
    });
  });

  it('get as stream', (done) => {
    get(`${URL}/test/data/fixture.tar`).stream((err, stream) => {
      assert.ok(!err);
      streamToBuffer(stream, (err, buffer) => {
        assert.ok(!err);
        assert.ok(isTar(buffer));
        done();
      });
    });
  });

  it.skip('get as promise', (done) => {
    get(`${URL}/test/data/fixture.tar`).stream((err, stream) => {
      assert.ok(!err);
      assert.ok(isTar(stream));
      done();
    });
  });

  it('get a very large file', (done) => {
    get('https://github.com/kmalakoff/get-remote/archive/refs/tags/v0.6.3.zip').stream((err, stream) => {
      assert.ok(!err);
      streamToBuffer(stream, (err, buffer) => {
        assert.ok(!err);
        assert.equal(buffer.length, 123087);
        done();
      });
    });
  });

  it('get and rename file', (done) => {
    get(`${URL}/test/data/fixture.tar`).file(TARGET, { filename: 'bar.tar' }, (err) => {
      assert.ok(!err);
      fs.readdir(TARGET, (err, files) => {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['bar.tar']);
        done();
      });
    });
  });

  it('save file', (done) => {
    get(`${URL}/test/data/fixture.tar`).file(TARGET, (err) => {
      assert.ok(!err);
      fs.readdir(TARGET, (err, files) => {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['fixture.tar']);
        done();
      });
    });
  });

  it('extract file', (done) => {
    const options = { strip: 1 };
    get(`${URL}/test/data/fixture.tar`).extract(TARGET, options, (err) => {
      assert.ok(!err);

      validateFiles(options, 'tar.gz', (err) => {
        assert.ok(!err);
        done();
      });
    });
  });

  it('extract file that is not compressed', (done) => {
    get(`${URL}/test/data/fixture.js`).extract(TARGET, (err) => {
      assert.ok(!err);

      fs.readdir(TARGET, (err, files) => {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['fixture.js']);
        done();
      });
    });
  });

  it('error on 404', (done) => {
    get(`${URL}/test/data/404`).stream((err) => {
      assert.ok(err);
      assert.equal(err.message, 'Response code 404 (Not Found)');
      done();
    });
  });

  it.skip('rename to valid filename', (done) => {
    get(`${URL}/test/data/fix*ture.tar`).file(TARGET, (err) => {
      assert.ok(!err);
      fs.readdir(TARGET, (err, files) => {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['fix!ture.tar']);
        done();
      });
    });
  });

  it('follow redirects', (done) => {
    get(`${URL.replace('https', 'http')}/test/data/fixture.tar`).stream((err, stream) => {
      assert.ok(!err);
      streamToBuffer(stream, (err, buffer) => {
        assert.ok(!err);
        assert.ok(isTar(buffer));
        done();
      });
    });
  });

  it('follow redirect to https', (done) => {
    get(`${URL.replace('https', 'http')}/test/data/fixture.tar`).stream((err, stream) => {
      assert.ok(!err);
      streamToBuffer(stream, (err, buffer) => {
        assert.ok(!err);
        assert.ok(isTar(buffer));
        done();
      });
    });
  });

  it('handle query string', (done) => {
    get(`${URL}/test/data/fixture.tar?param=value`).file(TARGET, (err) => {
      assert.ok(!err);
      fs.readdir(TARGET, (err, files) => {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['fixture.tar']);
        done();
      });
    });
  });

  it.skip('handle content dispositon', (done) => {
    get(`${URL}/test/data/fixture-tar`).file(TARGET, (err) => {
      assert.ok(!err);
      fs.readdir(TARGET, (err, files) => {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['fixture-tar.tar']);
        done();
      });
    });
  });

  it.skip('handle filename from file type', (done) => {
    get('http://foo.bar/filetype').file(TARGET, (err) => {
      assert.ok(!err);
      fs.readdir(TARGET, (err, files) => {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['filetype.tar']);
        done();
      });
    });
  });
});

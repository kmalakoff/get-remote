import assert from 'assert';
import fs from 'fs';
import isTar from 'is-tar';
import mkpath from 'mkpath';
import rimraf2 from 'rimraf2';

// var contentDisposition = require('content-disposition');

// @ts-ignore
import get from 'get-remote';

import { TARGET, TMP_DIR } from '../lib/constants';
import streamToBuffer from '../lib/streamToBuffer';
import validateFiles from '../lib/validateFiles';
const URL = 'https://raw.githubusercontent.com/kmalakoff/get-remote/master';

describe('download', () => {
  beforeEach((callback) => {
    rimraf2(TMP_DIR, { disableGlob: true }, () => {
      mkpath(TMP_DIR, callback);
    });
  });

  it('get as stream', (done) => {
    get(`${URL}/test/data/fixture.tar`).stream((err, stream) => {
      assert.ok(!err, err ? err.message : '');
      streamToBuffer(stream, (err, buffer) => {
        assert.ok(!err, err ? err.message : '');
        assert.ok(isTar(buffer));
        done();
      });
    });
  });

  it.skip('get as promise', (done) => {
    get(`${URL}/test/data/fixture.tar`).stream((err, stream) => {
      assert.ok(!err, err ? err.message : '');
      assert.ok(isTar(stream));
      done();
    });
  });

  it('get a very large file', (done) => {
    get('https://nodejs.org/dist/v22.12.0/node-v22.12.0-darwin-arm64.tar.gz').stream((err, stream) => {
      assert.ok(!err, err ? err.message : '');
      streamToBuffer(stream, (err, buffer) => {
        assert.ok(!err, err ? err.message : '');
        assert.equal(buffer.length, 48568612);
        done();
      });
    });
  });

  it('get and rename file', (done) => {
    get(`${URL}/test/data/fixture.tar`).file(TARGET, { filename: 'bar.tar' }, (err) => {
      assert.ok(!err, err ? err.message : '');
      fs.readdir(TARGET, (err, files) => {
        assert.ok(!err, err ? err.message : '');
        assert.deepEqual(files.sort(), ['bar.tar']);
        done();
      });
    });
  });

  it('save file', (done) => {
    get(`${URL}/test/data/fixture.tar`).file(TARGET, (err) => {
      assert.ok(!err, err ? err.message : '');
      fs.readdir(TARGET, (err, files) => {
        assert.ok(!err, err ? err.message : '');
        assert.deepEqual(files.sort(), ['fixture.tar']);
        done();
      });
    });
  });

  it('extract file', (done) => {
    const options = { strip: 1 };
    get(`${URL}/test/data/fixture.tar`).extract(TARGET, options, (err) => {
      assert.ok(!err, err ? err.message : '');

      validateFiles(options, 'tar.gz', (err) => {
        assert.ok(!err, err ? err.message : '');
        done();
      });
    });
  });

  it('extract file that is not compressed', (done) => {
    get(`${URL}/test/data/fixture.js`).extract(TARGET, (err) => {
      assert.ok(!err, err ? err.message : '');

      fs.readdir(TARGET, (err, files) => {
        assert.ok(!err, err ? err.message : '');
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
      assert.ok(!err, err ? err.message : '');
      fs.readdir(TARGET, (err, files) => {
        assert.ok(!err, err ? err.message : '');
        assert.deepEqual(files.sort(), ['fix!ture.tar']);
        done();
      });
    });
  });

  it('follow redirects', (done) => {
    get(`${URL.replace('https', 'http')}/test/data/fixture.tar`).stream((err, stream) => {
      assert.ok(!err, err ? err.message : '');
      streamToBuffer(stream, (err, buffer) => {
        assert.ok(!err, err ? err.message : '');
        assert.ok(isTar(buffer));
        done();
      });
    });
  });

  it('follow redirect to https', (done) => {
    get(`${URL.replace('https', 'http')}/test/data/fixture.tar`).stream((err, stream) => {
      assert.ok(!err, err ? err.message : '');
      streamToBuffer(stream, (err, buffer) => {
        assert.ok(!err, err ? err.message : '');
        assert.ok(isTar(buffer));
        done();
      });
    });
  });

  it('handle query string', (done) => {
    get(`${URL}/test/data/fixture.tar?param=value`).file(TARGET, (err) => {
      assert.ok(!err, err ? err.message : '');
      fs.readdir(TARGET, (err, files) => {
        assert.ok(!err, err ? err.message : '');
        assert.deepEqual(files.sort(), ['fixture.tar']);
        done();
      });
    });
  });

  it.skip('handle content dispositon', (done) => {
    get(`${URL}/test/data/fixture-tar`).file(TARGET, (err) => {
      assert.ok(!err, err ? err.message : '');
      fs.readdir(TARGET, (err, files) => {
        assert.ok(!err, err ? err.message : '');
        assert.deepEqual(files.sort(), ['fixture-tar.tar']);
        done();
      });
    });
  });

  it.skip('handle filename from file type', (done) => {
    get('http://foo.bar/filetype').file(TARGET, (err) => {
      assert.ok(!err, err ? err.message : '');
      fs.readdir(TARGET, (err, files) => {
        assert.ok(!err, err ? err.message : '');
        assert.deepEqual(files.sort(), ['filetype.tar']);
        done();
      });
    });
  });
});
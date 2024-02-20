const assert = require('assert');
const fs = require('fs');
const rimraf = require('rimraf');
const mkpath = require('mkpath');

const get = require('get-remote');

const constants = require('../lib/constants');
const TMP_DIR = constants.TMP_DIR;
const TARGET = constants.TARGET;
const URL = 'https://raw.githubusercontent.com/kmalakoff/get-remote/master';

describe('get-file', () => {
  beforeEach((callback) => {
    rimraf(TMP_DIR, () => {
      mkpath(TMP_DIR, callback);
    });
  });

  it('should get file over https', (done) => {
    get(`${URL}/package.json`).file(TARGET, (err) => {
      assert.ok(!err);
      const files = fs.readdirSync(TARGET);
      assert.ok(files.length === 1);
      done();
    });
  });

  it('should get file over http', (done) => {
    get(`${URL}/package.json`).file(TARGET, (err) => {
      assert.ok(!err);
      const files = fs.readdirSync(TARGET);
      assert.ok(files.length === 1);
      done();
    });
  });

  it('should support promises', (done) => {
    get(`${URL}/package.json`)
      .file(TARGET)
      .then((_stream) => {
        const files = fs.readdirSync(TARGET);
        assert.ok(files.length === 1);
        done();
      })
      .catch(done);
  });

  it('should get with progress', (done) => {
    const progressUpdates = [];
    function progress(update) {
      progressUpdates.push(update);
    }

    get(`${URL}/package.json`, { progress: progress }).file(TARGET, (err) => {
      assert.ok(!err);
      const files = fs.readdirSync(TARGET);
      assert.ok(files.length === 1);
      assert.ok(progressUpdates.length > 1);
      done();
    });
  });
});

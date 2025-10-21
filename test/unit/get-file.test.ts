import assert from 'assert';
import fs from 'fs';
import get from 'get-remote';
import mkdirp from 'mkdirp-classic';
import Pinkie from 'pinkie-promise';
import rimraf2 from 'rimraf2';

import { TARGET, TMP_DIR } from '../lib/constants.ts';

const URL = 'https://raw.githubusercontent.com/kmalakoff/get-remote/master';

describe('get-file', () => {
  (() => {
    // patch and restore promise
    if (typeof global === 'undefined') return;
    const globalPromise = global.Promise;
    before(() => {
      global.Promise = Pinkie;
    });
    after(() => {
      global.Promise = globalPromise;
    });
  })();

  beforeEach((callback) => {
    rimraf2(TMP_DIR, { disableGlob: true }, () => {
      mkdirp(TMP_DIR, callback);
    });
  });

  it('should get file over https', (done) => {
    get(`${URL}/package.json`).file(TARGET, (err?: Error) => {
      if (err) {
        done(err.message);
        return;
      }
      const files = fs.readdirSync(TARGET);
      assert.ok(files.length === 1);
      done();
    });
  });

  it('should get file over http', (done) => {
    get(`${URL}/package.json`).file(TARGET, (err?: Error) => {
      if (err) {
        done(err.message);
        return;
      }
      const files = fs.readdirSync(TARGET);
      assert.ok(files.length === 1);
      done();
    });
  });

  it('should support promises', async () => {
    await get(`${URL}/package.json`).file(TARGET);
    const files = fs.readdirSync(TARGET);
    assert.ok(files.length === 1);
  });

  it('should get with progress', (done) => {
    const progressUpdates = [];
    const progress = (update): undefined => {
      progressUpdates.push(update);
    };

    get(`${URL}/package.json`, { progress }).file(TARGET, (err?: Error) => {
      if (err) {
        done(err.message);
        return;
      }
      const files = fs.readdirSync(TARGET);
      assert.ok(files.length === 1);
      assert.ok(progressUpdates.length > 1);
      done();
    });
  });
});

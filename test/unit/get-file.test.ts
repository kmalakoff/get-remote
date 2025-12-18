import assert from 'assert';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import get from 'get-remote';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Pinkie from 'pinkie-promise';
import Queue from 'queue-cb';

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
    safeRm(TMP_DIR, () => {
      mkdirp(TMP_DIR, callback);
    });
  });

  it('should get file over https', (done) => {
    get(`${URL}/package.json`).file(TARGET, (err?: Error) => {
      if (err) {
        done(err);
        return;
      }
      const files = fs.readdirSync(TARGET);
      assert.ok(files.length === 1);
      done();
    });
  });

  it('should preserve query string in URLs', (done) => {
    // npm search API requires 'text' query param - returns error without it
    const url = 'https://registry.npmjs.org/-/v1/search?text=is-promise&size=1';
    get(url).file(TARGET, { filename: 'search-result.json' }, (err?: Error) => {
      if (err) {
        done(err);
        return;
      }
      const dest = path.join(TARGET, 'search-result.json');
      const content = JSON.parse(fs.readFileSync(dest, 'utf8'));
      // If query string was dropped, we'd get {error: "'text' query parameter is required"}
      assert.ok(content.objects, 'Should have search results (query string preserved)');
      assert.ok(content.objects.length > 0, 'Should have at least one result');
      assert.strictEqual(content.objects[0].package.name, 'is-promise');
      done();
    });
  });

  it('should get file over http', (done) => {
    get(`${URL}/package.json`).file(TARGET, (err?: Error) => {
      if (err) {
        done(err);
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
    const progress = (update): void => {
      progressUpdates.push(update);
    };

    get(`${URL}/package.json`, { progress }).file(TARGET, (err?: Error) => {
      if (err) {
        done(err);
        return;
      }
      const files = fs.readdirSync(TARGET);
      assert.ok(files.length === 1);
      assert.ok(progressUpdates.length > 1);
      done();
    });
  });

  it('should handle concurrent downloads to the same file without corruption', (done) => {
    const CONCURRENCY = 10;
    const dest = path.join(TARGET, 'package.json');
    let expectedSize = null;

    mkdirp(TARGET, (err) => {
      if (err) return done(err);

      // First, get the expected file size with a single download
      get(`${URL}/package.json`).file(TARGET, (err?: Error) => {
        if (err) return done(err);

        fs.stat(dest, (err, stats) => {
          if (err) return done(err);
          expectedSize = stats.size;

          // Now run concurrent downloads
          const queue = new Queue(CONCURRENCY);
          const errors = [];
          const sizes = [];

          for (let i = 0; i < CONCURRENCY; i++) {
            queue.defer((cb) => {
              get(`${URL}/package.json`).file(TARGET, (err?: Error) => {
                if (err) {
                  errors.push(err);
                  cb();
                  return;
                }
                // Check file size immediately after each download completes
                fs.stat(dest, (err, stats) => {
                  if (!err) sizes.push(stats.size);
                  cb();
                });
              });
            });
          }

          queue.await(() => {
            // All downloads should succeed (no errors)
            assert.equal(errors.length, 0, `Expected no errors but got: ${errors.map((e) => e.message).join(', ')}`);

            // All observed sizes should match expected (no truncation or corruption)
            const badSizes = sizes.filter((s) => s !== expectedSize);
            assert.equal(badSizes.length, 0, `File size inconsistent during concurrent writes. Expected ${expectedSize}, got sizes: ${sizes.join(', ')}`);

            // Final file should be valid JSON
            fs.readFile(dest, 'utf8', (err, contents) => {
              if (err) return done(err);

              try {
                const json = JSON.parse(contents);
                assert.ok(json.name, 'File should contain valid JSON with a name field');
                done();
              } catch (parseErr) {
                done(new Error(`File is corrupted or incomplete: ${parseErr.message}`));
              }
            });
          });
        });
      });
    });
  });

  it('should use atomic writes (temp file + rename)', (done) => {
    // Use a large file so we can observe the temp file during download
    const largeFileUrl = 'https://nodejs.org/dist/v22.12.0/node-v22.12.0-darwin-arm64.tar.gz';
    const expectedFilename = 'node-v22.12.0-darwin-arm64.tar.gz';

    mkdirp(TARGET, (err) => {
      if (err) return done(err);

      let sawTempFile = false;

      // Poll for temp file during download
      const interval = setInterval(() => {
        const files = fs.readdirSync(TARGET);
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          if (new RegExp(`^${expectedFilename}-\\d+$`).test(f)) {
            sawTempFile = true;
          }
          if (f === expectedFilename) {
            sawTempFile = true;
          }
        }
      }, 50);

      get(largeFileUrl).file(TARGET, (err?: Error) => {
        clearInterval(interval);

        if (err) return done(err);

        assert.ok(sawTempFile, 'Expected temp file to exist during download');

        // Final file should exist
        const dest = path.join(TARGET, expectedFilename);
        fs.stat(dest, (err) => {
          if (err) return done(err);
          done();
        });
      });
    });
  });
});

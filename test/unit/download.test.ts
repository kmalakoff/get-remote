import assert from 'assert';
import fs from 'fs';
import get, { fileType, getBasename } from 'get-remote';
import isTar from 'is-tar';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Pinkie from 'pinkie-promise';
import rimraf2 from 'rimraf2';

import { DATA_DIR, TARGET, TMP_DIR } from '../lib/constants.ts';
import streamToBuffer from '../lib/streamToBuffer.ts';
import validateFiles from '../lib/validateFiles.ts';

const URL = 'https://raw.githubusercontent.com/kmalakoff/get-remote/master';
const GITHUB_ARCHIVE_URL = 'https://github.com/kmalakoff/get-remote/archive/refs/heads/master.zip';

describe('download', () => {
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

  it('get as stream', (done) => {
    get(`${URL}/test/data/fixture.tar`).stream((err, stream) => {
      if (err) {
        done(err.message);
        return;
      }
      streamToBuffer(stream, (err, buffer) => {
        if (err) {
          done(err.message);
          return;
        }
        assert.ok(isTar(buffer));
        done();
      });
    });
  });

  it('get as promise', async () => {
    const stream = await get(`${URL}/test/data/fixture.tar`).stream();
    const buffer = await streamToBuffer(stream);
    assert.ok(isTar(buffer));
  });

  it('get a very large file', (done) => {
    get('https://nodejs.org/dist/v22.12.0/node-v22.12.0-darwin-arm64.tar.gz').stream((err, stream) => {
      if (err) {
        done(err.message);
        return;
      }
      streamToBuffer(stream, (err, buffer) => {
        if (err) {
          done(err.message);
          return;
        }
        assert.equal(buffer.length, 48568612);
        done();
      });
    });
  });

  it('get and rename file', (done) => {
    get(`${URL}/test/data/fixture.tar`).file(TARGET, { filename: 'bar.tar' }, (err?: Error) => {
      if (err) {
        done(err.message);
        return;
      }
      fs.readdir(TARGET, (err, files) => {
        if (err) {
          done(err.message);
          return;
        }
        assert.deepEqual(files.sort(), ['bar.tar']);
        done();
      });
    });
  });

  it('save file', (done) => {
    get(`${URL}/test/data/fixture.tar`).file(TARGET, (err?: Error) => {
      if (err) {
        done(err.message);
        return;
      }
      fs.readdir(TARGET, (err, files) => {
        if (err) {
          done(err.message);
          return;
        }
        assert.deepEqual(files.sort(), ['fixture.tar']);
        done();
      });
    });
  });

  it('extract file', (done) => {
    const options = { strip: 1 };
    get(`${URL}/test/data/fixture.tar`).extract(TARGET, options, (err?: Error) => {
      if (err) {
        done(err.message);
        return;
      }

      validateFiles(options, 'tar.gz', (err?: Error) => {
        if (err) {
          done(err.message);
          return;
        }
        done();
      });
    });
  });

  it('extract file that is not compressed', (done) => {
    get(`${URL}/test/data/fixture.js`).extract(TARGET, (err?: Error) => {
      if (err) {
        done(err.message);
        return;
      }

      fs.readdir(TARGET, (err, files) => {
        if (err) {
          done(err.message);
          return;
        }
        assert.deepEqual(files.sort(), ['fixture.js']);
        done();
      });
    });
  });

  it('error on 404', (done) => {
    get(`${URL}/test/data/404`).stream((err?: Error) => {
      assert.ok(err);
      assert.equal(err.message, 'Response code 404 (Not Found)');
      done();
    });
  });

  it('sanitize invalid filename characters', () => {
    // Test POSIX invalid characters are replaced with '!'
    // Note: ? is a query string delimiter in URLs, so it gets stripped not sanitized
    assert.equal(getBasename(null, {}, 'http://example.com/foo*bar.tar'), 'foo!bar.tar');
    assert.equal(getBasename(null, {}, 'http://example.com/foo<bar>.tar'), 'foo!bar!.tar');
    assert.equal(getBasename(null, {}, 'http://example.com/foo:bar.tar'), 'foo!bar.tar');
    assert.equal(getBasename(null, {}, 'http://example.com/foo"bar.tar'), 'foo!bar.tar');
    assert.equal(getBasename(null, {}, 'http://example.com/foo|bar.tar'), 'foo!bar.tar');

    // Test Windows reserved names are replaced
    assert.equal(getBasename(null, {}, 'http://example.com/con'), '!');
    assert.equal(getBasename(null, {}, 'http://example.com/prn'), '!');
    assert.equal(getBasename(null, {}, 'http://example.com/aux'), '!');
    assert.equal(getBasename(null, {}, 'http://example.com/nul'), '!');
    assert.equal(getBasename(null, {}, 'http://example.com/com1'), '!');
    assert.equal(getBasename(null, {}, 'http://example.com/lpt9'), '!');

    // Test query strings are stripped before sanitization
    assert.equal(getBasename(null, {}, 'http://example.com/file.tar?query=value'), 'file.tar');
  });

  it('follow redirects', (done) => {
    get(`${URL.replace('https', 'http')}/test/data/fixture.tar`).stream((err, stream) => {
      if (err) {
        done(err.message);
        return;
      }
      streamToBuffer(stream, (err, buffer) => {
        if (err) {
          done(err.message);
          return;
        }
        assert.ok(isTar(buffer));
        done();
      });
    });
  });

  it('follow redirect to https', (done) => {
    get(`${URL.replace('https', 'http')}/test/data/fixture.tar`).stream((err, stream) => {
      if (err) {
        done(err.message);
        return;
      }
      streamToBuffer(stream, (err, buffer) => {
        if (err) {
          done(err.message);
          return;
        }
        assert.ok(isTar(buffer));
        done();
      });
    });
  });

  it('handle query string', (done) => {
    get(`${URL}/test/data/fixture.tar?param=value`).file(TARGET, (err?: Error) => {
      if (err) {
        done(err.message);
        return;
      }
      fs.readdir(TARGET, (err, files) => {
        if (err) {
          done(err.message);
          return;
        }
        assert.deepEqual(files.sort(), ['fixture.tar']);
        done();
      });
    });
  });

  it('handle content disposition', (done) => {
    // GitHub archive downloads send Content-Disposition header with filename
    get(GITHUB_ARCHIVE_URL).stream((err, stream) => {
      if (err) {
        done(err.message);
        return;
      }
      // Verify the content-disposition header was received and parsed
      assert.ok(stream.headers['content-disposition'], 'Expected content-disposition header');
      assert.ok(stream.headers['content-disposition'].indexOf('get-remote-master.zip') !== -1, 'Expected filename in content-disposition');

      // Verify we can read the content as a zip
      streamToBuffer(stream, (err, buffer) => {
        if (err) {
          done(err.message);
          return;
        }
        const type = fileType(buffer);
        assert.ok(type && type.ext === 'zip', 'Expected zip content');
        done();
      });
    });
  });

  it('detect file type from magic bytes', (done) => {
    // Test that we can detect file types from content when URL has no extension
    // Using GitHub archive URL which returns a zip file
    get(GITHUB_ARCHIVE_URL).stream((err, stream) => {
      if (err) {
        done(err.message);
        return;
      }

      streamToBuffer(stream, (err, buffer) => {
        if (err) {
          done(err.message);
          return;
        }

        const result = fileType(buffer);
        assert.ok(result, 'Expected file type to be detected');
        assert.equal(result.ext, 'zip');
        assert.equal(result.mime, 'application/zip');
        done();
      });
    });
  });

  it('detect various archive types from magic bytes', () => {
    // Test file type detection with local test fixtures

    // Test ZIP
    const zipBuffer = fs.readFileSync(path.join(DATA_DIR, 'fixture.zip'));
    const zipResult = fileType(zipBuffer);
    assert.ok(zipResult, 'Expected zip to be detected');
    assert.equal(zipResult.ext, 'zip');

    // Test GZIP
    const gzBuffer = fs.readFileSync(path.join(DATA_DIR, 'fixture.tar.gz'));
    const gzResult = fileType(gzBuffer);
    assert.ok(gzResult, 'Expected gzip to be detected');
    assert.equal(gzResult.ext, 'gz');

    // Test BZIP2
    const bz2Buffer = fs.readFileSync(path.join(DATA_DIR, 'fixture.tar.bz2'));
    const bz2Result = fileType(bz2Buffer);
    assert.ok(bz2Result, 'Expected bzip2 to be detected');
    assert.equal(bz2Result.ext, 'bz2');

    // Test XZ
    const xzBuffer = fs.readFileSync(path.join(DATA_DIR, 'fixture.tar.xz'));
    const xzResult = fileType(xzBuffer);
    assert.ok(xzResult, 'Expected xz to be detected');
    assert.equal(xzResult.ext, 'xz');

    // Test TAR (uncompressed)
    const tarBuffer = fs.readFileSync(path.join(DATA_DIR, 'fixture.tar'));
    const tarResult = fileType(tarBuffer);
    assert.ok(tarResult, 'Expected tar to be detected');
    assert.equal(tarResult.ext, 'tar');
  });
});

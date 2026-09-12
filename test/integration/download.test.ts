import assert from 'assert';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import get, { fileType } from 'get-remote';
import isTar from 'is-tar';
import mkdirp from 'mkdirp-classic';
import Pinkie from 'pinkie-promise';

import { TARGET, TMP_DIR } from '../lib/constants.ts';
import streamToBuffer from '../lib/streamToBuffer.ts';
import validateFiles from '../lib/validateFiles.ts';

// Network access: this suite downloads live fixtures from GitHub and Node.js.
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
    safeRm(TMP_DIR, () => {
      mkdirp(TMP_DIR, callback);
    });
  });

  it('get as stream', (done) => {
    get(`${URL}/test/data/fixture.tar`).stream((err, stream) => {
      if (err) return done(err);
      if (!stream) return done(new Error('No stream'));
      streamToBuffer(stream, (err: Error | null, buffer: Buffer | undefined) => {
        if (err) return done(err);
        assert.ok(isTar(buffer as Buffer));
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
      if (err) return done(err);
      if (!stream) return done(new Error('No stream'));
      streamToBuffer(stream, (err: Error | null, buffer: Buffer | undefined) => {
        if (err) return done(err);
        const buf = buffer as Buffer;
        assert.ok(buf[0] === 0x1f && buf[1] === 0x8b, 'expected gzip magic bytes');
        assert.equal(buf.length, 48568612);
        done();
      });
    });
  });

  it('get and rename file', (done) => {
    get(`${URL}/test/data/fixture.tar`).file(TARGET, { filename: 'bar.tar' }, (err?: Error | null) => {
      if (err) return done(err);
      fs.readdir(TARGET, (err, files) => {
        if (err) return done(err);
        assert.deepEqual(files.sort(), ['bar.tar']);
        done();
      });
    });
  });

  it('save file', (done) => {
    get(`${URL}/test/data/fixture.tar`).file(TARGET, (err?: Error | null) => {
      if (err) return done(err);
      fs.readdir(TARGET, (err, files) => {
        if (err) return done(err);
        assert.deepEqual(files.sort(), ['fixture.tar']);
        done();
      });
    });
  });

  it('extract file', (done) => {
    const options = { strip: 1 };
    get(`${URL}/test/data/fixture.tar`).extract(TARGET, options, (err?: Error | null) => {
      if (err) return done(err);

      validateFiles(options, 'tar.gz', (err?: Error | null) => {
        if (err) return done(err);
        done();
      });
    });
  });

  it('extract file that is not compressed', (done) => {
    get(`${URL}/test/data/fixture.js`).extract(TARGET, (err?: Error | null) => {
      if (err) return done(err);

      fs.readdir(TARGET, (err, files) => {
        if (err) return done(err);
        assert.deepEqual(files.sort(), ['fixture.js']);
        done();
      });
    });
  });

  it('error on 404', (done) => {
    get(`${URL}/test/data/404`).stream((err?: Error | null) => {
      assert.ok(err);
      assert.equal(err.message, 'Response code 404 (Not Found)');
      done();
    });
  });

  it('follow redirects', (done) => {
    get(`${URL.replace('https', 'http')}/test/data/fixture.tar`).stream((err, stream) => {
      if (err) return done(err);
      if (!stream) return done(new Error('No stream'));
      streamToBuffer(stream, (err: Error | null, buffer: Buffer | undefined) => {
        if (err) return done(err);
        assert.ok(isTar(buffer as Buffer));
        done();
      });
    });
  });

  it('follow redirect to https', (done) => {
    get(`${URL.replace('https', 'http')}/test/data/fixture.tar`).stream((err, stream) => {
      if (err) return done(err);
      if (!stream) return done(new Error('No stream'));
      streamToBuffer(stream, (err: Error | null, buffer: Buffer | undefined) => {
        if (err) return done(err);
        assert.ok(isTar(buffer as Buffer));
        done();
      });
    });
  });

  it('handle query string', (done) => {
    get(`${URL}/test/data/fixture.tar?param=value`).file(TARGET, (err?: Error | null) => {
      if (err) return done(err);
      fs.readdir(TARGET, (err, files) => {
        if (err) return done(err);
        assert.deepEqual(files.sort(), ['fixture.tar']);
        done();
      });
    });
  });

  it('handle content disposition', (done) => {
    // GitHub archive downloads send Content-Disposition header with filename
    get(GITHUB_ARCHIVE_URL).stream((err, stream) => {
      if (err) return done(err);
      // Verify the content-disposition header was received and parsed
      if (!stream) return done(new Error('No stream'));
      const contentDisp = (stream.headers as Record<string, string>)['content-disposition'];
      assert.ok(contentDisp, 'Expected content-disposition header');
      assert.ok(contentDisp.indexOf('get-remote-master.zip') !== -1, 'Expected filename in content-disposition');

      // Verify we can read the content as a zip
      streamToBuffer(stream, (err: Error | null, buffer: Buffer | undefined) => {
        if (err) return done(err);
        const type = fileType(buffer as Buffer);
        assert.ok(type && type.ext === 'zip', 'Expected zip content');
        done();
      });
    });
  });

  it('detect file type from magic bytes', (done) => {
    // Test that we can detect file types from content when URL has no extension
    // Using GitHub archive URL which returns a zip file
    get(GITHUB_ARCHIVE_URL).stream((err, stream) => {
      if (err) return done(err);
      if (!stream) return done(new Error('No stream'));

      streamToBuffer(stream, (err: Error | null, buffer: Buffer | undefined) => {
        if (err) return done(err);

        const result = fileType(buffer as Buffer);
        assert.ok(result, 'Expected file type to be detected');
        assert.equal(result.ext, 'zip');
        assert.equal(result.mime, 'application/zip');
        done();
      });
    });
  });
});

import assert from 'assert';
import cr from 'cr';
import fs from 'fs';
// @ts-ignore
import get from 'get-remote';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Pinkie from 'pinkie-promise';
import rimraf2 from 'rimraf2';

import { DATA_DIR, TARGET, TMP_DIR } from '../lib/constants.ts';
import streamToBuffer from '../lib/streamToBuffer.ts';
import validateFiles from '../lib/validateFiles.ts';

const URL = 'https://raw.githubusercontent.com/kmalakoff/get-remote/master';
const FIXTURE_JSON = fs.readFileSync(path.join(DATA_DIR, 'fixture.json'), 'utf8');

describe('api', () => {
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

  describe('happy path', () => {
    it('should provide a stream method', (done) => {
      get(`${URL}/test/data/fixture.json`).stream((err, stream) => {
        if (err) {
          done(err.message);
          return;
        }

        streamToBuffer(stream, (err, buffer) => {
          if (err) {
            done(err.message);
            return;
          }
          assert.equal(cr(buffer.toString()), cr(FIXTURE_JSON));
          done();
        });
      });
    });

    it('should provide a stream method - promise', async () => {
      const stream = await get(`${URL}/test/data/fixture.json`).stream();
      const buffer = await streamToBuffer(stream);
      assert.equal(cr(buffer.toString()), cr(FIXTURE_JSON));
    });

    it('should provide a extract method', (done) => {
      const options = { strip: 1 };
      get(`${URL}/test/data/fixture.tar.gz`).extract(TARGET, options, (err?: Error) => {
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

    it('should provide a extract method - promise', (done) => {
      const options = { strip: 1 };
      get(`${URL}/test/data/fixture.tar.gz`)
        .extract(TARGET, options)
        .then(() => {
          validateFiles(options, 'tar.gz', (err?: Error) => {
            if (err) {
              done(err.message);
              return;
            }
            done();
          });
        })
        .catch(done);
    });

    it('should provide a file method', (done) => {
      get(`${URL}/test/data/fixture.json`).file(TARGET, (err?: Error) => {
        if (err) {
          done(err.message);
          return;
        }

        fs.readdir(TARGET, (err, files) => {
          if (err) {
            done(err.message);
            return;
          }
          assert.deepEqual(files.sort(), ['fixture.json']);
          assert.equal(cr(fs.readFileSync(path.join(TARGET, 'fixture.json'), 'utf8')), cr(FIXTURE_JSON));
          done();
        });
      });
    });

    it('should provide a file method - promise', (done) => {
      get(`${URL}/test/data/fixture.json`)
        .file(TARGET)
        .then(() => {
          fs.readdir(TARGET, (err, files) => {
            if (err) {
              done(err.message);
              return;
            }
            assert.deepEqual(files.sort(), ['fixture.json']);
            assert.equal(cr(fs.readFileSync(path.join(TARGET, 'fixture.json'), 'utf8')), cr(FIXTURE_JSON));
            done();
          });
        })
        .catch(done);
    });

    it('should provide a head method', (done) => {
      get(`${URL}/test/data/fixture.json`).head((err, res) => {
        if (err) {
          done(err.message);
          return;
        }
        assert.equal(res.statusCode, 200);
        assert.ok(!!res.headers);
        done();
      });
    });

    it('should provide a head method - promise', (done) => {
      get(`${URL}/test/data/fixture.json`)
        .head()
        .then((res) => {
          assert.equal(res.statusCode, 200);
          assert.ok(!!res.headers);
          done();
        })
        .catch(done);
    });

    it('should provide a json method', (done) => {
      get(`${URL}/test/data/fixture.json`).json((err, res) => {
        if (err) {
          done(err.message);
          return;
        }
        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, JSON.parse(FIXTURE_JSON));
        done();
      });
    });

    it('should provide a json method - promise', (done) => {
      get(`${URL}/test/data/fixture.json`)
        .json()
        .then((res) => {
          assert.equal(res.statusCode, 200);
          assert.deepEqual(res.body, JSON.parse(FIXTURE_JSON));
          done();
        })
        .catch(done);
    });

    it('should provide a pipe method', (done) => {
      mkdirp(TARGET, (err?: Error) => {
        if (err) {
          done(err.message);
          return;
        }

        get(`${URL}/test/data/fixture.json`).pipe(fs.createWriteStream(path.join(TARGET, 'fixture.json')), (err?: Error) => {
          if (err) {
            done(err.message);
            return;
          }
          assert.equal(cr(fs.readFileSync(path.join(TARGET, 'fixture.json'), 'utf8')), cr(FIXTURE_JSON));
          done();
        });
      });
    });

    it('should provide a pipe method - promise', (done) => {
      mkdirp(TARGET, (err?: Error) => {
        if (err) {
          done(err.message);
          return;
        }

        get(`${URL}/test/data/fixture.json`)
          .pipe(fs.createWriteStream(path.join(TMP_DIR, 'fixture.json')))
          .then(() => {
            assert.equal(cr(fs.readFileSync(path.join(TMP_DIR, 'fixture.json'), 'utf8')), cr(FIXTURE_JSON));
            done();
          })
          .catch(done);
      });
    });

    it('should provide a text method', (done) => {
      get(`${URL}/test/data/fixture.text`).text((err, res) => {
        if (err) {
          done(err.message);
          return;
        }
        assert.equal(res.statusCode, 200);
        assert.equal(cr(res.body), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.text'), 'utf8')));
        done();
      });
    });

    it('should provide a text method - promise', (done) => {
      get(`${URL}/test/data/fixture.text`)
        .text()
        .then((res) => {
          assert.equal(res.statusCode, 200);
          assert.equal(cr(res.body), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.text'), 'utf8')));
          done();
        })
        .catch(done);
    });
  });

  describe('unhappy path', () => {
    it('should fail to stream a missing endpoint', (done) => {
      get(`${URL}/test/data/fixture.json-junk`).stream((err?: Error) => {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to stream  a missing endpoint - promise', (done) => {
      get(`${URL}/test/data/fixture.json-junk`)
        .stream()
        .then(() => {
          assert.ok(false);
        })
        .catch((err?: Error) => {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to extract a missing endpoint', (done) => {
      get(`${URL}/test/data/fixture.tar.gz-junk`).extract(TARGET, { strip: 1 }, (err?: Error) => {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to extract a missing endpoint - promise', (done) => {
      get(`${URL}/test/data/fixture.tar.gz-junk`)
        .extract(TMP_DIR, { strip: 1 })
        .then(() => {
          assert.ok(false);
        })
        .catch((err?: Error) => {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to download file for a missing endpoint', (done) => {
      get(`${URL}/test/data/fixture.json-junk`).file(TARGET, (err?: Error) => {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to download file for a missing endpoint - promise', (done) => {
      get(`${URL}/test/data/fixture.json-junk`)
        .file(TMP_DIR)
        .then(() => {
          assert.ok(false);
        })
        .catch((err?: Error) => {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to head a missing endpoint', (done) => {
      get(`${URL}/test/data/fixture.json-junk`).head((err?: Error) => {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to head a missing endpoint - promise', (done) => {
      get(`${URL}/test/data/fixture.json-junk`)
        .head()
        .then(() => {
          assert.ok(false);
        })
        .catch((err?: Error) => {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to get json for a missing endpoint', (done) => {
      get(`${URL}/test/data/fixture.json-junk`).json((err?: Error) => {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to get json for a missing endpoint - promise', (done) => {
      get(`${URL}/test/data/fixture.json-junk`)
        .json()
        .then(() => {
          assert.ok(false);
        })
        .catch((err?: Error) => {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to pipe a missing endpoint', (done) => {
      get(`${URL}/test/data/fixture.json-junk`).pipe(fs.createWriteStream(path.join(TMP_DIR, 'fixture.json')), (err?: Error) => {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to pipe a missing endpoint - promise', (done) => {
      get(`${URL}/test/data/fixture.json-junk`)
        .pipe(fs.createWriteStream(path.join(TMP_DIR, 'fixture.json')))
        .then(() => {
          assert.ok(false);
        })
        .catch((err?: Error) => {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to get text for a missing endpoint', (done) => {
      get(`${URL}/test/data/fixture.text-junk`).text((err?: Error) => {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to get text for a missing endpoint - promise', (done) => {
      get(`${URL}/test/data/fixture.text-junk`)
        .text()
        .then(() => {
          assert.ok(false);
        })
        .catch((err?: Error) => {
          assert.ok(!!err);
          done();
        });
    });
  });
});

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const rimraf2 = require('rimraf2');
const mkpath = require('mkpath');
const cr = require('cr');

const get = require('get-remote');

const streamToBuffer = require('../lib/streamToBuffer');
const validateFiles = require('../lib/validateFiles');
const constants = require('../lib/constants');
const TMP_DIR = constants.TMP_DIR;
const TARGET = constants.TARGET;
const DATA_DIR = constants.DATA_DIR;
const URL = 'https://raw.githubusercontent.com/kmalakoff/get-remote/master';

describe('api', () => {
  beforeEach((callback) => {
    rimraf2(TMP_DIR, { disableGlob: true }, () => {
      mkpath(TMP_DIR, callback);
    });
  });

  describe('happy path', () => {
    it('should provide a stream method', (done) => {
      get(`${URL}/test/data/fixture.json`).stream((err, stream) => {
        assert.ok(!err, err ? err.message : '');

        streamToBuffer(stream, (err, buffer) => {
          assert.ok(!err, err ? err.message : '');
          assert.equal(cr(buffer.toString()), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.json'), 'utf8')));
          done();
        });
      });
    });

    it('should provide a stream method - promise', (done) => {
      get(`${URL}/test/data/fixture.json`)
        .stream()
        .then((stream) => {
          streamToBuffer(stream, (err, buffer) => {
            assert.ok(!err, err ? err.message : '');
            assert.equal(cr(buffer.toString()), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.json'), 'utf8')));
            done();
          });
        })
        .catch(done);
    });

    it('should provide a extract method', (done) => {
      const options = { strip: 1 };
      get(`${URL}/test/data/fixture.tar.gz`).extract(TARGET, options, (err) => {
        assert.ok(!err, err ? err.message : '');

        validateFiles(options, 'tar.gz', (err) => {
          assert.ok(!err, err ? err.message : '');
          done();
        });
      });
    });

    it('should provide a extract method - promise', (done) => {
      const options = { strip: 1 };
      get(`${URL}/test/data/fixture.tar.gz`)
        .extract(TARGET, options)
        .then(() => {
          validateFiles(options, 'tar.gz', (err) => {
            assert.ok(!err, err ? err.message : '');
            done();
          });
        })
        .catch(done);
    });

    it('should provide a file method', (done) => {
      get(`${URL}/test/data/fixture.json`).file(TARGET, (err) => {
        assert.ok(!err, err ? err.message : '');

        fs.readdir(TARGET, (err, files) => {
          assert.ok(!err, err ? err.message : '');
          assert.deepEqual(files.sort(), ['fixture.json']);
          assert.equal(cr(fs.readFileSync(path.join(TARGET, 'fixture.json'), 'utf8')), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.json'), 'utf8')));
          done();
        });
      });
    });

    it('should provide a file method - promise', (done) => {
      get(`${URL}/test/data/fixture.json`)
        .file(TARGET)
        .then(() => {
          fs.readdir(TARGET, (err, files) => {
            assert.ok(!err, err ? err.message : '');
            assert.deepEqual(files.sort(), ['fixture.json']);
            assert.equal(cr(fs.readFileSync(path.join(TARGET, 'fixture.json'), 'utf8')), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.json'), 'utf8')));
            done();
          });
        })
        .catch(done);
    });

    it('should provide a head method', (done) => {
      get(`${URL}/test/data/fixture.json`).head((err, res) => {
        assert.ok(!err, err ? err.message : '');
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
        assert.ok(!err, err ? err.message : '');
        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, require(path.join(DATA_DIR, 'fixture.json')));
        done();
      });
    });

    it('should provide a json method - promise', (done) => {
      get(`${URL}/test/data/fixture.json`)
        .json()
        .then((res) => {
          assert.equal(res.statusCode, 200);
          assert.deepEqual(res.body, require(path.join(DATA_DIR, 'fixture.json')));
          done();
        })
        .catch(done);
    });

    it('should provide a pipe method', (done) => {
      mkpath(TARGET, (err) => {
        assert.ok(!err, err ? err.message : '');

        get(`${URL}/test/data/fixture.json`).pipe(fs.createWriteStream(path.join(TARGET, 'fixture.json')), (err) => {
          assert.ok(!err, err ? err.message : '');
          assert.equal(cr(fs.readFileSync(path.join(TARGET, 'fixture.json'), 'utf8')), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.json'), 'utf8')));
          done();
        });
      });
    });

    it('should provide a pipe method - promise', (done) => {
      mkpath(TARGET, (err) => {
        assert.ok(!err, err ? err.message : '');

        get(`${URL}/test/data/fixture.json`)
          .pipe(fs.createWriteStream(path.join(TMP_DIR, 'fixture.json')))
          .then(() => {
            assert.equal(cr(fs.readFileSync(path.join(TMP_DIR, 'fixture.json'), 'utf8')), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.json'), 'utf8')));
            done();
          })
          .catch(done);
      });
    });

    it('should provide a text method', (done) => {
      get(`${URL}/test/data/fixture.text`).text((err, res) => {
        assert.ok(!err, err ? err.message : '');
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
      get(`${URL}/test/data/fixture.json-junk`).stream((err) => {
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
        .catch((err) => {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to extract a missing endpoint', (done) => {
      get(`${URL}/test/data/fixture.tar.gz-junk`).extract(TARGET, { strip: 1 }, (err) => {
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
        .catch((err) => {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to download file for a missing endpoint', (done) => {
      get(`${URL}/test/data/fixture.json-junk`).file(TARGET, (err) => {
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
        .catch((err) => {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to head a missing endpoint', (done) => {
      get(`${URL}/test/data/fixture.json-junk`).head((err) => {
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
        .catch((err) => {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to get json for a missing endpoint', (done) => {
      get(`${URL}/test/data/fixture.json-junk`).json((err) => {
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
        .catch((err) => {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to pipe a missing endpoint', (done) => {
      get(`${URL}/test/data/fixture.json-junk`).pipe(fs.createWriteStream(path.join(TMP_DIR, 'fixture.json')), (err) => {
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
        .catch((err) => {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to get text for a missing endpoint', (done) => {
      get(`${URL}/test/data/fixture.text-junk`).text((err) => {
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
        .catch((err) => {
          assert.ok(!!err);
          done();
        });
    });
  });
});

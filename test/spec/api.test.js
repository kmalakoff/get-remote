var assert = require('assert');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var mkpath = require('mkpath');
var semver = require('semver');

var get = require('../..');
var streamToBuffer = require('../lib/streamToBuffer');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));
var TARGET = path.resolve(path.join(TMP_DIR, 'target'));
var DATA_DIR = path.resolve(path.join(__dirname, '..', 'data'));

describe('api', function () {
  if (semver.lt(process.versions.node, 'v0.10.0')) return;

  // nock patch
  if (!Object.assign) Object.assign = require('object-assign');
  if (!require('timers').setImmediate) require('timers').setImmediate = require('next-tick');
  var nock = require('nock');
  var endpoint = null;

  before(function (callback) {
    endpoint = nock('http://api.com').persist();

    fs.readdir(DATA_DIR, function (err, names) {
      if (err) return callback(err);
      for (var index = 0; index < names.length; index++) {
        endpoint.get('/' + names[index]).replyWithFile(200, path.join(DATA_DIR, names[index]));
        endpoint.head('/' + names[index]).reply(200);
      }
      callback();
    });
  });

  beforeEach(function (callback) {
    rimraf(TMP_DIR, function (err) {
      if (err && err.code !== 'EEXIST') return callback(err);
      mkpath(TMP_DIR, callback);
    });
  });

  after(function () {
    endpoint.persist(false);
    endpoint = null;
  });

  describe('happy path', function () {
    it('should provide a stream method', function (done) {
      get('http://api.com/fixture.json').stream(function (err, stream) {
        assert.ok(!err);

        streamToBuffer(stream, function (err, buffer) {
          assert.ok(!err);
          assert.equal(buffer.toString(), fs.readFileSync(path.join(DATA_DIR, 'fixture.json')));
          done();
        });
      });
    });

    it('should provide a stream method - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      get('http://api.com/fixture.json')
        .stream()
        .then(function (stream) {
          streamToBuffer(stream, function (err, buffer) {
            assert.ok(!err);
            assert.equal(buffer.toString(), fs.readFileSync(path.join(DATA_DIR, 'fixture.json')));
            done();
          });
        })
        .catch(done);
    });

    it('should provide a extract method', function (done) {
      get('http://api.com/fixture.tar.gz').extract(TARGET, { strip: 1 }, function (err) {
        assert.ok(!err);

        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['file.txt', 'link']);
          assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'file.txt'));
          done();
        });
      });
    });

    it('should provide a extract method - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      get('http://api.com/fixture.tar.gz')
        .extract(TMP_DIR, { strip: 1 })
        .then(function () {
          fs.readdir(TMP_DIR, function (err, files) {
            assert.ok(!err);
            assert.deepEqual(files.sort(), ['file.txt', 'link']);
            assert.equal(fs.realpathSync(path.join(TMP_DIR, 'link')), path.join(TMP_DIR, 'file.txt'));
            done();
          });
        })
        .catch(done);
    });

    it('should provide a file method', function (done) {
      mkpath(TARGET, function (err) {
        assert.ok(!err);

        get('http://api.com/fixture.json').file(TARGET, function (err) {
          assert.ok(!err);

          fs.readdir(TARGET, function (err, files) {
            assert.ok(!err);
            assert.deepEqual(files.sort(), ['fixture.json']);
            assert.equal(fs.readFileSync(path.join(TARGET, 'fixture.json')).toString(), fs.readFileSync(path.join(DATA_DIR, 'fixture.json')).toString());
            done();
          });
        });
      });
    });

    it('should provide a file method - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      mkpath(TARGET, function (err) {
        assert.ok(!err);

        get('http://api.com/fixture.json')
          .file(TARGET)
          .then(function () {
            fs.readdir(TARGET, function (err, files) {
              assert.ok(!err);
              assert.deepEqual(files.sort(), ['fixture.json']);
              assert.equal(fs.readFileSync(path.join(TARGET, 'fixture.json')).toString(), fs.readFileSync(path.join(DATA_DIR, 'fixture.json')).toString());
              done();
            });
          })
          .catch(done);
      });
    });

    it('should provide a head method', function (done) {
      get('http://api.com/fixture.json').head(function (err, res) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        assert.ok(!!res.headers);
        done();
      });
    });

    it('should provide a head method - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      get('http://api.com/fixture.json')
        .head()
        .then(function (res) {
          assert.equal(res.statusCode, 200);
          assert.ok(!!res.headers);
          done();
        })
        .catch(done);
    });

    it('should provide a json method', function (done) {
      get('http://api.com/fixture.json').json(function (err, res) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, require(path.join(DATA_DIR, 'fixture.json')));
        done();
      });
    });

    it('should provide a json method - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      get('http://api.com/fixture.json')
        .json()
        .then(function (res) {
          assert.equal(res.statusCode, 200);
          assert.deepEqual(res.body, require(path.join(DATA_DIR, 'fixture.json')));
          done();
        })
        .catch(done);
    });

    it('should provide a pipe method', function (done) {
      mkpath(TARGET, function (err) {
        assert.ok(!err);

        get('http://api.com/fixture.json').pipe(fs.createWriteStream(path.join(TARGET, 'fixture.json')), function (err) {
          assert.ok(!err);
          assert.equal(fs.readFileSync(path.join(TARGET, 'fixture.json')).toString(), fs.readFileSync(path.join(DATA_DIR, 'fixture.json')).toString());
          done();
        });
      });
    });

    it('should provide a pipe method - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      mkpath(TARGET, function (err) {
        assert.ok(!err);

        get('http://api.com/fixture.json')
          .pipe(fs.createWriteStream(path.join(TMP_DIR, 'fixture.json')))
          .then(function () {
            assert.equal(fs.readFileSync(path.join(TMP_DIR, 'fixture.json')).toString(), fs.readFileSync(path.join(DATA_DIR, 'fixture.json')).toString());
            done();
          })
          .catch(done);
      });
    });

    it('should provide a text method', function (done) {
      get('http://api.com/fixture.text').text(function (err, res) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body, fs.readFileSync(path.join(DATA_DIR, 'fixture.text')));
        done();
      });
    });

    it('should provide a text method - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      get('http://api.com/fixture.text')
        .text()
        .then(function (res) {
          assert.equal(res.statusCode, 200);
          assert.equal(res.body, fs.readFileSync(path.join(DATA_DIR, 'fixture.text')));
          done();
        })
        .catch(done);
    });
  });

  describe('unhappy path', function () {
    it('should fail to stream a missing endpoint', function (done) {
      get('http://api.com/fixture.json-junk').stream(function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to stream  a missing endpoint - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      get('http://api.com/fixture.json-junk')
        .stream()
        .then(function () {
          assert.ok(false);
        })
        .catch(function (err) {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to extract a missing endpoint', function (done) {
      get('http://api.com/fixture.tar.gz-junk').extract(TARGET, { strip: 1 }, function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to extract a missing endpoint - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      get('http://api.com/fixture.tar.gz-junk')
        .extract(TMP_DIR, { strip: 1 })
        .then(function () {
          assert.ok(false);
        })
        .catch(function (err) {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to download file for a missing endpoint', function (done) {
      get('http://api.com/fixture.json-junk').file(TARGET, function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to download file for a missing endpoint - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      get('http://api.com/fixture.json-junk')
        .file(TMP_DIR)
        .then(function () {
          assert.ok(false);
        })
        .catch(function (err) {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to head a missing endpoint', function (done) {
      get('http://api.com/fixture.json-junk').head(function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to head a missing endpoint - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      get('http://api.com/fixture.json-junk')
        .head()
        .then(function () {
          assert.ok(false);
        })
        .catch(function (err) {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to get json for a missing endpoint', function (done) {
      get('http://api.com/fixture.json-junk').json(function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to get json for a missing endpoint - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      get('http://api.com/fixture.json-junk')
        .json()
        .then(function () {
          assert.ok(false);
        })
        .catch(function (err) {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to pipe a missing endpoint', function (done) {
      get('http://api.com/fixture.json-junk').pipe(fs.createWriteStream(path.join(TARGET, 'fixture.json')), function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to pipe a missing endpoint - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      get('http://api.com/fixture.json-junk')
        .pipe(fs.createWriteStream(path.join(TMP_DIR, 'fixture.json')))
        .then(function () {
          assert.ok(false);
        })
        .catch(function (err) {
          assert.ok(!!err);
          done();
        });
    });

    it('should fail to get text for a missing endpoint', function (done) {
      get('http://api.com/fixture.text-junk').text(function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to get text for a missing endpoint - promise', function (done) {
      if (typeof Promise === 'undefined') return done();

      get('http://api.com/fixture.text-junk')
        .text()
        .then(function () {
          assert.ok(false);
        })
        .catch(function (err) {
          assert.ok(!!err);
          done();
        });
    });
  });
});

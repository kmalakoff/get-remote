var assert = require('assert');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var mkpath = require('mkpath');
var cr = require('cr');

var get = require('../..');

var streamToBuffer = require('../lib/streamToBuffer');
var validateFiles = require('../lib/validateFiles');
var constants = require('../lib/constants');
var TMP_DIR = constants.TMP_DIR;
var TARGET = constants.TARGET;
var DATA_DIR = constants.DATA_DIR;
var URL = 'https://raw.githubusercontent.com/kmalakoff/get-remote/master';

describe('api', function () {
  beforeEach(function (callback) {
    rimraf(TMP_DIR, function () {
      mkpath(TMP_DIR, callback);
    });
  });

  describe('happy path', function () {
    it('should provide a stream method', function (done) {
      get(URL + '/test/data/fixture.json').stream(function (err, stream) {
        assert.ok(!err);

        streamToBuffer(stream, function (err, buffer) {
          assert.ok(!err);
          assert.equal(cr(buffer.toString()), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.json'), 'utf8')));
          done();
        });
      });
    });

    it('should provide a stream method - promise', function (done) {
      get(URL + '/test/data/fixture.json')
        .stream()
        .then(function (stream) {
          streamToBuffer(stream, function (err, buffer) {
            assert.ok(!err);
            assert.equal(cr(buffer.toString()), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.json'), 'utf8')));
            done();
          });
        })
        .catch(done);
    });

    it('should provide a extract method', function (done) {
      var options = { strip: 1 };
      get(URL + '/test/data/fixture.tar.gz').extract(TARGET, options, function (err) {
        assert.ok(!err);

        validateFiles(options, 'tar.gz', function (err) {
          assert.ok(!err);
          done();
        });
      });
    });

    it('should provide a extract method - promise', function (done) {
      var options = { strip: 1 };
      get(URL + '/test/data/fixture.tar.gz')
        .extract(TARGET, options)
        .then(function () {
          validateFiles(options, 'tar.gz', function (err) {
            assert.ok(!err);
            done();
          });
        })
        .catch(done);
    });

    it('should provide a file method', function (done) {
      get(URL + '/test/data/fixture.json').file(TARGET, function (err) {
        assert.ok(!err);

        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['fixture.json']);
          assert.equal(cr(fs.readFileSync(path.join(TARGET, 'fixture.json'), 'utf8')), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.json'), 'utf8')));
          done();
        });
      });
    });

    it('should provide a file method - promise', function (done) {
      get(URL + '/test/data/fixture.json')
        .file(TARGET)
        .then(function () {
          fs.readdir(TARGET, function (err, files) {
            assert.ok(!err);
            assert.deepEqual(files.sort(), ['fixture.json']);
            assert.equal(cr(fs.readFileSync(path.join(TARGET, 'fixture.json'), 'utf8')), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.json'), 'utf8')));
            done();
          });
        })
        .catch(done);
    });

    it('should provide a head method', function (done) {
      get(URL + '/test/data/fixture.json').head(function (err, res) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        assert.ok(!!res.headers);
        done();
      });
    });

    it('should provide a head method - promise', function (done) {
      get(URL + '/test/data/fixture.json')
        .head()
        .then(function (res) {
          assert.equal(res.statusCode, 200);
          assert.ok(!!res.headers);
          done();
        })
        .catch(done);
    });

    it('should provide a json method', function (done) {
      get(URL + '/test/data/fixture.json').json(function (err, res) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, require(path.join(DATA_DIR, 'fixture.json')));
        done();
      });
    });

    it('should provide a json method - promise', function (done) {
      get(URL + '/test/data/fixture.json')
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

        get(URL + '/test/data/fixture.json').pipe(fs.createWriteStream(path.join(TARGET, 'fixture.json')), function (err) {
          assert.ok(!err);
          assert.equal(cr(fs.readFileSync(path.join(TARGET, 'fixture.json'), 'utf8')), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.json'), 'utf8')));
          done();
        });
      });
    });

    it('should provide a pipe method - promise', function (done) {
      mkpath(TARGET, function (err) {
        assert.ok(!err);

        get(URL + '/test/data/fixture.json')
          .pipe(fs.createWriteStream(path.join(TMP_DIR, 'fixture.json')))
          .then(function () {
            assert.equal(cr(fs.readFileSync(path.join(TMP_DIR, 'fixture.json'), 'utf8')), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.json'), 'utf8')));
            done();
          })
          .catch(done);
      });
    });

    it('should provide a text method', function (done) {
      get(URL + '/test/data/fixture.text').text(function (err, res) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        assert.equal(cr(res.body), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.text'), 'utf8')));
        done();
      });
    });

    it('should provide a text method - promise', function (done) {
      get(URL + '/test/data/fixture.text')
        .text()
        .then(function (res) {
          assert.equal(res.statusCode, 200);
          assert.equal(cr(res.body), cr(fs.readFileSync(path.join(DATA_DIR, 'fixture.text'), 'utf8')));
          done();
        })
        .catch(done);
    });
  });

  describe('unhappy path', function () {
    it('should fail to stream a missing endpoint', function (done) {
      get(URL + '/test/data/fixture.json-junk').stream(function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to stream  a missing endpoint - promise', function (done) {
      get(URL + '/test/data/fixture.json-junk')
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
      get(URL + '/test/data/fixture.tar.gz-junk').extract(TARGET, { strip: 1 }, function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to extract a missing endpoint - promise', function (done) {
      get(URL + '/test/data/fixture.tar.gz-junk')
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
      get(URL + '/test/data/fixture.json-junk').file(TARGET, function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to download file for a missing endpoint - promise', function (done) {
      get(URL + '/test/data/fixture.json-junk')
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
      get(URL + '/test/data/fixture.json-junk').head(function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to head a missing endpoint - promise', function (done) {
      get(URL + '/test/data/fixture.json-junk')
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
      get(URL + '/test/data/fixture.json-junk').json(function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to get json for a missing endpoint - promise', function (done) {
      get(URL + '/test/data/fixture.json-junk')
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
      get(URL + '/test/data/fixture.json-junk').pipe(fs.createWriteStream(path.join(TMP_DIR, 'fixture.json')), function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to pipe a missing endpoint - promise', function (done) {
      get(URL + '/test/data/fixture.json-junk')
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
      get(URL + '/test/data/fixture.text-junk').text(function (err) {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail to get text for a missing endpoint - promise', function (done) {
      get(URL + '/test/data/fixture.text-junk')
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

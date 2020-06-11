var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var mkpath = require('mkpath');
var contentDisposition = require('content-disposition');
var isTar = require('is-tar');
var randomBuffer = require('random-buffer');
var semver = require('semver');

var streamToBuffer = require('../lib/streamToBuffer');

var get = require('../..');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));
var TARGET = path.resolve(path.join(TMP_DIR, 'target'));

describe('download', function () {
  if (semver.lt(process.versions.node, 'v0.10.0')) return;

  // nock patch
  if (!Object.assign) Object.assign = require('object-assign');
  if (!require('timers').setImmediate) require('timers').setImmediate = require('next-tick');
  var nock = require('nock');
  var scope1 = null;
  var scope2 = null;

  before(function () {
    var fixturePath = path.join(__dirname, '..', 'data', 'fixture.tar');

    scope1 = nock('http://foo.bar')
      .persist()
      .get('/404')
      .reply(404)
      .get('/foo.tar')
      .replyWithFile(200, fixturePath)
      .get('/foo.js')
      .replyWithFile(200, __filename)
      .get('/querystring.tar')
      .query({ param: 'value' })
      .replyWithFile(200, fixturePath)
      .get('/dispo')
      .replyWithFile(200, fixturePath, {
        'Content-Disposition': contentDisposition('dispo.tar'),
      })
      .get('/foo*bar.tar')
      .replyWithFile(200, fixturePath)
      .get('/large.bin')
      .reply(200, randomBuffer(7928260))
      .get('/redirect.tar')
      .reply(302, null, { location: 'http://foo.bar/foo.tar' })
      .get('/redirect-https.tar')
      .reply(301, null, { location: 'https://foo.bar/foo-https.tar' })
      .get('/filetype')
      .replyWithFile(200, fixturePath);

    scope2 = nock('https://foo.bar').persist().get('/foo-https.tar').replyWithFile(200, fixturePath);
  });

  beforeEach(function (callback) {
    rimraf(TMP_DIR, function (err) {
      if (err && err.code !== 'EEXIST') return callback(err);
      mkpath(TMP_DIR, callback);
    });
  });

  after(function () {
    scope1.persist(false);
    scope1 = null;
    scope2.persist(false);
    scope2 = null;
  });

  it('get as stream', function (done) {
    get('http://foo.bar/foo.tar').stream(function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.ok(isTar(buffer));
        done();
      });
    });
  });

  it.skip('get as promise', function (done) {
    get('http://foo.bar/foo.tar').stream(function (err, stream) {
      assert.ok(!err);
      assert.ok(isTar(stream));
      done();
    });
  });

  it('get a very large file', function (done) {
    get('http://foo.bar/large.bin').stream(function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.equal(buffer.length, 7928260);
        done();
      });
    });
  });

  it('get and rename file', function (done) {
    mkpath(TARGET, function (err) {
      assert.ok(!err);

      get('http://foo.bar/foo.tar').file(TARGET, { filename: 'bar.tar' }, function (err) {
        assert.ok(!err);
        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['bar.tar']);
          done();
        });
      });
    });
  });

  it('save file', function (done) {
    mkpath(TARGET, function (err) {
      assert.ok(!err);

      get('http://foo.bar/foo.tar').file(TARGET, function (err) {
        assert.ok(!err);
        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['foo.tar']);
          done();
        });
      });
    });
  });

  it('extract file', function (done) {
    get('http://foo.bar/foo.tar').extract(TARGET, { strip: 1 }, function (err) {
      assert.ok(!err);

      fs.readdir(TARGET, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['file.txt', 'link']);
        assert.equal(fs.realpathSync(path.join(TARGET, 'link')), path.join(TARGET, 'file.txt'));
        done();
      });
    });
  });

  it('extract file that is not compressed', function (done) {
    get('http://foo.bar/foo.js').extract(TARGET, function (err) {
      assert.ok(!err);

      fs.readdir(TARGET, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['foo.js']);
        done();
      });
    });
  });

  it('error on 404', function (done) {
    get('http://foo.bar/404').stream(function (err) {
      assert.ok(err);
      assert.equal(err.message, 'Response code 404 (Not Found)');
      done();
    });
  });

  it('rename to valid filename', function (done) {
    mkpath(TARGET, function (err) {
      assert.ok(!err);

      get('http://foo.bar/foo*bar.tar').file(TARGET, function (err) {
        assert.ok(!err);
        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['foo!bar.tar']);
          done();
        });
      });
    });
  });

  it('follow redirects', function (done) {
    get('http://foo.bar/redirect.tar').stream(function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.ok(isTar(buffer));
        done();
      });
    });
  });

  it('follow redirect to https', function (done) {
    get('http://foo.bar/redirect-https.tar').stream(function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.ok(isTar(buffer));
        done();
      });
    });
  });

  it('handle query string', function (done) {
    mkpath(TARGET, function (err) {
      assert.ok(!err);

      get('http://foo.bar/querystring.tar?param=value').file(TARGET, function (err) {
        assert.ok(!err);
        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['querystring.tar']);
          done();
        });
      });
    });
  });

  it('handle content dispositon', function (done) {
    mkpath(TARGET, function (err) {
      assert.ok(!err);

      get('http://foo.bar/dispo').file(TARGET, function (err) {
        assert.ok(!err);
        fs.readdir(TARGET, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['dispo.tar']);
          done();
        });
      });
    });
  });

  it.skip('handle filename from file type', function (done) {
    get('http://foo.bar/filetype').file(TARGET, function (err) {
      assert.ok(!err);
      fs.readdir(TARGET, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['filetype.tar']);
        done();
      });
    });
  });
});

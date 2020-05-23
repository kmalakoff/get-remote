var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp-classic');
var contentDisposition = require('content-disposition');
var isZip = require('is-zip');
var randomBuffer = require('random-buffer');
var semver = require('semver');

var streamToBuffer = require('../lib/streamToBuffer');

var download = require('../..');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

describe('download', function () {
  if (semver.lt(process.versions.node, 'v0.10.0')) return;

  // nock patch
  if (!Object.assign) Object.assign = require('object-assign');
  var nock = require('nock');

  beforeEach(function (done) {
    rimraf(TMP_DIR, function () {
      mkdirp(TMP_DIR, done);
    });
  });

  before(function () {
    var fixturePath = path.join(__dirname, '..', 'data', 'fixture.zip');

    nock('http://foo.bar')
      .persist()
      .get('/404')
      .reply(404)
      .get('/foo.zip')
      .replyWithFile(200, fixturePath)
      .get('/foo.js')
      .replyWithFile(200, __filename)
      .get('/querystring.zip')
      .query({ param: 'value' })
      .replyWithFile(200, fixturePath)
      .get('/dispo')
      .replyWithFile(200, fixturePath, {
        'Content-Disposition': contentDisposition('dispo.zip'),
      })
      .get('/foo*bar.zip')
      .replyWithFile(200, fixturePath)
      .get('/large.bin')
      .reply(200, randomBuffer(7928260))
      .get('/redirect.zip')
      .reply(302, null, { location: 'http://foo.bar/foo.zip' })
      .get('/redirect-https.zip')
      .reply(301, null, { location: 'https://foo.bar/foo-https.zip' })
      .get('/filetype')
      .replyWithFile(200, fixturePath);

    nock('https://foo.bar').persist().get('/foo-https.zip').replyWithFile(200, fixturePath);
  });

  it('download as stream', function (done) {
    download('http://foo.bar/foo.zip', function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.ok(isZip(buffer));
        done();
      });
    });
  });

  it.skip('download as promise', function (done) {
    download('http://foo.bar/foo.zip', function (err, stream) {
      assert.ok(!err);
      assert.ok(isZip(stream));
      done();
    });
  });

  it('download a very large file', function (done) {
    download('http://foo.bar/large.bin', function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.equal(buffer.length, 7928260);
        done();
      });
    });
  });

  it('download and rename file', function (done) {
    download('http://foo.bar/foo.zip', TMP_DIR, { filename: 'bar.zip' }, function (err) {
      assert.ok(!err);
      fs.readdir(TMP_DIR, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['bar.zip']);
        done();
      });
    });
  });

  it('save file', function (done) {
    download('http://foo.bar/foo.zip', TMP_DIR, function (err) {
      assert.ok(!err);
      fs.readdir(TMP_DIR, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['foo.zip']);
        done();
      });
    });
  });

  it('extract file', function (done) {
    download('http://foo.bar/foo.zip', TMP_DIR, { extract: true, strip: 1 }, function (err) {
      assert.ok(!err);
      fs.readdir(path.join(TMP_DIR, 'data'), function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['file.txt', 'link']);
        done();
      });
    });
  });

  it('extract file that is not compressed', function (done) {
    download('http://foo.bar/foo.js', TMP_DIR, { extract: true }, function (err) {
      assert.ok(!err);
      fs.readdir(TMP_DIR, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['foo.js']);
        done();
      });
    });
  });

  it('error on 404', function (done) {
    download('http://foo.bar/404', function (err) {
      assert.ok(err);
      assert.equal(err.message, 'Response code 404 (Not Found)');
      done();
    });
  });

  it('rename to valid filename', function (done) {
    download('http://foo.bar/foo*bar.zip', TMP_DIR, function (err) {
      assert.ok(!err);
      fs.readdir(TMP_DIR, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['foo!bar.zip']);
        done();
      });
    });
  });

  it('follow redirects', function (done) {
    download('http://foo.bar/redirect.zip', function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.ok(isZip(buffer));
        done();
      });
    });
  });

  it('follow redirect to https', function (done) {
    download('http://foo.bar/redirect-https.zip', function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.ok(isZip(buffer));
        done();
      });
    });
  });

  it('handle query string', function (done) {
    download('http://foo.bar/querystring.zip?param=value', TMP_DIR, function (err) {
      assert.ok(!err);
      fs.readdir(TMP_DIR, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['querystring.zip']);
        done();
      });
    });
  });

  it('handle content dispositon', function (done) {
    download('http://foo.bar/dispo', TMP_DIR, function (err) {
      assert.ok(!err);
      fs.readdir(TMP_DIR, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['dispo.zip']);
        done();
      });
    });
  });

  it.skip('handle filename from file type', function (done) {
    download('http://foo.bar/filetype', TMP_DIR, function (err) {
      assert.ok(!err);
      fs.readdir(TMP_DIR, function (err, files) {
        assert.ok(!err);
        assert.deepEqual(files.sort(), ['filetype.zip']);
        done();
      });
    });
  });
});

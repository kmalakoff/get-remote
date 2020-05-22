var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp-classic');
var contentDisposition = require('content-disposition');
var isZip = require('is-zip');
var nock = require('nock');
var randomBuffer = require('random-buffer');
var semver = require('semver');

var access = require('../lib/access');
var streamToBuffer = require('../lib/streamToBuffer');

var m = require('../..');

// // nock patches
// if (!require('timers').setImmediate) {
//   require('setimmediate');
//   require('timers').setImmediate = global.setImmediate;
// }

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

describe('download', function () {
  if (semver.lt(process.versions.node, 'v0.10.0')) return;
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
      .reply(301, null, { location: 'https://foo.bar/foo-https.zip' });
    // .get('/filetype')
    // .replyWithFile(200, fixturePath);

    nock('https://foo.bar').persist().get('/foo-https.zip').replyWithFile(200, fixturePath);
  });

  it('download as stream', function (done) {
    m('http://foo.bar/foo.zip', function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.ok(isZip(buffer));
        done();
      });
    });
  });

  // it('download as promise', function (done) {
  //   m('http://foo.bar/foo.zip', function (err, stream) {
  //     assert.ok(!err);
  //     assert.ok(isZip(stream));
  //     done();
  //   });

  //   // t.true(isZip(await m('http://foo.bar/foo.zip')));
  // });

  it('download a very large file', function (done) {
    m('http://foo.bar/large.bin', function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.equal(buffer.length, 7928260);
        done();
      });
    });
  });

  it('download and rename file', function (done) {
    m('http://foo.bar/foo.zip', TMP_DIR, { filename: 'bar.zip' }, function (err) {
      assert.ok(!err);
      access(path.join(TMP_DIR, 'bar.zip'), function (err) {
        assert.ok(!err);
        fs.unlink(path.join(TMP_DIR, 'bar.zip'), done);
      });
    });
  });

  it('save file', function (done) {
    m('http://foo.bar/foo.zip', TMP_DIR, function (err) {
      assert.ok(!err);
      access(path.join(TMP_DIR, 'foo.zip'), function (err) {
        assert.ok(!err);
        fs.unlink(path.join(TMP_DIR, 'foo.zip'), done);
      });
    });
  });

  // it('extract file', function (done) {
  //   await m('http://foo.bar/foo.zip', TMP_DIR, { extract: true });
  //   t.true(await pathExists(path.join(TMP_DIR, 'file.txt')));
  //   await fsP.unlink(path.join(TMP_DIR, 'file.txt'));
  // });

  // it('extract file that is not compressed', function (done) {
  //   await m('http://foo.bar/foo.js', TMP_DIR, { extract: true });
  //   t.true(await pathExists(path.join(TMP_DIR, 'foo.js')));
  //   await fsP.unlink(path.join(TMP_DIR, 'foo.js'));
  // });

  it('error on 404', function (done) {
    m('http://foo.bar/404', function (err) {
      assert.ok(err);
      assert.equal(err.message, 'Response code 404 (Not Found)');
      done();
    });
  });

  it('rename to valid filename', function (done) {
    m('http://foo.bar/foo*bar.zip', TMP_DIR, function (err) {
      assert.ok(!err);
      access(path.join(TMP_DIR, 'foo!bar.zip'), function (err) {
        assert.ok(!err);
        fs.unlink(path.join(TMP_DIR, 'foo!bar.zip'), done);
      });
    });
  });

  it('follow redirects', function (done) {
    m('http://foo.bar/redirect.zip', function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.ok(isZip(buffer));
        done();
      });
    });
  });

  it('follow redirect to https', function (done) {
    m('http://foo.bar/redirect-https.zip', function (err, stream) {
      assert.ok(!err);
      streamToBuffer(stream, function (err, buffer) {
        assert.ok(!err);
        assert.ok(isZip(buffer));
        done();
      });
    });
  });

  it('handle query string', function (done) {
    m('http://foo.bar/querystring.zip?param=value', TMP_DIR, function (err) {
      assert.ok(!err);
      access(path.join(TMP_DIR, 'querystring.zip'), function (err) {
        assert.ok(!err);
        fs.unlink(path.join(TMP_DIR, 'querystring.zip'), done);
      });
    });
  });

  it('handle content dispositon', function (done) {
    m('http://foo.bar/dispo', TMP_DIR, function (err) {
      assert.ok(!err);
      access(path.join(TMP_DIR, 'dispo.zip'), function (err) {
        assert.ok(!err);
        fs.unlink(path.join(TMP_DIR, 'dispo.zip'), done);
      });
    });
  });

  // it('handle filename = require(file type', function (done) {
  //   m('http://foo.bar/filetype', TMP_DIR, function (err) {
  //     assert.ok(!err);
  //     access(path.join(TMP_DIR, 'filetype.zip'), function (err) {
  //       assert.ok(!err);
  //       fs.unlink(path.join(TMP_DIR, 'filetype.zip'), done);
  //     });
  //   });
  // });
});

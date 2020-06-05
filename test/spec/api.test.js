var assert = require('assert');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var mkpath = require('mkpath');
var semver = require('semver');

var download = require('../..');
var streamToBuffer = require('../lib/streamToBuffer');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));
var DATA_DIR = path.resolve(path.join(__dirname, '..', 'data'));

describe.only('api', function () {
  if (semver.lt(process.versions.node, 'v0.10.0')) return;

  // nock patch
  if (!Object.assign) Object.assign = require('object-assign');
  if (!require('timers').setImmediate) require('timers').setImmediate = require('next-tick');
  var nock = require('nock');

  beforeEach(function (done) {
    rimraf(TMP_DIR, function () {
      mkpath(TMP_DIR, done);
    });
  });

  before(function (done) {
    var endpoint = nock('http://api.com').persist();

    fs.readdir(DATA_DIR, function (err, names) {
      if (err) return done(err);
      for (var index = 0; index < names.length; index++) endpoint.get('/' + names[index]).replyWithFile(200, path.join(DATA_DIR, names[index]));
      done();
    });
  });

  describe('happy path', function () {
    it('should provide a stream method', function (done) {
      download('http://api.com/fixture.json').stream(function (err, stream) {
        assert.ok(!err);

        streamToBuffer(stream, function (err, buffer) {
          assert.ok(!err);
          assert.ok(buffer.toString(), require(path.join(DATA_DIR, 'fixture.json')));
          done();
        });
      });
    });

    it('should provide a extract method', function (done) {
      download('http://api.com/fixture.tar.gz').extract(TMP_DIR, { strip: 1 }, function (err) {
        assert.ok(!err);

        fs.readdir(TMP_DIR, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['file.txt', 'link']);
          assert.equal(fs.realpathSync(path.join(TMP_DIR, 'link')), path.join(TMP_DIR, 'file.txt'));
          done();
        });
      });
    });

    it('should provide a file method', function (done) {
      download('http://api.com/fixture.json').file(TMP_DIR, function (err) {
        assert.ok(!err);

        fs.readdir(TMP_DIR, function (err, files) {
          assert.ok(!err);
          assert.deepEqual(files.sort(), ['fixture.json']);
          assert.ok(require(path.join(TMP_DIR, 'fixture.json')), require(path.join(DATA_DIR, 'fixture.json')));
          done();
        });
      });
    });

    it('should provide a head method', function (done) {
      download('http://api.com/fixture.json').head(function (err, res) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        assert.ok(!!res.headers);
        done();
      });
    });

    it('should provide a json method', function (done) {
      download('http://api.com/fixture.json').json(function (err, res) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        assert.ok(res.body, require(path.join(DATA_DIR, 'fixture.json')));
        done();
      });
    });

    it('should provide a pipe method', function (done) {
      download('http://api.com/fixture.json').pipe(fs.createWriteStream(path.join(TMP_DIR, 'fixture.json')), function (err) {
        assert.ok(!err);
        assert.ok(require(path.join(TMP_DIR, 'fixture.json')), require(path.join(DATA_DIR, 'fixture.json')));
        done();
      });
    });

    it('should provide a text method', function (done) {
      download('http://api.com/fixture.text').text(function (err, res) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        assert.ok(res.body, fs.readFileSync(path.join(DATA_DIR, 'fixture.text')));
        done();
      });
    });
  });

  describe('unhappy path', function () {});
});

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');

var download = require('../..');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

describe('download', function () {
  beforeEach(rimraf.bind(null, TMP_DIR));
  after(rimraf.bind(null, TMP_DIR));

  it('should download over https', function (done) {
    var fullPath = path.join(TMP_DIR, 'node-tests-data');
    download('https://codeload.github.com/kmalakoff/node-tests-data/zip/v1.0.0', fullPath, { extract: true, strip: 1 }, function (err) {
      assert.ok(!err);
      var files = fs.readdirSync(fullPath);
      assert.ok(files.length > 1);
      done();
    });
  });

  it('should download over https', function (done) {
    var fullPath = path.join(TMP_DIR, 'install.ps1');
    download('https://raw.githubusercontent.com/jchip/nvm/v1.3.1/install.ps1', fullPath, function (err) {
      assert.ok(!err);
      var files = fs.readdirSync(TMP_DIR);
      assert.ok(files.length === 1);
      done();
    });
  });
});

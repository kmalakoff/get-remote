var assert = require('assert');
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');

var access = require('../lib/access');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

describe('download', function () {
  beforeEach(rimraf.bind(null, TMP_DIR));
  // after(rimraf.bind(null, TMP_DIR));

  it('should download over http', function (done) {
    var download = require('../..');

    var fullPath = path.join(TMP_DIR, 'node-tests-data');
    //https://raw.githubusercontent.com/jchip/nvm/v1.3.1/install.ps1
    download('https://codeload.github.com/kmalakoff/node-tests-data/zip/v1.0.0', fullPath, function (err) {
      assert.ok(!err);
      access(fullPath, function (err) {
        assert.ok(!err);
        done();
      });
    });
  });

  // it('should download over http', function (done) {
  //   var Download = require('download');
  //   // var progress = require('download-status');

  //   var fullPath = path.join(TMP_DIR, 'node-tests-data');
  //   fs.mkdirSync(TMP_DIR);

  //   new Download({ extract: true })
  //     .get('https://codeload.github.com/kmalakoff/node-tests-data/zip/v1.0.0')
  //     .dest(TMP_DIR)
  //     .run(function (err, files) {
  //       assert.ok(!err);
  //       access(fullPath, function (err) {
  //         assert.ok(!err);
  //         done();
  //       });
  //     });

  // var download = new Download()
  //   .get('https://codeload.github.com/kmalakoff/node-tests-data/zip/v1.0.0', fullPath, { extract: true, strip: 1 })
  //   .use(progress());

  // download.run(function (err, files) {
  //   assert.ok(!err);

  //   console.log(files);
  //   done();
  //   //=> [{ url: http://example.com/foo.zip, contents: <Buffer 50 4b 03 ...> }, { ... }]
  // });
  // //https://raw.githubusercontent.com/jchip/nvm/v1.3.1/install.ps1
  // download('', fullPath, function (err) {
  //   assert.ok(!err);
  //   access(fullPath, function (err) {
  //     assert.ok(!err);
  //     done();
  //   });
  // });
  // });
});

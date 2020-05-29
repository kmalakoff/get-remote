var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var BenchmarkSuite = require('benchmark-suite');

var TMP_DIR = path.resolve(path.join(__dirname, '..', '..', '.tmp'));

module.exports = async function run({ download, version }) {
  var suite = new BenchmarkSuite('download ' + version, 'Memory');

  function testFn(highWaterMark, fn) {
    return new Promise(function (resolve, reject) {
      var filename = 'npm-' + highWaterMark + '.tgz';
      download(
        'https://registry.npmjs.org/npm/-/npm-6.14.5.tgz',
        TMP_DIR,
        { filename: filename, highWaterMark: highWaterMark, progress: fn, time: 1000 },
        function (err) {
          err ? reject(err) : resolve();
        }
      );
    });
  }

  suite.add(`highWaterMark undefined`, function (fn) {
    return testFn(undefined, fn);
  });
  suite.add(`highWaterMark 1024`, function (fn) {
    return testFn(1024, fn);
  });

  suite.on('cycle', (results) => {
    for (var key in results) console.log(`${results[key].name.padStart(8, ' ')}| ${suite.formatStats(results[key].stats)} - ${key}`);
  });
  suite.on('complete', function (results) {
    console.log('-----Largest-----');
    for (var key in results) console.log(`${results[key].name.padStart(8, ' ')}| ${suite.formatStats(results[key].stats)} - ${key}`);
  });

  console.log('----------' + suite.name + '----------');
  try {
    rimraf.sync(TMP_DIR);
    fs.mkdirSync(TMP_DIR);
  } catch (err) {}
  await suite.run({ time: 1000 });
  console.log('');
};

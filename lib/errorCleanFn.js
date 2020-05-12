var rimraf = require('rimraf');

module.exports = function errorCleanFn(fullPath, fn) {
  return function errorClean() {
    var args = Array.prototype.slice.call(arguments, 0);
    var callback = args.pop();
    args.push(function (err) {
      var args = Array.prototype.slice.call(arguments, 0);
      if (!err) return callback.apply(null, args);
      rimraf(fullPath, function () {
        return callback.apply(null, args);
      });
    });
    fn.apply(null, args);
  };
};

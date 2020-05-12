var fs = require('fs');

module.exports =
  fs.access ||
  function existsAccess(fullPath, callback) {
    // eslint-disable-next-line node/no-deprecated-api
    fs.exists(fullPath, function (exists) {
      exists ? callback() : callback(new Error('Does not exist'));
    });
  };

var semver = require('semver');

if (semver.gte(process.versions.node, 'v10.0.0')) {
  module.exports = require('nock');
} else if (semver.gte(process.versions.node, 'v0.10.0')) {
  if (!global.WeakMap) global.WeakMap = require('weakmap-shim');
  if (!Object.assign) Object.assign = require('just-extend');
  if (!require('timers').setImmediate) require('timers').setImmediate = require('next-tick');
  module.exports = require('nock-4');
} else {
  module.exports = {};
}

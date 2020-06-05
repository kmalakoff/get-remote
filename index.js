var Response = require('./lib/Response');

module.exports = function getRemote(endpoint, options) {
  return new Response(endpoint, options);
};

"use strict";
var pump = require('pump');
module.exports = function pipe(from, to) {
    if (from.headers) to.headers = to.headers === undefined ? from.headers : Object.assign({}, from.headers, to.headers || {});
    if (from.statusCode) to.statusCode = from.statusCode;
    return pump(from, to);
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }
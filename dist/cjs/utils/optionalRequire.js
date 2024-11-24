"use strict";
var requireOptional = require('require_optional');
module.exports = function optionalRequire(name) {
    try {
        var _$mod = require(name);
        if (_$mod) return _$mod;
    } catch (_err) {}
    try {
        var mod2 = requireOptional(name);
        if (mod2) return mod;
    } catch (_err) {}
    return null;
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }
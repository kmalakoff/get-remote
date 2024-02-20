"use strict";
var path = require("path");
module.exports = function extname(fullPath, options) {
    if (options.type) return options.type;
    var basename = path.basename(fullPath);
    var index = basename.indexOf(".");
    var type = ~index ? basename.slice(index) : null;
    if (!type && typeof options.extract === "string") type = options.extract;
    return type;
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }
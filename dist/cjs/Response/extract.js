"use strict";
var fastExtract = require("../utils/optionalRequire")("fast-extract");
var extname = require("../utils/extname");
module.exports = function extract(dest, options, callback) {
    var _this = this;
    if (typeof options === "function") {
        callback = options;
        options = null;
    }
    if (!fastExtract) {
        console.log("Warning fast-extract not found so compressed file downloaded only without extraction. Require fast-extract for built-in extraction");
        return this.file(dest, callback);
    }
    if (typeof callback === "function") {
        options = Object.assign({}, this.options, options || {});
        return this.stream(options, function(err, res) {
            if (err) return callback(err);
            var type = extname(res.basename, options);
            if (!type) return callback(new Error("Cannot determine extract type for ".concat(res.basename)));
            fastExtract(res, dest, Object.assign({}, options, {
                type: type
            }), callback);
        });
    }
    return new Promise(function(resolve, reject) {
        _this.extract(dest, options, function(err, res) {
            err ? reject(err) : resolve(res);
        });
    });
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }
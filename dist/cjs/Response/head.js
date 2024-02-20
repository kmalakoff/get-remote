"use strict";
module.exports = function head(callback) {
    var _this = this;
    if (typeof callback === "function") {
        return this.stream({
            method: "HEAD"
        }, function(err, res) {
            if (err) return callback(err);
            res.resume(); // Discard response
            callback(null, {
                statusCode: res.statusCode,
                headers: res.headers
            });
        });
    }
    return new Promise(function(resolve, reject) {
        _this.head(function(err, res) {
            err ? reject(err) : resolve(res);
        });
    });
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }
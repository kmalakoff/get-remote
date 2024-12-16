"use strict";
module.exports = function json(callback) {
    var _this = this;
    if (typeof callback === 'function') {
        return this.text(function(err, res) {
            if (err) return callback(err);
            try {
                res.body = JSON.parse(res.body);
                return callback(null, res);
            } catch (err) {
                return callback(err);
            }
        });
    }
    return new Promise(function(resolve, reject) {
        _this.json(function(err, res) {
            err ? reject(err) : resolve(res);
        });
    });
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }
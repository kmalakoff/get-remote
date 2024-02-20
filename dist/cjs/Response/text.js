"use strict";
var eos = require("end-of-stream");
module.exports = function text(callback) {
    var _this = this;
    if (typeof callback === "function") {
        return this.stream(function(err, res) {
            if (err) return callback(err);
            // collect text
            var result = "";
            res.on("data", function(chunk) {
                result += chunk.toString();
            });
            eos(res, function(err) {
                err ? callback(err) : callback(null, {
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: result
                });
            });
        });
    }
    return new Promise(function(resolve, reject) {
        _this.text(function(err, res) {
            err ? reject(err) : resolve(res);
        });
    });
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }
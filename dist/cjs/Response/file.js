"use strict";
var path = require("path");
var fs = require("fs");
var eos = require("end-of-stream");
var mkpath = require("mkpath");
var statsBasename = require("../sourceStats/basename");
var pump = require("../utils/pump");
module.exports = function file(dest, options, callback) {
    var _this = this;
    if (typeof options === "function") {
        callback = options;
        options = null;
    }
    if (typeof callback === "function") {
        options = Object.assign({}, this.options, options || {});
        return this.stream(options, function(err, res) {
            if (err) return callback(err);
            var basename = statsBasename(options, res, _this.endpoint);
            var fullPath = basename === undefined ? dest : path.join(dest, basename);
            mkpath(path.dirname(fullPath), function(err) {
                if (err) return callback(err);
                // write to file
                res = pump(res, fs.createWriteStream(fullPath));
                eos(res, function(err) {
                    err ? callback(err) : callback(null, fullPath);
                });
            });
        });
    }
    return new Promise(function(resolve, reject) {
        _this.file(dest, options, function(err, res) {
            err ? reject(err) : resolve(res);
        });
    });
};
/* CJS INTEROP */ if (exports.__esModule && exports.default) { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) exports.default[key] = exports[key]; module.exports = exports.default; }
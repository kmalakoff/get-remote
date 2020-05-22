// eslint-disable-next-line no-control-regex
module.exports.posix = /[<>:"\/\\|?*\x00-\x1F]/g;
module.exports.windows = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;

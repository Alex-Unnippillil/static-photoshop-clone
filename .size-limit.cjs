const filePlugin = require("@size-limit/file");

module.exports = [
  {
    name: "Main bundle",
    path: "dist/bundle/index.js",
    limit: "200 kB",
    gzip: true,
  },
];

module.exports.plugins = [filePlugin];

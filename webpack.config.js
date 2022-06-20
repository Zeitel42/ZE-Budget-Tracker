const path = require("path");

module.exports = {
  entry: "./public/js/script.js",
  output: {
    path: __dirname + "dist",
    filename: "bundle.js",
  },
  mode: "development",
};

const fs = require("fs");
var UglifyJS = require("uglify-js");
var HtmlMinifier = require("html-minifier");
var CleanCss = require("clean-css");

fs.readFile("src/index.html", "utf8", (err, html) => {
  fs.readFile("src/index.js", "utf8", (err, js) => {
    fs.readFile("src/index.css", "utf8", (err, css) => {
      const minJS = UglifyJS.minify(js).code;
      const minCSS = new CleanCss().minify(css).styles;
      const minHTML = HtmlMinifier.minify(html, {
        "collapse-whitespace": true,
        "remove-comments": true,
        "remove-optional-tags": true,
        "remove-redundant-attributes": true,
        "remove-script-type-attributes": true,
        "remove-tag-whitespace": true,
        "use-short-doctype": true,
      });
      const result = `<style>${minCSS}</style>${minHTML}<script>${minJS}</script>`;
      fs.writeFile("public/index.html", result, () => undefined);
    });
  });
});

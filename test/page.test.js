const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("the playable page is index.html at the repository root", () => {
  const htmlPath = path.join(root, "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");

  assert.equal(path.basename(htmlPath), "index.html");
  assert.equal(fs.existsSync(path.join(root, "dist")), false);
  assert.match(html, /id="pitch"/);
  assert.match(html, /Top-down soccer pitch/);
  assert.match(html, /href="css\/game\.css"/);
  assert.match(html, /src="js\/catalog\.js"/);
  assert.match(html, /src="js\/game\.js"/);
  assert.doesNotMatch(html, /dist\//);
});

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
  assert.match(html, /src="js\/attempt\.js"/);
  assert.match(html, /src="js\/points\.js"/);
  assert.match(html, /src="js\/next-play\.js"/);
  assert.match(html, /src="js\/game\.js"/);
  assert.match(html, /id="points"/);
  assert.match(html, /id="next-play"/);
  assert.ok(
    html.indexOf('src="js/catalog.js"') < html.indexOf('src="js/attempt.js"') &&
      html.indexOf('src="js/attempt.js"') < html.indexOf('src="js/points.js"') &&
      html.indexOf('src="js/points.js"') < html.indexOf('src="js/next-play.js"') &&
      html.indexOf('src="js/next-play.js"') < html.indexOf('src="js/game.js"')
  );
  assert.doesNotMatch(html, /dist\//);
});

test("the page renders a drag attempt and does not judge spots", () => {
  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  assert.match(game, /presentation\(/);
  assert.doesNotMatch(game, /goodSpots/);
  assert.doesNotMatch(game, /better|worse|Math\.hypot/);
  assert.doesNotMatch(game, /\b(pass|fail)\b/i);
});

test("the page asks for one pick and does not judge the marked target", () => {
  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  assert.match(game, /createPickAttempt\(/);
  assert.match(game, /attemptApi\.pick\(/);
  assert.doesNotMatch(game, /correctTarget/);
  assert.doesNotMatch(game, /markedTargets/);
  assert.doesNotMatch(game, /\b(pass|fail)\b/i);
});

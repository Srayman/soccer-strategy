const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { drills } = require("../js/catalog.js");

const root = path.join(__dirname, "..");

function words(sentence) {
  return sentence.split(/\s+/).filter(Boolean);
}

test("one help control holds the color key and the pick-a-starter line", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  const scenes = fs.readFileSync(path.join(root, "js", "starter-scenes.js"), "utf8");
  const helpButtons = html.match(/<button\b[^>]*>\s*\?\s*<\/button>/g) || [];

  assert.equal(helpButtons.length, 1);
  assert.equal((html.match(/\?/g) || []).length, 1);
  assert.doesNotMatch(game, /textContent = "\?"/);
  assert.doesNotMatch(scenes, /White is you/);
  assert.doesNotMatch(scenes, /starter-legend/);

  const dialogStart = html.indexOf('<dialog id="game-help-panel"');
  const dialogEnd = html.indexOf("</dialog>");
  assert.ok(dialogStart > 0 && dialogEnd > dialogStart);
  const dialog = html.slice(dialogStart, dialogEnd);
  assert.match(dialog, /Look down on the pitch and start a starter drill\./);
  assert.match(dialog, /White is you\. Blue is your team\. Red is the other team\./);
  assert.match(dialog, /tap a ring/);
  assert.match(dialog, /Level 2: drag the white player\./);
  assert.match(dialog, /data-action="close-help"/);
  assert.equal(html.split("Look down on the pitch and start a starter drill.").length - 1, 1);
  assert.match(game, /showModal\(/);
  assert.match(game, /helpPanel\.close\(/);
});

test("each drill keeps one short goal sentence and a longer picture explainer", () => {
  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "css", "game.css"), "utf8");

  assert.equal(drills.length, 45);
  for (const drill of drills) {
    assert.equal(typeof drill.explainer, "string", drill.name);
    assert.equal(drill.explainer.includes("\n"), false, drill.name);
    assert.ok(words(drill.explainer).length > words(drill.idea).length, drill.name);
    assert.notEqual(drill.explainer, drill.idea, drill.name);
    assert.doesNotMatch(drill.explainer, /good spot|correct mark|the miss/i, drill.name);
  }

  assert.match(game, /idea\.textContent = drill\.idea/);
  assert.match(game, /statusEl\.textContent = current\.idea/);
  assert.match(game, /more\.dataset\.action = "more"/);
  assert.match(game, /explainer\.textContent = drill\.explainer/);
  assert.match(game, /button\[data-action='more'\]/);
  assert.match(game, /querySelector\("\.drill-action"\)/);
  assert.match(css, /"idea kind kind"/);
  assert.match(css, /grid-area: explainer/);
});

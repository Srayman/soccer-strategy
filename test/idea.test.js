const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("path");
const { drills } = require("../js/catalog.js");

const root = path.join(__dirname, "..");

function words(sentence) {
  return sentence.split(/\s+/).filter(Boolean);
}

test("every drill has one short idea sentence", () => {
  assert.equal(drills.length, 45);
  for (const drill of drills) {
    assert.equal(typeof drill.idea, "string", drill.name);
    assert.equal(drill.idea.length > 0, true, drill.name);
    assert.equal((drill.idea.match(/[.!?]/g) || []).length, 1, drill.idea);
    assert.equal(drill.idea.endsWith("."), true, drill.idea);
    assert.equal(drill.idea.includes("\n"), false, drill.name);
    assert.equal(words(drill.idea).length <= 18, true, drill.idea);
    assert.doesNotMatch(drill.idea, /good spot|points|pick the|correct|circle|locked/i, drill.name);
    assert.doesNotMatch(drill.idea, /Playing /, drill.name);
  }
  const triangle = drills.find((drill) => drill.name === "Triangle");
  assert.equal(triangle.tier, "starter");
  assert.equal(triangle.kind, "pick");
  assert.equal(
    triangle.idea,
    "A triangle gives the player with the ball two ways to pass."
  );
  const nextLocked = drills.find((drill) => drill.tier === "next");
  const advancedLocked = drills.find((drill) => drill.tier === "advanced");
  assert.equal(typeof nextLocked.idea, "string");
  assert.equal(typeof advancedLocked.idea, "string");
  assert.notEqual(nextLocked.idea, triangle.idea);
  assert.notEqual(advancedLocked.idea, triangle.idea);
});

test("the list shows the idea and the playing status uses that same sentence", () => {
  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "css", "game.css"), "utf8");

  assert.match(game, /className = "drill-idea"/);
  assert.match(game, /idea\.textContent = drill\.idea/);
  assert.match(game, /statusEl\.textContent = current\.idea/);
  assert.doesNotMatch(game, /Playing " \+ current\.name/);
  assert.match(game, /textContent = "Locked"/);
  assert.match(game, /button\[data-action='start'\]/);
  assert.match(game, /button\.removeAttribute\("data-action"\)/);

  assert.match(css, /grid-area: idea/);
  assert.match(css, /grid-area: kind/);
  assert.match(css, /"idea kind kind"/);
});

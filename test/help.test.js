const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { drills } = require("../js/catalog.js");

const root = path.join(__dirname, "..");

function words(sentence) {
  return sentence.split(/\s+/).filter(Boolean);
}

test("one help control explains the game in short plain sentences", () => {
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
  const sentences = dialog
    .replace(/<[^>]+>/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence && sentence !== "How to play");

  const needed = [
    "Look down on the pitch.",
    "White is you. Blue is your team. Red is the other team.",
    "Attack is the top goal. Defend is the bottom goal.",
    "A pick means you tap one circle.",
    "A drag means you pull the white player to a spot and let go.",
    "Level 1 is a pick.",
    "Level 2 is a drag of the same drill.",
    "Level 2 is not the Advanced list.",
    "Level 2 hides the good-spot circles and the wrong-choice circles.",
    "A drop on the hidden good spot still counts.",
    "A drop on a hidden wrong spot is a miss.",
    "A miss shows the good spot and ends the attempt.",
    "There is no second try.",
    "A miss adds 1 point.",
    "A correct first try adds 3 points.",
    "A later ending adds 1 point.",
    "The score is a count, not a grade.",
    "Next stays locked until every starter has ended once.",
    "Advanced stays locked until every next drill has ended once.",
    "Goalkeeper step-out counts as one starter.",
    "It counts only after Central, Near post, and Free ball have each ended once.",
    "When you open the page, the first starter is Open body.",
    "That start does not add points.",
  ];
  for (const sentence of needed) {
    assert.equal(dialog.includes(sentence), true, sentence);
  }
  assert.equal(drills.find((drill) => drill.tier === "starter").name, "Open body");
  assert.doesNotMatch(dialog, /tap a ring/);
  assert.doesNotMatch(dialog, /start a starter drill/);
  assert.doesNotMatch(dialog, /\b(pass|fail|unlock)\b/i);
  assert.match(dialog, /data-action="close-help"/);
  for (const sentence of sentences) {
    const count = sentence.split(/\s+/).filter(Boolean).length;
    assert.ok(count <= 16, sentence + " (" + count + " words)");
  }
  assert.match(game, /if \(helpIsOpen\(\)\) closeHelp\(\)/);
  assert.match(game, /else openHelp\(\)/);
  assert.match(game, /helpPanel\.showModal\(\)/);
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

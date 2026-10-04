const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("path");
const { drills } = require("../js/catalog.js");
const { lineFor } = require("../js/spot-lines.js");
const { starterHeading, lockedLeft } = require("../js/progress-copy.js");
const scenes = require("../js/starter-scenes.js");
const nextScenes = require("../js/scenes/next.js");
const advancedScenes = require("../js/scenes/advanced.js");

const root = path.join(__dirname, "..");
const compass = /\b(north|south|east|west|left|right|up|down|compass)\b/i;

function words(sentence) {
  return sentence.split(/\s+/).filter(Boolean);
}

function assertSpotLine(line, label) {
  assert.equal(typeof line, "string", label);
  assert.equal(line.length > 0, true, label);
  assert.equal((line.match(/[.!?]/g) || []).length, 1, line);
  assert.equal(line.endsWith("."), true, line);
  assert.equal(line.includes("\n"), false, label);
  assert.equal(words(line).length <= 18, true, line);
  assert.match(line, /^The good spot\b/, line);
  assert.doesNotMatch(line, compass, line);
  assert.doesNotMatch(line, /\b(fail|grade)\b/i, line);
}

function picturesOf(scene) {
  if (!scene.pictures) return [{ id: "" }];
  if (Array.isArray(scene.pictures)) {
    return scene.pictures.map((picture) => ({ id: picture.id }));
  }
  return Object.keys(scene.pictures).map((id) => ({ id: id }));
}

test("every picture has one short good-spot sentence", () => {
  const seen = new Set();

  function check(scene) {
    const pictures = picturesOf(scene);
    if (pictures.length === 1 && pictures[0].id && !scene.angles && !Array.isArray(scene.pictures)) {
      const line = lineFor(scene.id, "");
      assertSpotLine(line, scene.id);
      seen.add(scene.id);
      return;
    }
    if (pictures.length === 1 && Array.isArray(scene.pictures)) {
      const line = lineFor(scene.id, "");
      assertSpotLine(line, scene.id);
      seen.add(scene.id);
      return;
    }
    for (const picture of pictures) {
      const line = lineFor(scene.id, picture.id);
      assertSpotLine(line, scene.id + "/" + picture.id);
      seen.add(scene.id + "/" + picture.id);
    }
  }

  scenes.scenes.forEach(check);
  nextScenes.scenes.forEach(check);
  advancedScenes.scenes.forEach(check);

  assert.equal(seen.size, 51);
  assert.equal(lineFor("triangle", ""), "The good spot is the open corner that makes a triangle.");
  assert.equal(
    lineFor("goalkeeper-step-out-and-line-up", "through-ball"),
    "The good spot is on the ball's path at the edge of the six-yard box."
  );
  assert.equal(
    lineFor("set-and-go", "runner"),
    "The good spot is arriving on the ball in the runner's path."
  );
});

test("starter progress and locked tiers say what is left", () => {
  assert.equal(starterHeading("Starter drills", 0, 20), "Starter drills (0 of 20 done)");
  assert.equal(starterHeading("Starter drills", 20, 20), "Starter drills (20 of 20 done)");
  assert.equal(lockedLeft(20, "starter"), "20 starter drills left before this opens.");
  assert.equal(lockedLeft(1, "starter"), "1 starter drill left before this opens.");
  assert.equal(lockedLeft(17, "next"), "17 next drills left before this opens.");
  assert.equal(lockedLeft(0, "next"), "These are open.");
  assert.doesNotMatch(lockedLeft(3, "starter"), /\b(pass|fail|grade|unlock)\b/i);
});

test("the page shows a score, opens Triangle on level 1, and keeps the spot", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "css", "game.css"), "utf8");

  assert.match(html, /id="points"/);
  assert.match(html, /Score: 0/);
  assert.match(html, /Find the good spot on the first try: 3\./);
  assert.match(html, /A miss: 1\./);
  assert.match(html, /Any try after that: 1\./);
  assert.doesNotMatch(html, /\b(pass|fail|grade)\b/i);
  assert.ok(html.indexOf('src="js/spot-lines.js"') < html.indexOf('src="js/starter-scenes.js"'));
  assert.ok(html.indexOf('src="js/progress-copy.js"') < html.indexOf('src="js/game.js"'));

  assert.match(game, /Score: /);
  assert.match(game, /starterHeading\(/);
  assert.match(game, /lockedLeft\(/);
  assert.match(game, /view\.spotLine/);
  assert.match(game, /view\.correctionSpots\.forEach/);
  assert.match(game, /id === "triangle"/);
  assert.doesNotMatch(game, /\b(pass|fail|grade)\b/i);
  assert.doesNotMatch(game, /unlock/i);
  assert.match(css, /\.site-header \.points/);

  const tail = game.slice(game.lastIndexOf("renderList();"));
  assert.match(tail, /triangle/);
  assert.doesNotMatch(tail, /settle\(/);
});

test("a Triangle miss names the open corner and keeps the spot", () => {
  const previousDocument = global.document;
  const previousAttempt = globalThis.SoccerAttempt;
  const previousPlay = globalThis.SoccerScenePlay;
  const previousLines = globalThis.SoccerSpotLines;
  global.document = {
    querySelector() {
      return null;
    },
    addEventListener() {},
  };
  globalThis.SoccerSpotLines = require("../js/spot-lines.js");
  globalThis.SoccerAttempt = require("../js/attempt.js");
  globalThis.SoccerScenePlay = require("../js/scene-play.js");
  scenes.install();
  try {
    const attemptApi = globalThis.SoccerAttempt;
    const triangle = drills.find((drill) => drill.id === "triangle");
    const playing = attemptApi.createLevelAttempt(triangle, 1);
    assert.equal(playing.level, 1);
    assert.equal(playing.ended, false);
    assert.equal(playing.targets.find((target) => target.id === "b").r, 32);
    const missed = attemptApi.pick(playing, "a");
    assert.equal(missed.state, "miss");
    assert.equal(missed.ended, true);
    const view = attemptApi.presentation(missed);
    assert.equal(view.spotLine, "The good spot is the open corner that makes a triangle.");
    assert.equal(view.correctionSpots.length, 1);
    assert.equal(view.correctionSpots[0].x, 510);
    assert.equal(view.correctionSpots[0].y, 610);
    assert.equal(view.correctionSpots[0].r, 32);
  } finally {
    scenes.usePicture("central");
    if (previousDocument === undefined) delete global.document;
    else global.document = previousDocument;
    if (previousAttempt === undefined) delete globalThis.SoccerAttempt;
    else globalThis.SoccerAttempt = previousAttempt;
    if (previousPlay === undefined) delete globalThis.SoccerScenePlay;
    else globalThis.SoccerScenePlay = previousPlay;
    if (previousLines === undefined) delete globalThis.SoccerSpotLines;
    else globalThis.SoccerSpotLines = previousLines;
  }
});

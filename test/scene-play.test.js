const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.join(__dirname, "..");

function assertSignedOffPlay(sceneFor, next, advanced, scale) {
  const source = next.sceneById("diagonal-run");
  const picture = source.pictures[0];
  const learner = picture.players.find((player) => player.id === "learner");
  const played = sceneFor("diagonal-run");
  assert.equal(picture.ball.x, 60);
  assert.equal(picture.ball.y, 42);
  assert.equal(learner.x, 32);
  assert.equal(learner.y, 50);
  assert.equal(picture.goodSpot.x, 48);
  assert.equal(picture.goodSpot.y, 20);
  assert.equal(played.kind, "drag");
  assert.equal(played.ball.x, 60 * scale);
  assert.equal(played.ball.y, 42 * scale);
  assert.equal(played.learner.x, 32 * scale);
  assert.equal(played.learner.y, 50 * scale);
  assert.equal(played.goodSpots[0].x, 48 * scale);
  assert.equal(played.goodSpots[0].y, 20 * scale);
  assert.equal(played.goodSpots[0].r, picture.goodSpot.r * scale);

  const zonesSource = advanced.sceneById("zones");
  const zones = sceneFor("zones");
  assert.ok(zonesSource);
  assert.ok(zones);
  assert.equal(zones.kind, "drag");
  assert.equal(
    zones.pictures[zonesSource.pictures[0].id].goodSpots[0].x,
    zonesSource.pictures[0].goodSpot.x * scale
  );
}

test("the page tags starter, next, and advanced files before scene-play", () => {
  const source = fs.readFileSync(path.join(root, "js", "scene-play.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

  assert.match(source, /function load\(/);
  assert.match(source, /require\(rel\)/);
  assert.match(source, /load\("SoccerNextScenes"/);
  assert.match(source, /load\("SoccerAdvancedScenes"/);
  assert.match(source, /load\("StarterScenes"/);
  assert.ok(
    html.indexOf('src="js/starter-scenes.js"') < html.indexOf('src="js/scenes/next.js"') &&
      html.indexOf('src="js/scenes/next.js"') < html.indexOf('src="js/scenes/advanced.js"') &&
      html.indexOf('src="js/scenes/advanced.js"') < html.indexOf('src="js/scene-play.js"')
  );
});

test("node require loads the signed-off next and advanced files", () => {
  delete globalThis.SoccerNextScenes;
  delete globalThis.SoccerAdvancedScenes;
  delete globalThis.StarterScenes;

  const { sceneFor } = require("../js/scene-play.js");
  const next = require("../js/scenes/next.js");
  const advanced = require("../js/scenes/advanced.js");
  const starter = require("../js/starter-scenes.js");

  assertSignedOffPlay(sceneFor, next, advanced, starter.pitch.scale);
  assert.equal(globalThis.SoccerNextScenes, next);
  assert.equal(globalThis.SoccerAdvancedScenes, advanced);
  assert.equal(globalThis.StarterScenes, starter);
});

test("script-tag globals read those same signed-off files", () => {
  const script = [
    "const next = require(" + JSON.stringify(path.join(root, "js/scenes/next.js")) + ");",
    "const advanced = require(" + JSON.stringify(path.join(root, "js/scenes/advanced.js")) + ");",
    "const starter = require(" + JSON.stringify(path.join(root, "js/starter-scenes.js")) + ");",
    "globalThis.SoccerNextScenes = next;",
    "globalThis.SoccerAdvancedScenes = advanced;",
    "globalThis.StarterScenes = starter;",
    "const { sceneFor } = require(" + JSON.stringify(path.join(root, "js/scene-play.js")) + ");",
    "const scale = starter.pitch.scale;",
    "const played = sceneFor('diagonal-run');",
    "const zones = sceneFor('zones');",
    "if (globalThis.SoccerNextScenes !== next) process.exit(2);",
    "if (globalThis.SoccerAdvancedScenes !== advanced) process.exit(3);",
    "if (played.ball.x !== 60 * scale) process.exit(4);",
    "if (played.learner.x !== 32 * scale) process.exit(5);",
    "if (played.goodSpots[0].x !== 48 * scale) process.exit(6);",
    "if (played.goodSpots[0].y !== 20 * scale) process.exit(7);",
    "if (!zones || zones.kind !== 'drag') process.exit(8);",
    "if (!advanced.sceneById('zones')) process.exit(9);",
  ].join("\n");
  const result = spawnSync(process.execPath, ["-e", script], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

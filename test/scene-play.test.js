const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("scene-play loads next and advanced data through one helper", () => {
  const source = fs.readFileSync(path.join(root, "js", "scene-play.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

  assert.match(source, /function load\(/);
  assert.match(source, /load\("SoccerNextScenes"/);
  assert.match(source, /load\("SoccerAdvancedScenes"/);
  assert.match(source, /load\("StarterScenes"/);
  assert.doesNotMatch(source, /SoccerNextScenes && root\.SoccerAdvancedScenes/);
  assert.doesNotMatch(source, /require\("\.\/scenes\/next\.js"\)/);
  assert.doesNotMatch(source, /require\("\.\/scenes\/advanced\.js"\)/);
  assert.ok(
    html.indexOf('src="js/scenes/next.js"') < html.indexOf('src="js/scenes/advanced.js"') &&
      html.indexOf('src="js/scenes/advanced.js"') < html.indexOf('src="js/scene-play.js"')
  );
});

test("script-tag globals and node require share that load path", () => {
  const starter = require("../js/starter-scenes.js");
  const previous = {
    next: globalThis.SoccerNextScenes,
    advanced: globalThis.SoccerAdvancedScenes,
    starter: globalThis.StarterScenes,
  };

  globalThis.StarterScenes = starter;
  globalThis.SoccerNextScenes = {
    scenes: [
      {
        id: "diagonal-run",
        name: "Diagonal run",
        kind: "drag",
        pictures: [
          {
            id: "gap-behind",
            ball: { x: 11, y: 13 },
            players: [
              { id: "learner", team: "learner", x: 17, y: 19 },
            ],
            goodSpot: { x: 23, y: 29, r: 3 },
          },
        ],
      },
    ],
  };
  globalThis.SoccerAdvancedScenes = { scenes: [] };

  try {
    const { sceneFor } = require("../js/scene-play.js");
    const played = sceneFor("diagonal-run");
    assert.equal(played.kind, "drag");
    assert.equal(played.goodSpots[0].x, 23 * starter.pitch.scale);
    assert.equal(played.goodSpots[0].y, 29 * starter.pitch.scale);
    assert.equal(played.goodSpots[0].r, 3 * starter.pitch.scale);
    assert.equal(played.learner.x, 17 * starter.pitch.scale);
    assert.equal(played.learner.y, 19 * starter.pitch.scale);
    assert.equal(played.ball.x, 11 * starter.pitch.scale);
    assert.equal(sceneFor("zones"), null);
  } finally {
    if (previous.next) globalThis.SoccerNextScenes = previous.next;
    else delete globalThis.SoccerNextScenes;
    if (previous.advanced) globalThis.SoccerAdvancedScenes = previous.advanced;
    else delete globalThis.SoccerAdvancedScenes;
    if (previous.starter) globalThis.StarterScenes = previous.starter;
    else delete globalThis.StarterScenes;
  }
});

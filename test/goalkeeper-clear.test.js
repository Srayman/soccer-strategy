const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { drills } = require("../js/catalog.js");
const { createClearance, noteEnded, isCleared } = require("../js/clear.js");
const scenes = require("../js/starter-scenes.js");

const root = path.join(__dirname, "..");
const keeper = drills.find((drill) => drill.id === "goalkeeper-step-out-and-line-up");
const pictures = ["central", "near-post", "through-ball"];

function installAttempt() {
  const previousDocument = global.document;
  const previousAttempt = globalThis.SoccerAttempt;
  const previousPlay = globalThis.SoccerScenePlay;
  global.document = {
    querySelector() {
      return null;
    },
    addEventListener() {},
  };
  globalThis.SoccerAttempt = require("../js/attempt.js");
  globalThis.SoccerScenePlay = require("../js/scene-play.js");
  scenes.install();
  scenes.usePicture("central");
  return {
    attempt: globalThis.SoccerAttempt,
    restore() {
      scenes.usePicture("central");
      if (previousDocument === undefined) delete global.document;
      else global.document = previousDocument;
      if (previousAttempt === undefined) delete globalThis.SoccerAttempt;
      else globalThis.SoccerAttempt = previousAttempt;
      if (previousPlay === undefined) delete globalThis.SoccerScenePlay;
      else globalThis.SoccerScenePlay = previousPlay;
    },
  };
}

test("one ended attempt leaves the goalkeeper drill uncleared until each picture ends", () => {
  const harness = installAttempt();
  try {
    const attempt = harness.attempt;
    let book = createClearance();
    assert.equal(isCleared(book, keeper.id), false);

    for (const pictureId of pictures) {
      scenes.usePicture(pictureId);
      const playing = attempt.createAttempt(keeper);
      assert.equal(playing.state, "playing");
      assert.equal(playing.ended, false);
      assert.equal(playing.pictureId, pictureId);
      const view = attempt.presentation(playing);
      assert.equal(view.draggable, true);
      assert.equal(view.verdict, null);
      assert.equal(view.confirmation, "");
      assert.deepEqual(view.hint, []);
      assert.deepEqual(view.correctionSpots, []);
      const next = noteEnded(book, playing);
      assert.equal(next, book);
      assert.equal(isCleared(book, keeper.id), false);
    }

    scenes.usePicture("central");
    const central = attempt.drop(attempt.createAttempt(keeper), { x: 1, y: 1 });
    assert.equal(central.ended, true);
    assert.equal(central.state, "miss");
    assert.equal(central.pictureId, "central");
    assert.equal(central.confirmation, "");
    assert.equal(central.correctionSpots.length, 1);
    assert.equal(central.correctionSpots[0].x, 340);
    assert.equal(central.correctionSpots[0].y, 1030);
    const revealed = attempt.presentation(central);
    assert.equal(revealed.verdict, null);
    assert.equal(revealed.draggable, false);
    assert.equal(revealed.confirmation, "");
    assert.equal(revealed.correctionSpots.length, 1);
    book = noteEnded(book, central);
    assert.equal(isCleared(book, keeper.id), false);
    book = noteEnded(book, central);
    assert.equal(isCleared(book, keeper.id), false);

    scenes.usePicture("near-post");
    const switched = attempt.createAttempt(keeper);
    assert.equal(switched.ended, false);
    assert.equal(switched.pictureId, "near-post");
    book = noteEnded(book, switched);
    assert.equal(isCleared(book, keeper.id), false);

    const near = attempt.drop(attempt.createAttempt(keeper), { x: 1, y: 1 });
    assert.equal(near.ended, true);
    assert.equal(near.state, "miss");
    assert.equal(near.pictureId, "near-post");
    book = noteEnded(book, near);
    assert.equal(isCleared(book, keeper.id), false);

    scenes.usePicture("through-ball");
    const free = attempt.drop(attempt.createAttempt(keeper), { x: 1, y: 1 });
    assert.equal(free.ended, true);
    assert.equal(free.state, "miss");
    assert.equal(free.pictureId, "through-ball");
    assert.equal(free.correctionSpots[0].x, 400);
    assert.equal(free.correctionSpots[0].y, 995);
    book = noteEnded(book, free);
    assert.equal(isCleared(book, keeper.id), true);
  } finally {
    harness.restore();
  }
});

test("the goalkeeper heading does not say versus a set close shot", () => {
  const plan = fs.readFileSync(path.join(root, "docs", "PLAN.md"), "utf8");
  const scene = scenes.byId[keeper.id];
  assert.equal(scene.angles.length, 3);
  assert.doesNotMatch(plan, /versus a set close shot/);
  for (const angle of scene.angles) {
    assert.doesNotMatch(angle.label, /versus a set close shot/);
  }
  for (const picture of Object.values(scene.pictures)) {
    assert.doesNotMatch(picture.caption, /versus a set close shot/);
  }

  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  assert.ok(
    html.indexOf('src="js/clear.js"') > html.indexOf('src="js/scene-play.js"') &&
      html.indexOf('src="js/clear.js"') < html.indexOf('src="js/game.js"')
  );
  assert.match(game, /pointsApi\.settle\(session, attempt\)/);
  assert.match(game, /clearApi\.noteEnded\(clearance, attempt\)/);
  assert.match(game, /isLocked\(drill, session\.endedDrills\)/);
  const listener = game.slice(
    game.indexOf('document.addEventListener("starter-scene-change"'),
    game.indexOf("renderList();")
  );
  assert.match(listener, /createAttempt/);
  assert.doesNotMatch(listener, /noteEnded/);
  assert.doesNotMatch(listener, /settle\(/);
  assert.doesNotMatch(game, /better|worse/);
});

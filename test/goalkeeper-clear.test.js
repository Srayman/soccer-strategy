const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { drills, canStart, goalkeeperDrillId } = require("../js/catalog.js");
const { createSession, settle } = require("../js/points.js");
const { createClearance, noteEnded, isCleared, markEnded } = require("../js/clear.js");
const scenes = require("../js/starter-scenes.js");

const root = path.join(__dirname, "..");
const keeper = drills.find((drill) => drill.id === goalkeeperDrillId);
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

function pageRecord(session, clearance, ended) {
  let next = settle(session, ended);
  const book = noteEnded(clearance, ended);
  if (isCleared(book, ended && ended.drillId)) next = markEnded(next, ended.drillId);
  return { session: next, clearance: book };
}

test("one ended attempt leaves the goalkeeper drill uncleared until each picture ends", () => {
  const harness = installAttempt();
  try {
    const attempt = harness.attempt;
    let session = createSession();
    let book = createClearance();
    assert.equal(isCleared(book, keeper.id), false);
    assert.equal(session.endedDrills.includes(keeper.id), false);

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
      const switched = pageRecord(session, book, playing);
      assert.equal(switched.session, session);
      assert.equal(switched.clearance, book);
      assert.equal(switched.session.points, session.points);
      assert.equal(switched.session.endedDrills.includes(keeper.id), false);
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
    let recorded = pageRecord(session, book, central);
    session = recorded.session;
    book = recorded.clearance;
    assert.equal(isCleared(book, keeper.id), false);
    assert.equal(session.endedDrills.includes(keeper.id), false);
    assert.equal(session.points, 1);
    recorded = pageRecord(session, book, central);
    session = recorded.session;
    book = recorded.clearance;
    assert.equal(isCleared(book, keeper.id), false);
    assert.equal(session.endedDrills.includes(keeper.id), false);
    assert.equal(session.points, 2);

    scenes.usePicture("near-post");
    const switched = attempt.createAttempt(keeper);
    assert.equal(switched.ended, false);
    assert.equal(switched.pictureId, "near-post");
    recorded = pageRecord(session, book, switched);
    assert.equal(recorded.session, session);
    assert.equal(recorded.session.endedDrills.includes(keeper.id), false);
    assert.equal(isCleared(book, keeper.id), false);

    const near = attempt.drop(attempt.createAttempt(keeper), { x: 1, y: 1 });
    assert.equal(near.ended, true);
    assert.equal(near.state, "miss");
    assert.equal(near.pictureId, "near-post");
    recorded = pageRecord(session, book, near);
    session = recorded.session;
    book = recorded.clearance;
    assert.equal(isCleared(book, keeper.id), false);
    assert.equal(session.endedDrills.includes(keeper.id), false);
    assert.equal(session.points, 3);

    scenes.usePicture("through-ball");
    const free = attempt.drop(attempt.createAttempt(keeper), { x: 1, y: 1 });
    assert.equal(free.ended, true);
    assert.equal(free.state, "miss");
    assert.equal(free.pictureId, "through-ball");
    assert.equal(free.correctionSpots[0].x, 400);
    assert.equal(free.correctionSpots[0].y, 995);
    recorded = pageRecord(session, book, free);
    session = recorded.session;
    book = recorded.clearance;
    assert.equal(isCleared(book, keeper.id), true);
    assert.equal(session.endedDrills.includes(keeper.id), true);
    assert.equal(session.endedDrills.filter((id) => id === keeper.id).length, 1);
    assert.equal(session.endedDrills.includes("central"), false);
    assert.equal(session.endedDrills.includes("near-post"), false);
    assert.equal(session.endedDrills.includes("through-ball"), false);
    assert.equal(session.points, 4);

    const nextDrills = drills.filter((drill) => drill.tier === "next");
    const withoutKeeper = session.endedDrills.filter((id) => id !== keeper.id);
    assert.equal(canStart(nextDrills[0], withoutKeeper), false);
    assert.equal(canStart(nextDrills[0], session.endedDrills), false);

    scenes.usePicture("central");
    const found = attempt.drop(attempt.createAttempt(keeper), { x: 340, y: 1030 });
    assert.equal(found.state, "correct");
    let fresh = pageRecord(createSession(), createClearance(), found);
    assert.equal(fresh.session.points, 3);
    assert.equal(fresh.session.endedDrills.includes(keeper.id), false);
    scenes.usePicture("near-post");
    const foundNear = attempt.drop(attempt.createAttempt(keeper), { x: 369, y: 1030 });
    assert.equal(foundNear.state, "correct");
    fresh = pageRecord(fresh.session, fresh.clearance, foundNear);
    assert.equal(fresh.session.points, 4);
    assert.equal(fresh.session.endedDrills.includes(keeper.id), false);
  } finally {
    harness.restore();
  }
});

test("usePicture still selects Free ball after another picture and Central after that", () => {
  assert.equal(scenes.usePicture("near-post"), "near-post");
  assert.equal(scenes.usePicture("through-ball"), "through-ball");
  assert.equal(scenes.usePicture("central"), "central");
  scenes.usePicture("central");
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
  assert.match(game, /clearApi\.isCleared\(clearance, attempt\.drillId\)/);
  assert.match(game, /clearApi\.markEnded\(session, attempt\.drillId\)/);
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

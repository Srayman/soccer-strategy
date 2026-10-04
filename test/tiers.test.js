const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { drills, isLocked, canStart } = require("../js/catalog.js");
const { createSession, settle } = require("../js/points.js");
const { createClearance, noteEnded, isCleared, markEnded } = require("../js/clear.js");
const {
  goodSpots,
  markedTargets,
  correctTarget,
  createAttempt,
  createPickAttempt,
  drop,
  pick,
} = require("../js/attempt.js");
const { sceneById: nextSceneById } = require("../js/scenes/next.js");
const { sceneById: advancedSceneById } = require("../js/scenes/advanced.js");
const { frameFor } = require("../js/starter-scenes.js");
const { sceneFor } = require("../js/scene-play.js");

const root = path.join(__dirname, "..");
const starters = drills.filter((drill) => drill.tier === "starter");
const nextDrills = drills.filter((drill) => drill.tier === "next");
const advanced = drills.filter((drill) => drill.tier === "advanced");
const wrongTarget = markedTargets.find((target) => target.id !== correctTarget.id);
const diagonal = nextDrills.find((drill) => drill.name === "Diagonal run");
const zones = advanced.find((drill) => drill.name === "Zones");
const goalkeeper = starters.find(
  (drill) => drill.name === "Goalkeeper step-out and line-up"
);

function endMiss(drill) {
  if (drill.kind === "drag") return drop(createAttempt(drill), { x: 1, y: 1 });
  return pick(createPickAttempt(drill), wrongTarget.id);
}

function endCorrect(drill) {
  if (drill.kind === "drag") {
    return drop(createAttempt(drill), { x: goodSpots[0].x, y: goodSpots[0].y });
  }
  return pick(createPickAttempt(drill), correctTarget.id);
}

function withPicture(ended, pictureId) {
  return Object.freeze(Object.assign({}, ended, { pictureId: pictureId }));
}

function finish(session, drill, ended) {
  assert.equal(ended.ended, true, drill.name);
  assert.equal(ended.drillId, drill.id, drill.name);
  let next = settle(session, ended);
  const clearance = noteEnded(session.clearance || createClearance(), ended);
  if (isCleared(clearance, ended.drillId)) next = markEnded(next, ended.drillId);
  return Object.freeze(Object.assign({}, next, { clearance: clearance }));
}

function finishKeeper(session, endOne) {
  let next = finish(session, goalkeeper, withPicture(endOne(goalkeeper), "central"));
  assert.equal(next.endedDrills.includes(goalkeeper.id), false);
  next = finish(next, goalkeeper, withPicture(endOne(goalkeeper), "near-post"));
  assert.equal(next.endedDrills.includes(goalkeeper.id), false);
  next = finish(next, goalkeeper, withPicture(endOne(goalkeeper), "through-ball"));
  assert.equal(next.endedDrills.includes(goalkeeper.id), true);
  assert.equal(next.endedDrills.filter((id) => id === goalkeeper.id).length, 1);
  assert.equal(next.endedDrills.includes("central"), false);
  assert.equal(next.endedDrills.includes("near-post"), false);
  assert.equal(next.endedDrills.includes("through-ball"), false);
  return next;
}

test("next stays locked until every starter has ended once", () => {
  let session = createSession();
  assert.equal(starters.length, 20);
  assert.equal(nextDrills.length, 17);

  for (const drill of nextDrills) {
    assert.equal(isLocked(drill, session.endedDrills), true, drill.name);
    assert.equal(canStart(drill, session.endedDrills), false, drill.name);
  }
  for (const drill of advanced) {
    assert.equal(canStart(drill, session.endedDrills), false, drill.name);
  }

  for (let i = 0; i < starters.length - 1; i += 1) {
    const drill = starters[i];
    const ended =
      drill.id === goalkeeper.id
        ? withPicture(endMiss(drill), "central")
        : endMiss(drill);
    session = finish(session, drill, ended);
    assert.equal(canStart(diagonal, session.endedDrills), false, drill.name);
    assert.equal(canStart(zones, session.endedDrills), false, drill.name);
  }

  assert.equal(session.endedDrills.includes(goalkeeper.id), false);
  assert.equal(session.endedDrills.includes("central"), false);
  assert.equal(session.endedDrills.includes("near-post"), false);
  assert.equal(session.endedDrills.includes("through-ball"), false);

  const last = starters[starters.length - 1];
  const before = session.points;
  const missed = endMiss(last);
  assert.equal(missed.state, "miss");
  session = finish(session, last, missed);
  assert.equal(session.points - before, 1);
  assert.equal(session.endedDrills.includes(goalkeeper.id), false);
  assert.equal(canStart(diagonal, session.endedDrills), false);

  session = finish(session, goalkeeper, withPicture(endMiss(goalkeeper), "near-post"));
  assert.equal(session.endedDrills.includes(goalkeeper.id), false);
  assert.equal(canStart(diagonal, session.endedDrills), false);
  session = finish(session, goalkeeper, withPicture(endMiss(goalkeeper), "through-ball"));
  assert.equal(session.endedDrills.includes(goalkeeper.id), true);
  assert.equal(session.endedDrills.filter((id) => id === goalkeeper.id).length, 1);
  assert.equal(session.endedDrills.length, starters.length);

  for (const drill of nextDrills) {
    assert.equal(isLocked(drill, session.endedDrills), false, drill.name);
    assert.equal(canStart(drill, session.endedDrills), true, drill.name);
  }
  for (const drill of advanced) {
    assert.equal(isLocked(drill, session.endedDrills), true, drill.name);
    assert.equal(canStart(drill, session.endedDrills), false, drill.name);
  }
});

test("advanced stays locked until every next drill has ended once", () => {
  let session = createSession();

  for (const drill of starters) {
    session =
      drill.id === goalkeeper.id
        ? finishKeeper(session, endCorrect)
        : finish(session, drill, endCorrect(drill));
  }
  for (const drill of advanced) {
    assert.equal(canStart(drill, session.endedDrills), false, drill.name);
  }
  for (const drill of nextDrills) {
    assert.equal(canStart(drill, session.endedDrills), true, drill.name);
  }

  for (let i = 0; i < nextDrills.length - 1; i += 1) {
    session = finish(session, nextDrills[i], endMiss(nextDrills[i]));
    assert.equal(canStart(zones, session.endedDrills), false, nextDrills[i].name);
    assert.equal(
      session.endedDrills.filter((id) => id === nextDrills[i].id).length,
      1,
      nextDrills[i].name
    );
  }

  const last = nextDrills[nextDrills.length - 1];
  const missed = endMiss(last);
  assert.equal(missed.state, "miss");
  session = finish(session, last, missed);

  for (const drill of advanced) {
    assert.equal(isLocked(drill, session.endedDrills), false, drill.name);
    assert.equal(canStart(drill, session.endedDrills), true, drill.name);
  }
  assert.equal(canStart(zones, session.endedDrills), true);
});

test("a miss still clears", () => {
  const openBody = starters.find((drill) => drill.name === "Open body");
  let session = createSession();
  const missed = endMiss(openBody);
  assert.equal(missed.state, "miss");
  assert.equal(missed.ended, true);
  session = finish(session, openBody, missed);
  assert.equal(session.points, 1);
  assert.deepEqual(session.endedDrills, [openBody.id]);

  for (const drill of starters) {
    if (drill.id === openBody.id) continue;
    session =
      drill.id === goalkeeper.id
        ? finishKeeper(session, endCorrect)
        : finish(session, drill, endCorrect(drill));
  }
  assert.equal(canStart(diagonal, session.endedDrills), true);
  assert.equal(canStart(zones, session.endedDrills), false);

  let almost = createSession();
  for (let i = 0; i < starters.length - 1; i += 1) {
    almost = finish(almost, starters[i], endCorrect(starters[i]));
  }
  assert.equal(almost.points, 57);
  assert.equal(canStart(diagonal, almost.endedDrills), false);

  const setAndGo = nextDrills.find((drill) => drill.name === "Set and go");
  const opened = finish(createSession(), setAndGo, endMiss(setAndGo));
  assert.equal(opened.endedDrills.length, 1);
  assert.equal(opened.endedDrills[0], setAndGo.id);
  assert.equal(opened.points, 1);
});

test("a reload starts locked again", () => {
  let session = createSession();
  for (const drill of starters) {
    session =
      drill.id === goalkeeper.id
        ? finishKeeper(session, endMiss)
        : finish(session, drill, endMiss(drill));
  }
  for (const drill of nextDrills) session = finish(session, drill, endMiss(drill));
  assert.equal(canStart(diagonal, session.endedDrills), true);
  assert.equal(canStart(zones, session.endedDrills), true);
  assert.ok(session.points > 0);

  const reloaded = createSession();
  assert.equal(reloaded.points, 0);
  assert.deepEqual(reloaded.endedDrills, []);
  for (const drill of nextDrills) {
    assert.equal(isLocked(drill, reloaded.endedDrills), true, drill.name);
    assert.equal(canStart(drill, reloaded.endedDrills), false, drill.name);
  }
  for (const drill of advanced) {
    assert.equal(canStart(drill, reloaded.endedDrills), false, drill.name);
  }
  for (const drill of starters) {
    assert.equal(canStart(drill, reloaded.endedDrills), true, drill.name);
  }
  assert.equal(session.points > 0, true);
  assert.equal(canStart(zones, session.endedDrills), true);

  const files = [
    "index.html",
    "js/catalog.js",
    "js/game.js",
    "js/points.js",
    "js/clear.js",
    "js/scene-play.js",
    "js/starter-scenes.js",
  ];
  const persistent =
    /localStorage|sessionStorage|indexedDB|document\.cookie|\bcaches\b|openDatabase/;
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(source, persistent, file);
  }

  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(game, /createSession\(/);
  assert.match(game, /isLocked\(drill, session\.endedDrills\)/);
  assert.match(game, /canStart\(drill, session\.endedDrills\)/);
  assert.match(game, /refreshDrills\(/);
  assert.match(game, /textContent = "Locked"/);
  assert.match(game, /textContent = "Start"/);
  assert.doesNotMatch(game, /unlock/i);
  assert.ok(
    html.indexOf('src="js/starter-scenes.js"') < html.indexOf('src="js/scenes/next.js"') &&
      html.indexOf('src="js/scenes/next.js"') <
        html.indexOf('src="js/scenes/advanced.js"') &&
      html.indexOf('src="js/scenes/advanced.js"') <
        html.indexOf('src="js/scene-play.js"') &&
      html.indexOf('src="js/scene-play.js"') < html.indexOf('src="js/game.js"')
  );
});

test("a startable next or advanced drill plays its signed-off scene", () => {
  const nextScene = nextSceneById("diagonal-run");
  const spot = nextScene.pictures[0].goodSpot;
  const learner = nextScene.pictures[0].players.find((player) => player.id === "learner");
  const beforeX = spot.x;
  const played = sceneFor("diagonal-run");
  assert.equal(spot.x, beforeX);
  assert.ok(spot.x < 70);
  assert.equal(played.kind, "drag");
  assert.equal(played.goodSpots.length, 1);
  assert.equal(played.goodSpots[0].x, spot.x * 10);
  assert.equal(played.goodSpots[0].y, spot.y * 10);
  assert.equal(played.goodSpots[0].r, spot.r * 10);
  assert.equal(played.learner.x, learner.x * 10);
  assert.equal(played.learner.y, learner.y * 10);
  assert.equal(sceneFor("open-body"), null);
  assert.equal(sceneFor("zones").kind, "drag");

  const overlap = nextSceneById("overlap");
  const picture = overlap.pictures[0];
  const correct = picture.marks.find((mark) => mark.id === picture.correctMarkId);
  const playedPick = sceneFor("overlap");
  const chosen = playedPick.targets.find((target) => target.id === "b");
  assert.equal(playedPick.targets.filter((target) => target.id === "b").length, 1);
  assert.equal(chosen.x, correct.x * 10);
  assert.equal(chosen.y, correct.y * 10);
  assert.equal(chosen.r, correct.r * 10);
  assert.equal("correct" in chosen, false);

  const setAndGo = sceneFor("set-and-go");
  assert.deepEqual(
    setAndGo.angles.map((angle) => angle.id),
    ["setter", "runner"]
  );
  const setter = frameFor(setAndGo, "setter");
  const runner = frameFor(setAndGo, "runner");
  const source = nextSceneById("set-and-go");
  assert.equal(setter.targets.find((target) => target.id === "b").x, source.pictures[0].marks.find((mark) => mark.id === source.pictures[0].correctMarkId).x * 10);
  assert.equal(runner.targets.find((target) => target.id === "b").x, source.pictures[1].marks.find((mark) => mark.id === source.pictures[1].correctMarkId).x * 10);
  assert.equal(frameFor(setAndGo, "central").targets, setter.targets);

  const line = advancedSceneById("offside-line-step-or-drop");
  const playedLine = sceneFor("offside-line-step-or-drop");
  assert.equal(line.pictures[0].goodSpot.y, 70.5);
  assert.equal(
    frameFor(playedLine, line.pictures[1].id).goodSpots[0].y,
    line.pictures[1].goodSpot.y * 10
  );

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
  try {
    require("../js/starter-scenes.js").install();
    const pageAttempt = globalThis.SoccerAttempt;
    const open = pageAttempt.createAttempt(
      starters.find((drill) => drill.id === "open-body")
    );
    assert.equal(open.goodSpots[0].x, 420);
    assert.equal(open.goodSpots[0].y, 676);
    assert.equal(open.token.x, 360);
    assert.equal(open.token.y, 700);

    const keeper = pageAttempt.createAttempt(goalkeeper);
    assert.equal(keeper.drillId, goalkeeper.id);
    assert.equal(keeper.goodSpots.length, 1);
    assert.equal(keeper.goodSpots[0].x, 340);
    assert.equal(keeper.goodSpots[0].y, 1030);

    const run = pageAttempt.createAttempt(diagonal);
    assert.equal(run.drillId, "diagonal-run");
    assert.equal(run.goodSpots[0].x, spot.x * 10);
    assert.equal(run.goodSpots[0].y, spot.y * 10);
    assert.notDeepEqual(
      run.goodSpots.map((entry) => entry.x),
      goodSpots.map((entry) => entry.x)
    );
    const missedRun = pageAttempt.drop(run, { x: 1, y: 1 });
    assert.equal(missedRun.state, "miss");
    assert.equal(missedRun.ended, true);
    assert.equal(missedRun.correctionSpots.length, 1);
    assert.equal(missedRun.correctionSpots[0].x, spot.x * 10);
    assert.equal(missedRun.correctionSpots[0].y, spot.y * 10);

    const found = pageAttempt.drop(pageAttempt.createAttempt(diagonal), {
      x: spot.x * 10,
      y: spot.y * 10,
    });
    assert.equal(found.state, "correct");
    assert.equal(found.confirmation, "You found a spot.");
    assert.deepEqual(found.correctionSpots, []);

    const overlapDrill = nextDrills.find((drill) => drill.id === "overlap");
    const choosing = pageAttempt.createPickAttempt(overlapDrill);
    assert.equal(choosing.targets.find((target) => target.id === "b").x, correct.x * 10);
    assert.equal(pageAttempt.pick(choosing, "b").state, "correct");
    const other = choosing.targets.find((target) => target.id !== "b");
    const missedPick = pageAttempt.pick(pageAttempt.createPickAttempt(overlapDrill), other.id);
    assert.equal(missedPick.state, "miss");
    assert.equal(missedPick.correctionSpots[0].x, correct.x * 10);
    assert.equal(missedPick.correctionSpots[0].y, correct.y * 10);
  } finally {
    if (previousDocument === undefined) delete global.document;
    else global.document = previousDocument;
    if (previousAttempt === undefined) delete globalThis.SoccerAttempt;
    else globalThis.SoccerAttempt = previousAttempt;
    if (previousPlay === undefined) delete globalThis.SoccerScenePlay;
    else globalThis.SoccerScenePlay = previousPlay;
  }
});

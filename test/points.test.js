const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { drills } = require("../js/catalog.js");
const {
  goodSpots,
  markedTargets,
  correctTarget,
  createAttempt,
  createPickAttempt,
  drop,
  pick,
} = require("../js/attempt.js");
const { createSession, settle } = require("../js/points.js");

const root = path.join(__dirname, "..");
const drag = drills.find((drill) => drill.kind === "drag");
const otherDrag = drills.find(
  (drill) => drill.kind === "drag" && drill.id !== drag.id
);
const pickDrill = drills.find((drill) => drill.kind === "pick");
const wrongTarget = markedTargets.find((target) => target.id !== correctTarget.id);
const spot = { x: goodSpots[0].x, y: goodSpots[0].y };

function loadPoints() {
  const resolved = require.resolve("../js/points.js");
  delete require.cache[resolved];
  return require("../js/points.js");
}

test("a miss adds 1", () => {
  let session = createSession();
  assert.equal(session.points, 0);

  const playing = createAttempt(drag);
  assert.equal(playing.ended, false);
  session = settle(session, playing);
  assert.equal(session.points, 0);

  const missed = drop(playing, { x: 1, y: 1 });
  assert.equal(missed.state, "miss");
  assert.equal(missed.ended, true);
  session = settle(session, missed);
  assert.equal(session.points, 1);

  const pickPlaying = createPickAttempt(pickDrill);
  session = settle(session, pickPlaying);
  assert.equal(session.points, 1);

  const pickMiss = pick(pickPlaying, wrongTarget.id);
  assert.equal(pickMiss.state, "miss");
  assert.equal(pickMiss.ended, true);
  session = settle(session, pickMiss);
  assert.equal(session.points, 2);
});

test("a correct first try adds 3", () => {
  let session = createSession();
  const playing = createAttempt(drag);
  session = settle(session, playing);
  assert.equal(session.points, 0);

  const ended = drop(playing, spot);
  assert.equal(ended.state, "correct");
  assert.equal(ended.ended, true);
  session = settle(session, ended);
  assert.equal(session.points, 3);

  const picked = pick(createPickAttempt(pickDrill), correctTarget.id);
  assert.equal(picked.state, "correct");
  assert.equal(picked.ended, true);
  session = settle(session, picked);
  assert.equal(session.points, 6);
});

test("a later ending adds 1 and not 3", () => {
  let session = createSession();

  const firstMiss = drop(createAttempt(drag), { x: 1, y: 1 });
  session = settle(session, firstMiss);
  assert.equal(session.points, 1);

  const laterCorrect = drop(createAttempt(drag), spot);
  assert.equal(laterCorrect.state, "correct");
  const afterMiss = session.points;
  session = settle(session, laterCorrect);
  assert.equal(session.points - afterMiss, 1);
  assert.equal(session.points, 2);

  const laterMiss = drop(createAttempt(drag), { x: 4, y: 4 });
  session = settle(session, laterMiss);
  assert.equal(session.points, 3);

  const firstCorrect = pick(createPickAttempt(pickDrill), correctTarget.id);
  session = settle(session, firstCorrect);
  assert.equal(session.points, 6);

  const laterPick = pick(createPickAttempt(pickDrill), correctTarget.id);
  assert.equal(laterPick.state, "correct");
  const beforeLaterPick = session.points;
  session = settle(session, laterPick);
  assert.equal(session.points - beforeLaterPick, 1);
  assert.equal(session.points, 7);

  const otherFirst = drop(createAttempt(otherDrag), spot);
  assert.equal(otherFirst.state, "correct");
  session = settle(session, otherFirst);
  assert.equal(session.points, 10);
});

test("points are not written to storage that survives a reload", () => {
  const files = ["js/points.js", "js/game.js", "js/attempt.js", "index.html"];
  const persistent = /localStorage|sessionStorage|indexedDB|document\.cookie|\bcaches\b|openDatabase/;
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(source, persistent);
  }

  const writes = [];
  const fake = {
    setItem(key, value) {
      writes.push(["set", key, value]);
    },
    getItem() {
      writes.push(["get"]);
      return null;
    },
    removeItem(key) {
      writes.push(["remove", key]);
    },
    clear() {
      writes.push(["clear"]);
    },
    key() {
      return null;
    },
    length: 0,
  };
  const prior = {
    localStorage: Object.getOwnPropertyDescriptor(globalThis, "localStorage"),
    sessionStorage: Object.getOwnPropertyDescriptor(globalThis, "sessionStorage"),
    indexedDB: Object.getOwnPropertyDescriptor(globalThis, "indexedDB"),
  };

  function put(name, value) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value,
    });
  }

  put("localStorage", fake);
  put("sessionStorage", fake);
  put("indexedDB", fake);

  try {
    const points = loadPoints();
    let session = points.createSession();
    assert.equal(session.points, 0);
    session = points.settle(session, drop(createAttempt(drag), { x: 1, y: 1 }));
    assert.equal(session.points, 1);
    session = points.settle(session, drop(createAttempt(drag), spot));
    assert.equal(session.points, 2);
    session = points.settle(session, drop(createAttempt(otherDrag), spot));
    assert.equal(session.points, 5);

    const reloaded = points.createSession();
    assert.equal(reloaded.points, 0);
    assert.equal(session.points, 5);
    assert.deepEqual(writes, []);
    assert.equal(globalThis.localStorage, fake);
    assert.equal(globalThis.sessionStorage, fake);
  } finally {
    for (const name of ["localStorage", "sessionStorage", "indexedDB"]) {
      if (prior[name]) Object.defineProperty(globalThis, name, prior[name]);
      else delete globalThis[name];
    }
  }

  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  assert.match(game, /settle\(/);
  assert.match(game, /createSession\(/);
  assert.doesNotMatch(game, /\b(pass|fail|grade)\b/i);
});

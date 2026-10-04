const test = require("node:test");
const assert = require("node:assert/strict");
const { drills } = require("../js/catalog.js");
const {
  markedTargets,
  correctTarget,
  createAttempt,
  createPickAttempt,
  presentation,
  revealAnswer,
  endAttempt,
  pick,
} = require("../js/attempt.js");

const pickDrills = drills.filter((drill) => drill.kind === "pick");

function strip(spots) {
  return spots.map((spot) => ({ x: spot.x, y: spot.y, r: spot.r }));
}

function answerSpot(target) {
  return { x: target.x, y: target.y, r: target.r };
}

test("the first pick shows no answer", () => {
  assert.ok(pickDrills.length > 1);
  assert.ok(markedTargets.length > 1);
  assert.equal(
    markedTargets.filter((target) => target.id === correctTarget.id).length,
    1
  );

  for (const drill of pickDrills) {
    const attempt = createPickAttempt(drill);
    const view = presentation(attempt);
    assert.equal(attempt.kind, "pick");
    assert.equal(attempt.state, "playing");
    assert.equal(attempt.ended, false);
    assert.equal(attempt.answerShown, false);
    assert.equal(attempt.confirmation, "");
    assert.deepEqual(strip(attempt.correctionSpots), []);
    assert.deepEqual(
      attempt.targets.map((target) => target.id),
      markedTargets.map((target) => target.id)
    );
    assert.deepEqual(view.hint, []);
    assert.deepEqual(view.correctionSpots, []);
    assert.equal(view.confirmation, "");
    assert.equal(view.pickable, true);
    assert.equal(view.draggable, false);
    assert.equal(view.verdict, null);
    for (const target of view.targets) {
      assert.equal("correct" in target, false);
      assert.equal("answer" in target, false);
    }
  }

  const drag = drills.find((drill) => drill.kind === "drag");
  assert.throws(
    () => createPickAttempt(drag),
    /A pick attempt needs a pick drill/
  );
  assert.throws(
    () => createAttempt(pickDrills[0]),
    /A drag attempt needs a drag drill/
  );
});

test("a wrong pick reveals the correct marked target and ends", () => {
  const drill = pickDrills[0];
  const wrongTargets = markedTargets.filter(
    (target) => target.id !== correctTarget.id
  );
  assert.ok(wrongTargets.length > 0);

  assert.throws(
    () => endAttempt(createPickAttempt(drill)),
    /Show the answer before the attempt is over/
  );

  const revealed = revealAnswer(createPickAttempt(drill));
  assert.equal(revealed.state, "playing");
  assert.equal(revealed.ended, false);
  assert.equal(revealed.answerShown, true);
  assert.deepEqual(strip(revealed.correctionSpots), [answerSpot(correctTarget)]);

  for (const wrong of wrongTargets) {
    const ended = pick(createPickAttempt(drill), wrong.id);
    const view = presentation(ended);
    assert.equal(ended.state, "miss");
    assert.equal(ended.ended, true);
    assert.equal(ended.confirmation, "");
    assert.equal(ended.correctionSpots.length, 1);
    assert.deepEqual(strip(ended.correctionSpots), [answerSpot(correctTarget)]);
    assert.notDeepEqual(strip(ended.correctionSpots), [answerSpot(wrong)]);
    assert.deepEqual(view.correctionSpots, ended.correctionSpots);
    assert.equal(view.confirmation, "");
    assert.equal(view.pickable, false);
    assert.equal(view.verdict, null);
    assert.equal("pass" in ended, false);
    assert.equal("fail" in ended, false);
    assert.equal("result" in ended, false);
    assert.equal(pick(ended, correctTarget.id), ended);
    assert.equal(pick(ended, wrong.id), ended);
  }

  const last = pickDrills[pickDrills.length - 1];
  const missed = pick(createPickAttempt(last), wrongTargets[0].id);
  assert.equal(missed.state, "miss");
  assert.equal(missed.ended, true);
  assert.deepEqual(strip(missed.correctionSpots), [answerSpot(correctTarget)]);

  const fresh = createPickAttempt(drill);
  assert.equal(pick(fresh, "nope"), fresh);
  assert.equal(fresh.answerShown, false);
  assert.equal(fresh.ended, false);
});

test("a correct pick ends with the confirmation and no correction spots", () => {
  const drill = pickDrills[0];
  const wrong = markedTargets.find((target) => target.id !== correctTarget.id);
  const ended = pick(createPickAttempt(drill), correctTarget.id);
  const view = presentation(ended);

  assert.equal(ended.state, "correct");
  assert.equal(ended.ended, true);
  assert.equal(ended.confirmation, "You found a spot.");
  assert.deepEqual(ended.correctionSpots, []);
  assert.equal(view.confirmation, "You found a spot.");
  assert.deepEqual(view.correctionSpots, []);
  assert.deepEqual(view.hint, []);
  assert.equal(view.pickable, false);
  assert.equal(view.draggable, false);
  assert.equal(view.verdict, null);
  assert.equal("pass" in ended, false);
  assert.equal("fail" in ended, false);
  assert.equal("result" in ended, false);
  assert.equal(pick(ended, wrong.id), ended);
  assert.equal(pick(ended, correctTarget.id), ended);

  const last = pick(
    createPickAttempt(pickDrills[pickDrills.length - 1]),
    correctTarget.id
  );
  assert.equal(last.state, "correct");
  assert.equal(last.confirmation, "You found a spot.");
  assert.deepEqual(last.correctionSpots, []);
});

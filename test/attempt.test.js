const test = require("node:test");
const assert = require("node:assert/strict");
const { drills } = require("../js/catalog.js");
const {
  goodSpots,
  createAttempt,
  presentation,
  revealAnswer,
  endAttempt,
  drop,
} = require("../js/attempt.js");

const dragDrills = drills.filter((drill) => drill.kind === "drag");

function strip(spots) {
  return spots.map((spot) => ({ x: spot.x, y: spot.y, r: spot.r }));
}

test("first try has no hint", () => {
  assert.ok(dragDrills.length > 0);
  for (const drill of dragDrills) {
    const attempt = createAttempt(drill);
    const view = presentation(attempt);
    assert.equal(attempt.state, "playing");
    assert.equal(attempt.ended, false);
    assert.equal(attempt.answerShown, false);
    assert.equal(attempt.confirmation, "");
    assert.deepEqual(strip(attempt.goodSpots), strip(goodSpots));
    assert.deepEqual(view.hint, []);
    assert.deepEqual(view.correctionSpots, []);
    assert.equal(view.confirmation, "");
    assert.equal(view.draggable, true);
    assert.equal(view.verdict, null);
    for (const spot of attempt.goodSpots) {
      const dx = attempt.token.x - spot.x;
      const dy = attempt.token.y - spot.y;
      assert.ok(dx * dx + dy * dy > spot.r * spot.r);
    }
  }
});

test("a miss reveals the fixed good spots and ends", () => {
  const drill = dragDrills[0];
  const attempt = createAttempt(drill);

  assert.throws(
    () => endAttempt(attempt),
    /Show the answer before the attempt is over/
  );

  const revealed = revealAnswer(attempt);
  assert.equal(revealed.state, "playing");
  assert.equal(revealed.ended, false);
  assert.equal(revealed.answerShown, true);
  assert.deepEqual(strip(revealed.correctionSpots), strip(goodSpots));

  const ended = endAttempt(revealed);
  assert.equal(ended.state, "miss");
  assert.equal(ended.ended, true);
  assert.deepEqual(strip(ended.correctionSpots), strip(goodSpots));

  const low = drop(createAttempt(drill), { x: 1, y: 1 });
  const high = drop(createAttempt(dragDrills[dragDrills.length - 1]), {
    x: 400,
    y: 600,
  });
  assert.equal(low.state, "miss");
  assert.equal(low.ended, true);
  assert.equal(high.state, "miss");
  assert.equal(high.ended, true);
  assert.deepEqual(strip(low.correctionSpots), strip(goodSpots));
  assert.deepEqual(strip(high.correctionSpots), strip(low.correctionSpots));
  assert.equal(low.confirmation, "");
  assert.equal(presentation(low).verdict, null);
  assert.equal("pass" in low, false);
  assert.equal("fail" in low, false);
  assert.equal("result" in low, false);
  assert.deepEqual(presentation(low).correctionSpots, low.correctionSpots);
  assert.equal(presentation(low).draggable, false);
  assert.equal(drop(low, goodSpots[0]), low);

  const spot = goodSpots[0];
  const outside = drop(createAttempt(drill), {
    x: spot.x + spot.r + 1,
    y: spot.y,
  });
  assert.equal(outside.state, "miss");
  assert.deepEqual(strip(outside.correctionSpots), strip(goodSpots));
});

test("a correct drop ends with the confirmation and no correction spots", () => {
  const drill = dragDrills[0];
  for (const spot of goodSpots) {
    const ended = drop(createAttempt(drill), { x: spot.x, y: spot.y });
    const view = presentation(ended);
    assert.equal(ended.state, "correct");
    assert.equal(ended.ended, true);
    assert.equal(ended.confirmation, "You found a spot.");
    assert.deepEqual(ended.correctionSpots, []);
    assert.equal(view.confirmation, "You found a spot.");
    assert.deepEqual(view.correctionSpots, []);
    assert.deepEqual(view.hint, []);
    assert.equal(view.draggable, false);
    assert.equal(view.verdict, null);
    assert.equal(drop(ended, { x: 1, y: 1 }), ended);
  }

  const spot = goodSpots[0];
  const edge = drop(createAttempt(drill), { x: spot.x + spot.r, y: spot.y });
  assert.equal(edge.state, "correct");
  assert.equal(edge.confirmation, "You found a spot.");
  assert.deepEqual(edge.correctionSpots, []);
});

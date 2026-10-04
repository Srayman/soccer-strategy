const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { drills, isLocked, canStart } = require("../js/catalog.js");
const {
  goodSpots,
  markedTargets,
  correctTarget,
  createAttempt,
  createPickAttempt,
  presentation,
  revealAnswer,
  endAttempt,
  drop,
  pick,
} = require("../js/attempt.js");
const {
  fixedAnimation,
  buttonEnabled,
  animationFor,
  nextInTier,
} = require("../js/next-play.js");

const root = path.join(__dirname, "..");
const drag = drills.find((drill) => drill.tier === "starter" && drill.kind === "drag");
const pickDrill = drills.find((drill) => drill.tier === "starter" && drill.kind === "pick");
const wrongTarget = markedTargets.find((target) => target.id !== correctTarget.id);
const spot = goodSpots[0];

function hideAnswer(attempt) {
  return {
    state: attempt.state,
    ended: attempt.ended,
    answerShown: false,
    confirmation: attempt.confirmation,
    correctionSpots: attempt.correctionSpots,
  };
}

test("the button is off on a miss until the answer is shown", () => {
  const playing = createAttempt(drag);
  assert.equal(buttonEnabled(playing), false);
  assert.equal(animationFor(playing), null);

  const revealed = revealAnswer(playing);
  assert.equal(revealed.state, "playing");
  assert.equal(revealed.answerShown, true);
  assert.equal(revealed.ended, false);
  assert.equal(presentation(revealed).correctionSpots.length, 0);
  assert.equal(buttonEnabled(revealed), false);
  assert.equal(animationFor(revealed), null);

  const hidden = hideAnswer(endAttempt(revealed));
  assert.equal(hidden.state, "miss");
  assert.equal(hidden.ended, true);
  assert.equal(hidden.answerShown, false);
  assert.equal(buttonEnabled(hidden), false);
  assert.equal(animationFor(hidden), null);

  const missed = endAttempt(revealed);
  assert.equal(missed.state, "miss");
  assert.equal(missed.answerShown, true);
  assert.ok(presentation(missed).correctionSpots.length > 0);
  assert.equal(buttonEnabled(missed), true);

  const dropped = drop(createAttempt(drag), { x: 1, y: 1 });
  assert.equal(dropped.state, "miss");
  assert.equal(dropped.answerShown, true);
  assert.equal(dropped.confirmation, "");
  assert.equal(buttonEnabled(dropped), true);
  assert.equal(buttonEnabled(hideAnswer(dropped)), false);

  const picked = pick(createPickAttempt(pickDrill), wrongTarget.id);
  assert.equal(picked.state, "miss");
  assert.equal(picked.answerShown, true);
  assert.equal(buttonEnabled(createPickAttempt(pickDrill)), false);
  assert.equal(buttonEnabled(hideAnswer(picked)), false);
  assert.equal(buttonEnabled(picked), true);

  assert.equal(animationFor(dropped), fixedAnimation);
  assert.equal(animationFor(picked), fixedAnimation);
  assert.notEqual(fixedAnimation.frames[0].x, 1);
  assert.notEqual(fixedAnimation.frames[1].x, 1);
  assert.equal(fixedAnimation.repeatCount, 1);
  assert.equal(fixedAnimation.frames.length, 2);
  assert.equal("velocity" in fixedAnimation, false);
  assert.equal("gravity" in fixedAnimation, false);
});

test("the button is on after a correct end", () => {
  const playing = createAttempt(drag);
  assert.equal(buttonEnabled(playing), false);
  assert.equal(presentation(playing).confirmation, "");

  const ended = drop(playing, { x: spot.x, y: spot.y });
  const view = presentation(ended);
  assert.equal(ended.state, "correct");
  assert.equal(ended.ended, true);
  assert.equal(ended.confirmation, "You found a spot.");
  assert.equal(view.confirmation, "You found a spot.");
  assert.deepEqual(view.correctionSpots, []);
  assert.equal(buttonEnabled(ended), true);
  assert.equal(animationFor(ended), fixedAnimation);

  const picked = pick(createPickAttempt(pickDrill), correctTarget.id);
  const pickView = presentation(picked);
  assert.equal(picked.state, "correct");
  assert.equal(picked.confirmation, "You found a spot.");
  assert.equal(pickView.confirmation, "You found a spot.");
  assert.deepEqual(pickView.correctionSpots, []);
  assert.equal(buttonEnabled(picked), true);
  assert.equal(animationFor(picked), fixedAnimation);
  assert.equal(animationFor(picked), animationFor(drop(createAttempt(drag), { x: 3, y: 9 })));

  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /id="next-play"/);
  assert.match(html, /Next play/);
  assert.match(game, /view\.confirmation/);
  assert.match(game, /buttonEnabled\(/);
  assert.match(game, /animationFor\(/);
  assert.doesNotMatch(game, /requestAnimationFrame|physics|velocity|gravity/);
  assert.doesNotMatch(game, /\b(pass|fail)\b/i);
});

test("next play advances one drill", () => {
  const starters = drills.filter((drill) => drill.tier === "starter");
  assert.equal(starters.length, 20);

  for (let i = 0; i < starters.length - 1; i += 1) {
    const upcoming = nextInTier(drills, starters[i].id);
    assert.equal(upcoming.id, starters[i + 1].id);
    assert.equal(upcoming.tier, "starter");
    assert.notEqual(upcoming.id, starters[i].id);
  }

  const lastStarter = starters[starters.length - 1];
  assert.equal(nextInTier(drills, lastStarter.id), null);
  assert.equal(drills[drills.findIndex((drill) => drill.id === lastStarter.id) + 1].tier, "next");

  const nextTier = drills.filter((drill) => drill.tier === "next");
  assert.equal(nextInTier(drills, nextTier[0].id).id, nextTier[1].id);
  assert.equal(nextInTier(drills, nextTier[0].id).tier, "next");
  assert.equal(nextInTier(drills, nextTier[nextTier.length - 1].id), null);

  const advanced = drills.filter((drill) => drill.tier === "advanced");
  assert.equal(nextInTier(drills, advanced[0].id).id, advanced[1].id);
  assert.equal(nextInTier(drills, advanced[advanced.length - 1].id), null);
  assert.equal(nextInTier(drills, "missing"), null);

  for (const drill of drills) {
    if (drill.tier === "starter") {
      assert.equal(isLocked(drill), false);
      assert.equal(canStart(drill), true);
    } else {
      assert.equal(isLocked(drill), true);
      assert.equal(canStart(drill), false);
    }
  }

  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  assert.match(game, /nextInTier\(/);
  assert.match(game, /canStart\(/);
  assert.doesNotMatch(game, /unlock/i);
});

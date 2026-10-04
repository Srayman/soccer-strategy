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
  presentation,
  revealAnswer,
  drop,
  pick,
} = require("../js/attempt.js");
const { createSession, settle } = require("../js/points.js");
const { buttonEnabled } = require("../js/next-play.js");
const { celebrationFor } = require("../js/celebrate.js");

const root = path.join(__dirname, "..");
const drag = drills.find((drill) => drill.kind === "drag");
const pickDrill = drills.find((drill) => drill.kind === "pick");
const wrongTarget = markedTargets.find((target) => target.id !== correctTarget.id);
const spot = { x: goodSpots[0].x, y: goodSpots[0].y };

test("a correct first try celebrates", () => {
  let session = createSession();
  const playing = createAttempt(drag);
  assert.equal(celebrationFor(playing), null);

  const ended = drop(playing, spot);
  session = settle(session, ended);
  const view = presentation(ended);
  const mark = celebrationFor(ended);

  assert.equal(ended.state, "correct");
  assert.equal(ended.ended, true);
  assert.equal(session.points, 3);
  assert.equal(ended.confirmation, "You found a spot.");
  assert.equal(view.confirmation, "You found a spot.");
  assert.deepEqual(view.correctionSpots, []);
  assert.ok(mark);
  assert.equal(mark.stars.length, 8);
  assert.equal(mark.disc.r, 240);
  assert.equal(mark.ring.r, 160);
  assert.match(mark.shapes.big, /^-?[\d.]+,-70\.00 /);
  assert.match(mark.shapes.small, /^-?[\d.]+,-46\.00 /);
  assert.equal("audio" in mark, false);
  assert.equal(buttonEnabled(ended), true);

  const picked = pick(createPickAttempt(pickDrill), correctTarget.id);
  const pickView = presentation(picked);
  assert.equal(picked.state, "correct");
  assert.equal(pickView.confirmation, "You found a spot.");
  assert.deepEqual(pickView.correctionSpots, []);
  assert.equal(celebrationFor(picked), mark);
});

test("a later correct ending still celebrates", () => {
  let session = createSession();
  const missed = drop(createAttempt(drag), { x: 1, y: 1 });
  session = settle(session, missed);
  assert.equal(session.points, 1);
  assert.equal(celebrationFor(missed), null);

  const later = drop(createAttempt(drag), spot);
  const before = session.points;
  session = settle(session, later);
  assert.equal(later.state, "correct");
  assert.equal(session.points - before, 1);
  assert.equal(session.points, 2);
  assert.equal(later.confirmation, "You found a spot.");
  assert.deepEqual(presentation(later).correctionSpots, []);
  assert.ok(celebrationFor(later));
  assert.equal(celebrationFor(later), celebrationFor(drop(createAttempt(drag), spot)));

  const firstPick = pick(createPickAttempt(pickDrill), correctTarget.id);
  session = settle(createSession(), firstPick);
  const again = pick(createPickAttempt(pickDrill), correctTarget.id);
  const afterPick = settle(session, again);
  assert.equal(again.state, "correct");
  assert.equal(afterPick.points, 4);
  assert.equal(celebrationFor(again), celebrationFor(later));
});

test("a miss does not celebrate", () => {
  const playing = createAttempt(drag);
  const revealed = revealAnswer(playing);
  assert.equal(revealed.answerShown, true);
  assert.equal(revealed.ended, false);
  assert.equal(celebrationFor(revealed), null);
  assert.equal(buttonEnabled(revealed), false);

  const missed = drop(playing, { x: 1, y: 1 });
  const view = presentation(missed);
  assert.equal(missed.state, "miss");
  assert.equal(missed.confirmation, "");
  assert.ok(view.correctionSpots.length > 0);
  assert.equal(celebrationFor(missed), null);
  assert.equal(buttonEnabled(missed), true);

  const hidden = {
    state: missed.state,
    ended: missed.ended,
    answerShown: false,
    confirmation: missed.confirmation,
    correctionSpots: [],
  };
  assert.equal(buttonEnabled(hidden), false);
  assert.equal(celebrationFor(hidden), null);

  const picked = pick(createPickAttempt(pickDrill), wrongTarget.id);
  assert.equal(picked.state, "miss");
  assert.ok(presentation(picked).correctionSpots.length > 0);
  assert.equal(picked.confirmation, "");
  assert.equal(celebrationFor(picked), null);
  assert.equal(celebrationFor(null), null);
});

test("the page celebrates from the correct ending and leaves the rest of play", () => {
  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "css", "game.css"), "utf8");
  const scenes = fs.readFileSync(path.join(root, "js", "starter-scenes.js"), "utf8");

  assert.match(html, /src="js\/celebrate\.js"/);
  assert.ok(
    html.indexOf('src="js/next-play.js"') < html.indexOf('src="js/celebrate.js"') &&
      html.indexOf('src="js/celebrate.js"') < html.indexOf('src="js/game.js"')
  );
  assert.match(game, /celebrationFor\(/);
  assert.match(game, /id: "spot-celebration"/);
  assert.match(game, /is-celebrating/);
  assert.match(game, /view\.confirmation/);
  assert.match(game, /buttonEnabled\(/);
  assert.doesNotMatch(game, /goodSpots/);
  assert.doesNotMatch(game, /requestAnimationFrame|physics|velocity|gravity/);
  assert.doesNotMatch(game, /\b(pass|fail|grade)\b/i);
  assert.doesNotMatch(game, /Audio|speechSynthesis|\.mp3|\.wav/);
  assert.doesNotMatch(css, /<audio|@keyframes[\s\S]*sound/);

  assert.match(css, /\.spot-celebration/);
  assert.match(css, /animation-duration:\s*2\.8s/);
  assert.match(css, /@keyframes burst-pop/);
  assert.match(scenes, /const playerRadius = 18;/);
  assert.match(
    scenes,
    /return Object\.freeze\(\{ x: spot\.x, y: spot\.y, r: spot\.r \* 2 \}\);/
  );
  assert.match(game, /class: "drag-hit", cx: 0, cy: 0, r: 44/);
  assert.match(game, /class: "drag-token", cx: 0, cy: 0, r: 28/);

  const panes = css.slice(css.indexOf("/* Fixed page unless"), css.indexOf(".spot-celebration"));
  assert.match(panes, /@media \(max-width: 800px\), \(max-height: 500px\)/);
  assert.match(panes, /aspect-ratio: 1180 \/ 744/);
  assert.match(panes, /rotate\(-90deg\)/);
  assert.match(panes, /@media \(max-width: 639px\)/);
  assert.match(panes, /height: 16rem/);
  assert.match(panes, /@media \(min-width: 640px\) and \(max-width: 800px\)/);
  assert.doesNotMatch(panes, /spot-celebration|burst-pop|is-celebrating/);
});

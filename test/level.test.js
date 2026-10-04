const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("path");
const { drills } = require("../js/catalog.js");
const scenes = require("../js/starter-scenes.js");

const root = path.join(__dirname, "..");
const openBody = drills.find((drill) => drill.id === "open-body");
const checkAway = drills.find((drill) => drill.id === "check-away");
const diagonal = drills.find((drill) => drill.id === "diagonal-run");
const overlap = drills.find((drill) => drill.id === "overlap");

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

let harness;
test.before(() => {
  harness = installAttempt();
});
test.after(() => {
  harness.restore();
});

test("open body level 1 is 44 and level 2 is 88", () => {
    const attempt = harness.attempt;
    assert.equal(scenes.byId["open-body"].goodSpots[0].r, 22);
    assert.equal(openBody.kind, "drag");
    assert.equal(openBody.tier, "starter");

    const level1 = attempt.createLevelAttempt(openBody, 1);
    assert.equal(level1.kind, "pick");
    assert.equal(level1.level, 1);
    assert.equal(level1.state, "playing");
    assert.equal(level1.ended, false);
    assert.equal(level1.targets.length, 1);
    assert.equal(level1.targets[0].id, "b");
    assert.equal(level1.targets[0].x, 420);
    assert.equal(level1.targets[0].y, 676);
    assert.equal(level1.targets[0].r, 44);
    assert.notEqual(level1.targets[0].r, 22);
    assert.equal(level1.token.x, 360);
    assert.equal(level1.token.y, 700);
    const view1 = attempt.presentation(level1);
    assert.equal(view1.pickable, true);
    assert.equal(view1.draggable, false);
    assert.equal(view1.targets[0].r, 44);

    const stayed = attempt.drop(level1, { x: 420, y: 676 });
    assert.equal(stayed, level1);
    assert.equal(stayed.ended, false);

    const chosen = attempt.pick(level1, "b");
    assert.equal(chosen.state, "correct");
    assert.equal(chosen.ended, true);
    assert.equal(chosen.token.x, 420);
    assert.equal(chosen.token.y, 676);
    assert.notEqual(chosen.token.x, level1.token.x);

    const level2 = attempt.createLevelAttempt(openBody, 2);
    assert.notEqual(level2.kind, "pick");
    assert.equal(level2.level, 2);
    assert.equal(level2.levelMarks[0].r, 88);
    assert.equal(level2.goodSpots[0].r, 88);
    assert.notEqual(level2.goodSpots[0].r, 44);
    assert.equal(level2.token.x, 360);
    assert.equal(level2.token.y, 700);
    const view2 = attempt.presentation(level2);
    assert.equal(view2.draggable, true);
    assert.equal(view2.pickable, false);
    assert.equal(view2.targets.length, 1);
    assert.equal(view2.targets[0].r, 88);

    const inside = attempt.drop(level2, { x: 480, y: 676 });
    assert.equal(inside.state, "correct");
    assert.equal(inside.token.x, 420);
    assert.equal(inside.token.y, 676);
    assert.equal(attempt.presentation(inside).targets[0].r, 88);

    const outside = attempt.drop(attempt.createLevelAttempt(openBody, 2), {
      x: 520,
      y: 676,
    });
    assert.equal(outside.state, "miss");
    assert.equal(outside.ended, true);
    assert.equal(outside.token.x, 520);
    assert.equal(outside.token.y, 676);
    assert.equal(outside.goodSpots[0].r, 88);
});

test("level 1 keeps a doubled mark, and the landing test does not multiply it again", () => {
  const attempt = harness.attempt;
    const drawn = attempt.createAttempt(diagonal);
    const level1 = attempt.createLevelAttempt(diagonal, 1);
    assert.equal(level1.kind, "pick");
    assert.equal(level1.targets[0].r, drawn.goodSpots[0].r);
    assert.notEqual(level1.targets[0].r, drawn.goodSpots[0].r / 2);

    const level2 = attempt.createLevelAttempt(diagonal, 2);
    const radius = drawn.goodSpots[0].r;
    assert.equal(level2.goodSpots[0].r, radius * 2);
    assert.equal(level2.levelMarks[0].r, radius * 2);
    const x = level2.goodSpots[0].x;
    const y = level2.goodSpots[0].y;
    const wider = attempt.drop(attempt.createLevelAttempt(diagonal, 2), {
      x: x + radius + 1,
      y: y,
    });
    assert.equal(wider.state, "correct");
    assert.equal(wider.token.x, x);
    assert.equal(wider.token.y, y);
    const tooWide = attempt.drop(attempt.createLevelAttempt(diagonal, 2), {
      x: x + radius * 2 + 1,
      y: y,
    });
    assert.equal(tooWide.state, "miss");
    assert.equal(tooWide.token.x, x + radius * 2 + 1);
});

test("a pick mark stays at its drawn width on level 1 and doubles on level 2", () => {
  const attempt = harness.attempt;
    const stored = scenes.byId["check-away"].targets;
    const level1 = attempt.createLevelAttempt(checkAway, 1);
    assert.equal(checkAway.kind, "pick");
    assert.deepEqual(
      level1.targets.map((mark) => mark.r),
      stored.map((mark) => mark.r)
    );
    assert.equal(level1.targets[0].r, 32);
    assert.equal(level1.token.x, 480);
    assert.equal(level1.token.y, 700);

    const away = attempt.pick(level1, "b");
    assert.equal(away.state, "correct");
    assert.equal(away.token.x, 600);
    assert.equal(away.token.y, 640);

    const into = attempt.pick(attempt.createLevelAttempt(checkAway, 1), "c");
    assert.equal(into.state, "miss");
    assert.equal(into.token.x, 410);
    assert.equal(into.token.y, 691);

    const level2 = attempt.createLevelAttempt(checkAway, 2);
    assert.deepEqual(
      level2.levelMarks.map((mark) => mark.r),
      stored.map((mark) => mark.r * 2)
    );
    assert.equal(level2.goodSpots.length, 1);
    assert.equal(level2.goodSpots[0].r, 64);
    assert.equal(attempt.presentation(level2).targets.length, 3);
    assert.equal(attempt.presentation(level2).pickable, false);

    const dragged = attempt.drop(level2, { x: 650, y: 640 });
    assert.equal(dragged.state, "correct");
    assert.equal(dragged.token.x, 600);
    assert.equal(dragged.token.y, 640);

    const wrong = attempt.drop(attempt.createLevelAttempt(checkAway, 2), {
      x: 410,
      y: 691,
    });
    assert.equal(wrong.state, "miss");
    assert.equal(wrong.token.x, 410);
    assert.equal(wrong.token.y, 691);

    const past = attempt.drop(attempt.createLevelAttempt(checkAway, 2), {
      x: 690,
      y: 640,
    });
    assert.equal(past.state, "miss");
    assert.equal(past.token.x, 690);

    const played = attempt.createPickAttempt(overlap);
    const levelPick = attempt.createLevelAttempt(overlap, 1);
    const correct = played.targets.find((mark) => mark.id === "b");
    const levelCorrect = levelPick.targets.find((mark) => mark.id === "b");
    assert.equal(levelCorrect.r, correct.r);
    assert.equal(attempt.createLevelAttempt(overlap, 2).levelMarks.find((mark) => mark.id === "b").r, correct.r * 2);
});

test("a goalkeeper level attempt keeps its picture and the drawn radius", () => {
  const attempt = harness.attempt;
  const keeper = drills.find((drill) => drill.id === "goalkeeper-step-out-and-line-up");
  scenes.usePicture("near-post");
  const level1 = attempt.createLevelAttempt(keeper, 1);
  assert.equal(level1.kind, "pick");
  assert.equal(level1.pictureId, "near-post");
  assert.equal(level1.targets[0].r, 32);
  assert.notEqual(level1.targets[0].r, 16);
  const picked = attempt.pick(level1, "b");
  assert.equal(picked.ended, true);
  assert.equal(picked.pictureId, "near-post");
  assert.equal(picked.token.x, level1.targets[0].x);
  assert.equal(picked.token.y, level1.targets[0].y);

  scenes.usePicture("central");
  const level2 = attempt.createLevelAttempt(keeper, 2);
  assert.equal(level2.pictureId, "central");
  assert.equal(level2.goodSpots[0].r, 64);
  const missed = attempt.drop(level2, { x: 1, y: 1 });
  assert.equal(missed.state, "miss");
  assert.equal(missed.pictureId, "central");
  assert.equal(missed.ended, true);
});

test("the level choice starts at level 1 and is not the advanced list", () => {
  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(game, /let level = 1;/);
  assert.match(html, /data-level="1"/);
  assert.match(html, />Level 1</);
  assert.match(html, /data-level="2"/);
  assert.match(html, />Level 2</);
  assert.match(game, /title: "Advanced drills"/);
  assert.doesNotMatch(html, /Advanced/);
  const handler = game.slice(
    game.indexOf('playLevelEl.addEventListener("click"'),
    game.indexOf("renderList();")
  );
  assert.match(handler, /createLevelAttempt|freshAttempt/);
  assert.doesNotMatch(handler, /settle\(/);
  assert.doesNotMatch(handler, /localStorage|sessionStorage/);
  assert.equal(
    drills.filter((drill) => drill.tier === "advanced").length > 0,
    true
  );
});

test("level 2 hides zones and keeps pick marks on screen", () => {
  const attempt = harness.attempt;
  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  const render = game.slice(game.indexOf("function renderAttempt"), game.indexOf("function sync"));
  assert.match(render, /visibleTargets/);

  const openLevel1 = attempt.presentation(attempt.createLevelAttempt(openBody, 1));
  assert.equal(openLevel1.visibleTargets, undefined);
  assert.equal(openLevel1.targets.length, 1);
  assert.equal(openLevel1.targets[0].r, 44);

  const openLevel2 = attempt.createLevelAttempt(openBody, 2);
  const openView = attempt.presentation(openLevel2);
  assert.equal(openView.targets[0].r, 88);
  assert.equal(openView.targets[0].zone, true);
  assert.equal(openView.visibleTargets.some((mark) => mark.zone), false);
  assert.equal(
    openView.visibleTargets.some((mark) => mark.x === 420 && mark.y === 676),
    false
  );
  assert.ok(openView.visibleTargets.length >= 1);
  const openChoice = openView.visibleTargets[0];
  assert.notEqual(openChoice.id, "b");
  const openMiss = attempt.drop(attempt.createLevelAttempt(openBody, 2), {
    x: openChoice.x,
    y: openChoice.y,
  });
  assert.equal(openMiss.state, "miss");
  assert.equal(openMiss.token.x, openChoice.x);
  assert.equal(openMiss.token.y, openChoice.y);

  const away = attempt.presentation(attempt.createLevelAttempt(checkAway, 2));
  assert.deepEqual(
    away.visibleTargets.map((mark) => mark.id),
    away.targets.map((mark) => mark.id)
  );
  assert.ok(away.visibleTargets.some((mark) => mark.id === "b"));
  assert.ok(away.visibleTargets.some((mark) => mark.id !== "b"));

  for (const drill of drills) {
    const level2 = attempt.createLevelAttempt(drill, 2);
    const view = attempt.presentation(level2);
    if (drill.kind === "drag") {
      assert.equal(view.visibleTargets.some((mark) => mark.zone), false, drill.id);
      assert.ok(view.visibleTargets.length >= 1, drill.id);
      assert.ok(view.visibleTargets.every((mark) => mark.id !== "b"), drill.id);
      const choice = view.visibleTargets[0];
      const missed = attempt.drop(attempt.createLevelAttempt(drill, 2), {
        x: choice.x,
        y: choice.y,
      });
      assert.equal(missed.state, "miss", drill.id);
      assert.equal(missed.token.x, choice.x, drill.id);
      assert.equal(missed.token.y, choice.y, drill.id);
    } else {
      assert.equal(view.visibleTargets.length, view.targets.length, drill.id);
      assert.ok(view.visibleTargets.some((mark) => mark.id === "b"), drill.id);
    }
  }

  const zones = drills.find((drill) => drill.id === "zones");
  const zonesView = attempt.presentation(attempt.createLevelAttempt(zones, 2));
  assert.equal(zonesView.targets.some((mark) => mark.zone), true);
  assert.equal(zonesView.visibleTargets.some((mark) => mark.zone), false);
  assert.ok(zonesView.visibleTargets.length >= 1);
});

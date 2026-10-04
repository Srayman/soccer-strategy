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
    assert.equal(level1.targets[0].id, "b");
    assert.ok(
      level1.targets.filter((mark) => mark.id !== "b").length === 2 ||
        level1.targets.filter((mark) => mark.id !== "b").length === 3
    );
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

test("level 1 copy says pick and level 2 copy says drag", () => {
  const level1 = scenes.levelAction(1);
  const level2 = scenes.levelAction(2);
  assert.match(level1, /pick/i);
  assert.doesNotMatch(level1, /drag/i);
  assert.match(level2, /drag/i);
  assert.doesNotMatch(level2, /pick/i);
  assert.equal(openBody.kind, "drag");
  assert.equal(checkAway.kind, "pick");
  assert.equal(scenes.levelCopy("Drag to the mark.", 1), "Pick to the mark.");
  assert.doesNotMatch(scenes.levelCopy("Drag to the mark.", 1), /drag/i);
  assert.equal(scenes.levelCopy("Pick a spot.", 2), "Drag a spot.");
  assert.doesNotMatch(scenes.levelCopy("Pick a spot.", 2), /pick/i);

  function captionsOf(scene) {
    const list = [];
    if (scene.caption) list.push(scene.caption);
    if (scene.pictures) {
      Object.keys(scene.pictures).forEach((id) => {
        if (scene.pictures[id].caption) list.push(scene.pictures[id].caption);
      });
    }
    return list;
  }

  for (const scene of scenes.scenes) {
    for (const caption of captionsOf(scene)) {
      const shown1 = scenes.levelCopy(caption, 1);
      const shown2 = scenes.levelCopy(caption, 2);
      assert.doesNotMatch(shown1, /\bdrag\b/i, scene.id + " level 1: " + shown1);
      assert.doesNotMatch(shown2, /\bpick\b/i, scene.id + " level 2: " + shown2);
      if (/\bpick\b/i.test(caption)) assert.match(shown2, /\bdrag\b/i, scene.id);
      if (/\bdrag\b/i.test(caption)) assert.match(shown1, /\bpick\b/i, scene.id);
    }
  }

  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  const sceneSource = fs.readFileSync(path.join(root, "js", "starter-scenes.js"), "utf8");
  assert.match(game, /StarterScenes\.levelAction\(level\)/);
  assert.match(game, /kind\.textContent = kindLabel\(\)/);
  assert.doesNotMatch(game, /kindLabel\(drill\.kind\)/);
  assert.doesNotMatch(game, /kind === "drag" \? "Drag" : "Pick"/);
  assert.match(sceneSource, /caption\.textContent = levelCopy\(/);
  const handler = game.slice(
    game.indexOf('playLevelEl.addEventListener("click"'),
    game.indexOf("renderList();")
  );
  assert.match(handler, /paintKinds\(\)/);
  assert.doesNotMatch(handler, /settle\(/);
});

test("level 2 hides the correct spot and the wrong choices", () => {
  const attempt = harness.attempt;
  const play = require("../js/scene-play.js");
  const game = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  const render = game.slice(game.indexOf("function renderAttempt"), game.indexOf("function sync"));
  assert.match(render, /visibleTargets/);
  assert.match(render, /view\.visibleTargets \|\| view\.targets/);

  const openLevel1 = attempt.presentation(attempt.createLevelAttempt(openBody, 1));
  assert.equal(openLevel1.visibleTargets, undefined);
  assert.equal(openLevel1.pickable, true);
  assert.equal(openLevel1.targets.find((mark) => mark.id === "b").r, 44);
  assert.ok(
    openLevel1.targets.filter((mark) => mark.id !== "b").length === 2 ||
      openLevel1.targets.filter((mark) => mark.id !== "b").length === 3
  );

  function picturesOf(drill) {
    const scene = scenes.byId[drill.id] || play.sceneFor(drill.id);
    if (!scene || !scene.pictures) return [""];
    return Object.keys(scene.pictures);
  }

  function hiddenWrongs(level2) {
    const choices = level2.wrongChoices || [];
    const marks = (level2.levelMarks || []).filter((mark) => mark.id !== "b");
    return choices.concat(marks);
  }

  function shownAt(list, spot) {
    return (list || []).some((mark) => mark.x === spot.x && mark.y === spot.y);
  }

  try {
    for (const drill of drills) {
      for (const pictureId of picturesOf(drill)) {
        const label = drill.id + (pictureId ? " " + pictureId : "");
        if (pictureId) assert.equal(scenes.usePicture(pictureId), pictureId, label);
        const level2 = attempt.createLevelAttempt(drill, 2);
        const view = attempt.presentation(level2);
        assert.equal(level2.level, 2, label);
        assert.notEqual(level2.kind, "pick", label);
        assert.equal(view.draggable, true, label);
        assert.equal(view.pickable, false, label);
        assert.ok(Array.isArray(view.visibleTargets), label);
        assert.equal(view.visibleTargets.length, 0, label);
        assert.ok(view.targets.some((mark) => mark.id === "b"), label);
        assert.equal(view.visibleTargets.some((mark) => mark.id === "b"), false, label);
        assert.equal(view.visibleTargets.some((mark) => mark.zone), false, label);

        const good = level2.goodSpots[0];
        assert.equal(shownAt(view.visibleTargets, good), false, label);
        const hit = attempt.drop(attempt.createLevelAttempt(drill, 2), {
          x: good.x,
          y: good.y,
        });
        assert.equal(hit.state, "correct", label);
        assert.equal(hit.ended, true, label);
        assert.equal(hit.token.x, good.x, label);
        assert.equal(hit.token.y, good.y, label);
        assert.equal(attempt.presentation(hit).visibleTargets.length, 0, label);
        assert.deepEqual(attempt.presentation(hit).correctionSpots, [], label);

        const wrongs = hiddenWrongs(level2);
        assert.ok(wrongs.length >= 1, label);
        for (const choice of wrongs) {
          assert.equal(shownAt(view.visibleTargets, choice), false, label);
          const missed = attempt.drop(attempt.createLevelAttempt(drill, 2), {
            x: choice.x,
            y: choice.y,
          });
          assert.equal(missed.state, "miss", label + " " + choice.id);
          assert.equal(missed.ended, true, label);
          assert.equal(missed.token.x, choice.x, label + " " + choice.id);
          assert.equal(missed.token.y, choice.y, label + " " + choice.id);
          const missView = attempt.presentation(missed);
          assert.equal(missView.visibleTargets.length, 0, label);
          assert.equal(shownAt(missView.visibleTargets, good), false, label);
          assert.equal(shownAt(missView.visibleTargets, choice), false, label);
          assert.ok(
            missView.correctionSpots.some((spot) => spot.x === good.x && spot.y === good.y),
            label
          );
        }
      }
    }
  } finally {
    scenes.usePicture("central");
  }

  const zones = drills.find((drill) => drill.id === "zones");
  const zonesLevel = attempt.createLevelAttempt(zones, 2);
  const zonesView = attempt.presentation(zonesLevel);
  assert.equal(zonesView.targets.some((mark) => mark.zone), true);
  assert.equal(zonesView.visibleTargets.length, 0);
  assert.ok((zonesLevel.wrongChoices || []).length >= 1);
});

test("level 1 offers two or three wrong spots and a wrong pick is a miss", () => {
  const attempt = harness.attempt;
  const points = require("../js/points.js");
  const play = require("../js/scene-play.js");

  function picturesOf(drill) {
    const scene = scenes.byId[drill.id] || play.sceneFor(drill.id);
    if (!scene || !scene.pictures) return [""];
    return Object.keys(scene.pictures);
  }

  function wrongMarks(targets) {
    return targets.filter((mark) => mark.id !== "b");
  }

  try {
    for (const drill of drills) {
      for (const pictureId of picturesOf(drill)) {
        const label = drill.id + (pictureId ? " " + pictureId : "");
        if (pictureId) assert.equal(scenes.usePicture(pictureId), pictureId, label);
        const level1 = attempt.createLevelAttempt(drill, 1);
        assert.equal(level1.kind, "pick", label);
        assert.equal(level1.level, 1, label);
        const good = level1.targets.filter((mark) => mark.id === "b");
        const wrong = wrongMarks(level1.targets);
        assert.equal(good.length, 1, label);
        assert.ok(wrong.length === 2 || wrong.length === 3, label + " " + wrong.length);
        const view = attempt.presentation(level1);
        assert.equal(view.pickable, true, label);
        assert.equal(view.draggable, false, label);
        assert.equal(view.visibleTargets, undefined, label);
        assert.equal(view.targets.length, level1.targets.length, label);
        const ids = level1.targets.map((mark) => mark.id);
        assert.equal(new Set(ids).size, ids.length, label);
        for (let i = 0; i < level1.targets.length; i += 1) {
          for (let j = i + 1; j < level1.targets.length; j += 1) {
            const left = level1.targets[i];
            const right = level1.targets[j];
            const gap = Math.hypot(left.x - right.x, left.y - right.y);
            assert.ok(gap >= left.r + right.r, label);
          }
        }

        const missed = attempt.pick(level1, wrong[0].id);
        assert.equal(missed.state, "miss", label);
        assert.equal(missed.ended, true, label);
        assert.equal(missed.confirmation, "", label);
        assert.equal(missed.token.x, wrong[0].x, label);
        assert.equal(missed.token.y, wrong[0].y, label);
        const missView = attempt.presentation(missed);
        assert.equal(missView.pickable, false, label);
        assert.equal(missView.correctionSpots.length, 1, label);
        assert.equal(missView.correctionSpots[0].x, good[0].x, label);
        assert.equal(missView.correctionSpots[0].y, good[0].y, label);
        assert.equal(missView.correctionSpots[0].r, good[0].r, label);
        assert.equal(attempt.pick(missed, good[0].id), missed, label);
        assert.equal(attempt.pick(missed, wrong[1] ? wrong[1].id : wrong[0].id), missed, label);

        const scored = attempt.pick(attempt.createLevelAttempt(drill, 1), "b");
        assert.equal(scored.state, "correct", label);
        assert.equal(scored.ended, true, label);
        assert.equal(scored.confirmation, "You found a spot.", label);
        assert.deepEqual(scored.correctionSpots, [], label);
        assert.equal(scored.token.x, good[0].x, label);
        assert.equal(scored.token.y, good[0].y, label);
        assert.equal(attempt.pick(scored, wrong[0].id), scored, label);

        const level2 = attempt.createLevelAttempt(drill, 2);
        assert.equal(level2.level, 2, label);
        assert.notEqual(level2.kind, "pick", label);
        assert.equal(attempt.presentation(level2).pickable, false, label);
        assert.equal(attempt.presentation(level2).draggable, true, label);
      }
    }
  } finally {
    scenes.usePicture("central");
  }

  const open = drills.find((drill) => drill.id === "open-body");
  let missedSession = points.createSession();
  const miss = attempt.pick(attempt.createLevelAttempt(open, 1), "a");
  assert.equal(miss.state, "miss");
  missedSession = points.settle(missedSession, miss);
  assert.equal(missedSession.points, 1);
  const later = attempt.pick(attempt.createLevelAttempt(open, 1), "b");
  missedSession = points.settle(missedSession, later);
  assert.equal(missedSession.points, 2);

  let correctSession = points.createSession();
  const first = attempt.pick(attempt.createLevelAttempt(open, 1), "b");
  correctSession = points.settle(correctSession, first);
  assert.equal(correctSession.points, 3);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { drills } = require("../js/catalog.js");
const { correctTarget } = require("../js/attempt.js");
const { pitch, scenes, byId, frameFor, markersFor } = require("../js/starter-scenes.js");

const starters = drills.filter((drill) => drill.tier === "starter");

function dist(a, b) {
  return Math.hypot(a.x - b.x, b.y - a.y);
}

function frames(scene) {
  if (!scene.pictures) return [{ id: scene.id, frame: scene }];
  return scene.angles.map((angle) => ({
    id: scene.id + ":" + angle.id,
    frame: scene.pictures[angle.id],
  }));
}

function named(list, name) {
  return list.find((item) => item.name === name);
}

function onPitch(point) {
  assert.ok(point.x >= 0 && point.x <= pitch.width);
  assert.ok(point.y >= 0 && point.y <= pitch.length);
}

test("pitch is 105 by 68 and attacks the top goal", () => {
  assert.equal(pitch.lengthM, 105);
  assert.equal(pitch.widthM, 68);
  assert.equal(pitch.scale, 10);
  assert.equal(pitch.length, 1050);
  assert.equal(pitch.width, 680);
  assert.equal(pitch.attack, "top");
  assert.equal(pitch.defend, "bottom");
  assert.equal(pitch.attackGoalY, 0);
  assert.ok(pitch.ownGoalY > pitch.halfwayY);
  assert.equal(pitch.ownGoalY - pitch.ownBuildOutY, 345);
  assert.equal(pitch.ownGoalY - pitch.sixEdgeY, 55);
  assert.equal(pitch.ownGoalY - pitch.penaltySpotY, 110);

  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /src="js\/starter-scenes\.js"/);
  assert.ok(
    html.indexOf('src="js/attempt.js"') < html.indexOf('src="js/starter-scenes.js"') &&
      html.indexOf('src="js/starter-scenes.js"') < html.indexOf('src="js/game.js"')
  );
  assert.match(html, /width="680"/);
  assert.match(html, /height="1050"/);
  assert.match(html, /y="-22"/);
  assert.match(html, /y="1050"/);
  assert.match(html, /Attack/);
  assert.match(html, /Defend/);
  assert.match(html, />Attack</);
  const attackAt = html.indexOf(">Attack<");
  const defendAt = html.indexOf(">Defend<");
  assert.ok(attackAt > 0 && attackAt < defendAt);
});

test("starter scenes are the 20 starter drills and nothing else", () => {
  assert.equal(scenes.length, 20);
  assert.deepEqual(
    scenes.map((scene) => scene.id),
    starters.map((drill) => drill.id)
  );
  for (const drill of starters) {
    assert.equal(byId[drill.id].name, drill.name);
    assert.equal(byId[drill.id].kind, drill.kind);
  }
  assert.equal(byId["set-and-go"], undefined);
  assert.equal(byId["near-post"], undefined);
  assert.equal(byId["through-ball"], undefined);
  const setAndGo = drills.find((drill) => drill.name === "Set and go");
  assert.equal(setAndGo.tier, "next");
  assert.equal(setAndGo.kind, "pick");
  for (const drill of drills) {
    if (drill.tier !== "starter") assert.equal(byId[drill.id], undefined);
  }
});

test("each picture stays on the pitch and the learner starts outside the good spot", () => {
  for (const scene of scenes) {
    for (const { id, frame } of frames(scene)) {
      if (frame.ball) onPitch(frame.ball);
      for (const actor of frame.teammates || []) onPitch(actor);
      for (const actor of frame.opponents || []) onPitch(actor);
      if (frame.learner) onPitch(frame.learner);
      if (scene.learner) onPitch(scene.learner);
      if (scene.kind === "drag") {
        assert.equal(frame.goodSpots.length, 1, id);
        const spot = frame.goodSpots[0];
        onPitch(spot);
        assert.ok(dist(frame.learner, spot) > spot.r, id);
      }
      if (scene.kind === "pick") {
        assert.equal(frame.targets.length, 3, id);
        const correct = frame.targets.filter((target) => target.id === correctTarget.id);
        assert.equal(correct.length, 1, id);
        for (const target of frame.targets) {
          onPitch(target);
          assert.equal("correct" in target, false);
          assert.equal("answer" in target, false);
        }
        for (let i = 0; i < frame.targets.length; i += 1) {
          for (let j = i + 1; j < frame.targets.length; j += 1) {
            const gap = dist(frame.targets[i], frame.targets[j]);
            assert.ok(gap > frame.targets[i].r + frame.targets[j].r, id);
          }
        }
        const shown = markersFor(frame);
        assert.deepEqual(
          shown.map((target) => target.id),
          frame.targets.map((target) => target.id)
        );
        for (const target of shown) {
          assert.deepEqual(Object.keys(target).sort(), ["id", "r", "x", "y"]);
        }
      }
    }
  }
});

test("open body steps to the side of the defender", () => {
  const scene = byId["open-body"];
  const defender = scene.opponents[0];
  const good = scene.goodSpots[0];
  assert.equal(scene.teammates.length, 1);
  assert.equal(scene.opponents.length, 1);
  assert.ok(scene.ball.y > pitch.halfwayY);
  assert.ok(Math.abs(scene.ball.x - pitch.centerX) < 80);
  assert.ok(defender.y < scene.learner.y);
  assert.ok(Math.abs(defender.x - scene.learner.x) < 15);
  assert.ok(dist(defender, scene.learner) < 40);
  const side = Math.abs(good.x - defender.x);
  const depth = Math.abs(good.y - defender.y);
  assert.ok(side > depth);
  assert.ok(side >= 30 && side <= 70);
  assert.ok(good.x > defender.x);
  assert.ok(dist(defender, good) > good.r);
});

test("get open leaves the defender and the ball", () => {
  const scene = byId["get-open"];
  const defender = scene.opponents[0];
  const good = scene.goodSpots[0];
  assert.equal(scene.opponents.length, 1);
  assert.ok(Math.abs(scene.ball.x - pitch.centerX) < 40);
  assert.ok(dist(scene.learner, defender) < 40);
  const pocket = dist(good, defender);
  assert.ok(pocket >= 50 && pocket <= 100);
  assert.ok(dist(good, scene.ball) > good.r + 40);
  assert.ok(dist(defender, good) > good.r);
  assert.ok(dist(scene.ball, good) > good.r);
});

test("stay wide holds the touchline", () => {
  const scene = byId["stay-wide"];
  const good = scene.goodSpots[0];
  assert.equal(scene.teammates.length, 1);
  assert.equal(scene.opponents.length, 0);
  assert.ok(scene.learner.x < 80);
  assert.ok(Math.abs(good.x - scene.learner.x) < 15);
  assert.ok(good.y < scene.ball.y);
  assert.ok(scene.ball.y - good.y < 80);
  assert.ok(Math.abs(scene.ball.x - pitch.centerX) < 40);
  assert.ok(Math.abs(scene.teammates[0].x - pitch.centerX) < 80);
  assert.ok(dist(good, scene.ball) > 200);
});

test("spread out takes the empty flank", () => {
  const scene = byId["spread-out"];
  const good = scene.goodSpots[0];
  assert.equal(scene.teammates.length, 2);
  assert.equal(scene.opponents.length, 1);
  assert.ok(good.x < 80 || good.x > pitch.width - 80);
  for (const mate of scene.teammates) {
    assert.ok(dist(good, mate) > 200);
    assert.ok(Math.abs(mate.y - pitch.halfwayY) < 80);
  }
  assert.ok(dist(good, scene.learner) > 200);
  assert.ok(dist(scene.opponents[0], scene.ball) < 120);
});

test("get wide moves from the middle to the outside channel", () => {
  const scene = byId["get-wide"];
  const good = scene.goodSpots[0];
  assert.equal(scene.teammates.length, 1);
  assert.equal(scene.opponents.length, 1);
  assert.ok(Math.abs(scene.learner.x - pitch.centerX) < 40);
  assert.ok(Math.abs(scene.ball.x - pitch.centerX) < 40);
  assert.ok(Math.abs(scene.opponents[0].x - pitch.centerX) < 40);
  assert.ok(scene.opponents[0].y < scene.ball.y);
  assert.ok(good.x < 80 || good.x > pitch.width - 80);
  assert.ok(dist(good, scene.ball) > 150);
});

test("help the ball is 8 to 12 m to the side and slightly behind", () => {
  const scene = byId["help-the-ball"];
  const good = scene.goodSpots[0];
  const gap = dist(good, scene.ball);
  assert.equal(scene.teammates.length, 1);
  assert.equal(scene.opponents.length, 1);
  assert.ok(gap >= 80 && gap <= 120);
  assert.ok(good.y > scene.ball.y);
  assert.ok(Math.abs(good.x - scene.ball.x) > Math.abs(good.y - scene.ball.y));
  assert.ok(scene.opponents[0].y < scene.ball.y);
  assert.ok(dist(scene.ball, good) > good.r);
  const far = { x: scene.ball.x - 300, y: scene.ball.y };
  assert.ok(dist(far, scene.ball) >= 300);
  assert.ok(dist(far, good) > good.r);
});

test("pass and move leaves the spot of the pass", () => {
  const scene = byId["pass-and-move"];
  const good = scene.goodSpots[0];
  const receiver = scene.teammates[0];
  assert.ok(good.y < receiver.y);
  assert.ok(Math.abs(good.x - receiver.x) > 40);
  assert.ok(dist(scene.learner, good) > good.r);
  assert.ok(dist(scene.opponents[0], scene.learner) < 80);
  assert.ok(dist(scene.opponents[0], good) > good.r);
});

test("goal-side is between the ball and the bottom goal", () => {
  const scene = byId["goal-side"];
  const ball = scene.ball;
  const good = scene.goodSpots[0];
  assert.ok(scene.learner.y < ball.y);
  assert.ok(ball.y < good.y);
  assert.ok(good.y < pitch.ownGoalY);
  const beside = { x: ball.x + 100, y: ball.y };
  const behind = { x: ball.x, y: ball.y - 80 };
  assert.ok(dist(beside, good) > good.r);
  assert.ok(dist(behind, good) > good.r);
});

test("ball-side is goal-side and on the ball side", () => {
  const scene = byId["ball-side"];
  const opponent = scene.opponents[0];
  const good = scene.goodSpots[0];
  assert.ok(scene.ball.x > pitch.centerX);
  assert.ok(opponent.x < scene.ball.x);
  assert.ok(good.x > opponent.x);
  assert.ok(good.y > opponent.y);
  assert.ok(scene.learner.x < opponent.x);
  assert.ok(dist(scene.learner, good) > good.r);
});

test("mark distance is one to two meters, not touch-tight and not ten meters", () => {
  const scene = byId["mark-distance"];
  const opponent = scene.opponents[0];
  const good = scene.goodSpots[0];
  const toBall = dist(scene.ball, opponent);
  assert.ok(toBall >= 140 && toBall <= 160);
  const mark = dist(good, opponent);
  assert.ok(mark >= 10 && mark <= 20);
  assert.ok(good.y > opponent.y);
  assert.ok(good.x > opponent.x);
  assert.ok(dist(opponent, good) > good.r);
  const dx = good.x - opponent.x;
  const dy = good.y - opponent.y;
  const far = {
    x: opponent.x + (dx / mark) * 100,
    y: opponent.y + (dy / mark) * 100,
  };
  assert.ok(dist(far, good) > good.r);
  assert.ok(scene.learner.x < opponent.x);
  assert.ok(dist(scene.learner, opponent) < 50);
  assert.ok(dist(scene.learner, good) > good.r);
});

test("delay stays a few meters goal-side of the dribbler", () => {
  const scene = byId["delay"];
  const ball = scene.ball;
  const good = scene.goodSpots[0];
  assert.equal(scene.opponents.length, 1);
  assert.ok(good.y > ball.y);
  const deeper = good.y - ball.y;
  assert.ok(deeper >= 30 && deeper <= 80);
  assert.ok(Math.abs(good.x - ball.x) > 20);
  assert.ok(dist(ball, good) > good.r);
});

test("pressure and cover puts the learner behind the presser", () => {
  const scene = byId["pressure-and-cover"];
  const presser = named(scene.teammates, "presser");
  const good = scene.goodSpots[0];
  assert.ok(presser);
  assert.equal(scene.opponents.length, 1);
  assert.ok(presser.y > scene.ball.y);
  assert.ok(good.y > presser.y);
  assert.ok(Math.abs(good.x - pitch.centerX) < Math.abs(presser.x - pitch.centerX));
  const behind = dist(good, presser);
  assert.ok(behind >= 40 && behind <= 90);
  assert.equal(scene.learner.y, presser.y);
  assert.ok(dist(scene.learner, good) > good.r);
});

test("squeeze the middle leaves the far touchline and does not reach the ball", () => {
  const scene = byId["squeeze-the-middle"];
  const good = scene.goodSpots[0];
  assert.ok(scene.ball.x > pitch.width - 80);
  assert.ok(scene.learner.x < 80);
  assert.ok(good.x > 180 && good.x < pitch.centerX + 40);
  assert.ok(dist(good, scene.learner) > good.r);
  assert.ok(dist(good, scene.ball) > 200);
  assert.equal(scene.teammates.length, 1);
  assert.ok(dist(scene.teammates[0], scene.ball) < 80);
});

test("recovery run ends goal-side of the ball", () => {
  const scene = byId["recovery-run"];
  const good = scene.goodSpots[0];
  assert.ok(scene.learner.y < 350);
  assert.ok(scene.learner.x < 120);
  assert.ok(good.y > scene.ball.y);
  assert.ok(good.x > scene.learner.x);
  const chase = { x: 160, y: 500 };
  assert.ok(chase.y < scene.ball.y);
  assert.ok(dist(chase, good) > good.r);
});

test("goalkeeper step-out is one starter with three pictures", () => {
  const scene = byId["goalkeeper-step-out-and-line-up"];
  assert.equal(scene.kind, "drag");
  assert.deepEqual(
    scene.angles.map((angle) => angle.id),
    ["central", "near-post", "through-ball"]
  );
  assert.equal(Object.keys(scene.pictures).length, 3);

  const central = frameFor(scene, "central");
  assert.equal(central.opponents.length, 1);
  assert.equal(central.teammates.length, 0);
  assert.equal(central.opponents[0].name, "shooter");
  assert.ok(central.ball.y > pitch.boxEdgeY && central.ball.y < pitch.sixEdgeY);
  assert.ok(Math.abs(central.ball.x - pitch.goalCenterX) < 20);
  const centralSpot = central.goodSpots[0];
  assert.ok(Math.abs(centralSpot.x - pitch.goalCenterX) < 8);
  const centralSteps = pitch.ownGoalY - centralSpot.y;
  assert.ok(centralSteps >= 12 && centralSteps <= 25);
  const penalty = { x: pitch.goalCenterX, y: pitch.penaltySpotY };
  assert.ok(dist(penalty, centralSpot) > centralSpot.r);

  const near = frameFor(scene, "near-post");
  assert.equal(near.opponents.length, 1);
  assert.equal(near.teammates.length, 0);
  const corner = { x: pitch.boxRightX, y: pitch.boxEdgeY };
  assert.ok(dist(near.ball, corner) < 60);
  const nearSpot = near.goodSpots[0];
  assert.ok(Math.abs(nearSpot.x - pitch.rightPostX) >= 6);
  assert.ok(Math.abs(nearSpot.x - pitch.rightPostX) <= 12);
  assert.ok(nearSpot.x < pitch.rightPostX);
  const nearSteps = pitch.ownGoalY - nearSpot.y;
  assert.ok(nearSteps >= 12 && nearSteps <= 25);
  const center = { x: pitch.goalCenterX, y: nearSpot.y };
  const outside = { x: pitch.rightPostX + 16, y: nearSpot.y };
  assert.ok(dist(center, nearSpot) > nearSpot.r);
  assert.ok(dist(outside, nearSpot) > nearSpot.r);

  const through = frameFor(scene, "through-ball");
  assert.equal(through.opponents.length, 0);
  assert.equal(through.teammates.length, 0);
  assert.equal(through.ball.y, pitch.sixEdgeY);
  assert.ok(through.ball.x > pitch.sixLeftX && through.ball.x < pitch.sixRightX);
  assert.equal(through.goodSpots[0].x, through.ball.x);
  assert.equal(through.goodSpots[0].y, through.ball.y);
});

test("check away picks the move into open space", () => {
  const scene = byId["check-away"];
  const away = named(scene.targets, "away");
  const into = named(scene.targets, "into");
  const still = named(scene.targets, "still");
  const defender = scene.opponents[0];
  assert.equal(away.id, correctTarget.id);
  assert.equal(scene.teammates.length, 1);
  assert.equal(scene.opponents.length, 1);
  assert.ok(dist(away, defender) > dist(still, defender));
  assert.ok(dist(away, defender) > dist(into, defender));
  const toBall = {
    x: scene.ball.x - defender.x,
    y: scene.ball.y - defender.y,
  };
  const toInto = { x: into.x - defender.x, y: into.y - defender.y };
  assert.ok(toBall.x * toInto.x + toBall.y * toInto.y > 0);
  const toStill = { x: still.x - defender.x, y: still.y - defender.y };
  assert.ok(toBall.x * toStill.x + toBall.y * toStill.y < 0);
});

test("triangle picks the open corner", () => {
  const scene = byId["triangle"];
  const corner = named(scene.targets, "corner");
  const line = named(scene.targets, "line");
  const beside = named(scene.targets, "beside");
  const mates = scene.teammates;
  assert.equal(corner.id, correctTarget.id);
  assert.equal(mates.length, 2);
  assert.equal(scene.opponents.length, 1);
  assert.equal(mates[0].x, mates[1].x);
  assert.equal(line.x, mates[0].x);
  function area(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }
  assert.equal(area(mates[0], mates[1], line), 0);
  assert.notEqual(area(mates[0], mates[1], corner), 0);
  assert.ok(dist(beside, scene.ball) < dist(corner, scene.ball));
  assert.ok(dist(beside, scene.ball) < dist(line, scene.ball));
});

test("wall pass picks the space behind the defender", () => {
  const scene = byId["wall-pass"];
  const behind = named(scene.targets, "behind");
  const start = named(scene.targets, "start");
  const feet = named(scene.targets, "feet");
  const defender = scene.opponents[0];
  assert.equal(behind.id, correctTarget.id);
  assert.ok(behind.y < defender.y);
  assert.ok(behind.x < defender.x);
  assert.ok(dist(feet, defender) < 5);
  assert.ok(dist(start, behind) > behind.r);
  assert.ok(start.x < 100);
});

test("switch the weak side picks the open player on the left", () => {
  const scene = byId["switch-the-weak-side"];
  const open = named(scene.targets, "open");
  const marked = named(scene.targets, "marked");
  const crowd = named(scene.targets, "crowd");
  assert.equal(open.id, correctTarget.id);
  assert.equal(scene.opponents.length, 2);
  assert.ok(scene.ball.x > pitch.width - 120);
  assert.ok(open.x < 80);
  assert.ok(marked.x > 500);
  assert.ok(crowd.x > 500);
  for (const opponent of scene.opponents) assert.ok(opponent.x > 500);
  assert.ok(dist(named(scene.teammates, "open"), open) < 5);
  assert.ok(dist(named(scene.teammates, "marked"), marked) < 5);
  assert.ok(dist(named(scene.teammates, "crowd"), crowd) < 5);
});

test("build-out picks the short pass to the open wide teammate", () => {
  const scene = byId["build-out"];
  const wide = named(scene.targets, "wide");
  const striker = named(scene.targets, "striker");
  const space = named(scene.targets, "space");
  assert.equal(wide.id, correctTarget.id);
  assert.equal(scene.opponents.length, 2);
  assert.equal(scene.teammates.length, 3);
  assert.ok(scene.learner.y > pitch.ownBuildOutY);
  assert.ok(wide.x < 120);
  assert.ok(wide.y > pitch.ownBuildOutY);
  assert.ok(striker.y < pitch.ownBuildOutY);
  assert.ok(space.y > pitch.ownBuildOutY);
  for (const opponent of scene.opponents) {
    assert.ok(opponent.y < pitch.ownBuildOutY);
  }
  assert.ok(dist(named(scene.teammates, "wide"), wide) < 5);
  assert.ok(dist(named(scene.teammates, "striker"), striker) < 5);
  assert.ok(dist(named(scene.teammates, "middle"), wide) > 80);
  assert.equal(scene.guides[0].y, pitch.ownBuildOutY);
});

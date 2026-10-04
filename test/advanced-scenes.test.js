const test = require("node:test");
const assert = require("node:assert/strict");
const { drills } = require("../js/catalog.js");
const { pitch, scenes, sceneById } = require("../js/scenes/advanced.js");

const advanced = drills.filter((drill) => drill.tier === "advanced");

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function learner(picture) {
  const found = picture.players.filter((player) => player.team === "learner");
  assert.equal(found.length, 1);
  return found[0];
}

function byRole(picture, role) {
  return picture.players.filter((player) => player.role === role);
}

function one(picture, role) {
  const found = byRole(picture, role);
  assert.equal(found.length, 1);
  return found[0];
}

function ownBuildOutY() {
  return pitch.length - pitch.buildOutFromGoalLine;
}

function onPitch(point) {
  assert.ok(point.x >= 0 && point.x <= pitch.width);
  assert.ok(point.y >= 0 && point.y <= pitch.length);
}

function outsideSpot(point, spot) {
  assert.ok(distance(point, spot) > spot.r);
}

test("pitch attacks the top goal and defends the bottom goal", () => {
  assert.equal(pitch.length, 105);
  assert.equal(pitch.width, 68);
  assert.equal(pitch.attackGoal, "top");
  assert.equal(pitch.defendGoal, "bottom");
  assert.equal(pitch.halfway, 52.5);
  assert.equal(pitch.buildOutFromGoalLine, 34.5);
  assert.equal(ownBuildOutY(), 70.5);
  assert.notEqual(ownBuildOutY(), pitch.halfway);
});

test("advanced scenes match the catalog and nothing else", () => {
  assert.equal(advanced.length, 8);
  assert.equal(scenes.length, 8);
  assert.deepEqual(
    scenes.map((scene) => [scene.tier, scene.kind, scene.id, scene.name]),
    advanced.map((drill) => [drill.tier, drill.kind, drill.id, drill.name])
  );
  for (const scene of scenes) {
    assert.equal(sceneById(scene.id), scene);
    assert.ok(scene.pictures.length >= 1);
    for (const picture of scene.pictures) {
      learner(picture);
      for (const player of picture.players) onPitch(player);
      assert.ok(picture.ball, scene.id + " " + picture.id);
      onPitch(picture.ball);
      if (scene.kind === "drag") {
        assert.equal(picture.marks, undefined);
        onPitch(picture.goodSpot);
        outsideSpot(learner(picture), picture.goodSpot);
      } else {
        assert.equal(picture.goodSpot, undefined);
        assert.ok(picture.marks.length >= 2);
        const correct = picture.marks.filter(
          (mark) => mark.id === picture.correctMarkId
        );
        assert.equal(correct.length, 1);
        for (const mark of picture.marks) {
          onPitch(mark);
          for (const other of picture.marks) {
            if (other === mark) continue;
            assert.ok(distance(mark, other) > mark.r + other.r);
          }
        }
      }
    }
  }
});

test("offside line steps up or drops on the 7v7 build-out line", () => {
  const scene = sceneById("offside-line-step-or-drop");
  const line = ownBuildOutY();
  assert.equal(scene.format, "7v7");
  assert.equal(scene.line, "build-out");
  assert.equal(scene.pictures.length, 2);

  const safe = scene.pictures[0];
  assert.equal(safe.id, "ball-safe");
  const safeMate = safe.players.find((player) => player.id === "line-teammate");
  const safeOpponent = one(safe, "ball-carrier");
  assert.equal(safeMate.team, "teammate");
  assert.equal(safeMate.y, line);
  assert.equal(safeOpponent.facing, "top");
  assert.deepEqual(safe.ball, { x: safeOpponent.x, y: safeOpponent.y });
  assert.ok(safe.ball.y < line);
  assert.equal(safe.goodSpot.y, line);
  assert.equal(safe.goodSpot.x, learner(safe).x);
  assert.ok(learner(safe).y > line);
  assert.notEqual(safe.goodSpot.y, pitch.halfway);

  const behind = scene.pictures[1];
  assert.equal(behind.id, "played-in-behind");
  const behindMate = behind.players.find((player) => player.id === "line-teammate");
  const runner = one(behind, "runner");
  const penaltyEdge = pitch.length - 16.5;
  assert.equal(behindMate.y, line);
  assert.equal(learner(behind).y, line);
  assert.ok(behind.ball.y > line);
  assert.ok(runner.y > line);
  assert.ok(behind.goodSpot.y > runner.y);
  assert.ok(behind.goodSpot.y < penaltyEdge);
  assert.ok(Math.abs(behind.goodSpot.x - runner.x) <= 2);
  assert.ok(Math.abs(behind.goodSpot.y - line) > behind.goodSpot.r);
  assert.notEqual(behind.goodSpot.y, pitch.halfway);
});

test("zones stays central or goes with the closest runner", () => {
  const scene = sceneById("zones");
  assert.equal(scene.pictures.length, 2);

  const stay = scene.pictures[0];
  assert.equal(stay.id, "someone-else-takes-the-runner");
  const stayRunner = one(stay, "wide-runner");
  assert.deepEqual(stay.ball, { x: stayRunner.x, y: stayRunner.y });
  const cover = one(stay, "covering-defender");
  assert.ok(
    distance(cover, stayRunner) < distance(learner(stay), stayRunner)
  );
  assert.ok(Math.abs(stay.goodSpot.x - pitch.width / 2) <= 2);
  assert.ok(stay.goodSpot.y > stayRunner.y);
  assert.ok(stay.goodSpot.x < stayRunner.x - 10);

  const go = scene.pictures[1];
  assert.equal(go.id, "learner-goes-with-the-runner");
  const goRunner = one(go, "wide-runner");
  assert.deepEqual(go.ball, { x: goRunner.x, y: goRunner.y });
  const sliders = byRole(go, "sliding-defender");
  assert.ok(sliders.length >= 2);
  for (const slider of sliders) {
    assert.ok(distance(learner(go), goRunner) < distance(slider, goRunner));
    assert.ok(
      Math.abs(slider.x - pitch.width / 2) < Math.abs(goRunner.x - pitch.width / 2)
    );
  }
  assert.ok(
    Math.abs(go.goodSpot.x - goRunner.x) < Math.abs(go.goodSpot.x - pitch.width / 2)
  );
  assert.ok(go.goodSpot.y > goRunner.y);
  assert.ok(Math.abs(go.goodSpot.x - pitch.width / 2) > 10);
});

test("rest defense stays central and goal-side near halfway", () => {
  const scene = sceneById("rest-defense");
  assert.equal(scene.pictures.length, 1);
  const picture = scene.pictures[0];
  const attackers = byRole(picture, "attacker");
  assert.equal(attackers.length, 2);
  const carrier = attackers.find(
    (player) => player.x === picture.ball.x && player.y === picture.ball.y
  );
  assert.ok(carrier);
  for (const attacker of attackers) {
    assert.ok(attacker.y < pitch.halfway);
    assert.ok(attacker.y < picture.goodSpot.y);
  }
  assert.ok(picture.goodSpot.y > picture.ball.y);
  assert.ok(Math.abs(picture.goodSpot.x - pitch.width / 2) <= 2);
  assert.ok(Math.abs(picture.goodSpot.y - pitch.halfway) <= 3);
  assert.ok(picture.goodSpot.y < pitch.length - 16.5);
});

test("counter-press is one spot that cuts the forward pass", () => {
  const scene = sceneById("counter-press");
  assert.equal(scene.pictures.length, 1);
  const picture = scene.pictures[0];
  const receiver = one(picture, "receiver");
  const cover = one(picture, "cover");
  assert.equal(receiver.facing, "top");
  assert.deepEqual(picture.ball, { x: receiver.x, y: receiver.y });
  assert.ok(picture.ball.y < pitch.halfway);
  assert.ok(picture.goodSpot.y < pitch.halfway);
  assert.equal(picture.goodSpot.x, picture.ball.x);
  assert.ok(picture.goodSpot.y > picture.ball.y);
  assert.ok(distance(picture.goodSpot, picture.ball) < 10);
  assert.ok(Math.abs(picture.goodSpot.y - ownBuildOutY()) > 10);
  assert.ok(Math.abs(picture.goodSpot.y - pitch.buildOutFromGoalLine) > 5);
  assert.ok(distance(learner(picture), picture.ball) < distance(cover, picture.ball));
  assert.equal(picture.players.length, 3);
});

test("between the lines is the pocket, not beyond the last line", () => {
  const scene = sceneById("between-the-lines");
  assert.equal(scene.pictures.length, 1);
  const picture = scene.pictures[0];
  const midfield = byRole(picture, "midfield-line");
  const last = byRole(picture, "last-line");
  const passer = one(picture, "passer");
  assert.equal(midfield.length, 2);
  assert.equal(last.length, 2);
  const midY = midfield[0].y;
  const lastY = last[0].y;
  assert.equal(midfield[1].y, midY);
  assert.equal(last[1].y, lastY);
  assert.ok(lastY < midY);
  assert.deepEqual(picture.ball, { x: passer.x, y: passer.y });
  assert.ok(passer.y > midY);
  assert.ok(picture.goodSpot.y > lastY + 4);
  assert.ok(picture.goodSpot.y < midY - 4);
  const gap = midfield.map((player) => player.x).sort((a, b) => a - b);
  assert.ok(picture.goodSpot.x > gap[0] && picture.goodSpot.x < gap[1]);
  assert.equal(picture.goodSpot.x, passer.x);
});

test("third man marks the player in the space the defender left", () => {
  const scene = sceneById("third-man");
  const picture = scene.pictures[0];
  const setter = learner(picture);
  const defender = one(picture, "defender");
  const third = one(picture, "third-player");
  const original = one(picture, "original-passer");
  const shadow = one(picture, "shadow");
  assert.equal(setter.role, "setter");
  assert.deepEqual(picture.ball, { x: setter.x, y: setter.y });
  assert.equal(original.marked, true);
  assert.equal(picture.correctMarkId, "third-player");
  assert.deepEqual(
    picture.marks.map((mark) => mark.id).sort(),
    ["original-passer", "shadow", "third-player"]
  );

  const step = { x: defender.x - setter.x, y: defender.y - setter.y };
  const behind = { x: shadow.x - defender.x, y: shadow.y - defender.y };
  const cross = step.x * behind.y - step.y * behind.x;
  const dot = step.x * behind.x + step.y * behind.y;
  assert.equal(cross, 0);
  assert.ok(dot > 0);
  assert.ok(distance(defender, setter) < distance(defender, third));
  assert.ok(distance(third, defender.from) < 4);
  assert.notEqual(picture.correctMarkId, "original-passer");
  assert.notEqual(picture.correctMarkId, "shadow");

  for (const mark of picture.marks) {
    const body = picture.players.find((player) => player.id === mark.id);
    assert.equal(body.x, mark.x);
    assert.equal(body.y, mark.y);
  }
});

test("far-post run chooses the far post on a cross from the right", () => {
  const scene = sceneById("far-post-run");
  const picture = scene.pictures[0];
  const crosser = one(picture, "crosser");
  const nearMate = one(picture, "near-post");
  const far = picture.marks.find((mark) => mark.id === "far-post");
  const near = picture.marks.find((mark) => mark.id === "near-post");
  const beside = picture.marks.find((mark) => mark.id === "beside-crosser");
  const center = pitch.width / 2;
  assert.ok(crosser.x > center + 10);
  assert.deepEqual(picture.ball, { x: crosser.x, y: crosser.y });
  assert.equal(picture.correctMarkId, "far-post");
  assert.ok(far.x < center);
  assert.ok(near.x > center);
  assert.ok(far.y < 5.5);
  assert.ok(near.y < 5.5);
  assert.equal(nearMate.x, near.x);
  assert.equal(nearMate.y, near.y);
  assert.ok(distance(beside, crosser) < 12);
  assert.ok(distance(beside, crosser) > beside.r);
});

test("swap places pinches the wide player inside the overlap", () => {
  const scene = sceneById("swap-places");
  const picture = scene.pictures[0];
  const wide = learner(picture);
  const overlap = one(picture, "overlap");
  const inside = picture.marks.find((mark) => mark.id === "inside");
  const sameLane = picture.marks.find((mark) => mark.id === "same-lane");
  const inFront = picture.marks.find((mark) => mark.id === "in-front");
  assert.equal(wide.role, "wide-player");
  assert.deepEqual(picture.ball, { x: overlap.x, y: overlap.y });
  assert.equal(picture.correctMarkId, "inside");
  assert.ok(overlap.x > inside.x);
  assert.ok(wide.x > inside.x);
  assert.ok(inside.x > pitch.width / 2 - 8);
  assert.equal(sameLane.x, wide.x);
  assert.ok(sameLane.y < wide.y);
  assert.ok(Math.abs(inFront.x - overlap.x) <= 2);
  assert.ok(inFront.y < overlap.y);
  assert.notEqual(picture.correctMarkId, "same-lane");
  assert.notEqual(picture.correctMarkId, "in-front");
});

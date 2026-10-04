const test = require("node:test");
const assert = require("node:assert/strict");
const { drills } = require("../js/catalog.js");
const { pitch, scenes, sceneById } = require("../js/scenes/next.js");

const next = drills.filter((drill) => drill.tier === "next");

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

function mark(picture, id) {
  const found = picture.marks.find((entry) => entry.id === id);
  assert.ok(found);
  return found;
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

function lineDistance(origin, toward, spot) {
  const vx = toward.x - origin.x;
  const vy = toward.y - origin.y;
  const length = Math.hypot(vx, vy);
  const cross = vx * (origin.y - spot.y) - vy * (origin.x - spot.x);
  return Math.abs(cross) / length;
}

function onSegment(origin, toward, spot) {
  const vx = toward.x - origin.x;
  const vy = toward.y - origin.y;
  const lengthSq = vx * vx + vy * vy;
  const t = ((spot.x - origin.x) * vx + (spot.y - origin.y) * vy) / lengthSq;
  assert.ok(t > 0 && t < 1);
  assert.ok(lineDistance(origin, toward, spot) < 0.05);
}

const six = Object.freeze({
  left: (pitch.width - 18.32) / 2,
  right: (pitch.width + 18.32) / 2,
  top: 5.5,
  bottom: pitch.length - 5.5,
});

const box = Object.freeze({
  left: (pitch.width - 40.32) / 2,
  right: (pitch.width + 40.32) / 2,
  top: 16.5,
});

const rightPost = pitch.width / 2 + 7.32 / 2;
const leftPost = pitch.width / 2 - 7.32 / 2;

function inAttackingSix(point) {
  return (
    point.x >= six.left &&
    point.x <= six.right &&
    point.y >= 0 &&
    point.y <= six.top
  );
}

function inDefendingSix(point) {
  return (
    point.x >= six.left &&
    point.x <= six.right &&
    point.y >= six.bottom &&
    point.y <= pitch.length
  );
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

test("next scenes match the catalog and nothing else", () => {
  assert.equal(next.length, 17);
  assert.equal(scenes.length, 17);
  assert.deepEqual(
    scenes.map((scene) => [scene.tier, scene.kind, scene.id, scene.name]),
    next.map((drill) => [drill.tier, drill.kind, drill.id, drill.name])
  );
  const twoPictures = [];
  for (const scene of scenes) {
    assert.equal(sceneById(scene.id), scene);
    assert.equal(scene.tier, "next");
    assert.notEqual(scene.id, "zones");
    assert.notEqual(scene.id, "counter-press");
    assert.ok(scene.pictures.length >= 1);
    if (scene.pictures.length === 2) twoPictures.push(scene.id);
    for (const picture of scene.pictures) {
      const body = learner(picture);
      assert.equal(
        picture.players.filter((player) => player.id === "learner").length,
        1
      );
      for (const player of picture.players) onPitch(player);
      assert.ok(picture.ball, scene.id + " " + picture.id);
      onPitch(picture.ball);
      if (scene.kind === "drag") {
        assert.equal(picture.marks, undefined);
        onPitch(picture.goodSpot);
        outsideSpot(body, picture.goodSpot);
      } else {
        assert.equal(picture.goodSpot, undefined);
        assert.ok(picture.marks.length >= 2);
        const correct = picture.marks.filter(
          (entry) => entry.id === picture.correctMarkId
        );
        assert.equal(correct.length, 1);
        for (const entry of picture.marks) {
          onPitch(entry);
          for (const other of picture.marks) {
            if (other === entry) continue;
            assert.ok(distance(entry, other) > entry.r + other.r);
          }
        }
      }
    }
  }
  assert.deepEqual(twoPictures, ["set-and-go", "throw-switch"]);
});

test("diagonal run goes to the corner gap behind the narrow defender", () => {
  const picture = sceneById("diagonal-run").pictures[0];
  const runner = learner(picture);
  const carrier = one(picture, "ball-carrier");
  const defender = one(picture, "defender");
  const spot = picture.goodSpot;
  const corner = { x: pitch.width, y: 0 };
  assert.equal(picture.players.length, 3);
  assert.deepEqual(picture.ball, { x: carrier.x, y: carrier.y });
  assert.ok(carrier.x > pitch.width / 2 + 12);
  assert.ok(Math.abs(defender.x - pitch.width / 2) < Math.abs(carrier.x - pitch.width / 2));
  assert.ok(spot.y < defender.y);
  assert.ok(distance(spot, corner) < distance(runner, corner));
  assert.ok(distance(spot, picture.ball) > spot.r + 8);
  const toBall = { x: picture.ball.x - runner.x, y: picture.ball.y - runner.y };
  const toSpot = { x: spot.x - runner.x, y: spot.y - runner.y };
  const cross = toBall.x * toSpot.y - toBall.y * toSpot.x;
  assert.ok(Math.abs(cross) > 100);
});

test("numbers up takes the open side for a 2v1", () => {
  const picture = sceneById("numbers-up").pictures[0];
  const carrier = one(picture, "ball-carrier");
  const defender = one(picture, "defender");
  const spot = picture.goodSpot;
  assert.equal(learner(picture).role, "free-attacker");
  assert.equal(picture.players.length, 3);
  assert.deepEqual(picture.ball, { x: carrier.x, y: carrier.y });
  assert.ok(distance(defender, carrier) < 6);
  assert.ok(spot.x > carrier.x);
  assert.ok(spot.x > defender.x);
  assert.ok(spot.y >= defender.y);
  const gap = distance(spot, picture.ball);
  assert.ok(gap > spot.r);
  assert.ok(gap <= 12);
});

test("track goes with the runner and leaves the six", () => {
  const picture = sceneById("track").pictures[0];
  const runner = one(picture, "runner");
  const spot = picture.goodSpot;
  assert.equal(picture.players.length, 2);
  assert.ok(picture.ball.x > pitch.width - 12);
  assert.ok(inDefendingSix(learner(picture)));
  assert.equal(inDefendingSix(spot), false);
  assert.ok(runner.from.y > six.bottom);
  assert.ok(runner.y < runner.from.y);
  assert.ok(spot.y > runner.y);
  onSegment(runner.from, picture.ball, runner);
  onSegment(runner.from, picture.ball, spot);
  assert.ok(distance(spot, runner) < 8);
});

test("slide over is a covering step behind the presser", () => {
  const picture = sceneById("slide-over").pictures[0];
  const body = learner(picture);
  const presser = one(picture, "presser");
  const carrier = one(picture, "ball-carrier");
  const spot = picture.goodSpot;
  const center = pitch.width / 2;
  assert.deepEqual(picture.ball, { x: carrier.x, y: carrier.y });
  assert.ok(carrier.x > center + 16);
  assert.ok(body.x < pitch.width / 3);
  assert.ok(spot.x > body.x);
  assert.ok(spot.x > center);
  assert.ok(spot.x < carrier.x - 12);
  assert.ok(spot.y > presser.y);
  assert.ok(presser.y > carrier.y);
  assert.ok(distance(presser, carrier) < 8);
  assert.ok(distance(spot, carrier) > 15);
});

test("cover shadow curves onto the inside pass", () => {
  const picture = sceneById("cover-shadow").pictures[0];
  const body = learner(picture);
  const carrier = one(picture, "ball-carrier");
  const inside = one(picture, "inside");
  const spot = picture.goodSpot;
  assert.equal(body.role, "presser");
  assert.equal(picture.players.length, 3);
  assert.deepEqual(picture.ball, { x: carrier.x, y: carrier.y });
  assert.ok(Math.abs(inside.x - pitch.width / 2) <= 2);
  assert.ok(body.x > inside.x && body.x < carrier.x);
  assert.ok(distance(picture.ball, inside) > distance(picture.ball, body));
  onSegment(picture.ball, inside, spot);
  assert.ok(distance(spot, picture.ball) > spot.r);
  assert.ok(distance(spot, picture.ball) < 8);
  assert.ok(lineDistance(body, picture.ball, spot) > 1);
});

test("simple press triggers are one step onto a heavy touch", () => {
  const scene = sceneById("simple-press-triggers");
  assert.equal(scene.pictures.length, 1);
  const picture = scene.pictures[0];
  const carrier = one(picture, "ball-carrier");
  const spot = picture.goodSpot;
  assert.equal(picture.players.length, 2);
  assert.equal(carrier.facing, "top");
  assert.equal(carrier.touch, "heavy");
  assert.equal(spot.x, picture.ball.x);
  assert.equal(spot.y, picture.ball.y);
  assert.ok(picture.ball.y < carrier.y);
  assert.ok(distance(picture.ball, carrier) < 8);
  assert.ok(distance(picture.ball, carrier) > 3);
  const delay = { x: carrier.x, y: carrier.y + 8 };
  assert.ok(distance(spot, delay) > spot.r);
});

test("show outside stands on the inside shoulder", () => {
  const picture = sceneById("show-outside").pictures[0];
  const carrier = one(picture, "ball-carrier");
  const spot = picture.goodSpot;
  const center = pitch.width / 2;
  const defendingThird = (pitch.length * 2) / 3;
  assert.equal(picture.players.length, 2);
  assert.equal(carrier.facing, "bottom");
  assert.deepEqual(picture.ball, { x: carrier.x, y: carrier.y });
  assert.ok(picture.ball.y > defendingThird);
  assert.ok(picture.ball.x > center + 16);
  assert.ok(Math.abs(spot.x - center) < Math.abs(picture.ball.x - center));
  assert.ok(spot.y > picture.ball.y);
  const square = { x: picture.ball.x, y: spot.y };
  const showInside = { x: picture.ball.x + (picture.ball.x - spot.x), y: spot.y };
  assert.ok(distance(spot, square) > spot.r);
  assert.ok(distance(spot, showInside) > spot.r);
});

test("goalkeeper depth stays on the goal line", () => {
  const picture = sceneById("goalkeeper-depth").pictures[0];
  const spot = picture.goodSpot;
  const penalty = { x: pitch.width / 2, y: pitch.length - 11 };
  assert.equal(learner(picture).role, "goalkeeper");
  assert.equal(picture.players.length, 1);
  assert.ok(picture.ball.y < pitch.halfway);
  assert.equal(spot.x, pitch.width / 2);
  assert.ok(pitch.length - spot.y > 0);
  assert.ok(pitch.length - spot.y <= 2);
  assert.ok(distance(spot, penalty) > spot.r);
  assert.deepEqual(
    { x: learner(picture).x, y: learner(picture).y },
    penalty
  );
});

test("goalkeeper as plus-one offers a short option outside the six", () => {
  const picture = sceneById("goalkeeper-as-plus-one").pictures[0];
  const defender = one(picture, "defender");
  const spot = picture.goodSpot;
  const opponents = picture.players.filter((player) => player.team === "opponent");
  assert.equal(learner(picture).role, "goalkeeper");
  assert.deepEqual(picture.ball, { x: defender.x, y: defender.y });
  assert.ok(opponents.length >= 2);
  for (const opponent of opponents) {
    assert.ok(opponent.y < ownBuildOutY());
    assert.equal(opponent.facing, "bottom");
  }
  assert.ok(spot.y < six.bottom);
  assert.ok(six.bottom - spot.y <= 4);
  assert.ok(Math.abs(spot.x - defender.x) >= 8);
  assert.ok(distance(spot, defender) < 20);
  assert.ok(Math.abs(spot.y - pitch.halfway) > 30);
});

test("counter, react on turnover, and counter-press stay separate", () => {
  const counter = sceneById("counter").pictures[0];
  const react = sceneById("react-on-turnover").pictures[0];
  assert.equal(sceneById("counter-press"), null);
  assert.equal(sceneById("counter").pictures.length, 1);
  assert.equal(sceneById("react-on-turnover").pictures.length, 1);

  const runner = learner(counter);
  const stranded = one(counter, "upfield");
  assert.equal(byRole(counter, "runner").length, 1);
  assert.equal(counter.players.length, 2);
  assert.ok(stranded.y > counter.ball.y);
  assert.ok(counter.goodSpot.y < counter.ball.y);
  assert.ok(counter.goodSpot.y < runner.y);
  assert.ok(distance(counter.goodSpot, counter.ball) > 12);
  assert.notEqual(counter.goodSpot.y, runner.y);
  assert.ok(counter.goodSpot.y < runner.y - 8);

  const carrier = one(react, "ball-carrier");
  const nearest = learner(react);
  assert.equal(react.players.length, 2);
  assert.deepEqual(react.ball, { x: carrier.x, y: carrier.y });
  assert.ok(distance(nearest, carrier) > 4);
  assert.ok(distance(nearest, carrier) < 10);
  assert.ok(distance(react.goodSpot, carrier) < distance(nearest, carrier));
  assert.ok(distance(nearest, react.goodSpot) < 6);
  assert.ok(Math.abs(react.goodSpot.y - pitch.halfway) > 10);
  assert.ok(react.ball.y > pitch.halfway);
  assert.ok(counter.goodSpot.y < react.goodSpot.y - 15);
});

test("overlap takes the outside path around the wide carrier", () => {
  const picture = sceneById("overlap").pictures[0];
  const body = learner(picture);
  const carrier = one(picture, "ball-carrier");
  const defender = one(picture, "defender");
  const outside = mark(picture, "outside");
  const inside = mark(picture, "inside");
  const behind = mark(picture, "behind");
  assert.equal(picture.correctMarkId, "outside");
  assert.deepEqual(picture.ball, { x: carrier.x, y: carrier.y });
  assert.ok(body.x < carrier.x);
  assert.ok(distance(defender, carrier) < 6);
  assert.ok(outside.x > carrier.x);
  assert.ok(outside.y < carrier.y);
  assert.ok(inside.x < carrier.x);
  assert.ok(behind.y > picture.ball.y);
});

test("diagonal ball finds the straight run behind the defender", () => {
  const picture = sceneById("diagonal-ball").pictures[0];
  const passer = learner(picture);
  const runner = one(picture, "runner");
  const defender = one(picture, "defender");
  const marked = one(picture, "marked");
  const into = mark(picture, "into-the-run");
  const square = mark(picture, "square");
  const feet = mark(picture, "defender-feet");
  assert.equal(picture.correctMarkId, "into-the-run");
  assert.deepEqual(picture.ball, { x: passer.x, y: passer.y });
  assert.equal(marked.marked, true);
  assert.equal(runner.x, runner.runTo.x);
  assert.equal(into.x, runner.x);
  assert.equal(into.y, runner.runTo.y);
  assert.ok(into.y < defender.y);
  assert.ok(into.y < runner.y);
  assert.notEqual(into.y, picture.ball.y);
  assert.equal(square.y, picture.ball.y);
  assert.equal(square.x, marked.x);
  assert.equal(square.y, marked.y);
  assert.equal(feet.x, defender.x);
  assert.equal(feet.y, defender.y);
});

test("set and go is a one-touch set, then the runner arrives", () => {
  const scene = sceneById("set-and-go");
  assert.equal(scene.pictures.length, 2);
  const setter = scene.pictures[0];
  const runnerPicture = scene.pictures[1];
  assert.equal(setter.id, "setter");
  assert.equal(runnerPicture.id, "runner");

  const setterBody = learner(setter);
  const setterRunner = one(setter, "runner");
  const setterDefender = one(setter, "defender");
  const oneTouch = mark(setter, "one-touch");
  assert.equal(setter.correctMarkId, "one-touch");
  assert.equal(setterBody.role, "setter");
  assert.deepEqual(setter.ball, { x: setterBody.x, y: setterBody.y });
  assert.ok(distance(setterDefender, setterBody) < 6);
  onSegment(setterRunner, setterRunner.runTo, oneTouch);
  const pass = distance(setter.ball, oneTouch);
  assert.ok(pass >= 6 && pass <= 12);
  assert.ok(distance(oneTouch, setterRunner) > oneTouch.r + 3);

  const runner = learner(runnerPicture);
  const arrive = mark(runnerPicture, "arrive");
  const start = mark(runnerPicture, "start");
  assert.equal(runnerPicture.correctMarkId, "arrive");
  assert.equal(runner.role, "runner");
  assert.equal(arrive.x, runnerPicture.ball.x);
  assert.equal(arrive.y, runnerPicture.ball.y);
  assert.equal(start.x, runner.x);
  assert.equal(start.y, runner.y);
  onSegment(runner, runner.runTo, runnerPicture.ball);
  assert.equal(runnerPicture.ball.x, oneTouch.x);
  assert.equal(runnerPicture.ball.y, oneTouch.y);
  assert.equal(one(runnerPicture, "defender").x, setterDefender.x);
});

test("throw switch plays short when near is open and long when it is marked", () => {
  const scene = sceneById("throw-switch");
  assert.equal(scene.pictures.length, 2);
  const open = scene.pictures[0];
  const marked = scene.pictures[1];
  assert.equal(open.id, "near-open");
  assert.equal(marked.id, "near-marked");

  for (const picture of scene.pictures) {
    const thrower = learner(picture);
    assert.equal(thrower.role, "thrower");
    assert.equal(thrower.x, pitch.width);
    assert.deepEqual(picture.ball, { x: thrower.x, y: thrower.y });
    const near = one(picture, "near");
    const far = one(picture, "far");
    const short = mark(picture, "short");
    const long = mark(picture, "long");
    assert.equal(short.x, near.x);
    assert.equal(short.y, near.y);
    assert.equal(long.x, far.x);
    assert.equal(long.y, far.y);
    assert.ok(distance(thrower, short) < 15);
    assert.ok(distance(thrower, long) > 40);
  }

  assert.equal(open.correctMarkId, "short");
  assert.equal(
    open.players.filter((player) => player.team === "opponent").length,
    0
  );

  assert.equal(marked.correctMarkId, "long");
  const near = one(marked, "near");
  const far = one(marked, "far");
  const markers = byRole(marked, "marker");
  assert.ok(markers.length >= 2);
  for (const marker of markers) {
    assert.ok(distance(marker, near) < 6);
    assert.ok(distance(marker, far) > 20);
  }
});

test("corner near and far has one correct spot at the far post", () => {
  const scene = sceneById("corner-near-and-far");
  assert.equal(scene.pictures.length, 1);
  const picture = scene.pictures[0];
  const defender = one(picture, "near-post");
  const far = mark(picture, "far-post");
  const near = mark(picture, "near-post");
  const penalty = mark(picture, "penalty-spot");
  const edge = mark(picture, "box-edge");
  assert.equal(picture.corner, "right");
  assert.equal(picture.correctMarkId, "far-post");
  assert.equal(
    picture.marks.filter((entry) => entry.id === picture.correctMarkId).length,
    1
  );
  assert.equal(learner(picture).role, "runner");
  assert.ok(inAttackingSix(far));
  assert.ok(far.x < leftPost);
  assert.ok(Math.abs(far.x - leftPost) < 4);
  assert.equal(near.x, rightPost);
  assert.ok(near.y < six.top);
  assert.equal(defender.x, rightPost);
  assert.ok(picture.ball.x < defender.x);
  assert.ok(picture.ball.x < near.x);
  assert.equal(penalty.x, pitch.width / 2);
  assert.equal(penalty.y, 11);
  assert.ok(penalty.y > six.top);
  assert.equal(edge.y, box.top);
  assert.ok(edge.y > penalty.y);
});

test("short corner finds the free teammate outside the arc", () => {
  const scene = sceneById("short-corner");
  assert.equal(scene.pictures.length, 1);
  const picture = scene.pictures[0];
  const taker = learner(picture);
  const free = one(picture, "free");
  const crowd = byRole(picture, "crowd");
  const chosen = mark(picture, "free-teammate");
  const nearCrowd = mark(picture, "near-post-crowd");
  const corner = { x: pitch.width, y: 0 };
  assert.equal(picture.corner, "right");
  assert.equal(picture.correctMarkId, "free-teammate");
  assert.equal(taker.role, "taker");
  assert.deepEqual(picture.ball, { x: taker.x, y: taker.y });
  assert.ok(distance(taker, corner) < 3);
  assert.equal(chosen.x, free.x);
  assert.equal(chosen.y, free.y);
  const fromCorner = distance(free, corner);
  assert.ok(fromCorner > 1);
  assert.ok(fromCorner < 6);
  assert.ok(free.x > box.right);
  assert.ok(crowd.length >= 3);
  for (const player of crowd) {
    assert.ok(player.x >= box.left && player.x <= box.right);
    assert.ok(player.y <= box.top);
  }
  assert.equal(nearCrowd.x, crowd[0].x);
  assert.equal(nearCrowd.y, crowd[0].y);
  assert.ok(distance(nearCrowd, { x: rightPost, y: 0 }) < 8);
});

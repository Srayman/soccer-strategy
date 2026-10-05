const test = require("node:test");
const assert = require("node:assert/strict");
const { drills } = require("../js/catalog.js");
const {
  pitch: starterPitch,
  scenes: starterScenes,
} = require("../js/starter-scenes.js");
const { pitch: nextPitch, scenes: nextScenes } = require("../js/scenes/next.js");
const {
  pitch: advancedPitch,
  scenes: advancedScenes,
} = require("../js/scenes/advanced.js");

const packs = [
  { name: "starter", pitch: starterPitch, scenes: starterScenes },
  { name: "next", pitch: nextPitch, scenes: nextScenes },
  { name: "advanced", pitch: advancedPitch, scenes: advancedScenes },
];

function picturesOf(scene) {
  if (Array.isArray(scene.pictures)) {
    return scene.pictures.map((picture) => ({
      id: scene.id + ":" + picture.id,
      frame: picture,
    }));
  }
  if (scene.pictures && scene.angles) {
    return scene.angles.map((angle) => ({
      id: scene.id + ":" + angle.id,
      frame: scene.pictures[angle.id],
    }));
  }
  return [{ id: scene.id, frame: scene }];
}

function goodSpotsOf(frame) {
  if (frame.goodSpots) return frame.goodSpots;
  if (frame.goodSpot) return [frame.goodSpot];
  return [];
}

function targetsOf(frame) {
  if (frame.targets) return frame.targets;
  if (frame.marks) return frame.marks;
  return [];
}

function onPitch(point, pitch, id) {
  assert.ok(point.x >= 0 && point.x <= pitch.width, id);
  assert.ok(point.y >= 0 && point.y <= pitch.length, id);
}

function checkScene(scene, pitch) {
  for (const { id, frame } of picturesOf(scene)) {
    assert.ok(frame, id);
    for (const spot of goodSpotsOf(frame)) onPitch(spot, pitch, id);
    for (const target of targetsOf(frame)) onPitch(target, pitch, id);
    if (frame.marks || frame.correctMarkId != null) {
      const marks = frame.marks || [];
      const matched = marks.filter((mark) => mark.id === frame.correctMarkId);
      assert.equal(matched.length, 1, id);
    }
  }
}

test("every scene keeps spots and marks on the pitch", () => {
  const seen = [];
  for (const pack of packs) {
    for (const scene of pack.scenes) {
      checkScene(scene, pack.pitch);
      seen.push(scene.id);
    }
  }
  assert.deepEqual(
    seen,
    drills.map((drill) => drill.id)
  );
});

test("a spot outside the pitch fails the schema check", () => {
  assert.throws(() => {
    checkScene(
      {
        id: "out-of-bounds-spot",
        kind: "drag",
        goodSpot: { x: 70, y: 10, r: 3 },
      },
      nextPitch
    );
  });
  assert.throws(() => {
    checkScene(
      {
        id: "out-of-bounds-target",
        kind: "pick",
        marks: [{ id: "a", x: -1, y: 10, r: 3 }],
        correctMarkId: "a",
      },
      nextPitch
    );
  });
});

test("a correctMarkId that does not match a mark fails the schema check", () => {
  assert.throws(() => {
    checkScene(
      {
        id: "missing-mark",
        kind: "pick",
        pictures: [
          {
            id: "one",
            marks: [{ id: "a", x: 10, y: 10, r: 3 }],
            correctMarkId: "missing",
          },
        ],
      },
      nextPitch
    );
  });
});

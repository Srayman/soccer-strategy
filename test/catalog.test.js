const test = require("node:test");
const assert = require("node:assert/strict");
const { drills, isLocked, canStart } = require("../js/catalog.js");

const expected = [
  ["starter", "drag", "Open body"],
  ["starter", "drag", "Get open"],
  ["starter", "drag", "Stay wide"],
  ["starter", "drag", "Spread out"],
  ["starter", "drag", "Get wide"],
  ["starter", "drag", "Help the ball"],
  ["starter", "drag", "Pass and move"],
  ["starter", "drag", "Goal-side"],
  ["starter", "drag", "Ball-side"],
  ["starter", "drag", "Mark distance"],
  ["starter", "drag", "Delay"],
  ["starter", "drag", "Pressure and cover"],
  ["starter", "drag", "Squeeze the middle"],
  ["starter", "drag", "Recovery run"],
  ["starter", "drag", "Goalkeeper step-out and line-up"],
  ["starter", "pick", "Check away"],
  ["starter", "pick", "Triangle"],
  ["starter", "pick", "Wall pass"],
  ["starter", "pick", "Switch the weak side"],
  ["starter", "pick", "Build-out"],
  ["next", "drag", "Diagonal run"],
  ["next", "drag", "Numbers up"],
  ["next", "drag", "Track"],
  ["next", "drag", "Slide over"],
  ["next", "drag", "Cover shadow"],
  ["next", "drag", "Simple press triggers"],
  ["next", "drag", "Show outside"],
  ["next", "drag", "Goalkeeper depth"],
  ["next", "drag", "Goalkeeper as plus-one"],
  ["next", "drag", "Counter"],
  ["next", "drag", "React on turnover"],
  ["next", "pick", "Overlap"],
  ["next", "pick", "Diagonal ball"],
  ["next", "pick", "Set and go"],
  ["next", "pick", "Throw switch"],
  ["next", "pick", "Corner near and far"],
  ["next", "pick", "Short corner"],
  ["advanced", "drag", "Offside line step or drop"],
  ["advanced", "drag", "Zones"],
  ["advanced", "drag", "Rest defense"],
  ["advanced", "drag", "Counter-press"],
  ["advanced", "drag", "Between the lines"],
  ["advanced", "pick", "Third man"],
  ["advanced", "pick", "Far-post run"],
  ["advanced", "pick", "Swap places"],
];

test("catalog lists every plan drill in order", () => {
  assert.equal(drills.length, 45);
  assert.deepEqual(
    drills.map((drill) => [drill.tier, drill.kind, drill.name]),
    expected
  );
});

test("catalog counts match the plan tiers", () => {
  const count = (tier) => drills.filter((drill) => drill.tier === tier).length;
  assert.equal(count("starter"), 20);
  assert.equal(count("next"), 17);
  assert.equal(count("advanced"), 8);
});

test("ids are unique and stable", () => {
  const ids = drills.map((drill) => drill.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(
    drills.find((drill) => drill.name === "Goalkeeper step-out and line-up").id,
    "goalkeeper-step-out-and-line-up"
  );
  assert.equal(
    drills.find((drill) => drill.name === "Offside line step or drop").id,
    "offside-line-step-or-drop"
  );
});

test("only starters can be started", () => {
  for (const drill of drills) {
    if (drill.tier === "starter") {
      assert.equal(isLocked(drill), false);
      assert.equal(canStart(drill), true);
    } else {
      assert.equal(isLocked(drill), true);
      assert.equal(canStart(drill), false);
    }
  }
});

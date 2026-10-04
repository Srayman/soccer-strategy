// Names, kinds, and tiers follow docs/PLAN.md.
// Next and advanced stay locked. Unlocking a tier is a later change.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SoccerStrategy = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const starters = {
    drag: [
      "Open body",
      "Get open",
      "Stay wide",
      "Spread out",
      "Get wide",
      "Help the ball",
      "Pass and move",
      "Goal-side",
      "Ball-side",
      "Mark distance",
      "Delay",
      "Pressure and cover",
      "Squeeze the middle",
      "Recovery run",
      "Goalkeeper step-out and line-up",
    ],
    pick: [
      "Check away",
      "Triangle",
      "Wall pass",
      "Switch the weak side",
      "Build-out",
    ],
  };

  const next = {
    drag: [
      "Diagonal run",
      "Numbers up",
      "Track",
      "Slide over",
      "Cover shadow",
      "Simple press triggers",
      "Show outside",
      "Goalkeeper depth",
      "Goalkeeper as plus-one",
      "Counter",
      "React on turnover",
    ],
    pick: [
      "Overlap",
      "Diagonal ball",
      "Set and go",
      "Throw switch",
      "Corner near and far",
      "Short corner",
    ],
  };

  const advanced = {
    drag: [
      "Offside line step or drop",
      "Zones",
      "Rest defense",
      "Counter-press",
      "Between the lines",
    ],
    pick: ["Third man", "Far-post run", "Swap places"],
  };

  function slug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function drillsFor(tier, groups) {
    return ["drag", "pick"].flatMap((kind) =>
      groups[kind].map((name) =>
        Object.freeze({
          id: slug(name),
          name,
          tier,
          kind,
        })
      )
    );
  }

  const drills = Object.freeze(
    [].concat(
      drillsFor("starter", starters),
      drillsFor("next", next),
      drillsFor("advanced", advanced)
    )
  );

  function isLocked(drill) {
    return drill.tier !== "starter";
  }

  function canStart(drill) {
    return drill.tier === "starter";
  }

  return Object.freeze({
    drills,
    isLocked,
    canStart,
  });
});

// Names, kinds, and tiers follow docs/PLAN.md.
// Starters can start immediately. Next stays locked until every starter
// has ended once. Advanced stays locked until every next drill has ended once.
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

  function clearedIds(cleared) {
    return Array.isArray(cleared) ? cleared : [];
  }

  function everyEnded(tier, cleared) {
    const done = clearedIds(cleared);
    return drills
      .filter(function (drill) {
        return drill.tier === tier;
      })
      .every(function (drill) {
        return done.indexOf(drill.id) !== -1;
      });
  }

  // A missing cleared list is a fresh page: only starters can start.
  // One ended attempt clears that drill, except goalkeeper step-out.
  // That drill joins the ended list only after each picture has ended.
  // Picture ids are not drills.
  function isLocked(drill, cleared) {
    if (!drill) return true;
    if (drill.tier === "starter") return false;
    if (drill.tier === "next") return !everyEnded("starter", cleared);
    if (drill.tier === "advanced") return !everyEnded("next", cleared);
    return true;
  }

  function canStart(drill, cleared) {
    return Boolean(drill) && isLocked(drill, cleared) === false;
  }

  return Object.freeze({
    drills,
    isLocked,
    canStart,
  });
});

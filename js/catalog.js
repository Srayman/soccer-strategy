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

  // One sentence each. It says what the idea means.
  // It does not say where to go, which mark to choose, or how points work.
  const ideas = {
    "Open body": "You turn so you can see the ball and the goal at the same time.",
    "Get open": "You move into free space so a teammate can pass to you.",
    "Stay wide": "A player on the side of the field stays on that side.",
    "Spread out": "Teammates stand apart so the team is not bunched up.",
    "Get wide": "You leave the crowded middle to make the team wider.",
    "Help the ball": "You give the player with the ball someone to pass to.",
    "Pass and move": "After you pass the ball, you run to a new place.",
    "Goal-side": "Goal-side means you guard a player with your own goal behind you.",
    "Ball-side": "You stay so you can see the ball and the player you guard.",
    "Mark distance": "You stay near your player, but not stuck right on them.",
    Delay: "You slow the player with the ball instead of charging in.",
    "Pressure and cover": "One teammate goes to the ball, and you stay behind as cover.",
    "Squeeze the middle": "Squeeze the middle means the team shifts across to stay compact.",
    "Recovery run": "You run back toward your goal after your team loses the ball.",
    "Goalkeeper step-out and line-up":
      "The goalkeeper gets set early so they are ready for the ball.",
    "Check away": "A little move helps you get free before you ask for the ball.",
    Triangle: "A triangle gives the player with the ball two ways to pass.",
    "Wall pass": "A wall pass uses a teammate like a wall to play around a defender.",
    "Switch the weak side": "The weak side is the side of the field with more open space.",
    "Build-out": "Build-out means starting the attack with the players near your goal.",
    "Diagonal run": "A diagonal run goes on a slant to find open space.",
    "Numbers up": "Numbers up means your team has more players than the other team in the play.",
    Track: "Tracking means you stay with a runner so they cannot slip away.",
    "Slide over": "Slide over means stepping across the field as the ball moves.",
    "Cover shadow": "A cover shadow blocks a pass to the player behind you.",
    "Simple press triggers":
      "A press trigger is the moment the other player loses control of the ball.",
    "Show outside": "Show outside means you protect the middle and leave the side path.",
    "Goalkeeper depth": "The goalkeeper does not rush out when the ball is far away.",
    "Goalkeeper as plus-one": "The goalkeeper can be an extra teammate for a pass.",
    Counter: "A counter is a fast move toward the other goal after you win the ball.",
    "React on turnover": "The nearest player acts right away when your team loses the ball.",
    Overlap: "An overlap is a run that joins the teammate who has the ball.",
    "Diagonal ball": "A diagonal ball travels on a slant instead of straight across.",
    "Set and go": "One player sets the ball and a runner takes it forward.",
    "Throw switch": "A throw-in can send the ball to a teammate who is free.",
    "Corner near and far":
      "On a corner, players attack the near side and the far side of the goal.",
    "Short corner": "A short corner is a pass to a teammate before the ball goes into the box.",
    "Offside line step or drop": "The back line steps forward together or drops back together.",
    Zones: "In zones, each defender looks after one part of the field.",
    "Rest defense": "Rest defense means one player stays back while others attack.",
    "Counter-press": "A counter-press tries to win the ball back right after you lose it.",
    "Between the lines": "Between the lines is the open gap between two rows of defenders.",
    "Third man": "A third player joins after two teammates have already played the ball.",
    "Far-post run": "The far post is the goal post farther from the ball.",
    "Swap places": "Swap places means two players trade the spaces they were using.",
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
          idea: ideas[name],
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

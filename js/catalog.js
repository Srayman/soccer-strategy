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

  // Longer picture explainers. Plain words for a 10-year-old.
  // They describe the picture the drill was built from.
  // They do not name the good spot or the right mark.
  const explainers = {
    "Open body":
      "A teammate has the ball in the middle of your half. A defender stands on your back. Turn so you can see the ball and the goal at the same time.",
    "Get open":
      "The ball is in the middle, and a defender is tight on you. Move into free space so a teammate can pass to you.",
    "Stay wide":
      "You are the wide player, already near the side line. The ball is in the middle. Stay on that side instead of running into the crowd.",
    "Spread out":
      "Three of you are bunched on the ball. One opponent is near that bunch. Spread out so the team is not all in one spot.",
    "Get wide":
      "The ball is stuck in the middle, and you start in that crowd. Leave the middle so the team gets wider.",
    "Help the ball":
      "A teammate has the ball, and an opponent is pressing them. You are the helper, not the player with the ball. Give that teammate someone to pass to.",
    "Pass and move":
      "You just passed, and the ball is with a teammate. An opponent is near the spot you left. After the pass, run to a new place.",
    "Goal-side":
      "Their player has the ball, between you and your own goal. Guard them with your goal behind you.",
    "Ball-side":
      "You are marking a player away from the ball. The ball is on the right. Stay where you can see the ball and that player.",
    "Mark distance":
      "You are marking a player who is not on the ball. The ball is a short way off. Stay near your player, but not stuck on them.",
    Delay:
      "Their player is dribbling at your goal with the ball under control. Slow them down instead of charging in.",
    "Pressure and cover":
      "Your teammate is already on the ball. You are the cover, not the one pressing. One teammate goes to the ball, and you stay behind.",
    "Squeeze the middle":
      "The ball is on the other wing, and your teammate is pressing it. You are the far defender. Shift across so the team stays compact.",
    "Recovery run":
      "You lost the ball up the wing. Their player is running at your goal. Run back toward your goal.",
    "Goalkeeper step-out and line-up":
      "You are the goalkeeper. This drill has three pictures: a close shot in front, a close shot near the post, and one free ball. Get set early so you are ready. Near post is a picture in this drill, not a second drill.",
    "Check away":
      "You are marked, and a teammate has the ball. A little move into space helps you get free before you ask for the ball.",
    Triangle:
      "You choose a spot around two teammates and the ball. A triangle gives the player with the ball two ways to pass.",
    "Wall pass":
      "You passed inside, and the defender stepped toward the ball. A wall pass uses a teammate like a wall to play around that defender.",
    "Switch the weak side":
      "The ball is on the right, and two opponents are crowded there. The weak side is the other side, where there is more open space.",
    "Build-out":
      "The ball is in your hands, and you are the goalkeeper. Opponents wait behind the build-out line. Start the attack with the players near your goal.",
    "Diagonal run":
      "A teammate has the ball wide, and you are the runner off the ball. A diagonal run goes on a slant to find open space.",
    "Numbers up":
      "A teammate has the ball, and one opponent is on that teammate. You are the free attacker. Numbers up means your team has more players in the play.",
    Track:
      "The ball is at the side. An opponent runs from the box toward that ball. Stay with the runner so they cannot slip away.",
    "Slide over":
      "The ball has moved from one side to the other. Your teammate is pressing it. Step across the field. This is not a slide tackle.",
    "Cover shadow":
      "An opponent has the ball. Another opponent is in the middle, behind you. A cover shadow blocks a pass to the player behind you.",
    "Simple press triggers":
      "You are the nearest defender. Their player just took a heavy touch and faces their own goal. A press trigger is that moment when they lose control.",
    "Show outside":
      "Their player has the ball on the side, near your goal. Protect the middle and leave the side path.",
    "Goalkeeper depth":
      "You are the goalkeeper. The ball is in the other half, and it is not a shot. Do not rush out when the ball is far away.",
    "Goalkeeper as plus-one":
      "Your team has the ball at the back, and one defender is under pressure. You can be an extra teammate for a pass.",
    Counter:
      "Your team just won the ball. You are the free runner, and one opponent is still up the field. A counter is a fast move toward their goal.",
    "React on turnover":
      "Your team just lost the ball. You are the nearest player, and the new carrier is close. Act right away.",
    Overlap:
      "A teammate has the ball wide, and you start narrower than that teammate. An overlap is a run that joins them.",
    "Diagonal ball":
      "A teammate is making a straight run behind a defender. A diagonal ball travels on a slant into that run.",
    "Set and go":
      "This drill has two pictures, and one defender is tight. In one picture you set the ball. In the other you are the runner. One player sets it, and a runner takes it forward.",
    "Throw switch":
      "You throw in from the right side line. This drill has two pictures. A throw-in can go to the teammate who is free.",
    "Corner near and far":
      "The corner comes from the right, and you are the runner. On a corner, players attack the near side and the far side of the goal.",
    "Short corner":
      "You take the corner from the right. The box is crowded, and one teammate is free just outside. A short corner is a pass to a teammate before the ball goes into the box.",
    "Offside line step or drop":
      "You are a defender on the build-out line, with a teammate on that line. This drill has two pictures. The line steps forward together, or it drops back together.",
    Zones:
      "You look after the middle in front of your goal. A runner goes toward the wing. This drill has two pictures. In zones, each defender looks after one part of the field.",
    "Rest defense":
      "Two teammates attack with the ball. You are the player who stays, and one opponent is off the ball. One player stays back while the others attack.",
    "Counter-press":
      "Your team just lost the ball in the other half. You are the nearest player, and their player faces their own goal. A counter-press tries to win the ball back right away.",
    "Between the lines":
      "Two opponents make a line in midfield. Two more make a line nearer their goal. A teammate has the ball behind the first line. Between the lines is the gap between those rows.",
    "Third man":
      "One player has the ball, and a second player can set it. A defender steps toward that second player. A third player joins after those two have played the ball.",
    "Far-post run":
      "A teammate is about to cross from the right. One teammate is already at the near post. The far post is the goal post farther from the ball.",
    "Swap places":
      "A teammate overlaps outside with the ball. You are the wide player in that path. You trade the space that teammate left.",
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
          explainer: explainers[name],
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

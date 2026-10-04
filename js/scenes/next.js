// Next scenes from docs/SCENES.md. Starter and advanced scenes stay elsewhere.
// Meters. x is 0 on the left touchline and 68 on the right.
// y is 0 on the top goal line and 105 on the bottom goal line.
// The learner attacks the top goal and defends the bottom goal.
// Good spots and marked choices are fixed.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SoccerNextScenes = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const pitch = Object.freeze({
    length: 105,
    width: 68,
    attackGoal: "top",
    defendGoal: "bottom",
    halfway: 52.5,
    buildOutFromGoalLine: 34.5,
  });

  const dragRadius = 3.6;
  const pickRadius = 3;

  function spot(x, y, r) {
    return Object.freeze({ x: x, y: y, r: r });
  }

  function point(x, y) {
    return Object.freeze({ x: x, y: y });
  }

  function player(fields) {
    return Object.freeze(fields);
  }

  function picture(fields) {
    return Object.freeze(fields);
  }

  function scene(fields) {
    return Object.freeze(fields);
  }

  function spotMark(id, x, y) {
    return Object.freeze({ id: id, x: x, y: y, r: pickRadius });
  }

  const scenes = Object.freeze([
    scene({
      id: "diagonal-run",
      name: "Diagonal run",
      tier: "next",
      kind: "drag",
      pictures: Object.freeze([
        picture({
          id: "gap-behind",
          ball: point(60, 42),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "runner",
              x: 32,
              y: 50,
            }),
            player({
              id: "wide",
              team: "teammate",
              role: "ball-carrier",
              x: 60,
              y: 42,
            }),
            player({
              id: "defender",
              team: "opponent",
              role: "defender",
              x: 40,
              y: 32,
            }),
          ]),
          // Diagonal run toward the right corner, into the gap behind the defender.
          goodSpot: spot(48, 20, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "numbers-up",
      name: "Numbers up",
      tier: "next",
      kind: "drag",
      pictures: Object.freeze([
        picture({
          id: "open-side",
          ball: point(38, 44),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "free-attacker",
              x: 20,
              y: 58,
            }),
            player({
              id: "carrier",
              team: "teammate",
              role: "ball-carrier",
              x: 38,
              y: 44,
            }),
            player({
              id: "defender",
              team: "opponent",
              role: "defender",
              x: 36,
              y: 40,
            }),
          ]),
          // Open side of the defender, close enough for a 2v1.
          goodSpot: spot(46, 42, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "track",
      name: "Track",
      tier: "next",
      kind: "drag",
      pictures: Object.freeze([
        picture({
          id: "with-the-runner",
          ball: point(62, 78),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "defender",
              x: 34,
              y: 102,
            }),
            player({
              id: "runner",
              team: "opponent",
              role: "runner",
              x: 50,
              y: 90,
              from: point(40, 100),
            }),
          ]),
          // With the runner, goal-side, on the path out of the box.
          goodSpot: spot(46, 94, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "slide-over",
      name: "Slide over",
      tier: "next",
      kind: "drag",
      pictures: Object.freeze([
        picture({
          id: "toward-the-middle",
          ball: point(62, 68),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "far-defender",
              x: 8,
              y: 82,
            }),
            player({
              id: "presser",
              team: "teammate",
              role: "presser",
              x: 58,
              y: 72,
            }),
            player({
              id: "carrier",
              team: "opponent",
              role: "ball-carrier",
              x: 62,
              y: 68,
            }),
          ]),
          // Covering step toward the middle. Not a slide tackle.
          goodSpot: spot(40, 80, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "cover-shadow",
      name: "Cover shadow",
      tier: "next",
      kind: "drag",
      pictures: Object.freeze([
        picture({
          id: "block-the-inside",
          ball: point(60, 48),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "presser",
              x: 50,
              y: 52,
            }),
            player({
              id: "carrier",
              team: "opponent",
              role: "ball-carrier",
              x: 60,
              y: 48,
            }),
            player({
              id: "inside",
              team: "opponent",
              role: "inside",
              x: 34,
              y: 46,
            }),
          ]),
          // Curved step onto the pass from the ball to the inside player.
          goodSpot: spot(55.01, 47.62, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "simple-press-triggers",
      name: "Simple press triggers",
      tier: "next",
      kind: "drag",
      pictures: Object.freeze([
        picture({
          id: "heavy-touch",
          ball: point(42, 43),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "nearest-defender",
              x: 48,
              y: 51,
            }),
            player({
              id: "carrier",
              team: "opponent",
              role: "ball-carrier",
              facing: "top",
              touch: "heavy",
              x: 42,
              y: 48,
            }),
          ]),
          // One player, one spot: a step onto the heavy touch.
          goodSpot: spot(42, 43, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "show-outside",
      name: "Show outside",
      tier: "next",
      kind: "drag",
      pictures: Object.freeze([
        picture({
          id: "inside-shoulder",
          ball: point(62, 82),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "first-defender",
              x: 48,
              y: 94,
            }),
            player({
              id: "carrier",
              team: "opponent",
              role: "ball-carrier",
              facing: "bottom",
              x: 62,
              y: 82,
            }),
          ]),
          // Inside shoulder, goal-side, so the easy path is the touchline.
          goodSpot: spot(56, 86, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "goalkeeper-depth",
      name: "Goalkeeper depth",
      tier: "next",
      kind: "drag",
      pictures: Object.freeze([
        picture({
          id: "on-the-line",
          ball: point(36, 24),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "goalkeeper",
              x: 34,
              y: 94,
            }),
            player({
              id: "defender",
              team: "opponent",
              role: "defender",
              x: 36,
              y: 24,
            }),
          ]),
          // Near the goal line, in the center of the goal. Not the penalty spot.
          goodSpot: spot(34, 103.5, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "goalkeeper-as-plus-one",
      name: "Goalkeeper as plus-one",
      tier: "next",
      kind: "drag",
      pictures: Object.freeze([
        picture({
          id: "short-option",
          ball: point(30, 91),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "goalkeeper",
              x: 34,
              y: 103.5,
            }),
            player({
              id: "defender",
              team: "teammate",
              role: "defender",
              x: 30,
              y: 91,
            }),
            player({
              id: "presser",
              team: "opponent",
              role: "presser",
              facing: "bottom",
              x: 30,
              y: 87,
            }),
            player({
              id: "line-opponent",
              team: "opponent",
              role: "presser",
              facing: "bottom",
              x: 48,
              y: 66,
            }),
          ]),
          // Just outside the six, to the side of the pressed defender.
          goodSpot: spot(44, 97.5, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "counter",
      name: "Counter",
      tier: "next",
      kind: "drag",
      pictures: Object.freeze([
        picture({
          id: "free-runner",
          ball: point(34, 62),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "runner",
              x: 30,
              y: 66,
            }),
            player({
              id: "stranded",
              team: "opponent",
              role: "upfield",
              x: 50,
              y: 84,
            }),
          ]),
          // Toward the top goal, ahead of the ball. One free runner.
          goodSpot: spot(36, 44, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "react-on-turnover",
      name: "React on turnover",
      tier: "next",
      kind: "drag",
      pictures: Object.freeze([
        picture({
          id: "first-step",
          ball: point(40, 66),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "nearest",
              x: 46,
              y: 70,
            }),
            player({
              id: "carrier",
              team: "opponent",
              role: "ball-carrier",
              x: 40,
              y: 66,
            }),
          ]),
          // First step to the new carrier. Not a sprint to halfway.
          goodSpot: spot(42.3, 67.6, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "overlap",
      name: "Overlap",
      tier: "next",
      kind: "pick",
      pictures: Object.freeze([
        picture({
          id: "around-the-carrier",
          ball: point(58, 36),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "support",
              x: 46,
              y: 44,
            }),
            player({
              id: "wide",
              team: "teammate",
              role: "ball-carrier",
              x: 58,
              y: 36,
            }),
            player({
              id: "defender",
              team: "opponent",
              role: "defender",
              x: 56,
              y: 32,
            }),
          ]),
          marks: Object.freeze([
            spotMark("outside", 65, 26),
            spotMark("inside", 46, 28),
            spotMark("behind", 50, 50),
          ]),
          correctMarkId: "outside",
        }),
      ]),
    }),
    scene({
      id: "diagonal-ball",
      name: "Diagonal ball",
      tier: "next",
      kind: "pick",
      pictures: Object.freeze([
        picture({
          id: "into-the-run",
          ball: point(26, 52),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "passer",
              x: 26,
              y: 52,
            }),
            player({
              id: "runner",
              team: "teammate",
              role: "runner",
              x: 46,
              y: 40,
              runTo: point(46, 24),
            }),
            player({
              id: "defender",
              team: "opponent",
              role: "defender",
              x: 40,
              y: 36,
            }),
            player({
              id: "marked",
              team: "teammate",
              role: "marked",
              marked: true,
              x: 50,
              y: 52,
            }),
          ]),
          marks: Object.freeze([
            spotMark("into-the-run", 46, 24),
            spotMark("square", 50, 52),
            spotMark("defender-feet", 40, 36),
          ]),
          correctMarkId: "into-the-run",
        }),
      ]),
    }),
    scene({
      id: "set-and-go",
      name: "Set and go",
      tier: "next",
      kind: "pick",
      pictures: Object.freeze([
        picture({
          id: "setter",
          ball: point(38, 44),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "setter",
              x: 38,
              y: 44,
            }),
            player({
              id: "runner",
              team: "teammate",
              role: "runner",
              x: 30,
              y: 40,
              runTo: point(50, 32),
            }),
            player({
              id: "defender",
              team: "opponent",
              role: "defender",
              x: 41,
              y: 47,
            }),
          ]),
          marks: Object.freeze([
            spotMark("one-touch", 42, 35.2),
            spotMark("defender", 41, 47),
          ]),
          correctMarkId: "one-touch",
        }),
        picture({
          id: "runner",
          ball: point(42, 35.2),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "runner",
              x: 30,
              y: 40,
              runTo: point(50, 32),
            }),
            player({
              id: "setter",
              team: "teammate",
              role: "setter",
              x: 38,
              y: 44,
            }),
            player({
              id: "defender",
              team: "opponent",
              role: "defender",
              x: 41,
              y: 47,
            }),
          ]),
          marks: Object.freeze([
            spotMark("arrive", 42, 35.2),
            spotMark("start", 30, 40),
          ]),
          correctMarkId: "arrive",
        }),
      ]),
    }),
    scene({
      id: "throw-switch",
      name: "Throw switch",
      tier: "next",
      kind: "pick",
      pictures: Object.freeze([
        picture({
          id: "near-open",
          ball: point(68, 50),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "thrower",
              x: 68,
              y: 50,
            }),
            player({
              id: "near",
              team: "teammate",
              role: "near",
              x: 58,
              y: 48,
            }),
            player({
              id: "far",
              team: "teammate",
              role: "far",
              x: 8,
              y: 44,
            }),
            player({
              id: "defender",
              team: "opponent",
              role: "defender",
              x: 48,
              y: 38,
            }),
          ]),
          marks: Object.freeze([
            spotMark("short", 58, 48),
            spotMark("long", 8, 44),
          ]),
          correctMarkId: "short",
        }),
        picture({
          id: "near-marked",
          ball: point(68, 50),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "thrower",
              x: 68,
              y: 50,
            }),
            player({
              id: "near",
              team: "teammate",
              role: "near",
              x: 58,
              y: 48,
            }),
            player({
              id: "far",
              team: "teammate",
              role: "far",
              x: 8,
              y: 44,
            }),
            player({
              id: "marker-a",
              team: "opponent",
              role: "marker",
              x: 56,
              y: 46,
            }),
            player({
              id: "marker-b",
              team: "opponent",
              role: "marker",
              x: 61,
              y: 52,
            }),
          ]),
          marks: Object.freeze([
            spotMark("short", 58, 48),
            spotMark("long", 8, 44),
          ]),
          correctMarkId: "long",
        }),
      ]),
    }),
    scene({
      id: "corner-near-and-far",
      name: "Corner near and far",
      tier: "next",
      kind: "pick",
      pictures: Object.freeze([
        picture({
          id: "first-ball",
          corner: "right",
          ball: point(32, 4),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "runner",
              x: 52,
              y: 20,
            }),
            player({
              id: "near-post-defender",
              team: "opponent",
              role: "near-post",
              x: 37.66,
              y: 3,
            }),
          ]),
          marks: Object.freeze([
            spotMark("far-post", 28.5, 3),
            spotMark("near-post", 37.66, 2),
            spotMark("penalty-spot", 34, 11),
            spotMark("box-edge", 40, 16.5),
          ]),
          correctMarkId: "far-post",
        }),
      ]),
    }),
    scene({
      id: "short-corner",
      name: "Short corner",
      tier: "next",
      kind: "pick",
      pictures: Object.freeze([
        picture({
          id: "outside-the-arc",
          corner: "right",
          ball: point(67, 0.5),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "taker",
              x: 67,
              y: 0.5,
            }),
            player({
              id: "free",
              team: "teammate",
              role: "free",
              x: 65,
              y: 2.2,
            }),
            player({
              id: "crowd-a",
              team: "opponent",
              role: "crowd",
              x: 37.5,
              y: 3,
            }),
            player({
              id: "crowd-b",
              team: "opponent",
              role: "crowd",
              x: 36,
              y: 6,
            }),
            player({
              id: "crowd-c",
              team: "opponent",
              role: "crowd",
              x: 40,
              y: 5,
            }),
          ]),
          marks: Object.freeze([
            spotMark("free-teammate", 65, 2.2),
            spotMark("near-post-crowd", 37.5, 3),
          ]),
          correctMarkId: "free-teammate",
        }),
      ]),
    }),
  ]);

  function sceneById(id) {
    return scenes.find((entry) => entry.id === id) || null;
  }

  return Object.freeze({
    pitch: pitch,
    scenes: scenes,
    sceneById: sceneById,
  });
});

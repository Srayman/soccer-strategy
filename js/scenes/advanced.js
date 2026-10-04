// Advanced scenes from docs/SCENES.md. Starter and next scenes stay elsewhere.
// Meters. x is 0 on the left touchline and 68 on the right.
// y is 0 on the top goal line and 105 on the bottom goal line.
// The learner attacks the top goal and defends the bottom goal.
// The build-out line is 34.5 m from each goal line, so the line the
// learner defends sits at y = 70.5. Good spots are fixed.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SoccerAdvancedScenes = api;
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
      id: "offside-line-step-or-drop",
      name: "Offside line step or drop",
      tier: "advanced",
      kind: "drag",
      format: "7v7",
      line: "build-out",
      pictures: Object.freeze([
        picture({
          id: "ball-safe",
          ball: point(34, 46),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "defender",
              x: 42,
              y: 75,
            }),
            player({
              id: "line-teammate",
              team: "teammate",
              role: "defender",
              x: 26,
              y: 70.5,
            }),
            player({
              id: "opponent",
              team: "opponent",
              role: "ball-carrier",
              facing: "top",
              x: 34,
              y: 46,
            }),
          ]),
          // Step up onto the build-out line with the teammate.
          goodSpot: spot(42, 70.5, dragRadius),
        }),
        picture({
          id: "played-in-behind",
          ball: point(40, 76),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "defender",
              x: 42,
              y: 70.5,
            }),
            player({
              id: "line-teammate",
              team: "teammate",
              role: "defender",
              x: 26,
              y: 70.5,
            }),
            player({
              id: "runner",
              team: "opponent",
              role: "runner",
              facing: "bottom",
              x: 40,
              y: 78,
            }),
          ]),
          // Drop goal-side of the runner, toward the team's penalty area.
          goodSpot: spot(40, 84, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "zones",
      name: "Zones",
      tier: "advanced",
      kind: "drag",
      pictures: Object.freeze([
        picture({
          id: "someone-else-takes-the-runner",
          ball: point(58, 68),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "central-defender",
              x: 40,
              y: 78,
            }),
            player({
              id: "covering-defender",
              team: "teammate",
              role: "covering-defender",
              x: 52,
              y: 74,
            }),
            player({
              id: "wide-runner",
              team: "opponent",
              role: "wide-runner",
              x: 58,
              y: 68,
            }),
          ]),
          // Stay central and goal-side. The other defender can take the runner.
          goodSpot: spot(34, 86, dragRadius),
        }),
        picture({
          id: "learner-goes-with-the-runner",
          ball: point(60, 66),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "central-defender",
              x: 46,
              y: 74,
            }),
            player({
              id: "sliding-defender-a",
              team: "teammate",
              role: "sliding-defender",
              x: 30,
              y: 82,
            }),
            player({
              id: "sliding-defender-b",
              team: "teammate",
              role: "sliding-defender",
              x: 24,
              y: 74,
            }),
            player({
              id: "wide-runner",
              team: "opponent",
              role: "wide-runner",
              x: 60,
              y: 66,
            }),
          ]),
          // Go with the runner. The learner is closest. The others can slide in.
          goodSpot: spot(58, 72, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "rest-defense",
      name: "Rest defense",
      tier: "advanced",
      kind: "drag",
      pictures: Object.freeze([
        picture({
          id: "stay",
          ball: point(40, 24),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "rest-defender",
              x: 36,
              y: 44,
            }),
            player({
              id: "attacker-a",
              team: "teammate",
              role: "attacker",
              x: 40,
              y: 24,
            }),
            player({
              id: "attacker-b",
              team: "teammate",
              role: "attacker",
              x: 28,
              y: 30,
            }),
          ]),
          // Central, goal-side of the ball, near the halfway line.
          goodSpot: spot(34, 54, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "counter-press",
      name: "Counter-press",
      tier: "advanced",
      kind: "drag",
      pictures: Object.freeze([
        picture({
          id: "cut-the-forward-pass",
          ball: point(40, 22),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "nearest",
              x: 48,
              y: 26,
            }),
            player({
              id: "cover",
              team: "teammate",
              role: "cover",
              x: 30,
              y: 34,
            }),
            player({
              id: "opponent",
              team: "opponent",
              role: "receiver",
              facing: "top",
              x: 40,
              y: 22,
            }),
          ]),
          // One spot, in the opponent's half, on the forward pass.
          goodSpot: spot(40, 28, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "between-the-lines",
      name: "Between the lines",
      tier: "advanced",
      kind: "drag",
      pictures: Object.freeze([
        picture({
          id: "pocket",
          ball: point(34, 64),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "attacker",
              x: 40,
              y: 58,
            }),
            player({
              id: "passer",
              team: "teammate",
              role: "passer",
              x: 34,
              y: 64,
            }),
            player({
              id: "midfield-a",
              team: "opponent",
              role: "midfield-line",
              x: 22,
              y: 50,
            }),
            player({
              id: "midfield-b",
              team: "opponent",
              role: "midfield-line",
              x: 46,
              y: 50,
            }),
            player({
              id: "last-a",
              team: "opponent",
              role: "last-line",
              x: 20,
              y: 28,
            }),
            player({
              id: "last-b",
              team: "opponent",
              role: "last-line",
              x: 48,
              y: 28,
            }),
          ]),
          // The pocket between the two lines, on the passer's sight line.
          goodSpot: spot(34, 39, dragRadius),
        }),
      ]),
    }),
    scene({
      id: "third-man",
      name: "Third man",
      tier: "advanced",
      kind: "pick",
      pictures: Object.freeze([
        picture({
          id: "third-pass",
          ball: point(24, 52),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "setter",
              x: 24,
              y: 52,
            }),
            player({
              id: "defender",
              team: "opponent",
              role: "defender",
              x: 28,
              y: 46,
              from: point(48, 38),
            }),
            player({
              id: "third-player",
              team: "teammate",
              role: "third-player",
              x: 50,
              y: 36,
            }),
            player({
              id: "original-passer",
              team: "teammate",
              role: "original-passer",
              marked: true,
              x: 18,
              y: 66,
            }),
            player({
              id: "shadow",
              team: "teammate",
              role: "shadow",
              x: 36,
              y: 34,
            }),
          ]),
          marks: Object.freeze([
            spotMark("third-player", 50, 36),
            spotMark("original-passer", 18, 66),
            spotMark("shadow", 36, 34),
          ]),
          correctMarkId: "third-player",
        }),
      ]),
    }),
    scene({
      id: "far-post-run",
      name: "Far-post run",
      tier: "advanced",
      kind: "pick",
      pictures: Object.freeze([
        picture({
          id: "cross-from-the-right",
          ball: point(63, 14),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "runner",
              x: 34,
              y: 20,
            }),
            player({
              id: "crosser",
              team: "teammate",
              role: "crosser",
              x: 63,
              y: 14,
            }),
            player({
              id: "near-post-teammate",
              team: "teammate",
              role: "near-post",
              x: 37.66,
              y: 4,
            }),
          ]),
          marks: Object.freeze([
            spotMark("far-post", 30.34, 4),
            spotMark("near-post", 37.66, 4),
            spotMark("beside-crosser", 57, 18),
          ]),
          correctMarkId: "far-post",
        }),
      ]),
    }),
    scene({
      id: "swap-places",
      name: "Swap places",
      tier: "advanced",
      kind: "pick",
      pictures: Object.freeze([
        picture({
          id: "pinch-inside",
          ball: point(63, 28),
          players: Object.freeze([
            player({
              id: "learner",
              team: "learner",
              role: "wide-player",
              x: 57,
              y: 36,
            }),
            player({
              id: "overlap",
              team: "teammate",
              role: "overlap",
              x: 63,
              y: 28,
            }),
          ]),
          marks: Object.freeze([
            spotMark("inside", 45, 44),
            spotMark("same-lane", 57, 22),
            spotMark("in-front", 63, 16),
          ]),
          correctMarkId: "inside",
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

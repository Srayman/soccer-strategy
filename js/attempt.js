// A drag attempt uses one fixed set of good spots.
// It does not calculate a live better or worse spot.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SoccerAttempt = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const CONFIRMATION = "You found a spot.";

  // Pitch coordinates from the page viewBox. Every drag drill uses this
  // set. Nothing here scores a live better or worse spot.
  const goodSpots = Object.freeze([
    Object.freeze({ x: 760, y: 180, r: 36 }),
    Object.freeze({ x: 760, y: 500, r: 36 }),
    Object.freeze({ x: 920, y: 340, r: 36 }),
  ]);

  const start = Object.freeze({ x: 150, y: 340 });

  function copySpot(spot) {
    return Object.freeze({ x: spot.x, y: spot.y, r: spot.r });
  }

  function snapshot(fields) {
    return Object.freeze({
      drillId: fields.drillId,
      state: fields.state,
      ended: fields.ended,
      confirmation: fields.confirmation,
      answerShown: fields.answerShown,
      token: Object.freeze({ x: fields.token.x, y: fields.token.y }),
      goodSpots: Object.freeze(fields.goodSpots.map(copySpot)),
      correctionSpots: Object.freeze(fields.correctionSpots.map(copySpot)),
    });
  }

  function canDrop(attempt) {
    return Boolean(attempt) && attempt.state === "playing" && attempt.ended === false;
  }

  function hits(spots, point) {
    return spots.some((spot) => {
      const dx = point.x - spot.x;
      const dy = point.y - spot.y;
      return dx * dx + dy * dy <= spot.r * spot.r;
    });
  }

  function createAttempt(drill) {
    if (!drill || drill.kind !== "drag") {
      throw new Error("A drag attempt needs a drag drill.");
    }
    return snapshot({
      drillId: drill.id,
      state: "playing",
      ended: false,
      confirmation: "",
      answerShown: false,
      token: start,
      goodSpots,
      correctionSpots: [],
    });
  }

  function presentation(attempt) {
    if (isPick(attempt)) return presentPick(attempt);
    if (!attempt) {
      return {
        hint: [],
        correctionSpots: [],
        confirmation: "",
        draggable: false,
        verdict: null,
      };
    }
    return {
      hint: [],
      correctionSpots: attempt.state === "miss" ? attempt.correctionSpots : [],
      confirmation: attempt.state === "correct" ? attempt.confirmation : "",
      draggable: canDrop(attempt),
      verdict: null,
    };
  }

  function revealAnswer(attempt) {
    if (isPick(attempt)) return revealPickAnswer(attempt);
    if (!canDrop(attempt)) return attempt;
    return snapshot({
      ...attempt,
      answerShown: true,
      correctionSpots: attempt.goodSpots,
    });
  }

  function endAttempt(attempt) {
    if (isPick(attempt)) return endPickAttempt(attempt);
    if (!canDrop(attempt)) return attempt;
    const confirmed = attempt.confirmation === CONFIRMATION;
    if (!confirmed && attempt.answerShown !== true) {
      throw new Error("Show the answer before the attempt is over.");
    }
    if (confirmed) {
      return snapshot({
        ...attempt,
        state: "correct",
        ended: true,
        confirmation: CONFIRMATION,
        answerShown: false,
        correctionSpots: [],
      });
    }
    return snapshot({
      ...attempt,
      state: "miss",
      ended: true,
    });
  }

  function drop(attempt, point) {
    if (isPick(attempt)) return attempt;
    if (!canDrop(attempt)) return attempt;
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      return attempt;
    }
    const placed = snapshot({
      ...attempt,
      token: point,
    });
    if (hits(placed.goodSpots, point)) {
      return endAttempt(
        snapshot({
          ...placed,
          confirmation: CONFIRMATION,
          correctionSpots: [],
          answerShown: false,
        })
      );
    }
    return endAttempt(revealAnswer(placed));
  }

  // A pick attempt asks the learner to choose one marked target.
  // Every pick drill uses this set. The correct target stays hidden until a miss.
  const markedTargets = Object.freeze([
    Object.freeze({ id: "a", x: 360, y: 180, r: 36 }),
    Object.freeze({ id: "b", x: 560, y: 340, r: 36 }),
    Object.freeze({ id: "c", x: 360, y: 500, r: 36 }),
  ]);

  const correctTarget = markedTargets[1];

  function copyTarget(target) {
    return Object.freeze({ id: target.id, x: target.x, y: target.y, r: target.r });
  }

  function isPick(attempt) {
    return Boolean(attempt) && attempt.kind === "pick";
  }

  function pickSnapshot(fields) {
    return Object.freeze({
      kind: "pick",
      drillId: fields.drillId,
      state: fields.state,
      ended: fields.ended,
      confirmation: fields.confirmation,
      answerShown: fields.answerShown,
      targets: Object.freeze(fields.targets.map(copyTarget)),
      correctionSpots: Object.freeze(fields.correctionSpots.map(copySpot)),
    });
  }

  function presentPick(attempt) {
    return {
      hint: [],
      targets: attempt.targets,
      correctionSpots: attempt.state === "miss" ? attempt.correctionSpots : [],
      confirmation: attempt.state === "correct" ? attempt.confirmation : "",
      pickable: canDrop(attempt),
      draggable: false,
      verdict: null,
    };
  }

  function createPickAttempt(drill) {
    if (!drill || drill.kind !== "pick") {
      throw new Error("A pick attempt needs a pick drill.");
    }
    return pickSnapshot({
      drillId: drill.id,
      state: "playing",
      ended: false,
      confirmation: "",
      answerShown: false,
      targets: markedTargets,
      correctionSpots: [],
    });
  }

  function revealPickAnswer(attempt) {
    if (!canDrop(attempt)) return attempt;
    return pickSnapshot({
      ...attempt,
      answerShown: true,
      correctionSpots: [correctTarget],
    });
  }

  function endPickAttempt(attempt) {
    if (!canDrop(attempt)) return attempt;
    const confirmed = attempt.confirmation === CONFIRMATION;
    if (!confirmed && attempt.answerShown !== true) {
      throw new Error("Show the answer before the attempt is over.");
    }
    if (confirmed) {
      return pickSnapshot({
        ...attempt,
        state: "correct",
        ended: true,
        confirmation: CONFIRMATION,
        answerShown: false,
        correctionSpots: [],
      });
    }
    return pickSnapshot({
      ...attempt,
      state: "miss",
      ended: true,
    });
  }

  function pick(attempt, targetId) {
    if (!isPick(attempt) || !canDrop(attempt)) return attempt;
    const chosen = attempt.targets.find((target) => target.id === targetId);
    if (!chosen) return attempt;
    if (chosen.id === correctTarget.id) {
      return endAttempt(
        pickSnapshot({
          ...attempt,
          confirmation: CONFIRMATION,
          correctionSpots: [],
          answerShown: false,
        })
      );
    }
    return endAttempt(revealAnswer(attempt));
  }

  return Object.freeze({
    goodSpots,
    start,
    createAttempt,
    presentation,
    revealAnswer,
    endAttempt,
    drop,
    markedTargets,
    correctTarget,
    createPickAttempt,
    pick,
  });
});

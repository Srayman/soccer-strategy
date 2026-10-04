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
    if (!canDrop(attempt)) return attempt;
    return snapshot({
      ...attempt,
      answerShown: true,
      correctionSpots: attempt.goodSpots,
    });
  }

  function endAttempt(attempt) {
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

  return Object.freeze({
    goodSpots,
    start,
    createAttempt,
    presentation,
    revealAnswer,
    endAttempt,
    drop,
  });
});

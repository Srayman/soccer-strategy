// The next-play button stays off until feedback is on screen.
// One fixed animation plays for that moment. It does not unlock a tier.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SoccerNextPlay = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const fixedAnimation = Object.freeze({
    id: "next-moment",
    durationMs: 900,
    repeatCount: 1,
    frames: Object.freeze([
      Object.freeze({ x: 700, y: 340 }),
      Object.freeze({ x: 860, y: 250 }),
    ]),
  });

  function answerOnScreen(attempt) {
    return (
      attempt.answerShown === true &&
      Array.isArray(attempt.correctionSpots) &&
      attempt.correctionSpots.length > 0
    );
  }

  function buttonEnabled(attempt) {
    if (!attempt || attempt.ended !== true) return false;
    if (attempt.state === "correct") {
      return typeof attempt.confirmation === "string" && attempt.confirmation.length > 0;
    }
    if (attempt.state === "miss") return answerOnScreen(attempt);
    return false;
  }

  function animationFor(attempt) {
    if (!buttonEnabled(attempt)) return null;
    return fixedAnimation;
  }

  function nextInTier(drills, drillId) {
    if (!Array.isArray(drills) || !drillId) return null;
    const index = drills.findIndex((drill) => drill && drill.id === drillId);
    if (index < 0) return null;
    const current = drills[index];
    const upcoming = drills[index + 1];
    if (!upcoming || upcoming.tier !== current.tier) return null;
    return upcoming;
  }

  return Object.freeze({
    fixedAnimation,
    buttonEnabled,
    animationFor,
    nextInTier,
  });
});

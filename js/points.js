// Points are a fun count added when an attempt ends.
// A new page load starts again at zero.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SoccerPoints = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function createSession() {
    return Object.freeze({
      points: 0,
      endedDrills: Object.freeze([]),
    });
  }

  function settle(session, attempt) {
    if (!attempt || attempt.ended !== true) return session;
    if (attempt.state !== "miss" && attempt.state !== "correct") return session;

    const first = session.endedDrills.indexOf(attempt.drillId) === -1;
    const added = first && attempt.state === "correct" ? 3 : 1;
    return Object.freeze({
      points: session.points + added,
      endedDrills: first
        ? Object.freeze(session.endedDrills.concat(attempt.drillId))
        : session.endedDrills,
    });
  }

  return Object.freeze({
    createSession,
    settle,
  });
});

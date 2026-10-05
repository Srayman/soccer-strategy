// Points are a fun count added when an attempt ends.
// A new page load starts again at zero.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SoccerPoints = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  const catalog =
    root.SoccerStrategy && root.SoccerStrategy.goalkeeperDrillId
      ? root.SoccerStrategy
      : require("./catalog.js");
  const goalkeeperId = catalog.goalkeeperDrillId;

  function createSession() {
    return Object.freeze({
      points: 0,
      endedDrills: Object.freeze([]),
      scoredDrills: Object.freeze([]),
    });
  }

  // Level 1 and an unleveled try share the drill id.
  // Level 2 has its own first try, so it does not spend the Level 1 bonus.
  function firstTryKey(attempt) {
    if (attempt.level === 2) return attempt.drillId + "#2";
    return attempt.drillId;
  }

  function settle(session, attempt) {
    if (!attempt || attempt.ended !== true) return session;
    if (attempt.state !== "miss" && attempt.state !== "correct") return session;

    const scored = Array.isArray(session.scoredDrills) ? session.scoredDrills : [];
    const key = firstTryKey(attempt);
    const first = scored.indexOf(key) === -1;
    const added = first && attempt.state === "correct" ? 3 : 1;
    const ended = session.endedDrills;
    const keeper = attempt.drillId === goalkeeperId;
    const already = ended.indexOf(attempt.drillId) !== -1;
    return Object.freeze({
      points: session.points + added,
      endedDrills:
        keeper || already ? ended : Object.freeze(ended.concat(attempt.drillId)),
      scoredDrills: first ? Object.freeze(scored.concat(key)) : scored,
    });
  }

  return Object.freeze({
    createSession,
    settle,
  });
});

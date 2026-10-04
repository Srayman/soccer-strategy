// List copy for how many starters are done, and what a locked tier still needs.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SoccerProgressCopy = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function starterHeading(title, done, total) {
    return title + " (" + done + " of " + total + " done)";
  }

  function lockedLeft(left, gate) {
    if (left === 0) return "These are open.";
    const name = gate === "starter" ? "starter" : "next";
    const noun = left === 1 ? "drill" : "drills";
    return left + " " + name + " " + noun + " left before this opens.";
  }

  return Object.freeze({
    starterHeading: starterHeading,
    lockedLeft: lockedLeft,
  });
});

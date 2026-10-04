// Goalkeeper step-out is one starter drill. It is cleared only after
// one attempt has ended on each picture. One ended attempt does not
// clear it. A picture switch before the drag is not an ended attempt.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SoccerClear = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const drillId = "goalkeeper-step-out-and-line-up";
  const pictures = Object.freeze(["central", "near-post", "through-ball"]);

  function createClearance() {
    return Object.freeze({
      drillId: drillId,
      pictures: Object.freeze([]),
    });
  }

  function noteEnded(clearance, attempt) {
    const book = clearance || createClearance();
    if (!attempt || attempt.ended !== true) return book;
    if (attempt.state !== "miss" && attempt.state !== "correct") return book;
    if (attempt.drillId !== drillId) return book;
    if (pictures.indexOf(attempt.pictureId) === -1) return book;
    if (book.pictures.indexOf(attempt.pictureId) !== -1) return book;
    return Object.freeze({
      drillId: drillId,
      pictures: Object.freeze(book.pictures.concat(attempt.pictureId)),
    });
  }

  function isCleared(clearance, id) {
    if (id !== drillId) return false;
    const done = clearance && clearance.pictures ? clearance.pictures : [];
    return pictures.every(function (pictureId) {
      return done.indexOf(pictureId) !== -1;
    });
  }

  return Object.freeze({
    createClearance: createClearance,
    noteEnded: noteEnded,
    isCleared: isCleared,
  });
});

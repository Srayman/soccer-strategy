// A correct ending shows a short visual celebration.
// A miss does not. This does not judge a spot.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SoccerCelebrate = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function starPoints(outer, inner) {
    const spikes = 5;
    const parts = [];
    for (let i = 0; i < spikes * 2; i += 1) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = (Math.PI / spikes) * i - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      parts.push(x.toFixed(2) + "," + y.toFixed(2));
    }
    return parts.join(" ");
  }

  const shapes = Object.freeze({
    big: starPoints(70, 28),
    small: starPoints(46, 18),
  });

  const burst = Object.freeze({
    disc: Object.freeze({ x: 340, y: 525, r: 240 }),
    ring: Object.freeze({ x: 340, y: 525, r: 160 }),
    shapes: shapes,
    stars: Object.freeze([
      Object.freeze({ x: 100, y: 160, fill: "#ffe56a", shape: "big", delayMs: 0 }),
      Object.freeze({ x: 580, y: 150, fill: "#ff9f1c", shape: "big", delayMs: 80 }),
      Object.freeze({ x: 90, y: 525, fill: "#ffffff", shape: "small", delayMs: 160 }),
      Object.freeze({ x: 590, y: 520, fill: "#7cffb2", shape: "big", delayMs: 80 }),
      Object.freeze({ x: 120, y: 900, fill: "#ff5d8f", shape: "big", delayMs: 160 }),
      Object.freeze({ x: 560, y: 910, fill: "#ffe56a", shape: "small", delayMs: 240 }),
      Object.freeze({ x: 340, y: 230, fill: "#8ecbff", shape: "big", delayMs: 40 }),
      Object.freeze({ x: 340, y: 820, fill: "#ff9f1c", shape: "big", delayMs: 200 }),
    ]),
  });

  function celebrationFor(attempt) {
    if (!attempt || attempt.ended !== true || attempt.state !== "correct") return null;
    return burst;
  }

  return Object.freeze({
    celebrationFor: celebrationFor,
  });
});

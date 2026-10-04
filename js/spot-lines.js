// One short sentence for the good spot in each picture.
// It names the spot in the scene. It is not a compass direction.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SoccerSpotLines = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const lines = Object.freeze({
    "open-body":
      "The good spot is a step beside the defender, where you can see the ball and the goal.",
    "get-open": "The good spot is the open pocket a few meters away from that defender.",
    "stay-wide": "The good spot stays on the touchline, level with the ball.",
    "spread-out": "The good spot is the empty flank, away from the bunch.",
    "get-wide": "The good spot is the open touchline on the weak side.",
    "help-the-ball":
      "The good spot is a short step beside the ball, where the passer can see you.",
    "pass-and-move": "The good spot is a new angle ahead of the pass you just played.",
    "goal-side": "The good spot is between that opponent and your goal.",
    "ball-side":
      "The good spot is on the ball side of that opponent, with your goal behind you.",
    "mark-distance":
      "The good spot is a step or two off your player, where you can see the ball.",
    delay: "The good spot is a few meters goal-side of the dribbler, with your body sideways.",
    "pressure-and-cover":
      "The good spot is a few meters behind your teammate, on the path to your goal.",
    "squeeze-the-middle":
      "The good spot is a shift toward the middle, not all the way to the ball.",
    "recovery-run":
      "The good spot is a curved run back that ends between the ball and your goal.",
    "goalkeeper-step-out-and-line-up/central":
      "The good spot is a step off the goal line, in the center of the goal.",
    "goalkeeper-step-out-and-line-up/near-post":
      "The good spot is a step off the goal line, close to the near post.",
    "goalkeeper-step-out-and-line-up/through-ball":
      "The good spot is on the ball's path at the edge of the six-yard box.",
    "check-away": "The good spot is a move away into space, then a show back for the ball.",
    triangle: "The good spot is the open corner that makes a triangle.",
    "wall-pass": "The good spot is the space behind the defender.",
    "switch-the-weak-side": "The good spot is the open teammate on the weak-side touchline.",
    "build-out": "The good spot is the short pass to the open wide teammate.",
    "diagonal-run": "The good spot is a diagonal run into the gap behind the defender.",
    "numbers-up": "The good spot is the open side of the defender, close enough to make a pair.",
    track: "The good spot is with the runner, on the path back toward your goal.",
    "slide-over": "The good spot is a step toward the middle, still behind the presser.",
    "cover-shadow": "The good spot puts your body between the ball and the player behind you.",
    "simple-press-triggers": "The good spot is a step to the ball after the heavy touch.",
    "show-outside": "The good spot is on the inside shoulder, so the easy path is the touchline.",
    "goalkeeper-depth": "The good spot is near the goal line, in the center of the goal.",
    "goalkeeper-as-plus-one":
      "The good spot is just outside the six-yard box, as a short passing option.",
    counter: "The good spot is ahead of the ball, toward the other goal.",
    "react-on-turnover": "The good spot is your first step to the new ball carrier.",
    overlap: "The good spot is the outside path around the ball carrier.",
    "diagonal-ball": "The good spot is the diagonal ball into the runner's path.",
    "set-and-go/setter": "The good spot is one touch into the runner's path.",
    "set-and-go/runner": "The good spot is arriving on the ball in the runner's path.",
    "throw-switch/near-open": "The good spot is the short throw to the open teammate.",
    "throw-switch/near-marked":
      "The good spot is the long throw to the open teammate on the far side.",
    "corner-near-and-far": "The good spot is the far-post space inside the six-yard box.",
    "short-corner": "The good spot is the free teammate just outside the corner arc.",
    "offside-line-step-or-drop/ball-safe":
      "The good spot is a step onto the build-out line with your teammate.",
    "offside-line-step-or-drop/played-in-behind":
      "The good spot is a drop goal-side of the runner, toward your penalty area.",
    "zones/someone-else-takes-the-runner":
      "The good spot stays in the middle while another defender takes the runner.",
    "zones/learner-goes-with-the-runner":
      "The good spot goes with the runner while other defenders cover the middle.",
    "rest-defense":
      "The good spot stays in the middle near the halfway line, goal-side of the ball.",
    "counter-press": "The good spot cuts off the forward pass.",
    "between-the-lines": "The good spot is the pocket between the two lines of defenders.",
    "third-man": "The good spot is the third player in the space the defender opened.",
    "far-post-run": "The good spot is the far post as the cross comes in.",
    "swap-places": "The good spot is the inside space your teammate opened.",
  });

  function lineFor(drillId, pictureId) {
    if (pictureId && lines[drillId + "/" + pictureId]) return lines[drillId + "/" + pictureId];
    return lines[drillId] || "";
  }

  return Object.freeze({
    lineFor: lineFor,
  });
});

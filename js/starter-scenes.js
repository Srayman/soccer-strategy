// Starter scenes from docs/SCENES.md.
// Pitch is 105 m by 68 m. 10 px is 1 m.
// The learner's team attacks the top goal and defends the bottom goal.
// Next and advanced scenes stay in their own files.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.StarterScenes = api;
    api.install();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const pitch = Object.freeze({
    lengthM: 105,
    widthM: 68,
    scale: 10,
    width: 680,
    length: 1050,
    attack: "top",
    defend: "bottom",
    centerX: 340,
    halfwayY: 525,
    attackGoalY: 0,
    ownGoalY: 1050,
    ownBuildOutY: 705,
    sixEdgeY: 995,
    boxEdgeY: 885,
    penaltySpotY: 940,
    leftPostX: 303.4,
    rightPostX: 376.6,
    goalCenterX: 340,
    sixLeftX: 248.4,
    sixRightX: 431.6,
    boxLeftX: 138.4,
    boxRightX: 541.6,
  });

  function at(x, y, name) {
    const point = { x: x, y: y };
    if (name) point.name = name;
    return Object.freeze(point);
  }

  function spot(x, y, r) {
    return Object.freeze({ x: x, y: y, r: r });
  }

  function mark(id, name, x, y, r) {
    return Object.freeze({ id: id, name: name, x: x, y: y, r: r });
  }

  // The correct pick mark uses id "b". That is the fixed correct id.
  const scenes = Object.freeze([
    Object.freeze({
      id: "open-body",
      name: "Open body",
      kind: "drag",
      caption: "A teammate has the ball. A defender is on your back.",
      ball: at(320, 800),
      teammates: Object.freeze([at(320, 800)]),
      opponents: Object.freeze([at(360, 670)]),
      learner: at(360, 700),
      goodSpots: Object.freeze([spot(420, 676, 22)]),
    }),
    Object.freeze({
      id: "get-open",
      name: "Get open",
      kind: "drag",
      caption: "The ball is in the middle. A defender is tight on you.",
      ball: at(340, 660),
      teammates: Object.freeze([at(340, 660)]),
      opponents: Object.freeze([at(508, 535)]),
      learner: at(500, 540),
      goodSpots: Object.freeze([spot(460, 490, 26)]),
    }),
    Object.freeze({
      id: "stay-wide",
      name: "Stay wide",
      kind: "drag",
      caption: "You are the wide player. The ball is in the middle.",
      ball: at(340, 600),
      teammates: Object.freeze([at(400, 640)]),
      opponents: Object.freeze([at(320, 720)]),
      learner: at(50, 820),
      goodSpots: Object.freeze([spot(50, 560, 36)]),
    }),
    Object.freeze({
      id: "spread-out",
      name: "Spread out",
      kind: "drag",
      caption: "Three of you are bunched on the ball.",
      ball: at(360, 560),
      teammates: Object.freeze([at(360, 560), at(400, 540)]),
      opponents: Object.freeze([at(420, 500)]),
      learner: at(380, 590),
      goodSpots: Object.freeze([spot(60, 400, 40)]),
    }),
    Object.freeze({
      id: "get-wide",
      name: "Get wide",
      kind: "drag",
      caption: "The ball is stuck in the middle.",
      ball: at(340, 720),
      teammates: Object.freeze([at(340, 720)]),
      opponents: Object.freeze([at(340, 560)]),
      learner: at(340, 640),
      goodSpots: Object.freeze([spot(50, 500, 40)]),
    }),
    Object.freeze({
      id: "help-the-ball",
      name: "Help the ball",
      kind: "drag",
      caption: "Your teammate has the ball and is under pressure.",
      ball: at(420, 700),
      teammates: Object.freeze([at(420, 700)]),
      opponents: Object.freeze([at(420, 660)]),
      learner: at(220, 480),
      goodSpots: Object.freeze([spot(520, 730, 24)]),
    }),
    Object.freeze({
      id: "pass-and-move",
      name: "Pass and move",
      kind: "drag",
      caption: "You just passed. The ball is with your teammate.",
      ball: at(440, 660),
      teammates: Object.freeze([at(440, 660)]),
      opponents: Object.freeze([at(320, 760)]),
      learner: at(280, 800),
      goodSpots: Object.freeze([spot(540, 540, 36)]),
    }),
    Object.freeze({
      id: "goal-side",
      name: "Goal-side",
      kind: "drag",
      caption: "Their player has the ball, between you and your goal.",
      ball: at(380, 740),
      teammates: Object.freeze([]),
      opponents: Object.freeze([at(380, 740)]),
      learner: at(380, 600),
      goodSpots: Object.freeze([spot(380, 840, 32)]),
    }),
    Object.freeze({
      id: "ball-side",
      name: "Ball-side",
      kind: "drag",
      caption: "You are marking a player. The ball is on the right.",
      ball: at(600, 480),
      teammates: Object.freeze([]),
      opponents: Object.freeze([at(280, 640)]),
      learner: at(220, 640),
      goodSpots: Object.freeze([spot(340, 710, 32)]),
    }),
    Object.freeze({
      id: "mark-distance",
      name: "Mark distance",
      kind: "drag",
      caption: "You are marking a player. The ball is close.",
      ball: at(460, 690),
      teammates: Object.freeze([]),
      opponents: Object.freeze([at(340, 600)]),
      learner: at(312, 576),
      goodSpots: Object.freeze([spot(353, 610, 12)]),
    }),
    Object.freeze({
      id: "delay",
      name: "Delay",
      kind: "drag",
      caption: "Their player is dribbling at your goal.",
      ball: at(360, 680),
      teammates: Object.freeze([]),
      opponents: Object.freeze([at(360, 680)]),
      learner: at(370, 700),
      goodSpots: Object.freeze([spot(400, 730, 28)]),
    }),
    Object.freeze({
      id: "pressure-and-cover",
      name: "Pressure and cover",
      kind: "drag",
      caption: "Your teammate is on the ball. You are the cover.",
      ball: at(520, 580),
      teammates: Object.freeze([at(516, 604, "presser")]),
      opponents: Object.freeze([at(520, 580)]),
      learner: at(440, 604),
      goodSpots: Object.freeze([spot(470, 670, 28)]),
    }),
    Object.freeze({
      id: "squeeze-the-middle",
      name: "Squeeze the middle",
      kind: "drag",
      caption: "The ball is on the other wing. Your teammate is pressing it.",
      ball: at(640, 480),
      teammates: Object.freeze([at(600, 520)]),
      opponents: Object.freeze([at(640, 480)]),
      learner: at(40, 760),
      goodSpots: Object.freeze([spot(280, 730, 36)]),
    }),
    Object.freeze({
      id: "recovery-run",
      name: "Recovery run",
      kind: "drag",
      caption: "You lost the ball up the wing. They are running at your goal.",
      ball: at(220, 620),
      teammates: Object.freeze([]),
      opponents: Object.freeze([at(220, 620)]),
      learner: at(60, 200),
      goodSpots: Object.freeze([spot(300, 780, 40)]),
    }),
    Object.freeze({
      id: "goalkeeper-step-out-and-line-up",
      name: "Goalkeeper step-out and line-up",
      kind: "drag",
      angles: Object.freeze([
        Object.freeze({ id: "central", label: "Central" }),
        Object.freeze({ id: "near-post", label: "Near post" }),
        Object.freeze({ id: "through-ball", label: "Free ball" }),
      ]),
      pictures: Object.freeze({
        central: Object.freeze({
          caption: "A close shot is in front of the goal.",
          ball: at(340, 960),
          teammates: Object.freeze([]),
          opponents: Object.freeze([at(340, 960, "shooter")]),
          learner: at(340, 1050),
          goodSpots: Object.freeze([spot(340, 1030, 16)]),
        }),
        "near-post": Object.freeze({
          caption: "A close shot is wide, near the corner of the box.",
          ball: at(510, 900),
          teammates: Object.freeze([]),
          opponents: Object.freeze([at(510, 900, "shooter")]),
          learner: at(340, 1050),
          goodSpots: Object.freeze([spot(369, 1030, 16)]),
        }),
        "through-ball": Object.freeze({
          caption: "A free ball is at the edge of the six.",
          ball: at(400, 995),
          teammates: Object.freeze([]),
          opponents: Object.freeze([at(400, 820)]),
          learner: at(340, 1040),
          goodSpots: Object.freeze([spot(400, 995, 28)]),
        }),
      }),
    }),
    Object.freeze({
      id: "check-away",
      name: "Check away",
      kind: "pick",
      caption: "You are marked. Pick your move.",
      ball: at(250, 860),
      teammates: Object.freeze([at(250, 860, "passer")]),
      opponents: Object.freeze([at(420, 680)]),
      learner: at(480, 700),
      targets: Object.freeze([
        mark("a", "still", 480, 700, 32),
        mark("c", "into", 410, 691, 32),
        mark("b", "away", 600, 640, 32),
      ]),
    }),
    Object.freeze({
      id: "triangle",
      name: "Triangle",
      kind: "pick",
      caption: "Pick a spot around your teammates and the ball.",
      ball: at(360, 720),
      teammates: Object.freeze([at(360, 720, "carrier"), at(360, 560)]),
      opponents: Object.freeze([at(410, 690)]),
      learner: at(220, 640),
      targets: Object.freeze([
        mark("a", "line", 360, 880, 32),
        mark("c", "beside", 300, 750, 32),
        mark("b", "corner", 510, 610, 32),
      ]),
    }),
    Object.freeze({
      id: "wall-pass",
      name: "Wall pass",
      kind: "pick",
      caption: "You passed inside. The defender stepped toward the ball.",
      ball: at(320, 500),
      teammates: Object.freeze([at(320, 500)]),
      opponents: Object.freeze([at(240, 560)]),
      learner: at(70, 700),
      targets: Object.freeze([
        mark("a", "start", 70, 700, 34),
        mark("c", "feet", 240, 560, 34),
        mark("b", "behind", 130, 440, 34),
      ]),
    }),
    Object.freeze({
      id: "switch-the-weak-side",
      name: "Switch the weak side",
      kind: "pick",
      caption: "The ball is on the right. Two opponents are crowded there. Pick who gets the ball.",
      ball: at(620, 680),
      learner: at(620, 680),
      teammates: Object.freeze([
        at(560, 730, "marked"),
        at(580, 560, "crowd"),
        at(55, 480, "open"),
      ]),
      opponents: Object.freeze([at(530, 700), at(630, 540)]),
      targets: Object.freeze([
        mark("a", "marked", 560, 730, 36),
        mark("c", "crowd", 580, 560, 36),
        mark("b", "open", 55, 480, 36),
      ]),
    }),
    Object.freeze({
      id: "build-out",
      name: "Build-out",
      kind: "pick",
      caption: "The ball is in your hands. Opponents are behind the build-out line.",
      ball: at(340, 1006),
      learner: at(340, 1010),
      teammates: Object.freeze([
        at(80, 880, "wide"),
        at(300, 820, "middle"),
        at(400, 320, "striker"),
      ]),
      opponents: Object.freeze([at(220, 640), at(480, 610)]),
      guides: Object.freeze([
        Object.freeze({ y: pitch.ownBuildOutY, label: "Build-out line" }),
      ]),
      targets: Object.freeze([
        mark("a", "striker", 400, 320, 36),
        mark("c", "space", 380, 760, 36),
        mark("b", "wide", 80, 880, 36),
      ]),
    }),
  ]);

  const byId = Object.freeze(
    scenes.reduce(function (map, scene) {
      map[scene.id] = scene;
      return map;
    }, {})
  );

  let angleId = "central";
  let wrapped = false;

  function playedScene(id) {
    const play = globalThis.SoccerScenePlay;
    if (!id || !play || typeof play.sceneFor !== "function") return null;
    if (byId[id]) return null;
    return play.sceneFor(id);
  }

  function sceneOf(id) {
    if (!id) return null;
    return byId[id] || playedScene(id);
  }

  function frameFor(scene, which) {
    if (!scene) return null;
    if (!scene.pictures) return scene;
    const id = which || angleId;
    if (scene.pictures[id]) return scene.pictures[id];
    if (scene.pictures.central) return scene.pictures.central;
    if (scene.angles && scene.angles[0]) {
      return scene.pictures[scene.angles[0].id] || null;
    }
    return null;
  }

  function markersFor(scene) {
    if (!scene || !scene.targets) return [];
    return scene.targets.map(function (target) {
      return { id: target.id, x: target.x, y: target.y, r: target.r };
    });
  }

  function usePicture(id) {
    const scene = byId["goalkeeper-step-out-and-line-up"];
    if (!scene || !scene.angles) return angleId;
    const known = scene.angles.some(function (angle) {
      return angle.id === id;
    });
    if (!known) return angleId;
    angleId = id;
    return angleId;
  }

  function install() {
    if (typeof document === "undefined" || !globalThis.SoccerAttempt) return;
    wrapAttempt();
    if (!document.querySelector("#pitch") || !document.querySelector("#drill-list")) {
      return;
    }
    bind();
  }

  function wrapAttempt() {
    if (wrapped) return;
    wrapped = true;
    const inner = globalThis.SoccerAttempt;

    function cloneSpot(spot) {
      // Twice as wide around the same center. The good spot does not move.
      return Object.freeze({ x: spot.x, y: spot.y, r: spot.r * 2 });
    }

    function drawnRadius(spot, fromDrag) {
      // A drag spot is already drawn at twice its stored radius.
      // Level 1 keeps that drawn width. It does not shrink.
      return fromDrag ? cloneSpot(spot).r : spot.r;
    }

    function marksFor(frame, level) {
      const fromDrag = Boolean(frame.goodSpots) && !frame.targets;
      const source = frame.targets || frame.goodSpots || [];
      return source.map(function (spot) {
        const drawn = drawnRadius(spot, fromDrag);
        return Object.freeze({
          id: spot.id || inner.correctTarget.id,
          x: spot.x,
          y: spot.y,
          r: level === 2 ? drawn * 2 : drawn,
        });
      });
    }

    function originFor(frame, scene) {
      const point = (frame && frame.learner) || (scene && scene.learner) || inner.start;
      return Object.freeze({ x: point.x, y: point.y });
    }

    function insideMark(mark, point) {
      const dx = point.x - mark.x;
      const dy = point.y - mark.y;
      return dx * dx + dy * dy <= mark.r * mark.r;
    }

    function nearestMark(marks, point) {
      let best = null;
      let bestDistance = Infinity;
      marks.forEach(function (mark) {
        const dx = point.x - mark.x;
        const dy = point.y - mark.y;
        const distance = dx * dx + dy * dy;
        if (distance < bestDistance) {
          best = mark;
          bestDistance = distance;
        }
      });
      return best;
    }

    function containingMarks(marks, point) {
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return [];
      return marks.filter(function (mark) {
        return insideMark(mark, point);
      });
    }

    function withLevel(result, attempt, fields) {
      const next = Object.assign({}, result, fields || {});
      if (attempt.level) next.level = attempt.level;
      if (attempt.levelMarks) next.levelMarks = attempt.levelMarks;
      if (attempt.pictureId) next.pictureId = attempt.pictureId;
      if (attempt.token && !next.token) next.token = attempt.token;
      return Object.freeze(next);
    }

    globalThis.SoccerAttempt = Object.freeze({
      goodSpots: inner.goodSpots,
      start: inner.start,
      markedTargets: inner.markedTargets,
      correctTarget: inner.correctTarget,
      presentation: function (attempt) {
        const view = inner.presentation(attempt);
        if (!attempt || !attempt.levelMarks) return view;
        const playing = attempt.state === "playing" && attempt.ended === false;
        return Object.freeze(
          Object.assign({}, view, {
            targets: attempt.levelMarks,
            pickable: attempt.level === 1 && playing,
            draggable: attempt.level === 2 && playing,
          })
        );
      },
      revealAnswer: inner.revealAnswer,
      endAttempt: inner.endAttempt,
      pick: function (attempt, targetId) {
        const result = inner.pick(attempt, targetId);
        if (!attempt || !attempt.levelMarks || result === attempt) return result;
        const chosen = attempt.levelMarks.find(function (mark) {
          return mark.id === targetId;
        });
        const fields = {};
        if (chosen) fields.token = Object.freeze({ x: chosen.x, y: chosen.y });
        return withLevel(result, attempt, fields);
      },
      createAttempt: function (drill) {
        const base = inner.createAttempt(drill);
        const frame = frameFor(sceneOf(drill && drill.id));
        if (!frame || !frame.goodSpots) return base;
        const made = {
          drillId: base.drillId,
          state: base.state,
          ended: base.ended,
          confirmation: base.confirmation,
          answerShown: base.answerShown,
          token: Object.freeze({ x: frame.learner.x, y: frame.learner.y }),
          goodSpots: Object.freeze(frame.goodSpots.map(cloneSpot)),
          correctionSpots: Object.freeze([]),
        };
        if (drill.id === "goalkeeper-step-out-and-line-up") made.pictureId = angleId;
        return Object.freeze(made);
      },
      createPickAttempt: function (drill) {
        const base = inner.createPickAttempt(drill);
        const frame = frameFor(sceneOf(drill && drill.id));
        if (!frame || !frame.targets) return base;
        return Object.freeze({
          kind: base.kind,
          drillId: base.drillId,
          state: base.state,
          ended: base.ended,
          confirmation: base.confirmation,
          answerShown: base.answerShown,
          targets: Object.freeze(
            frame.targets.map(function (target) {
              return Object.freeze({
                id: target.id,
                x: target.x,
                y: target.y,
                r: target.r,
              });
            })
          ),
          correctionSpots: Object.freeze([]),
        });
      },
      createLevelAttempt: function (drill, level) {
        const chosen = level === 2 ? 2 : 1;
        const scene = sceneOf(drill && drill.id);
        const frame = frameFor(scene);
        const marks = frame ? marksFor(frame, chosen) : [];
        if (!drill || !frame || marks.length === 0) {
          if (drill && drill.kind === "drag") return inner.createAttempt(drill);
          if (drill && drill.kind === "pick") return inner.createPickAttempt(drill);
          throw new Error("A level attempt needs a drill.");
        }
        const frozenMarks = Object.freeze(marks);
        const origin = originFor(frame, scene);
        const pictureId =
          drill.id === "goalkeeper-step-out-and-line-up" ? angleId : "";
        if (chosen === 1) {
          const made = {
            kind: "pick",
            drillId: drill.id,
            state: "playing",
            ended: false,
            confirmation: "",
            answerShown: false,
            targets: frozenMarks,
            correctionSpots: Object.freeze([]),
            token: origin,
            level: 1,
            levelMarks: frozenMarks,
          };
          if (pictureId) made.pictureId = pictureId;
          return Object.freeze(made);
        }
        const correct = frozenMarks.filter(function (mark) {
          return mark.id === inner.correctTarget.id;
        });
        const made = {
          drillId: drill.id,
          state: "playing",
          ended: false,
          confirmation: "",
          answerShown: false,
          token: origin,
          goodSpots: Object.freeze(
            correct.map(function (mark) {
              return Object.freeze({ x: mark.x, y: mark.y, r: mark.r });
            })
          ),
          correctionSpots: Object.freeze([]),
          level: 2,
          levelMarks: frozenMarks,
        };
        if (pictureId) made.pictureId = pictureId;
        return Object.freeze(made);
      },
      drop: function (attempt, point) {
        const pictureId =
          attempt && attempt.drillId === "goalkeeper-step-out-and-line-up"
            ? attempt.pictureId || angleId
            : "";
        const result = inner.drop(attempt, point);
        if (!result || result === attempt) return result;
        const fields = {};
        if (pictureId) fields.pictureId = pictureId;
        if (attempt && attempt.levelMarks) {
          const hits = containingMarks(attempt.levelMarks, point);
          const correctHits =
            result.state === "correct"
              ? hits.filter(function (mark) {
                  return mark.id === inner.correctTarget.id;
                })
              : [];
          const landed = nearestMark(correctHits.length ? correctHits : hits, point);
          if (landed) fields.token = Object.freeze({ x: landed.x, y: landed.y });
        }
        if (!fields.pictureId && !(attempt && attempt.levelMarks)) return result;
        return withLevel(result, attempt, fields);
      },
    });
  }

  function bind() {
    const svgNS = "http://www.w3.org/2000/svg";
    const listEl = document.querySelector("#drill-list");
    const statusEl = document.querySelector("#play-status");

    function svgEl(name, attrs) {
      const el = document.createElementNS(svgNS, name);
      Object.keys(attrs).forEach(function (key) {
        el.setAttribute(key, String(attrs[key]));
      });
      return el;
    }

    function addTitle(el, text) {
      const title = document.createElementNS(svgNS, "title");
      title.textContent = text;
      el.append(title);
    }

    function useFirstPicture(drillId) {
      const scene = sceneOf(drillId);
      if (scene && scene.angles && scene.angles[0]) angleId = scene.angles[0].id;
      else angleId = "central";
    }

    listEl.addEventListener(
      "click",
      function (event) {
        const button = event.target.closest("button[data-action='start']");
        if (!button) return;
        const item = button.closest("[data-drill-id]");
        useFirstPicture(item && item.dataset.drillId);
      },
      true
    );

    document.addEventListener("starter-scene-reset", function (event) {
      const detail = event.detail || {};
      useFirstPicture(detail.drillId);
    });

    function currentScene() {
      const item = document.querySelector(".drill.is-playing");
      if (!item) return null;
      return sceneOf(item.dataset.drillId);
    }

    function slot(id, className) {
      let el = document.getElementById(id);
      if (el) return el;
      el = document.createElement(id === "starter-angles" ? "div" : "p");
      el.id = id;
      el.className = className;
      const legend = document.getElementById("starter-legend");
      const caption = document.getElementById("starter-caption");
      const anchor = id === "starter-caption" ? statusEl : id === "starter-legend" ? caption : legend;
      anchor.insertAdjacentElement("afterend", el);
      return el;
    }

    function sceneLayer() {
      const pitchEl = document.querySelector("#pitch");
      let layer = pitchEl.querySelector("#starter-scene-layer");
      if (!layer) {
        layer = svgEl("g", { id: "starter-scene-layer" });
        pitchEl.append(layer);
      }
      const attempt = pitchEl.querySelector("#attempt-layer");
      if (attempt && layer.nextSibling !== attempt) {
        pitchEl.insertBefore(layer, attempt);
      }
      return layer;
    }

    const playerRadius = 18;
    const ballRadius = 24;

    function drawActor(layer, actor, className, title) {
      const g = svgEl("g", {
        class: "scene-player " + className,
        transform: "translate(" + actor.x + " " + actor.y + ")",
      });
      g.append(svgEl("circle", { r: playerRadius }));
      addTitle(g, title);
      layer.append(g);
    }

    function ballDrawPoint(ball, actors) {
      let cover = null;
      let coverDistance = Infinity;
      (actors || []).forEach(function (actor) {
        if (!actor) return;
        const distance = Math.hypot(actor.x - ball.x, actor.y - ball.y);
        if (distance < coverDistance) {
          cover = actor;
          coverDistance = distance;
        }
      });
      if (!cover || coverDistance > playerRadius + ballRadius * 0.35) return ball;
      const gap = playerRadius + ballRadius * 0.55;
      if (coverDistance < 1) return { x: cover.x, y: cover.y + gap };
      return {
        x: cover.x + ((ball.x - cover.x) / coverDistance) * gap,
        y: cover.y + ((ball.y - cover.y) / coverDistance) * gap,
      };
    }

    function drawBall(layer, ball, actors) {
      const place = ballDrawPoint(ball, actors);
      const g = svgEl("g", {
        class: "scene-ball",
        transform: "translate(" + place.x + " " + place.y + ")",
        "data-ball": "true",
      });
      g.append(svgEl("circle", { r: ballRadius }));
      g.append(svgEl("circle", { class: "scene-ball-spot", cx: -6, cy: -3, r: 6.5 }));
      g.append(svgEl("circle", { class: "scene-ball-spot", cx: 8, cy: 5, r: 4.6 }));
      addTitle(g, "Ball");
      layer.append(g);
    }

    function drawYou(layer, point) {
      const g = svgEl("g", {
        class: "scene-you",
        transform: "translate(" + point.x + " " + point.y + ")",
      });
      g.append(
        svgEl("circle", {
          r: playerRadius,
          fill: "#f5f7f2",
          stroke: "#0b4f8a",
          "stroke-width": 4,
        })
      );
      const label = svgEl("text", { class: "you-label", y: 4 });
      label.textContent = "You";
      g.append(label);
      addTitle(g, "You");
      layer.append(g);
    }

    function decorateToken() {
      const token = document.querySelector("#drag-token");
      if (!token || token.dataset.ready === "true") return;
      token.dataset.ready = "true";
      const body = token.querySelector(".drag-token");
      if (body) body.setAttribute("r", "18");
      const label = svgEl("text", { class: "you-label", y: 4 });
      label.textContent = "You";
      token.append(label);
    }

    function renderAngles(scene) {
      const bar = slot("starter-angles", "starter-angles");
      if (!scene || !scene.angles) {
        bar.hidden = true;
        bar.dataset.angles = "";
        bar.replaceChildren();
        return;
      }
      bar.hidden = false;
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "Pictures");
      const wanted = scene.angles
        .map(function (angle) {
          return angle.id;
        })
        .join(",");
      if (bar.dataset.angles !== wanted) {
        bar.dataset.angles = wanted;
        bar.replaceChildren();
        scene.angles.forEach(function (angle) {
          const button = document.createElement("button");
          button.type = "button";
          button.dataset.angle = angle.id;
          button.textContent = angle.label;
          button.addEventListener("click", function () {
            selectAngle(angle.id);
          });
          bar.append(button);
        });
      }
      const playing = statusEl.dataset.state === "playing";
      bar.querySelectorAll("button").forEach(function (button) {
        const on = button.dataset.angle === angleId;
        button.setAttribute("aria-pressed", on ? "true" : "false");
        button.disabled = !playing;
      });
    }

    function selectAngle(id) {
      if (statusEl.dataset.state !== "playing") return;
      if (angleId === id) return;
      angleId = id;
      document.dispatchEvent(new CustomEvent("starter-scene-change"));
      draw();
    }

    function draw() {
      const caption = slot("starter-caption", "starter-caption");
      const legend = slot("starter-legend", "starter-legend");
      const scene = currentScene();
      const layer = sceneLayer();
      layer.replaceChildren();
      renderAngles(scene);
      if (!scene) {
        caption.hidden = true;
        legend.hidden = true;
        caption.textContent = "";
        legend.textContent = "";
        return;
      }
      const frame = frameFor(scene);
      const captionText = frame.caption || scene.caption || "";
      caption.hidden = captionText === "";
      legend.hidden = false;
      caption.textContent = captionText;
      const levelButton = document.querySelector("#play-level button[aria-pressed='true']");
      const levelTwo = Boolean(levelButton && levelButton.dataset.level === "2");
      legend.textContent = levelTwo
        ? "White is you. Blue is your team. Red is the other team."
        : "White is you. Blue is your team. Red is the other team. Tap a ring.";
      (frame.guides || scene.guides || []).forEach(function (guide) {
        layer.append(
          svgEl("line", {
            class: "scene-guide",
            x1: 0,
            x2: pitch.width,
            y1: guide.y,
            y2: guide.y,
          })
        );
        const label = svgEl("text", {
          class: "scene-guide-label",
          x: 8,
          y: guide.y - 8,
        });
        label.textContent = guide.label;
        layer.append(label);
      });
      const actors = (frame.opponents || [])
        .concat(frame.teammates || [])
        .concat(frame.learner ? [frame.learner] : []);
      (frame.opponents || []).forEach(function (actor) {
        drawActor(
          layer,
          actor,
          "scene-opponent",
          actor.name === "shooter" ? "Shooter" : "Opponent"
        );
      });
      (frame.teammates || []).forEach(function (actor) {
        drawActor(layer, actor, "scene-team", "Teammate");
      });
      if (
        scene.kind === "pick" &&
        (frame.learner || scene.learner) &&
        !document.querySelector("#drag-token")
      ) {
        drawYou(layer, frame.learner || scene.learner);
      }
      if (frame.ball) drawBall(layer, frame.ball, actors);
      decorateToken();
    }

    document.addEventListener("click", function () {
      draw();
    });

    const pitchEl = document.querySelector("#pitch");
    const observer = new MutationObserver(function () {
      decorateToken();
    });
    observer.observe(pitchEl, { childList: true, subtree: true });
    draw();
  }

  return Object.freeze({
    pitch: pitch,
    scenes: scenes,
    byId: byId,
    frameFor: frameFor,
    markersFor: markersFor,
    usePicture: usePicture,
    install: install,
  });
});

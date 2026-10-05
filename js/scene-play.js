// Next and advanced scenes stay in their own files, in meters.
// This maps a scene onto the starter play path.  The page scale is 10 px
// for 1 m.  Scene coordinates are not rewritten.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SoccerScenePlay = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  const spareIds = ["a", "c", "d", "e", "f", "g"];

  // Script tags set these globals. Node require fills a missing one.
  // Both hosts then read the same global.
  function load(name, rel) {
    if (!root[name]) root[name] = require(rel);
    return root[name];
  }

  function sources() {
    return {
      next: load("SoccerNextScenes", "./scenes/next.js"),
      advanced: load("SoccerAdvancedScenes", "./scenes/advanced.js"),
      scale: load("StarterScenes", "./starter-scenes.js").pitch.scale,
    };
  }

  function px(value, scale) {
    return value * scale;
  }

  function pointAt(point, scale) {
    return Object.freeze({ x: px(point.x, scale), y: px(point.y, scale) });
  }

  function pictureLabel(id) {
    return id
      .split("-")
      .map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }

  function peopleIn(picture, scale) {
    const teammates = [];
    const opponents = [];
    let learner = null;
    picture.players.forEach(function (player) {
      const point = pointAt(player, scale);
      if (player.team === "learner") learner = point;
      else if (player.team === "teammate") teammates.push(point);
      else opponents.push(point);
    });
    return {
      learner: learner,
      teammates: Object.freeze(teammates),
      opponents: Object.freeze(opponents),
    };
  }

  function targetsFor(picture, scale) {
    let spare = 0;
    return Object.freeze(
      picture.marks.map(function (mark) {
        const correct = mark.id === picture.correctMarkId;
        const id = correct ? "b" : spareIds[spare++];
        return Object.freeze({
          id: id,
          name: mark.id,
          x: px(mark.x, scale),
          y: px(mark.y, scale),
          r: px(mark.r, scale),
        });
      })
    );
  }

  function frameFrom(picture, scene, scale) {
    const people = peopleIn(picture, scale);
    const frame = {
      learner: people.learner,
      teammates: people.teammates,
      opponents: people.opponents,
      ball: picture.ball ? pointAt(picture.ball, scale) : null,
    };
    if (scene.kind === "drag") {
      frame.goodSpots = Object.freeze([
        Object.freeze({
          x: px(picture.goodSpot.x, scale),
          y: px(picture.goodSpot.y, scale),
          r: px(picture.goodSpot.r, scale),
        }),
      ]);
    } else {
      frame.targets = targetsFor(picture, scale);
    }
    return Object.freeze(frame);
  }

  function adapt(scene, scale) {
    if (scene.pictures.length === 1) {
      const frame = frameFrom(scene.pictures[0], scene, scale);
      return Object.freeze({
        id: scene.id,
        name: scene.name,
        kind: scene.kind,
        learner: frame.learner,
        teammates: frame.teammates,
        opponents: frame.opponents,
        ball: frame.ball,
        goodSpots: frame.goodSpots,
        targets: frame.targets,
      });
    }

    const angles = [];
    const pictures = {};
    scene.pictures.forEach(function (picture) {
      angles.push(Object.freeze({ id: picture.id, label: pictureLabel(picture.id) }));
      pictures[picture.id] = frameFrom(picture, scene, scale);
    });
    return Object.freeze({
      id: scene.id,
      name: scene.name,
      kind: scene.kind,
      angles: Object.freeze(angles),
      pictures: Object.freeze(pictures),
    });
  }

  let cache = null;

  function allScenes() {
    if (cache) return cache;
    const src = sources();
    const map = Object.create(null);
    src.next.scenes.forEach(function (scene) {
      map[scene.id] = adapt(scene, src.scale);
    });
    src.advanced.scenes.forEach(function (scene) {
      map[scene.id] = adapt(scene, src.scale);
    });
    cache = map;
    return cache;
  }

  function sceneFor(id) {
    return allScenes()[id] || null;
  }

  function knowsPicture(id) {
    if (!id) return false;
    const all = allScenes();
    const keys = Object.keys(all);
    for (let i = 0; i < keys.length; i += 1) {
      const scene = all[keys[i]];
      if (scene.pictures && scene.pictures[id]) return true;
    }
    return false;
  }

  return Object.freeze({
    sceneFor: sceneFor,
    knowsPicture: knowsPicture,
  });
});

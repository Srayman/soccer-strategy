const test = require("node:test");
const assert = require("node:assert/strict");
const { drills, goalkeeperDrillId } = require("../js/catalog.js");

const keeper = drills.find((drill) => drill.id === goalkeeperDrillId);
const checkAway = drills.find((drill) => drill.id === "check-away");
const pictures = [
  { id: "central", label: "Central" },
  { id: "near-post", label: "Near post" },
  { id: "through-ball", label: "Free ball" },
];

function createElement(tag) {
  const el = {
    tagName: tag,
    id: "",
    className: "",
    textContent: "",
    hidden: false,
    disabled: false,
    type: "",
    children: [],
    parent: null,
    attrs: {},
    listeners: {},
    dataset: {},
    style: {},
  };

  el.dataset = new Proxy(
    {},
    {
      set(target, prop, value) {
        target[prop] = String(value);
        const attr =
          "data-" +
          String(prop).replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase());
        el.attrs[attr] = String(value);
        return true;
      },
      get(target, prop) {
        return target[prop];
      },
    }
  );

  el.classList = {
    names() {
      return new Set(el.className.split(/\s+/).filter(Boolean));
    },
    toggle(name, force) {
      const names = this.names();
      const on = force === undefined ? !names.has(name) : Boolean(force);
      if (on) names.add(name);
      else names.delete(name);
      el.className = Array.from(names).join(" ");
      return on;
    },
    add(name) {
      const names = this.names();
      names.add(name);
      el.className = Array.from(names).join(" ");
    },
    contains(name) {
      return this.names().has(name);
    },
  };
  el.classList.remove = (name) => {
    const names = el.classList.names();
    names.delete(name);
    el.className = Array.from(names).join(" ");
  };

  el.setAttribute = (key, value) => {
    el.attrs[key] = String(value);
    if (key === "id") el.id = String(value);
    if (key === "class") el.className = String(value);
  };
  el.getAttribute = (key) => (key in el.attrs ? el.attrs[key] : null);
  el.removeAttribute = (key) => {
    delete el.attrs[key];
  };
  el.addEventListener = (type, fn) => {
    el.listeners[type] = el.listeners[type] || [];
    el.listeners[type].push(fn);
  };
  el.setPointerCapture = () => {};
  el.append = (...nodes) => {
    nodes.forEach((node) => {
      if (node && node.nodeType === 11) {
        node.children.splice(0).forEach((child) => el.append(child));
        return;
      }
      node.parent = el;
      el.children.push(node);
    });
  };
  Object.defineProperty(el, "firstChild", {
    get() {
      return el.children[0] || null;
    },
  });
  el.insertBefore = (node, ref) => {
    node.parent = el;
    if (!ref) {
      el.children.push(node);
      return node;
    }
    const idx = el.children.indexOf(ref);
    if (idx === -1) el.children.push(node);
    else el.children.splice(idx, 0, node);
    return node;
  };
  el.insertAdjacentElement = (where, node) => {
    const parent = el.parent;
    if (!parent) return node;
    if (where === "afterend") {
      const idx = parent.children.indexOf(el);
      node.parent = parent;
      parent.children.splice(idx + 1, 0, node);
    }
    return node;
  };
  el.replaceChildren = (...nodes) => {
    el.children.splice(0).forEach((child) => {
      child.parent = null;
    });
    if (nodes.length) el.append(...nodes);
  };
  el.remove = () => {
    if (!el.parent) return;
    const idx = el.parent.children.indexOf(el);
    if (idx >= 0) el.parent.children.splice(idx, 1);
    el.parent = null;
  };
  el.closest = (sel) => {
    let current = el;
    while (current) {
      if (matches(current, sel)) return current;
      current = current.parent;
    }
    return null;
  };
  el.querySelectorAll = (sel) => {
    const found = [];
    walk(el, (node) => {
      if (node !== el && matches(node, sel)) found.push(node);
    });
    return found;
  };
  el.querySelector = (sel) => el.querySelectorAll(sel)[0] || null;
  return el;
}

function matches(el, sel) {
  if (sel === ".drill.is-playing") {
    const names = el.className.split(/\s+/);
    return names.includes("drill") && names.includes("is-playing");
  }
  if (sel.charAt(0) === ".") {
    return el.className.split(/\s+/).includes(sel.slice(1));
  }
  if (sel.charAt(0) === "#") {
    return el.id === sel.slice(1);
  }
  if (sel.charAt(0) === "[") {
    const name = sel.slice(1, -1).split("=")[0];
    return name in el.attrs;
  }
  const attr = sel.match(/^([a-z]+)\[([^\]=]+)(?:=["']?([^"'\]]+)["']?)?\]$/);
  if (attr) {
    if (el.tagName !== attr[1]) return false;
    if (!(attr[2] in el.attrs)) return false;
    if (attr[3] === undefined) return true;
    return el.attrs[attr[2]] === attr[3];
  }
  const compound = sel.match(/^([#.][^\s]+) ([a-z]+)\[([^\]=]+)=["']?([^"'\]]+)["']?\]$/);
  if (compound) {
    return false;
  }
  return el.tagName === sel;
}

function walk(el, visit) {
  visit(el);
  el.children.forEach((child) => walk(child, visit));
}

function createDocument() {
  if (!global.MutationObserver) {
    global.MutationObserver = class {
      observe() {}
      disconnect() {}
    };
  }

  const nodes = {};
  const listeners = {};
  const root = createElement("div");

  const copy = createElement("div");
  copy.className = "pitch-copy";
  const frame = createElement("div");
  frame.className = "pitch-frame";
  const pitch = createElement("svg");
  pitch.id = "pitch";
  frame.append(pitch);
  const list = createElement("div");
  list.id = "drill-list";
  const status = createElement("p");
  status.id = "play-status";
  const points = createElement("p");
  points.id = "points";
  points.textContent = "Score: 0";
  const nextPlay = createElement("button");
  nextPlay.id = "next-play";
  nextPlay.disabled = true;
  const level = createElement("div");
  level.id = "play-level";
  const level1 = createElement("button");
  level1.dataset.level = "1";
  level1.setAttribute("aria-pressed", "true");
  const level2 = createElement("button");
  level2.dataset.level = "2";
  level2.setAttribute("aria-pressed", "false");
  level.append(level1, level2);

  root.append(copy, frame, list, status, points, nextPlay, level);

  nodes["#pitch"] = pitch;
  nodes["#drill-list"] = list;
  nodes["#play-status"] = status;
  nodes["#points"] = points;
  nodes["#next-play"] = nextPlay;
  nodes["#play-level"] = level;
  nodes[".pitch-copy"] = copy;

  function find(sel) {
    if (nodes[sel] && (sel.charAt(0) === "#" || sel.charAt(0) === ".")) {
      if (sel === ".pitch-copy") return copy;
      if (sel.charAt(0) === "#") return nodes[sel];
    }
    if (sel === "#play-level button[aria-pressed='true']") {
      return level.children.find((child) => child.getAttribute("aria-pressed") === "true") || null;
    }
    const found = [];
    walk(root, (node) => {
      if (matches(node, sel)) found.push(node);
    });
    return found[0] || null;
  }

  const document = {
    nodes,
    pitch,
    root,
    addEventListener(type, fn) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
    dispatchEvent(event) {
      (listeners[event.type] || []).forEach((fn) => fn(event));
      return true;
    },
    querySelector(sel) {
      return find(sel);
    },
    getElementById(id) {
      return find("#" + id);
    },
    createElement(tag) {
      return createElement(tag);
    },
    createElementNS(_ns, tag) {
      return createElement(tag);
    },
    createDocumentFragment() {
      const fragment = createElement("fragment");
      fragment.nodeType = 11;
      return fragment;
    },
  };
  return document;
}

function loadGame(document) {
  const previous = {
    document: global.document,
    strategy: globalThis.SoccerStrategy,
    attempt: globalThis.SoccerAttempt,
    points: globalThis.SoccerPoints,
    clear: globalThis.SoccerClear,
    next: globalThis.SoccerNextPlay,
    celebrate: globalThis.SoccerCelebrate,
    progress: globalThis.SoccerProgressCopy,
    render: globalThis.SoccerRender,
    scenes: globalThis.StarterScenes,
    lines: globalThis.SoccerSpotLines,
    play: globalThis.SoccerScenePlay,
  };
  const catalog = require("../js/catalog.js");
  global.document = document;
  globalThis.SoccerStrategy = {
    drills: drills,
    isLocked: catalog.isLocked,
    canStart: catalog.canStart,
    goalkeeperDrillId: catalog.goalkeeperDrillId,
  };
  globalThis.SoccerAttempt = require("../js/attempt.js");
  globalThis.SoccerPoints = require("../js/points.js");
  globalThis.SoccerClear = require("../js/clear.js");
  globalThis.SoccerNextPlay = require("../js/next-play.js");
  globalThis.SoccerCelebrate = require("../js/celebrate.js");
  globalThis.SoccerProgressCopy = require("../js/progress-copy.js");
  globalThis.SoccerRender = require("../js/render.js");
  globalThis.SoccerSpotLines = require("../js/spot-lines.js");
  globalThis.SoccerScenePlay = require("../js/scene-play.js");
  const scenePath = require.resolve("../js/starter-scenes.js");
  delete require.cache[scenePath];
  globalThis.StarterScenes = require("../js/starter-scenes.js");
  globalThis.StarterScenes.install();
  const gamePath = require.resolve("../js/game.js");
  delete require.cache[gamePath];
  require("../js/game.js");
  return {
    restore() {
      delete require.cache[gamePath];
      delete require.cache[scenePath];
      if (previous.document === undefined) delete global.document;
      else global.document = previous.document;
      globalThis.SoccerStrategy = previous.strategy;
      globalThis.SoccerAttempt = previous.attempt;
      globalThis.SoccerPoints = previous.points;
      globalThis.SoccerClear = previous.clear;
      globalThis.SoccerNextPlay = previous.next;
      globalThis.SoccerCelebrate = previous.celebrate;
      globalThis.SoccerProgressCopy = previous.progress;
      globalThis.SoccerRender = previous.render;
      globalThis.StarterScenes = previous.scenes;
      globalThis.SoccerSpotLines = previous.lines;
      globalThis.SoccerScenePlay = previous.play;
    },
  };
}

function boot() {
  const document = createDocument();
  const page = loadGame(document);
  return { document, restore: page.restore };
}

function fireClicks(el, event) {
  (el.listeners.click || []).forEach((fn) => fn(event));
}

function startDrill(document, id) {
  const list = document.nodes["#drill-list"];
  const item = list.querySelectorAll(".drill").find((el) => el.dataset.drillId === id);
  const button = item.querySelector(".drill-action");
  fireClicks(list, { target: button });
  document.dispatchEvent({ type: "click" });
}

function pressLevel(document, level) {
  const group = document.nodes["#play-level"];
  const button = group.children.find((child) => child.dataset.level === String(level));
  fireClicks(group, { target: button });
  document.dispatchEvent({ type: "click" });
}

function pictureButtons(document) {
  const bar = document.getElementById("starter-angles");
  assert.ok(bar, "picture bar");
  return bar.children.filter((child) => child.tagName === "button");
}

function clickPicture(document, id) {
  const button = pictureButtons(document).find((el) => el.dataset.angle === id);
  assert.ok(button, "missing picture " + id);
  assert.equal(button.disabled, false, id + " disabled");
  let stopped = false;
  fireClicks(button, {
    target: button,
    stopPropagation() {
      stopped = true;
    },
  });
  assert.equal(stopped, true, id + " must stop the document redraw click");
  return button;
}

function assertPicturesOpen(document, level) {
  const buttons = pictureButtons(document);
  assert.equal(buttons.length, 3, "level " + level + " picture count");
  pictures.forEach((picture) => {
    const button = buttons.find((el) => el.dataset.angle === picture.id);
    assert.ok(button, picture.id);
    assert.equal(button.textContent, picture.label);
    assert.equal(button.disabled, false, picture.id + " on level " + level);
  });
  assert.equal(document.nodes["#points"].textContent, "Score: 0");
  assert.equal(document.nodes["#play-status"].dataset.state, "playing");
}

test("level 1 keeps Central and Free ball clickable during one attempt", () => {
  const page = boot();
  try {
    startDrill(page.document, keeper.id);
    assertPicturesOpen(page.document, 1);

    const token = page.document.pitch.querySelector("#drag-token");
    assert.equal(token.getAttribute("data-draggable"), "false");
    assert.equal(token.getAttribute("pointer-events"), "none");
    assert.equal(token.querySelector(".drag-hit"), null);

    clickPicture(page.document, "near-post");
    assertPicturesOpen(page.document, 1);
    assert.equal(
      pictureButtons(page.document).find((el) => el.dataset.angle === "near-post").getAttribute(
        "aria-pressed"
      ),
      "true"
    );

    clickPicture(page.document, "through-ball");
    assertPicturesOpen(page.document, 1);
    assert.equal(
      pictureButtons(page.document).find((el) => el.dataset.angle === "through-ball").getAttribute(
        "aria-pressed"
      ),
      "true"
    );

    clickPicture(page.document, "central");
    assertPicturesOpen(page.document, 1);
    assert.equal(
      pictureButtons(page.document).find((el) => el.dataset.angle === "central").getAttribute(
        "aria-pressed"
      ),
      "true"
    );

    const marks = page.document.pitch.querySelectorAll(".marked-target");
    const central = marks.find((mark) => mark.getAttribute("data-target-id") === "b");
    assert.ok(central);
    assert.equal(central.getAttribute("data-pickable"), "true");
    fireClicks(central, { preventDefault() {}, currentTarget: central });
    assert.equal(page.document.nodes["#points"].textContent, "Score: 3");
    assert.equal(page.document.nodes["#play-status"].textContent, "You found a spot.");
  } finally {
    page.restore();
  }
});

test("level 2 keeps every goalkeeper picture selectable without scoring", () => {
  const page = boot();
  try {
    startDrill(page.document, keeper.id);
    pressLevel(page.document, 2);
    assertPicturesOpen(page.document, 2);
    assert.equal(
      page.document.pitch.querySelector("#drag-token").getAttribute("data-draggable"),
      "true"
    );

    clickPicture(page.document, "near-post");
    clickPicture(page.document, "through-ball");
    clickPicture(page.document, "central");
    assertPicturesOpen(page.document, 2);
    assert.equal(page.document.nodes["#points"].textContent, "Score: 0");
    assert.equal(page.document.pitch.querySelectorAll(".marked-target").length, 0);
  } finally {
    page.restore();
  }
});

function sceneLayer(document) {
  return document.pitch.querySelector("#starter-scene-layer");
}

function ballAt(layer) {
  const ball = layer.querySelector("[data-ball='true']");
  return ball ? ball.getAttribute("transform") : "";
}

function countSceneDraws(layer, run) {
  let draws = 0;
  const original = layer.replaceChildren;
  layer.replaceChildren = (...nodes) => {
    draws += 1;
    return original.apply(layer, nodes);
  };
  try {
    run();
    return draws;
  } finally {
    layer.replaceChildren = original;
  }
}

test("a click that does not change the scene does not redraw it", () => {
  const page = boot();
  try {
    startDrill(page.document, keeper.id);
    assertPicturesOpen(page.document, 1);
    const layer = sceneLayer(page.document);
    const before = ballAt(layer);
    const actors = layer.children.length;
    const draws = countSceneDraws(layer, () => {
      page.document.dispatchEvent({ type: "click" });
      page.document.dispatchEvent({ type: "click" });
    });
    assert.equal(draws, 0);
    assert.equal(ballAt(layer), before);
    assert.equal(layer.children.length, actors);
    assert.equal(page.document.nodes["#points"].textContent, "Score: 0");
    assert.equal(
      pictureButtons(page.document).find((el) => el.dataset.angle === "central").getAttribute(
        "aria-pressed"
      ),
      "true"
    );
  } finally {
    page.restore();
  }
});

test("a click that changes the scene still redraws", () => {
  const page = boot();
  try {
    startDrill(page.document, keeper.id);
    const layer = sceneLayer(page.document);
    const keeperBall = ballAt(layer);
    const draws = countSceneDraws(layer, () => {
      startDrill(page.document, "open-body");
    });
    assert.ok(draws >= 1);
    const next = sceneLayer(page.document);
    assert.notEqual(ballAt(next), keeperBall);
    assert.equal(page.document.nodes["#points"].textContent, "Score: 0");
    const open = page.document.nodes["#drill-list"]
      .querySelectorAll(".drill")
      .find((item) => item.dataset.drillId === "open-body");
    assert.equal(open.className.includes("is-playing"), true);
    assert.equal(page.document.getElementById("starter-angles").hidden, true);
  } finally {
    page.restore();
  }
});

test("switching a goalkeeper picture still redraws and does not score", () => {
  const page = boot();
  try {
    startDrill(page.document, keeper.id);
    const layer = sceneLayer(page.document);
    const centralBall = ballAt(layer);
    const draws = countSceneDraws(layer, () => {
      clickPicture(page.document, "near-post");
    });
    assert.ok(draws >= 1);
    assert.notEqual(ballAt(sceneLayer(page.document)), centralBall);
    assertPicturesOpen(page.document, 1);
    assert.equal(
      pictureButtons(page.document).find((el) => el.dataset.angle === "near-post").getAttribute(
        "aria-pressed"
      ),
      "true"
    );
    assert.equal(page.document.nodes["#points"].textContent, "Score: 0");
  } finally {
    page.restore();
  }
});

test("check away level 1 keeps an overlapping mark under the learner token", () => {
  const page = boot();
  try {
    startDrill(page.document, checkAway.id);
    const layer = page.document.pitch.querySelector("#attempt-layer");
    const token = layer.querySelector("#drag-token");
    const still = layer
      .querySelectorAll(".marked-target")
      .find((mark) => mark.getAttribute("data-target-id") === "a");
    assert.ok(token, "learner token");
    assert.ok(still, "still mark");
    assert.equal(token.getAttribute("data-draggable"), "false");
    assert.ok(token.querySelector(".drag-hit"), "old 44px hit cover");
    assert.equal(token.getAttribute("pointer-events"), null);
    assert.ok(
      layer.children.indexOf(token) > layer.children.indexOf(still),
      "token stays above the overlapping mark"
    );
    assert.equal(page.document.nodes["#points"].textContent, "Score: 0");
    assert.equal(page.document.nodes["#play-status"].dataset.state, "playing");
  } finally {
    page.restore();
  }
});

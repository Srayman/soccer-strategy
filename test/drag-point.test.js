const test = require("node:test");
const assert = require("node:assert/strict");
const { drills } = require("../js/catalog.js");

// Measured on a 390px-wide layout. The pitch is turned with CSS.
// These clients are the painted centers of the field corners.
const corners = [
  { user: { x: 0, y: 0 }, client: { x: 25.758694648742676, y: 547.4909973144531 } },
  { user: { x: 680, y: 0 }, client: { x: 25.758694648742676, y: 331.9777526855469 } },
  { user: { x: 0, y: 1050 }, client: { x: 358.5365447998047, y: 547.4909973144531 } },
];

// getScreenCTM without the CSS turn. A finger on the good spot becomes about (110, -136).
const matrixWithoutTurn = {
  a: 0.31693128360215056,
  b: 0,
  c: 0,
  d: 0.31693128360215056,
  e: 205.14180107526883,
  f: 457.4930695564516,
};

// getScreenCTM with the CSS turn, as Chromium reports it on that same layout.
const matrixWithTurn = {
  a: 0,
  b: -0.31693128360215056,
  c: 0.31693128360215056,
  d: 0,
  e: 25.758694556451598,
  f: 547.4910114247311,
};

function userToClient(user) {
  const c0 = corners[0].client;
  const c1 = corners[1].client;
  const c2 = corners[2].client;
  const s = user.x / 680;
  const t = user.y / 1050;
  return {
    x: c0.x + s * (c1.x - c0.x) + t * (c2.x - c0.x),
    y: c0.y + s * (c1.y - c0.y) + t * (c2.y - c0.y),
  };
}

function svgMatrix(m) {
  const det = m.a * m.d - m.c * m.b;
  return {
    inverse() {
      return {
        a: m.d / det,
        b: -m.b / det,
        c: -m.c / det,
        d: m.a / det,
        e: (m.c * m.f - m.d * m.e) / det,
        f: (m.b * m.e - m.a * m.f) / det,
      };
    },
  };
}

function matrixPoint(matrix, client) {
  const inverse = svgMatrix(matrix).inverse();
  return {
    x: inverse.a * client.x + inverse.c * client.y + inverse.e,
    y: inverse.b * client.x + inverse.d * client.y + inverse.f,
  };
}

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
  el.replaceChildren = (...nodes) => {
    el.children.splice(0).forEach((child) => {
      child.parent = null;
    });
    if (nodes.length) el.append(...nodes);
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
  el.getBoundingClientRect = () => {
    if (!el.rectFor) return { left: 0, top: 0, width: 0, height: 0 };
    return el.rectFor(el);
  };
  return el;
}

function matches(el, sel) {
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
  return el.tagName === sel;
}

function walk(el, visit) {
  visit(el);
  el.children.forEach((child) => walk(child, visit));
}

function createDocument(rectFor, screenMatrix) {
  const nodes = {};
  const listeners = {};
  const frame = createElement("div");
  frame.className = "pitch-frame";
  const pitch = createElement("svg");
  pitch.id = "pitch";
  pitch.rectFor = rectFor;
  pitch.getScreenCTM = () => svgMatrix(screenMatrix);
  pitch.createSVGPoint = () => ({
    x: 0,
    y: 0,
    matrixTransform(matrix) {
      return {
        x: matrix.a * this.x + matrix.c * this.y + matrix.e,
        y: matrix.b * this.x + matrix.d * this.y + matrix.f,
      };
    },
  });
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
  const level2 = createElement("button");
  level2.dataset.level = "2";
  level.append(level1, level2);

  nodes["#drill-list"] = list;
  nodes["#play-status"] = status;
  nodes["#points"] = points;
  nodes["#next-play"] = nextPlay;
  nodes["#play-level"] = level;

  const document = {
    nodes,
    pitch,
    addEventListener(type, fn) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
    dispatchEvent(event) {
      (listeners[event.type] || []).forEach((fn) => fn(event));
      return true;
    },
    querySelector(sel) {
      return nodes[sel] || null;
    },
    createElement(tag) {
      const el = createElement(tag);
      el.rectFor = rectFor;
      return el;
    },
    createElementNS(_ns, tag) {
      const el = createElement(tag);
      el.rectFor = rectFor;
      return el;
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
  document.nodes["#pitch"] = document.pitch;
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

function boot(screenMatrix, cornersMeasurable) {
  const rectFor = (el) => {
    if (!cornersMeasurable) return { left: 0, top: 0, width: 0, height: 0 };
    const cx = Number(el.attrs.cx);
    const cy = Number(el.attrs.cy);
    const known = corners.find((corner) => corner.user.x === cx && corner.user.y === cy);
    if (!known) return { left: 0, top: 0, width: 0, height: 0 };
    const size = 0.63385;
    return {
      left: known.client.x - size / 2,
      top: known.client.y - size / 2,
      width: size,
      height: size,
    };
  };
  const document = createDocument(rectFor, screenMatrix);
  const page = loadGame(document);
  return { document, restore: page.restore };
}

function pressLevel(document, level) {
  const group = document.nodes["#play-level"];
  const button = group.children.find((child) => child.dataset.level === String(level));
  group.listeners.click[0]({ target: button });
}

function startDrill(document, id) {
  const list = document.nodes["#drill-list"];
  const item = list.querySelectorAll(".drill").find((el) => el.dataset.drillId === id);
  const button = item.querySelector(".drill-action");
  list.listeners.click[0]({ target: button });
}

function readTranslate(el) {
  const raw = el.getAttribute("transform") || "";
  const match = /translate\(\s*([-\d.eE+]+)\s+([-\d.eE+]+)\s*\)/.exec(raw);
  assert.ok(match, raw);
  return { x: Number(match[1]), y: Number(match[2]) };
}

function dragTo(pitch, client) {
  const token = pitch.querySelector("#drag-token");
  assert.equal(token.getAttribute("data-draggable"), "true");
  const pointer = {
    pointerId: 7,
    clientX: client.x,
    clientY: client.y,
    currentTarget: token,
    preventDefault() {},
  };
  token.listeners.pointerdown[0](pointer);
  token.listeners.pointermove[0](pointer);
  const followed = readTranslate(token);
  token.listeners.pointerup[0](pointer);
  return followed;
}

function near(actual, expected, slack) {
  assert.ok(Math.abs(actual.x - expected.x) <= slack, actual.x + " vs " + expected.x);
  assert.ok(Math.abs(actual.y - expected.y) <= slack, actual.y + " vs " + expected.y);
}

const openBody = drills.find((drill) => drill.id === "open-body");
const goodSpot = { x: 420, y: 676 };
const missSpot = { x: 520, y: 676 };

test("a fresh load opens Open body at score 0 and does not play Triangle", () => {
  const page = boot(matrixWithoutTurn, true);
  try {
    const list = page.document.nodes["#drill-list"];
    const open = list.querySelectorAll(".drill").find((item) => item.dataset.drillId === "open-body");
    const triangle = list
      .querySelectorAll(".drill")
      .find((item) => item.dataset.drillId === "triangle");
    const next = list.querySelectorAll(".drill").find((item) => item.dataset.tier === "next");
    assert.equal(open.className.includes("is-playing"), true);
    assert.equal(open.querySelector(".drill-action").textContent, "Playing");
    assert.equal(triangle.className.includes("is-playing"), false);
    assert.equal(triangle.querySelector(".drill-action").textContent, "Start");
    assert.equal(next.querySelector(".drill-action").textContent, "Locked");
    assert.equal(next.querySelector(".drill-action").disabled, true);
    assert.equal(page.document.nodes["#points"].textContent, "Score: 0");
    assert.equal(page.document.nodes["#play-status"].textContent, openBody.idea);
    const level1 = page.document.nodes["#play-level"].children[0];
    const level2 = page.document.nodes["#play-level"].children[1];
    assert.equal(level1.getAttribute("aria-pressed"), "true");
    assert.equal(level2.getAttribute("aria-pressed"), "false");
  } finally {
    page.restore();
  }
});

test("level 2 maps a finger through painted corners when the screen matrix omits the turn", () => {
  const finger = userToClient(goodSpot);
  const omitted = matrixPoint(matrixWithoutTurn, finger);
  near(omitted, { x: 110, y: -136 }, 1);

  const page = boot(matrixWithoutTurn, true);
  try {
    pressLevel(page.document, 2);
    const pitch = page.document.pitch;
    assert.equal(pitch.querySelectorAll(".marked-target").length, 0);
    assert.equal(pitch.querySelectorAll(".correction-spot").length, 0);
    const followed = dragTo(pitch, finger);
    near(followed, goodSpot, 0.05);
    const landed = readTranslate(pitch.querySelector("#drag-token"));
    near(landed, goodSpot, 0.05);
    assert.equal(page.document.nodes["#points"].textContent, "Score: 3");
    assert.equal(page.document.nodes["#play-status"].textContent, "You found a spot.");
    assert.equal(pitch.querySelectorAll(".correction-spot").length, 0);

    startDrill(page.document, "get-open");
    startDrill(page.document, "open-body");
    const again = dragTo(page.document.pitch, finger);
    near(again, goodSpot, 0.05);
    assert.equal(page.document.nodes["#points"].textContent, "Score: 4");
  } finally {
    page.restore();
  }
});

test("a level 2 miss stays on the pitch, adds 1, and shows the good spot", () => {
  const finger = userToClient(missSpot);
  const page = boot(matrixWithoutTurn, true);
  try {
    pressLevel(page.document, 2);
    const followed = dragTo(page.document.pitch, finger);
    near(followed, missSpot, 0.05);
    const landed = readTranslate(page.document.pitch.querySelector("#drag-token"));
    near(landed, missSpot, 0.05);
    assert.ok(landed.x > 0 && landed.x < 680);
    assert.ok(landed.y > 0 && landed.y < 1050);
    assert.equal(page.document.nodes["#points"].textContent, "Score: 1");
    assert.equal(
      page.document.nodes["#play-status"].textContent,
      "The good spot is a step beside the defender, where you can see the ball and the goal."
    );
    const shown = page.document.pitch.querySelectorAll(".correction-spot");
    assert.equal(shown.length, 1);
    assert.equal(shown[0].getAttribute("cx"), "420");
    assert.equal(shown[0].getAttribute("cy"), "676");
    assert.equal(page.document.pitch.querySelectorAll(".marked-target").length, 0);
  } finally {
    page.restore();
  }
});

test("a level 2 drop on a hidden wrong spot is a miss", () => {
  const page = boot(matrixWithoutTurn, true);
  try {
    const level2 = globalThis.SoccerAttempt.createLevelAttempt(openBody, 2);
    const wrong = level2.wrongChoices[0];
    assert.ok(wrong);
    const dx = wrong.x - goodSpot.x;
    const dy = wrong.y - goodSpot.y;
    assert.ok(dx * dx + dy * dy > 88 * 88);
    pressLevel(page.document, 2);
    assert.equal(page.document.pitch.querySelectorAll(".marked-target").length, 0);
    dragTo(page.document.pitch, userToClient(wrong));
    const landed = readTranslate(page.document.pitch.querySelector("#drag-token"));
    near(landed, wrong, 0.05);
    assert.ok(landed.x > 0 && landed.x < 680);
    assert.ok(landed.y > 0 && landed.y < 1050);
    assert.equal(page.document.nodes["#points"].textContent, "Score: 1");
    assert.notEqual(page.document.nodes["#play-status"].textContent, "You found a spot.");
    assert.equal(page.document.pitch.querySelectorAll(".marked-target").length, 0);
    assert.equal(page.document.pitch.querySelector(".correction-spot").getAttribute("cx"), "420");
  } finally {
    page.restore();
  }
});

test("level 1 pick still scores and does not use the drag", () => {
  const page = boot(matrixWithoutTurn, true);
  try {
    const pitch = page.document.pitch;
    const marks = pitch.querySelectorAll(".marked-target");
    assert.ok(marks.length >= 3);
    const good = marks.find((mark) => mark.getAttribute("data-target-id") === "b");
    assert.equal(pitch.querySelector("#drag-token").getAttribute("data-draggable"), "false");
    assert.equal(pitch.querySelector("#drag-token").listeners.pointerdown, undefined);
    good.listeners.click[0]({ preventDefault() {}, currentTarget: good });
    assert.equal(page.document.nodes["#points"].textContent, "Score: 3");
    assert.equal(page.document.nodes["#play-status"].textContent, "You found a spot.");
    near(readTranslate(pitch.querySelector("#drag-token")), goodSpot, 0.05);
  } finally {
    page.restore();
  }
});

test("the screen matrix is used when the painted corners are not measurable", () => {
  const finger = userToClient(goodSpot);
  near(matrixPoint(matrixWithTurn, finger), goodSpot, 0.05);
  const page = boot(matrixWithTurn, false);
  try {
    pressLevel(page.document, 2);
    const followed = dragTo(page.document.pitch, finger);
    near(followed, goodSpot, 0.05);
    assert.equal(page.document.nodes["#points"].textContent, "Score: 3");
  } finally {
    page.restore();
  }
});

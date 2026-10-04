const test = require("node:test");
const assert = require("node:assert/strict");
const { drills } = require("../js/catalog.js");

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
    toggle(name, force) {
      const names = new Set(el.className.split(/\s+/).filter(Boolean));
      const on = force === undefined ? !names.has(name) : Boolean(force);
      if (on) names.add(name);
      else names.delete(name);
      el.className = Array.from(names).join(" ");
      return on;
    },
  };

  el.setAttribute = (key, value) => {
    el.attrs[key] = String(value);
    if (key === "id") el.id = String(value);
  };
  el.getAttribute = (key) => (key in el.attrs ? el.attrs[key] : null);
  el.removeAttribute = (key) => {
    delete el.attrs[key];
  };
  el.addEventListener = (type, fn) => {
    el.listeners[type] = el.listeners[type] || [];
    el.listeners[type].push(fn);
  };
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
  return el;
}

function matches(el, sel) {
  if (sel.charAt(0) === ".") {
    return el.className.split(/\s+/).includes(sel.slice(1));
  }
  if (sel.charAt(0) === "#") {
    return el.id === sel.slice(1);
  }
  const attr = sel.match(/^([a-z]+)\[([^\]]+)\]$/);
  if (attr) return el.tagName === attr[1] && attr[2] in el.attrs;
  return el.tagName === sel;
}

function walk(el, visit) {
  visit(el);
  el.children.forEach((child) => walk(child, visit));
}

function createDocument() {
  const nodes = {};
  const listeners = {};
  const frame = createElement("div");
  frame.className = "pitch-frame";
  const pitch = createElement("svg");
  pitch.id = "pitch";
  frame.append(pitch);
  nodes["#pitch"] = pitch;

  const list = createElement("div");
  list.id = "drill-list";
  nodes["#drill-list"] = list;

  const status = createElement("p");
  status.id = "play-status";
  nodes["#play-status"] = status;

  const points = createElement("p");
  points.id = "points";
  points.textContent = "Score: 0";
  nodes["#points"] = points;

  const nextPlay = createElement("button");
  nextPlay.id = "next-play";
  nextPlay.disabled = true;
  nodes["#next-play"] = nextPlay;

  const level = createElement("div");
  level.id = "play-level";
  const level1 = createElement("button");
  level1.dataset.level = "1";
  const level2 = createElement("button");
  level2.dataset.level = "2";
  level.append(level1, level2);
  nodes["#play-level"] = level;

  return {
    nodes,
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
}

function boot(list) {
  const previous = {
    document: global.document,
    strategy: globalThis.SoccerStrategy,
    attempt: globalThis.SoccerAttempt,
    points: globalThis.SoccerPoints,
    clear: globalThis.SoccerClear,
    next: globalThis.SoccerNextPlay,
    celebrate: globalThis.SoccerCelebrate,
    progress: globalThis.SoccerProgressCopy,
    scenes: globalThis.StarterScenes,
  };
  const document = createDocument();
  const catalog = require("../js/catalog.js");
  const points = require("../js/points.js");
  let settled = 0;
  global.document = document;
  globalThis.SoccerStrategy = {
    drills: list,
    isLocked: catalog.isLocked,
    canStart: catalog.canStart,
  };
  globalThis.SoccerAttempt = require("../js/attempt.js");
  globalThis.SoccerPoints = {
    createSession: points.createSession,
    settle(session, attempt) {
      settled += 1;
      return points.settle(session, attempt);
    },
  };
  globalThis.SoccerClear = require("../js/clear.js");
  globalThis.SoccerNextPlay = require("../js/next-play.js");
  globalThis.SoccerCelebrate = require("../js/celebrate.js");
  globalThis.SoccerProgressCopy = require("../js/progress-copy.js");
  globalThis.StarterScenes = require("../js/starter-scenes.js");
  const gamePath = require.resolve("../js/game.js");
  delete require.cache[gamePath];
  require("../js/game.js");
  return {
    document,
    settled,
    restore() {
      delete require.cache[gamePath];
      if (previous.document === undefined) delete global.document;
      else global.document = previous.document;
      globalThis.SoccerStrategy = previous.strategy;
      globalThis.SoccerAttempt = previous.attempt;
      globalThis.SoccerPoints = previous.points;
      globalThis.SoccerClear = previous.clear;
      globalThis.SoccerNextPlay = previous.next;
      globalThis.SoccerCelebrate = previous.celebrate;
      globalThis.SoccerProgressCopy = previous.progress;
      globalThis.StarterScenes = previous.scenes;
    },
  };
}

function drillItem(list, id) {
  return list.querySelectorAll(".drill").find((item) => item.dataset.drillId === id);
}

test("a fresh load opens the first starter at score 0 and keeps Triangle", () => {
  const first = drills.find((drill) => drill.tier === "starter");
  assert.equal(first.name, "Open body");
  assert.notEqual(first.name, "Triangle");
  const page = boot(drills);
  try {
    const list = page.document.nodes["#drill-list"];
    const open = drillItem(list, "open-body");
    const triangle = drillItem(list, "triangle");
    assert.equal(open.className.includes("is-playing"), true);
    assert.equal(open.getAttribute("aria-current"), "true");
    assert.equal(open.querySelector(".drill-action").textContent, "Playing");
    assert.equal(triangle.className.includes("is-playing"), false);
    assert.equal(triangle.getAttribute("aria-current"), null);
    assert.equal(triangle.querySelector(".drill-action").textContent, "Start");
    assert.equal(page.document.nodes["#points"].textContent, "Score: 0");
    assert.equal(page.settled, 0);
    assert.equal(
      list.querySelector("h2").textContent,
      "Starter drills (0 of 20 done)"
    );
    assert.equal(
      page.document.nodes["#play-status"].textContent,
      first.idea
    );
    assert.equal(list.querySelectorAll(".drill").length, drills.length);
    const order = list.querySelectorAll(".drill").map((item) => item.dataset.drillId);
    assert.deepEqual(
      order,
      drills.map((drill) => drill.id)
    );
  } finally {
    page.restore();
  }
});

test("a leading Triangle starts with no drill and adds no points", () => {
  const triangle = drills.find((drill) => drill.name === "Triangle");
  const list = [triangle].concat(drills.filter((drill) => drill.id !== triangle.id));
  assert.equal(list[0].name, "Triangle");
  const page = boot(list);
  try {
    const drillList = page.document.nodes["#drill-list"];
    const playing = drillList
      .querySelectorAll(".drill")
      .filter((item) => item.className.split(/\s+/).includes("is-playing"));
    assert.equal(playing.length, 0);
    const shown = drillItem(drillList, "triangle");
    assert.equal(shown.querySelector(".drill-action").textContent, "Start");
    assert.equal(page.document.nodes["#points"].textContent, "Score: 0");
    assert.equal(page.settled, 0);
    assert.equal(
      page.document.nodes["#play-status"].textContent,
      "The pitch is ready. Start a starter drill."
    );
    assert.equal(page.document.nodes["#pitch"].getAttribute("role"), "img");
    assert.equal(
      drillList.querySelector("h2").textContent,
      "Starter drills (0 of 20 done)"
    );
  } finally {
    page.restore();
  }
});

(function () {
  const api = globalThis.SoccerStrategy;
  const attemptApi = globalThis.SoccerAttempt;
  const pointsApi = globalThis.SoccerPoints;
  const clearApi = globalThis.SoccerClear;
  const nextPlayApi = globalThis.SoccerNextPlay;
  const celebrateApi = globalThis.SoccerCelebrate;
  const progressCopy = globalThis.SoccerProgressCopy;
  const drills = api.drills;
  const listEl = document.querySelector("#drill-list");
  const statusEl = document.querySelector("#play-status");
  const pointsEl = document.querySelector("#points");
  const nextPlayEl = document.querySelector("#next-play");
  const pitchEl = document.querySelector("#pitch");
  const svgNS = "http://www.w3.org/2000/svg";

  const tiers = [
    {
      id: "starter",
      title: "Starter drills",
      note: "Play these from the start.",
    },
    {
      id: "next",
      title: "Next drills",
      note: "Locked until every starter is cleared.",
    },
    {
      id: "advanced",
      title: "Advanced drills",
      note: "Locked until every next drill is cleared.",
    },
  ];

  let currentId = null;
  let attempt = null;
  let drag = null;
  let level = 1;
  let session = pointsApi.createSession();
  let clearance = clearApi.createClearance();

  function kindLabel(kind) {
    return kind === "drag" ? "Drag" : "Pick";
  }

  function renderList() {
    const fragment = document.createDocumentFragment();

    tiers.forEach((tier) => {
      const group = drills.filter((drill) => drill.tier === tier.id);
      const section = document.createElement("section");
      section.className = "tier";
      section.dataset.tier = tier.id;

      const heading = document.createElement("h2");
      heading.id = "tier-" + tier.id;
      heading.textContent = headingText(tier, group);

      const note = document.createElement("p");
      note.className = "tier-note";
      note.textContent = noteText(tier);

      const list = document.createElement("ul");
      list.className = "drills";
      list.setAttribute("aria-labelledby", heading.id);

      group.forEach((drill) => {
        list.append(renderDrill(drill));
      });

      section.append(heading, note, list);
      fragment.append(section);
    });

    listEl.replaceChildren(fragment);
  }

  function renderDrill(drill) {
    const locked = api.isLocked(drill, session.endedDrills);
    const item = document.createElement("li");
    item.className = "drill" + (locked ? " is-locked" : "");
    item.dataset.drillId = drill.id;
    item.dataset.tier = drill.tier;
    item.dataset.kind = drill.kind;
    item.dataset.locked = locked ? "true" : "false";

    const name = document.createElement("span");
    name.className = "drill-name";
    name.textContent = drill.name;

    const idea = document.createElement("p");
    idea.className = "drill-idea";
    idea.textContent = drill.idea;

    const more = document.createElement("button");
    more.type = "button";
    more.className = "drill-more";
    more.dataset.action = "more";
    more.textContent = "More";
    more.setAttribute("aria-expanded", "false");
    more.setAttribute("aria-controls", "explainer-" + drill.id);
    more.setAttribute("aria-label", "More about " + drill.name);
    idea.append(more);

    const explainer = document.createElement("p");
    explainer.className = "drill-explainer";
    explainer.id = "explainer-" + drill.id;
    explainer.hidden = true;
    explainer.textContent = drill.explainer;

    const kind = document.createElement("span");
    kind.className = "drill-kind";
    kind.textContent = kindLabel(drill.kind);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "drill-action";
    item.append(name, idea, kind, explainer, button);
    paintButton(item, drill, button);
    return item;
  }

  function paintButton(item, drill, button) {
    const locked = api.isLocked(drill, session.endedDrills);
    const playing = drill.id === currentId;
    item.classList.toggle("is-locked", locked);
    item.dataset.locked = locked ? "true" : "false";
    item.classList.toggle("is-playing", playing);
    if (playing) item.setAttribute("aria-current", "true");
    else item.removeAttribute("aria-current");

    if (locked) {
      button.disabled = true;
      button.textContent = "Locked";
      button.removeAttribute("data-action");
      button.removeAttribute("aria-pressed");
      button.setAttribute("aria-label", drill.name + " is locked");
      return;
    }

    if (playing) {
      button.disabled = true;
      button.textContent = "Playing";
      button.removeAttribute("data-action");
      button.setAttribute("aria-pressed", "true");
      button.setAttribute("aria-label", "Playing " + drill.name);
      return;
    }

    button.disabled = false;
    button.textContent = "Start";
    button.dataset.action = "start";
    button.removeAttribute("aria-pressed");
    button.setAttribute("aria-label", "Start " + drill.name);
  }

  function drillsIn(tierId) {
    return drills.filter((drill) => drill.tier === tierId);
  }

  function doneIn(tierId) {
    return drillsIn(tierId).filter((drill) => session.endedDrills.indexOf(drill.id) !== -1)
      .length;
  }

  function headingText(tier, group) {
    if (tier.id === "starter") {
      return progressCopy.starterHeading(tier.title, doneIn("starter"), group.length);
    }
    return tier.title + " (" + group.length + ")";
  }

  function noteText(tier) {
    if (tier.id === "starter") return tier.note;
    const gate = tier.id === "next" ? "starter" : "next";
    const total = drillsIn(gate).length;
    return progressCopy.lockedLeft(total - doneIn(gate), gate);
  }

  function paintTierCopy() {
    listEl.querySelectorAll(".tier").forEach((section) => {
      const tier = tiers.find((entry) => entry.id === section.dataset.tier);
      if (!tier) return;
      const group = drillsIn(tier.id);
      const heading = section.querySelector("h2");
      const note = section.querySelector(".tier-note");
      if (heading) heading.textContent = headingText(tier, group);
      if (note) note.textContent = noteText(tier);
    });
  }

  function renderPoints() {
    pointsEl.textContent = "Score: " + session.points;
  }

  function renderNextPlay() {
    nextPlayEl.disabled = !nextPlayApi.buttonEnabled(attempt);
  }

  function freshAttempt(drill) {
    if (typeof attemptApi.createLevelAttempt === "function") {
      return attemptApi.createLevelAttempt(drill, level);
    }
    if (drill.kind === "drag") return attemptApi.createAttempt(drill);
    if (drill.kind === "pick") return attemptApi.createPickAttempt(drill);
    return null;
  }

  function paintLevels() {
    const group = document.querySelector("#play-level");
    if (!group) return;
    group.querySelectorAll("button[data-level]").forEach((button) => {
      const on = Number(button.dataset.level) === level;
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function startDrill(drill) {
    if (!drill || !api.canStart(drill, session.endedDrills)) return;
    document.dispatchEvent(
      new CustomEvent("starter-scene-reset", { detail: { drillId: drill.id } })
    );
    currentId = drill.id;
    drag = null;
    attempt = freshAttempt(drill);
    sync();
  }

  function refreshDrills() {
    paintTierCopy();
    listEl.querySelectorAll(".drill").forEach((item) => {
      const drill = drills.find((entry) => entry.id === item.dataset.drillId);
      paintButton(item, drill, item.querySelector(".drill-action"));
    });
  }

  function settleEnded(previous) {
    if (attempt && attempt.ended === true && attempt !== previous) {
      session = pointsApi.settle(session, attempt);
      clearance = clearApi.noteEnded(clearance, attempt);
      if (clearApi.isCleared(clearance, attempt.drillId)) {
        session = clearApi.markEnded(session, attempt.drillId);
      }
      refreshDrills();
    }
    renderPoints();
  }

  function renderStatus() {
    renderNextPlay();
    const current = drills.find((drill) => drill.id === currentId) || null;
    const view = attempt ? attemptApi.presentation(attempt) : null;
    statusEl.dataset.state = attempt ? attempt.state : "";
    pitchEl.setAttribute("role", attempt ? "group" : "img");

    if (!current) {
      statusEl.textContent = "The pitch is ready. Start a starter drill.";
      pitchEl.setAttribute("aria-label", "Top-down soccer pitch");
      return;
    }

    if (view && view.confirmation) {
      statusEl.textContent = view.confirmation;
      pitchEl.setAttribute(
        "aria-label",
        "Top-down soccer pitch. " + view.confirmation
      );
      return;
    }

    if (attempt && attempt.state === "miss") {
      const answer = view && view.spotLine ? view.spotLine : "";
      statusEl.textContent = answer;
      pitchEl.setAttribute("aria-label", "Top-down soccer pitch. " + answer);
      return;
    }

    statusEl.textContent = current.idea;
    pitchEl.setAttribute("aria-label", "Top-down soccer pitch. " + current.idea);
  }

  function svgEl(name, attrs) {
    const el = document.createElementNS(svgNS, name);
    Object.keys(attrs).forEach((key) => {
      el.setAttribute(key, String(attrs[key]));
    });
    return el;
  }

  function pitchPoint(event) {
    const matrix = pitchEl.getScreenCTM();
    if (!matrix) return null;
    const point = pitchEl.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    return { x: local.x, y: local.y };
  }

  function paintSpot(spot) {
    const mark = svgEl("circle", {
      class: "correction-spot",
      cx: spot.x,
      cy: spot.y,
      r: spot.r,
      "data-correction": "true",
    });
    const title = document.createElementNS(svgNS, "title");
    title.textContent = "Good spot";
    mark.append(title);
    return mark;
  }

  function movePiece(piece, point) {
    piece.setAttribute("transform", "translate(" + point.x + " " + point.y + ")");
  }

  function chooseTarget(mark) {
    const view = attempt ? attemptApi.presentation(attempt) : null;
    if (!view || !view.pickable) return;
    const targetId = mark.getAttribute("data-target-id");
    const previous = attempt;
    // pick reveals a miss answer before it marks the attempt over.
    attempt = attemptApi.pick(previous, targetId);
    settleEnded(previous);
    renderAttempt();
    renderStatus();
  }

  function onPick(event) {
    event.preventDefault();
    chooseTarget(event.currentTarget);
  }

  function onPickKey(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    chooseTarget(event.currentTarget);
  }

  function paintTarget(target, pickable) {
    const mark = svgEl("g", {
      class: "marked-target",
      "data-target-id": target.id,
      "data-pickable": pickable ? "true" : "false",
    });
    mark.append(
      svgEl("circle", {
        class: "marked-target-spot",
        cx: target.x,
        cy: target.y,
        r: target.r,
      })
    );
    const title = document.createElementNS(svgNS, "title");
    title.textContent = "Marked target";
    mark.append(title);
    if (pickable) {
      mark.setAttribute("role", "button");
      mark.setAttribute("tabindex", "0");
      mark.setAttribute("aria-label", "Choose this marked target");
      mark.addEventListener("click", onPick);
      mark.addEventListener("keydown", onPickKey);
    } else {
      mark.setAttribute("aria-hidden", "true");
    }
    return mark;
  }

  function onPointerDown(event) {
    const view = attempt ? attemptApi.presentation(attempt) : null;
    if (!view || !view.draggable) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag = { pointerId: event.pointerId, attempt };
    event.currentTarget.classList.add("is-dragging");
  }

  function onPointerMove(event) {
    if (!drag || drag.pointerId !== event.pointerId || drag.attempt !== attempt) {
      return;
    }
    const view = attemptApi.presentation(attempt);
    if (!view.draggable) return;
    const point = pitchPoint(event);
    if (!point) return;
    movePiece(event.currentTarget, point);
  }

  function onPointerCancel(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag = null;
    renderAttempt();
  }

  function onPointerUp(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const started = drag.attempt;
    drag = null;
    if (started !== attempt) return;
    const view = attemptApi.presentation(started);
    if (!view.draggable) return;
    const point = pitchPoint(event);
    if (!point) return;
    const previous = attempt;
    // drop reveals a miss answer before it marks the attempt over.
    attempt = attemptApi.drop(started, point);
    settleEnded(previous);
    renderAttempt();
    renderStatus();
  }

  function paintToken(token, draggable) {
    const piece = svgEl("g", {
      id: "drag-token",
      class: "drag-piece",
      "data-draggable": draggable ? "true" : "false",
    });
    movePiece(piece, token);
    piece.append(
      svgEl("circle", { class: "drag-hit", cx: 0, cy: 0, r: 44 }),
      svgEl("circle", { class: "drag-token", cx: 0, cy: 0, r: 28 })
    );
    if (draggable) {
      piece.setAttribute("role", "button");
      piece.setAttribute("aria-label", "Drag to a spot");
      piece.addEventListener("pointerdown", onPointerDown);
      piece.addEventListener("pointermove", onPointerMove);
      piece.addEventListener("pointerup", onPointerUp);
      piece.addEventListener("pointercancel", onPointerCancel);
    } else {
      piece.setAttribute("aria-hidden", "true");
    }
    return piece;
  }

  function paintMotion(motion) {
    const start = motion.frames[0];
    const end = motion.frames[motion.frames.length - 1];
    const group = svgEl("g", {
      id: "next-moment",
      class: "next-moment",
      "data-animation": motion.id,
    });
    const runner = svgEl("circle", {
      class: "next-moment-runner",
      cx: start.x,
      cy: start.y,
      r: 16,
    });
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    runner.append(
      svgEl("animateMotion", {
        dur: motion.durationMs + "ms",
        repeatCount: motion.repeatCount,
        fill: "freeze",
        begin: "0s",
        path: "M 0 0 L " + dx + " " + dy,
      })
    );
    const title = document.createElementNS(svgNS, "title");
    title.textContent = "Next moment";
    group.append(title, runner);
    return group;
  }

  function paintCelebration(mark) {
    const group = svgEl("g", {
      id: "spot-celebration",
      class: "spot-celebration",
      "data-celebration": "correct",
      "aria-hidden": "true",
    });

    function placed(className, point, child) {
      const wrap = svgEl("g", {
        transform: "translate(" + point.x + " " + point.y + ")",
      });
      const spin = svgEl("g", { class: className });
      if (point.delayMs) spin.style.animationDelay = point.delayMs + "ms";
      spin.append(child);
      wrap.append(spin);
      group.append(wrap);
    }

    placed(
      "burst-disc",
      mark.disc,
      svgEl("circle", {
        class: "burst-disc-shape",
        cx: 0,
        cy: 0,
        r: mark.disc.r,
      })
    );
    placed(
      "burst-ring",
      mark.ring,
      svgEl("circle", {
        class: "burst-ring-shape",
        cx: 0,
        cy: 0,
        r: mark.ring.r,
      })
    );
    mark.stars.forEach((star) => {
      placed(
        "burst-star",
        star,
        svgEl("polygon", {
          class: "burst-star-shape",
          points: mark.shapes[star.shape],
          fill: star.fill,
        })
      );
    });
    return group;
  }

  function renderAttempt() {
    const frame = pitchEl.closest(".pitch-frame");
    const mark = attempt ? celebrateApi.celebrationFor(attempt) : null;
    if (frame) frame.classList.toggle("is-celebrating", Boolean(mark));

    const existing = pitchEl.querySelector("#attempt-layer");
    if (!attempt) {
      if (existing) existing.remove();
      return;
    }

    const layer = existing || svgEl("g", { id: "attempt-layer" });
    if (!existing) pitchEl.append(layer);
    layer.replaceChildren();

    const view = attemptApi.presentation(attempt);
    // Level 2 sends visibleTargets so a zone is not drawn. Pick marks still are.
    const painted = view.visibleTargets || view.targets;
    if (painted) {
      painted.forEach((target) => {
        layer.append(paintTarget(target, view.pickable));
      });
    }
    view.correctionSpots.forEach((spot) => {
      layer.append(paintSpot(spot));
    });
    if (attempt.token) {
      layer.append(paintToken(attempt.token, view.draggable));
    }
    const motion = nextPlayApi.animationFor(attempt);
    if (motion) layer.append(paintMotion(motion));
    if (mark) layer.append(paintCelebration(mark));
  }

  function sync() {
    refreshDrills();
    renderAttempt();
    renderStatus();
    renderPoints();
  }

  listEl.addEventListener("click", (event) => {
    const more = event.target.closest("button[data-action='more']");
    if (more) {
      const item = more.closest("[data-drill-id]");
      const explainer = item.querySelector(".drill-explainer");
      const open = explainer.hidden;
      explainer.hidden = !open;
      more.setAttribute("aria-expanded", open ? "true" : "false");
      more.textContent = open ? "Less" : "More";
      const drillName = item.querySelector(".drill-name").textContent;
      more.setAttribute(
        "aria-label",
        (open ? "Less about " : "More about ") + drillName
      );
      return;
    }
    const button = event.target.closest("button[data-action='start']");
    if (!button) return;
    const item = button.closest("[data-drill-id]");
    const drill = drills.find((entry) => entry.id === item.dataset.drillId);
    startDrill(drill);
  });

  nextPlayEl.addEventListener("click", () => {
    if (!nextPlayApi.buttonEnabled(attempt)) return;
    startDrill(nextPlayApi.nextInTier(drills, currentId));
  });

  // The scene asks for this when its picture changes before the try ends.
  // Switching pictures replaces the playing attempt. It does not end one.
  document.addEventListener("starter-scene-change", () => {
    if (!currentId || !attempt || attempt.state !== "playing") return;
    const drill = drills.find((entry) => entry.id === currentId);
    if (!drill) return;
    drag = null;
    if (typeof attemptApi.createLevelAttempt === "function") {
      attempt = attemptApi.createLevelAttempt(drill, level);
    } else if (drill.kind === "drag") attempt = attemptApi.createAttempt(drill);
    else if (drill.kind === "pick") attempt = attemptApi.createPickAttempt(drill);
    else return;
    sync();
  });

  const playLevelEl = document.querySelector("#play-level");
  if (playLevelEl) {
    playLevelEl.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-level]");
      if (!button) return;
      const nextLevel = Number(button.dataset.level);
      if (nextLevel !== 1 && nextLevel !== 2) return;
      if (nextLevel === level) return;
      level = nextLevel;
      paintLevels();
      if (!currentId) return;
      const drill = drills.find((entry) => entry.id === currentId);
      if (!drill || !api.canStart(drill, session.endedDrills)) return;
      drag = null;
      attempt = freshAttempt(drill);
      sync();
    });
  }

  const helpButton = document.querySelector("#game-help");
  const helpPanel = document.querySelector("#game-help-panel");

  function helpIsOpen() {
    return Boolean(helpPanel && helpPanel.open);
  }

  function openHelp() {
    if (!helpButton || !helpPanel || helpIsOpen()) return;
    helpButton.setAttribute("aria-expanded", "true");
    helpPanel.showModal();
  }

  function closeHelp() {
    if (!helpPanel || !helpIsOpen()) return;
    helpPanel.close();
  }

  if (helpButton && helpPanel) {
    helpButton.addEventListener("click", () => {
      if (helpIsOpen()) closeHelp();
      else openHelp();
    });
    helpPanel.addEventListener("close", () => {
      helpButton.setAttribute("aria-expanded", "false");
    });
    helpPanel.addEventListener("click", (event) => {
      if (event.target === helpPanel || event.target.closest("[data-action='close-help']")) {
        closeHelp();
      }
    });
  }

  renderList();
  paintLevels();
  const opening = drills.find((drill) => drill.id === "triangle");
  startDrill(opening);
  if (!currentId) {
    renderStatus();
    renderPoints();
  }
  if (globalThis.StarterScenes && typeof globalThis.StarterScenes.redraw === "function") {
    globalThis.StarterScenes.redraw();
  }
})();

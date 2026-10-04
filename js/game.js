(function () {
  const api = globalThis.SoccerStrategy;
  const attemptApi = globalThis.SoccerAttempt;
  const pointsApi = globalThis.SoccerPoints;
  const drills = api.drills;
  const listEl = document.querySelector("#drill-list");
  const statusEl = document.querySelector("#play-status");
  const pointsEl = document.querySelector("#points");
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
  let session = pointsApi.createSession();

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
      heading.textContent = tier.title + " (" + group.length + ")";

      const note = document.createElement("p");
      note.className = "tier-note";
      note.textContent = tier.note;

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
    const locked = api.isLocked(drill);
    const item = document.createElement("li");
    item.className = "drill" + (locked ? " is-locked" : "");
    item.dataset.drillId = drill.id;
    item.dataset.tier = drill.tier;
    item.dataset.kind = drill.kind;
    item.dataset.locked = locked ? "true" : "false";

    const name = document.createElement("span");
    name.className = "drill-name";
    name.textContent = drill.name;

    const kind = document.createElement("span");
    kind.className = "drill-kind";
    kind.textContent = kindLabel(drill.kind);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "drill-action";
    item.append(name, kind, button);
    paintButton(item, drill, button);
    return item;
  }

  function paintButton(item, drill, button) {
    const playing = drill.id === currentId;
    item.classList.toggle("is-playing", playing);
    if (playing) item.setAttribute("aria-current", "true");
    else item.removeAttribute("aria-current");

    if (api.isLocked(drill)) {
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

  function renderPoints() {
    pointsEl.textContent = "Points: " + session.points;
  }

  function settleEnded(previous) {
    if (attempt && attempt.ended === true && attempt !== previous) {
      session = pointsApi.settle(session, attempt);
    }
    renderPoints();
  }

  function renderStatus() {
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
      const answer =
        attempt.kind === "pick" ? "The answer is shown." : "Good spots are shown.";
      statusEl.textContent = answer;
      pitchEl.setAttribute("aria-label", "Top-down soccer pitch. " + answer);
      return;
    }

    statusEl.textContent = "Playing " + current.name + ".";
    pitchEl.setAttribute(
      "aria-label",
      "Top-down soccer pitch. Playing " + current.name + "."
    );
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

  function renderAttempt() {
    const existing = pitchEl.querySelector("#attempt-layer");
    if (!attempt) {
      if (existing) existing.remove();
      return;
    }

    const layer = existing || svgEl("g", { id: "attempt-layer" });
    if (!existing) pitchEl.append(layer);
    layer.replaceChildren();

    const view = attemptApi.presentation(attempt);
    if (view.targets) {
      view.targets.forEach((target) => {
        layer.append(paintTarget(target, view.pickable));
      });
      view.correctionSpots.forEach((spot) => {
        layer.append(paintSpot(spot));
      });
      return;
    }
    view.correctionSpots.forEach((spot) => {
      layer.append(paintSpot(spot));
    });
    layer.append(paintToken(attempt.token, view.draggable));
  }

  function sync() {
    listEl.querySelectorAll(".drill").forEach((item) => {
      const drill = drills.find((entry) => entry.id === item.dataset.drillId);
      paintButton(item, drill, item.querySelector("button"));
    });
    renderAttempt();
    renderStatus();
    renderPoints();
  }

  listEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action='start']");
    if (!button) return;
    const item = button.closest("[data-drill-id]");
    const drill = drills.find((entry) => entry.id === item.dataset.drillId);
    if (!drill || !api.canStart(drill)) return;
    currentId = drill.id;
    drag = null;
    if (drill.kind === "drag") attempt = attemptApi.createAttempt(drill);
    else if (drill.kind === "pick") attempt = attemptApi.createPickAttempt(drill);
    else attempt = null;
    sync();
  });

  renderList();
  renderStatus();
  renderPoints();
})();

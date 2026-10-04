(function () {
  const api = globalThis.SoccerStrategy;
  const drills = api.drills;
  const listEl = document.querySelector("#drill-list");
  const statusEl = document.querySelector("#play-status");
  const pitchEl = document.querySelector("#pitch");

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

  function renderStatus() {
    const current = drills.find((drill) => drill.id === currentId) || null;
    if (!current) {
      statusEl.textContent = "The pitch is ready. Start a starter drill.";
      pitchEl.setAttribute("aria-label", "Top-down soccer pitch");
      return;
    }
    statusEl.textContent = "Playing " + current.name + ".";
    pitchEl.setAttribute(
      "aria-label",
      "Top-down soccer pitch. Playing " + current.name + "."
    );
  }

  function sync() {
    listEl.querySelectorAll(".drill").forEach((item) => {
      const drill = drills.find((entry) => entry.id === item.dataset.drillId);
      paintButton(item, drill, item.querySelector("button"));
    });
    renderStatus();
  }

  listEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action='start']");
    if (!button) return;
    const item = button.closest("[data-drill-id]");
    const drill = drills.find((entry) => entry.id === item.dataset.drillId);
    if (!drill || !api.canStart(drill)) return;
    currentId = drill.id;
    sync();
  });

  renderList();
  renderStatus();
})();

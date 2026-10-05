// SVG marks on the pitch: a marked target, the dragged player,
// the next-moment runner, and a correct ending.
// Pick and drag handling stay on the page.
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.SoccerRender = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const svgNS = "http://www.w3.org/2000/svg";

  function svgEl(name, attrs) {
    const el = document.createElementNS(svgNS, name);
    Object.keys(attrs).forEach((key) => {
      el.setAttribute(key, String(attrs[key]));
    });
    return el;
  }

  function paintTarget(target, pickable, onPick, onPickKey) {
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

  function paintToken(
    token,
    draggable,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    coverMarks
  ) {
    if (coverMarks !== false) coverMarks = true;
    const piece = svgEl("g", {
      id: "drag-token",
      class: "drag-piece",
      "data-draggable": draggable ? "true" : "false",
    });
    piece.setAttribute("transform", "translate(" + token.x + " " + token.y + ")");
    // Other Level 1 drills keep the 44px cover over a nearby mark.
    // Only Goalkeeper step-out Level 1 lets Central take the click.
    if (draggable || coverMarks) {
      piece.append(svgEl("circle", { class: "drag-hit", cx: 0, cy: 0, r: 44 }));
    }
    piece.append(svgEl("circle", { class: "drag-token", cx: 0, cy: 0, r: 28 }));
    if (draggable) {
      piece.setAttribute("role", "button");
      piece.setAttribute("aria-label", "Drag to a spot");
      piece.addEventListener("pointerdown", onPointerDown);
      piece.addEventListener("pointermove", onPointerMove);
      piece.addEventListener("pointerup", onPointerUp);
      piece.addEventListener("pointercancel", onPointerCancel);
    } else {
      piece.setAttribute("aria-hidden", "true");
      if (!coverMarks) piece.setAttribute("pointer-events", "none");
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

  return Object.freeze({
    svgEl: svgEl,
    paintTarget: paintTarget,
    paintToken: paintToken,
    paintCelebration: paintCelebration,
    paintMotion: paintMotion,
  });
});

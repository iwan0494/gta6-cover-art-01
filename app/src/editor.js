// Neon Coast Cover Studio — editor: state, undo, drag/zoom, export.
//
// The editor owns one piece of state (layout, grade, title, subtitle, and
// a per-slot override map). Every mutation first snapshots the previous
// state, so undo always steps back to exactly what was on screen before
// the change — including drags, which snapshot once at pointerdown.

import { CAST, photoById, shotById } from "./faces.js";
import { LAYOUTS, GRADES, layoutById, gradeById, defaultState, renderToCanvas, checkFaceGuard } from "./cover.js";

const $ = (sel) => document.querySelector(sel);

export function createEditor(canvas) {
  const ctx = canvas.getContext("2d");
  let state = defaultState();
  let images = new Map();
  let undoStack = [];
  let redoStack = [];
  let selected = 0;
  let drag = null;

  function snapshot() {
    undoStack.push(JSON.parse(JSON.stringify(state)));
    if (undoStack.length > 60) undoStack.shift();
    redoStack = [];
  }

  function setState(next, record = true) {
    if (record) snapshot();
    state = next;
    draw();
    syncPanel();
  }

  function slots() {
    return layoutById(state.layout).slots(canvas.width, canvas.height);
  }

  function loadImages() {
    const jobs = CAST.map(
      (p) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            images.set(p.id, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = p.src;
        })
    );
    return Promise.all(jobs);
  }

  // Render through cover.js, so the editor preview and the PNG exports
  // share exactly one code path.
  function draw() {
    import("./cover.js").then((m) => {
      m.renderCover(ctx, canvas.width, canvas.height, state, images);
      markSelected();
    });
  }

  function markSelected() {
    const list = slots();
    const s = list[selected];
    if (!s) return;
    ctx.save();
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(s.x * canvas.width + 2, s.y * canvas.height + 2, s.w * canvas.width - 4, s.h * canvas.height - 4);
    ctx.restore();
  }

  function syncPanel() {
    const list = slots();
    const s = list[selected];
    const info = $("#panel-info");
    if (!s || !info) return;
    const ov = state.panels[selected] || {};
    const photo = photoById(ov.photo || s.photo);
    const sh = shotById(photo, ov.shot || s.shot);
    info.textContent = `Panel ${selected + 1} — ${photo.role} · ${sh.label} · drag to reframe, wheel to zoom`;
    const guard = checkFaceGuard(list.map((sl, i) => {
      const o = state.panels[i] || {};
      return { photo: o.photo || sl.photo, shot: o.shot || sl.shot };
    }));
    const warn = $("#face-warn");
    if (warn) warn.style.display = guard.ok ? "none" : "block";
  }

  function slotAt(px, py) {
    const r = canvas.getBoundingClientRect();
    const x = ((px - r.left) / r.width) * canvas.width;
    const y = ((py - r.top) / r.height) * canvas.height;
    const list = slots();
    for (let i = list.length - 1; i >= 0; i--) {
      const s = list[i];
      if (x >= s.x * canvas.width && x <= (s.x + s.w) * canvas.width && y >= s.y * canvas.height && y <= (s.y + s.h) * canvas.height) {
        return i;
      }
    }
    return -1;
  }

  function bindPointer() {
    canvas.addEventListener("pointerdown", (e) => {
      const i = slotAt(e.clientX, e.clientY);
      if (i < 0) return;
      selected = i;
      snapshot();
      drag = { x: e.clientX, y: e.clientY, moved: false };
      canvas.setPointerCapture(e.pointerId);
      draw();
      syncPanel();
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const r = canvas.getBoundingClientRect();
      const dx = (e.clientX - drag.x) / r.width;
      const dy = (e.clientY - drag.y) / r.height;
      if (Math.abs(dx) + Math.abs(dy) > 0.002) drag.moved = true;
      const ov = { ...(state.panels[selected] || {}) };
      ov.dx = (ov.dx || 0) - dx * 0.9;
      ov.dy = (ov.dy || 0) - dy * 0.9;
      state.panels[selected] = ov;
      drag.x = e.clientX;
      drag.y = e.clientY;
      draw();
    });
    canvas.addEventListener("pointerup", () => {
      if (drag && !drag.moved) undoStack.pop(); // a plain click is not a change
      drag = null;
    });
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const i = slotAt(e.clientX, e.clientY);
      if (i < 0) return;
      snapshot();
      const ov = { ...(state.panels[i] || {}) };
      const z = ov.zoom || 1;
      ov.zoom = Math.max(1, Math.min(3, z * (e.deltaY < 0 ? 1.12 : 0.89)));
      state.panels[i] = ov;
      selected = i;
      draw();
      syncPanel();
    }, { passive: false });
  }

  function buildControls() {
    const layouts = $("#layouts");
    LAYOUTS.forEach((l) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = l.name;
      b.dataset.layout = l.id;
      b.addEventListener("click", () => {
        setState({ ...state, layout: l.id, panels: {} });
        refreshChips();
      });
      layouts.appendChild(b);
    });
    const grades = $("#grades");
    GRADES.forEach((g) => {
      const b = document.createElement("button");
      b.className = "chip grade-chip";
      b.textContent = g.name;
      b.dataset.grade = g.id;
      b.style.setProperty("--sw", g.tint);
      b.addEventListener("click", () => {
        setState({ ...state, grade: g.id });
        refreshChips();
      });
      grades.appendChild(b);
    });
    const photos = $("#photos");
    CAST.forEach((p) => {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = p.role;
      b.addEventListener("click", () => cyclePhoto(p.id));
      photos.appendChild(b);
    });
    const title = $("#title-input");
    title.value = state.title;
    title.addEventListener("input", () => {
      state = { ...state, title: title.value.toUpperCase().slice(0, 24) };
      draw();
    });
    title.addEventListener("change", () => snapshot());
    const sub = $("#subtitle-input");
    sub.value = state.subtitle;
    sub.addEventListener("input", () => {
      state = { ...state, subtitle: sub.value.slice(0, 40) };
      draw();
    });
    sub.addEventListener("change", () => snapshot());
    $("#undo-btn").addEventListener("click", undo);
    $("#redo-btn").addEventListener("click", redo);
    $("#export-btn").addEventListener("click", exportAll);
    $("#upload-input").addEventListener("change", onUpload);
    $("#shot-btn").addEventListener("click", cycleShot);
    refreshChips();
  }

  function refreshChips() {
    document.querySelectorAll("[data-layout]").forEach((b) => b.classList.toggle("active", b.dataset.layout === state.layout));
    document.querySelectorAll("[data-grade]").forEach((b) => b.classList.toggle("active", b.dataset.grade === state.grade));
  }

  function cyclePhoto(id) {
    snapshot();
    const list = slots();
    const s = list[selected];
    if (!s) return;
    const ov = { ...(state.panels[selected] || {}) };
    ov.photo = id;
    ov.shot = photoById(id).shots[0].id;
    ov.dx = 0;
    ov.dy = 0;
    ov.zoom = 1;
    state.panels[selected] = ov;
    draw();
    syncPanel();
  }

  function cycleShot() {
    snapshot();
    const list = slots();
    const s = list[selected];
    if (!s) return;
    const ov = { ...(state.panels[selected] || {}) };
    const photo = photoById(ov.photo || s.photo);
    const cur = ov.shot || s.shot;
    const idx = photo.shots.findIndex((x) => x.id === cur);
    const next = photo.shots[(idx + 1) % photo.shots.length];
    ov.shot = next.id;
    ov.dx = 0;
    ov.dy = 0;
    ov.zoom = 1;
    state.panels[selected] = ov;
    draw();
    syncPanel();
  }

  function onUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const id = "upload-" + Date.now();
      CAST.push({ id, src: url, role: "YOUR PHOTO", face: { x: 0.3, y: 0.06, w: 0.4, h: 0.32 }, shots: [{ id: "face", label: "Your photo", face: true, focus: { x: 0.5, y: 0.22 } }] });
      images.set(id, img);
      cyclePhoto(id);
    };
    img.src = url;
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(JSON.parse(JSON.stringify(state)));
    state = undoStack.pop();
    draw();
    syncPanel();
    refreshChips();
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(JSON.parse(JSON.stringify(state)));
    state = redoStack.pop();
    draw();
    syncPanel();
    refreshChips();
  }

  async function exportAll() {
    const btn = $("#export-btn");
    btn.disabled = true;
    btn.textContent = "Exporting…";
    const sizes = [
      [1080, 1080, "neon-coast-1080x1080.png"],
      [1080, 1350, "neon-coast-1080x1350.png"],
      [1920, 1080, "neon-coast-1920x1080.png"],
    ];
    for (let i = 0; i < sizes.length; i++) {
      const [w, h, name] = sizes[i];
      const c = renderToCanvas(w, h, state, images);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = name;
      a.click();
      if (i < sizes.length - 1) await new Promise((r) => setTimeout(r, 600));
    }
    btn.disabled = false;
    btn.textContent = "Export 3 PNGs";
  }

  // Exposed for ?shot= mode and for tests.
  return {
    get state() {
      return state;
    },
    setState(next) {
      state = next;
      draw();
      syncPanel();
      refreshChips();
    },
    undo,
    redo,
    exportAll,
    images,
    ready: loadImages().then(() => {
      buildControls();
      bindPointer();
      draw();
      syncPanel();
      return true;
    }),
  };
}

// editor.js — the cover studio: photo picks, layout + grade, per-panel crop,
// undo/redo (snapshot BEFORE the mutation), one-click 3-size PNG export.

import { SAMPLES, sampleById, shotShowsFace, defaultUploadCrop } from "./faces.js";
import { GRADES, LAYOUTS, layoutById, assignPanels, defaultState, renderCover, faceCounts } from "./cover.js";

export const EXPORT_SIZES = [
  { w: 1080, h: 1080, name: "cover-1080x1080.png" },
  { w: 1080, h: 1350, name: "cover-1080x1350.png" },
  { w: 1920, h: 1080, name: "cover-1920x1080.png" },
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("cannot load " + src));
    img.src = src;
  });
}

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

export async function bootEditor() {
  const images = {};
  for (const s of SAMPLES) {
    try {
      images[s.id] = await loadImage(s.src);
    } catch (e) {
      console.warn(e.message);
    }
  }

  const state = defaultState();
  const canvas = document.getElementById("coverCanvas");
  const info = document.getElementById("panelInfo");
  let selected = 1; // the hero panel, by default
  let uploads = 0;

  // --- history: snapshot BEFORE every mutation ------------------------------
  const past = [];
  const future = [];
  function snapshot() {
    past.push(clone(state));
    if (past.length > 60) past.shift();
    future.length = 0;
    refreshUndoButtons();
  }
  function undo() {
    if (!past.length) return;
    future.push(clone(state));
    Object.assign(state, past.pop());
    selected = Math.min(selected, state.panels.length - 1);
    refreshUndoButtons();
    draw();
  }
  function redo() {
    if (!future.length) return;
    past.push(clone(state));
    Object.assign(state, future.pop());
    selected = Math.min(selected, state.panels.length - 1);
    refreshUndoButtons();
    draw();
  }
  function refreshUndoButtons() {
    document.getElementById("undoBtn").disabled = !past.length;
    document.getElementById("redoBtn").disabled = !future.length;
  }

  // --- layout / grade / title controls --------------------------------------
  const layoutRow = document.getElementById("layoutRow");
  const gradeRow = document.getElementById("gradeRow");
  const photoRow = document.getElementById("photoRow");

  for (const layout of LAYOUTS) {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = layout.name;
    b.dataset.layout = layout.id;
    b.onclick = () => {
      if (state.layout === layout.id) return;
      snapshot();
      state.layout = layout.id;
      state.panels = assignPanels(layout.id);
      selected = state.panels.findIndex((p) => p.hero);
      if (selected < 0) selected = 0;
      markActive();
      draw();
    };
    layoutRow.appendChild(b);
  }
  for (const grade of GRADES) {
    const b = document.createElement("button");
    b.className = "swatch";
    b.dataset.grade = grade.id;
    b.style.setProperty("--sw1", grade.tint);
    b.style.setProperty("--sw2", grade.sky);
    b.innerHTML = `<span>${grade.name}</span>`;
    b.onclick = () => {
      if (state.grade === grade.id) return;
      snapshot();
      state.grade = grade.id;
      markActive();
      draw();
    };
    gradeRow.appendChild(b);
  }

  function thumb(photo, label) {
    const b = document.createElement("button");
    b.className = "thumb";
    b.dataset.photo = photo.id;
    b.innerHTML = `<img src="${photo.src}" alt="${label}"><span>${label}</span>`;
    b.onclick = () => {
      snapshot();
      const slot = layoutById(state.layout).slots[selected];
      const faceShot = photo.shots.find((s) => shotShowsFace(photo, s));
      const detailShot = photo.shots.find((s) => !shotShowsFace(photo, s));
      const shot = slot && slot.kind === "detail" ? detailShot || photo.shots[0] : faceShot || photo.shots[0];
      state.panels[selected] = {
        photo: photo.id, shot: shot.id, role: photo.role,
        kind: slot ? slot.kind : "face", hero: !!(slot && slot.hero),
        tilt: (slot && slot.tilt) || 0, zoom: 1, ox: 0, oy: 0,
      };
      draw();
    };
    return b;
  }
  function rebuildThumbs() {
    photoRow.innerHTML = "";
    for (const s of SAMPLES) photoRow.appendChild(thumb(s, s.role));
  }
  rebuildThumbs();

  // --- uploads ----------------------------------------------------------------
  document.getElementById("uploadBtn").onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const dataUrl = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsDataURL(file);
      });
      const img = await loadImage(dataUrl);
      uploads++;
      const id = "up" + uploads;
      const photo = {
        id, src: dataUrl, role: "YOU",
        face: { x: 0.3, y: 0.08, w: 0.4, h: 0.32 },
        shots: [
          { id: "face", label: "Close-up wajah", crop: { x: 0.15, y: 0.0, w: 0.7, h: 0.5 } },
          { id: "full", label: "Foto penuh", crop: { x: 0, y: 0, w: 1, h: 1 } },
          { id: "detail", label: "Detail bawah", crop: { x: 0.1, y: 0.6, w: 0.8, h: 0.4 } },
        ],
      };
      SAMPLES.push(photo);
      images[id] = img;
      snapshot();
      const slot = layoutById(state.layout).slots[selected];
      state.panels[selected] = {
        photo: id, shot: "face", role: "YOU", kind: "face",
        hero: !!(slot && slot.hero), tilt: (slot && slot.tilt) || 0, zoom: 1, ox: 0, oy: 0,
      };
      rebuildThumbs();
      draw();
    };
    input.click();
  };

  // --- title / subtitle ---------------------------------------------------------
  const titleInput = document.getElementById("titleInput");
  const subInput = document.getElementById("subInput");
  titleInput.value = state.title;
  subInput.value = state.subtitle;
  let titleSnapshotTaken = false;
  titleInput.addEventListener("focus", () => { titleSnapshotTaken = false; });
  titleInput.addEventListener("input", () => {
    if (!titleSnapshotTaken) { snapshot(); titleSnapshotTaken = true; }
    state.title = titleInput.value.toUpperCase().slice(0, 18) || "NEON COAST";
    draw();
  });
  subInput.addEventListener("input", () => {
    if (!titleSnapshotTaken) { snapshot(); titleSnapshotTaken = true; }
    state.subtitle = subInput.value.slice(0, 40) || "Paid in Sunsets";
    draw();
  });

  document.getElementById("undoBtn").onclick = undo;
  document.getElementById("redoBtn").onclick = redo;
  document.getElementById("exportBtn").onclick = exportAll;

  // --- export ---------------------------------------------------------------------
  async function exportAll() {
    for (const size of EXPORT_SIZES) {
      const off = document.createElement("canvas");
      off.width = size.w;
      off.height = size.h;
      renderCover(off, images, state);
      const blob = await new Promise((res) => off.toBlob(res, "image/png"));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = size.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      // stagger: a burst of downloads from one click is blocked after the
      // first, so give each file its own moment before the next starts
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  // --- canvas: select + drag to pan + wheel to zoom --------------------------------
  let drag = null;
  let lastWheelSnapshot = 0;
  function slotAt(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const x = (cx - rect.left) / rect.width;
    const y = (cy - rect.top) / rect.height;
    const slots = layoutById(state.layout).slots;
    for (let i = slots.length - 1; i >= 0; i--) {
      const r = slots[i].rect;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
    }
    return -1;
  }
  canvas.addEventListener("pointerdown", (e) => {
    const i = slotAt(e.clientX, e.clientY);
    if (i < 0) return;
    selected = i;
    snapshot();
    const panel = state.panels[i];
    drag = { x: e.clientX, y: e.clientY, ox: panel.ox || 0, oy: panel.oy || 0 };
    canvas.setPointerCapture(e.pointerId);
    draw();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const panel = state.panels[selected];
    panel.ox = Math.max(-0.4, Math.min(0.4, drag.ox + ((e.clientX - drag.x) / rect.width) * 0.6));
    panel.oy = Math.max(-0.4, Math.min(0.4, drag.oy + ((e.clientY - drag.y) / rect.height) * 0.6));
    draw();
  });
  canvas.addEventListener("pointerup", () => { drag = null; });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const i = slotAt(e.clientX, e.clientY);
    if (i < 0) return;
    if (Date.now() - lastWheelSnapshot > 800) { snapshot(); lastWheelSnapshot = Date.now(); }
    const panel = state.panels[i];
    panel.zoom = Math.max(1, Math.min(3, (panel.zoom || 1) * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
    draw();
  }, { passive: false });

  // --- draw --------------------------------------------------------------------------
  function markActive() {
    layoutRow.querySelectorAll(".chip").forEach((b) => b.classList.toggle("on", b.dataset.layout === state.layout));
    gradeRow.querySelectorAll(".swatch").forEach((b) => b.classList.toggle("on", b.dataset.grade === state.grade));
  }
  function draw() {
    const stage = document.getElementById("stage");
    const box = stage.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(320, Math.round(box.width * dpr));
    const h = Math.max(180, Math.round((box.width * 9) / 16 * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    renderCover(canvas, images, state);
    // selection outline (DOM overlay, so the export stays clean)
    const sel = document.getElementById("selection");
    const slot = layoutById(state.layout).slots[selected];
    const panel = state.panels[selected];
    if (slot && panel) {
      const photo = sampleById(panel.photo);
      const shot = photo.shots.find((s) => s.id === panel.shot);
      sel.style.display = "block";
      sel.style.left = slot.rect.x * 100 + "%";
      sel.style.top = slot.rect.y * 100 + "%";
      sel.style.width = slot.rect.w * 100 + "%";
      sel.style.height = slot.rect.h * 100 + "%";
      sel.style.transform = `rotate(${slot.tilt || 0}deg)`;
      info.textContent = `Panel ${selected + 1} — ${shot ? shot.label : ""} (${panel.role}) · shot: ${panel.shot} · zoom ${(panel.zoom || 1).toFixed(2)}x`;
    } else {
      sel.style.display = "none";
    }
    const counts = faceCounts(state.panels);
    const dupes = Object.entries(counts).filter(([, n]) => n > 1).map(([id]) => id);
    document.getElementById("guardNote").textContent = dupes.length
      ? "Peringatan: wajah ganda di " + dupes.join(", ")
      : `5 wajah, masing-masing 1x · ${state.panels.length} panel`;
  }

  markActive();
  refreshUndoButtons();
  draw();
  window.addEventListener("resize", draw);
  return { state, images, draw, exportAll };
}

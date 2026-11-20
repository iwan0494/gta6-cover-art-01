// editor.js — the Neon Coast Cover Studio editor. Loads the five sample
// photos and the two vendored fonts, renders the live cover preview, and
// wires every control: layouts, grades, title editing, per-panel crop
// (drag to reframe, wheel to zoom, cycle shot), undo/redo, and one-click
// export to all three post sizes. State is plain data; every mutation goes
// through `commit()`, which snapshots the previous state first.

import { SAMPLES, sampleById } from './faces.js';
import { LAYOUTS, GRADES, renderCover, assignPanels } from './cover.js';

export const EXPORT_SIZES = [
  { w: 1080, h: 1080, name: 'square' },
  { w: 1080, h: 1350, name: 'portrait' },
  { w: 1920, h: 1080, name: 'wide' },
];

const DEFAULT_TITLE = 'NEON COAST';
const DEFAULT_SUBTITLE = 'Paid in Sunsets';

export function freshState() {
  return {
    layoutId: 'keyart',
    gradeId: 'sunset',
    title: DEFAULT_TITLE,
    subtitle: DEFAULT_SUBTITLE,
    selected: 0,
    overrides: {},
    shotCycle: {},
  };
}

function snapshotOf(state) {
  return JSON.parse(JSON.stringify({
    layoutId: state.layoutId,
    gradeId: state.gradeId,
    title: state.title,
    subtitle: state.subtitle,
    selected: state.selected,
    overrides: state.overrides,
    shotCycle: state.shotCycle,
  }));
}

function restoreInto(state, snap) {
  Object.assign(state, JSON.parse(JSON.stringify(snap)));
}

async function loadFont(name, url, weight) {
  try {
    const face = new FontFace(name, `url(${url})`, { weight: String(weight) });
    const loaded = await face.load();
    document.fonts.add(loaded);
  } catch (err) {
    console.warn('font failed to load', name, err);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

export async function bootEditor(root) {
  const state = freshState();
  const undoStack = [];
  const redoStack = [];
  const images = {};

  const preview = root.querySelector('#preview');
  const ctx2d = preview.getContext('2d');

  function draw() {
    preview.width = 960;
    preview.height = 720;
    renderCover(preview, images, state);
    void ctx2d;
  }

  function commit(mutator) {
    // Snapshot BEFORE the mutation: undo restores the state that was live
    // before this change, including drags (taken at pointerdown) and zooms
    // (taken at the first wheel event of a burst).
    undoStack.push(snapshotOf(state));
    if (undoStack.length > 60) undoStack.shift();
    redoStack.length = 0;
    mutator(state);
    draw();
    syncPanelUI();
  }

  function undo() {
    const prev = undoStack.pop();
    if (!prev) return;
    redoStack.push(snapshotOf(state));
    restoreInto(state, prev);
    draw();
    syncControls();
  }

  function redo() {
    const next = redoStack.pop();
    if (!next) return;
    undoStack.push(snapshotOf(state));
    restoreInto(state, next);
    draw();
    syncControls();
  }

  // ---- controls -------------------------------------------------------
  const layoutRow = root.querySelector('#layouts');
  for (const layout of LAYOUTS) {
    const b = document.createElement('button');
    b.className = 'chip-btn';
    b.textContent = layout.name;
    b.dataset.layout = layout.id;
    b.addEventListener('click', () => {
      commit((s) => { s.layoutId = layout.id; s.selected = 0; });
      markActive(layoutRow, layout.id, 'layout');
    });
    layoutRow.appendChild(b);
  }

  const gradeRow = root.querySelector('#grades');
  for (const grade of GRADES) {
    const b = document.createElement('button');
    b.className = 'grade-btn';
    b.dataset.grade = grade.id;
    b.title = grade.name;
    b.style.background = `linear-gradient(135deg, ${grade.glow}, #1b0f2a 70%)`;
    b.addEventListener('click', () => {
      commit((s) => { s.gradeId = grade.id; });
      markActive(gradeRow, grade.id, 'grade');
    });
    gradeRow.appendChild(b);
  }

  const titleInput = root.querySelector('#title-input');
  const subtitleInput = root.querySelector('#subtitle-input');
  // Title edits: snapshot once when the field gains focus, so one undo
  // step reverts the whole edit (typing itself is live, not undoable).
  let titleSnap = null;
  titleInput.addEventListener('focus', () => { titleSnap = snapshotOf(state); });
  titleInput.addEventListener('input', () => {
    state.title = titleInput.value.toUpperCase() || DEFAULT_TITLE;
    draw();
  });
  titleInput.addEventListener('change', () => {
    if (titleSnap) {
      undoStack.push(titleSnap);
      if (undoStack.length > 60) undoStack.shift();
      redoStack.length = 0;
      titleSnap = null;
    }
    draw();
  });
  let subtitleSnap = null;
  subtitleInput.addEventListener('focus', () => { subtitleSnap = snapshotOf(state); });
  subtitleInput.addEventListener('input', () => {
    state.subtitle = subtitleInput.value || DEFAULT_SUBTITLE;
    draw();
  });
  subtitleInput.addEventListener('change', () => {
    if (subtitleSnap) {
      undoStack.push(subtitleSnap);
      if (undoStack.length > 60) undoStack.shift();
      redoStack.length = 0;
      subtitleSnap = null;
    }
    draw();
  });

  const undoBtn = root.querySelector('#undo-btn');
  const redoBtn = root.querySelector('#redo-btn');
  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);

  // Sample photo strip: clicking one loads it as the hero's photo is not
  // how it works — samples are the cast. Picking one re-rolls the panel
  // assignment so that photo takes the hero slot.
  const castRow = root.querySelector('#cast');
  for (const sample of SAMPLES) {
    const b = document.createElement('button');
    b.className = 'cast-btn';
    b.textContent = sample.role;
    b.addEventListener('click', () => {
      commit((s) => {
        s.heroSample = sample.id;
        s.selected = 0;
      });
    });
    castRow.appendChild(b);
  }

  const uploadInput = root.querySelector('#upload-input');
  uploadInput.addEventListener('change', async () => {
    const file = uploadInput.files && uploadInput.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      images.upload = img;
      commit((s) => { s.heroSample = 'upload'; });
    } catch (err) {
      console.warn('upload failed', err);
    }
  });

  const cycleBtn = root.querySelector('#cycle-btn');
  cycleBtn.addEventListener('click', () => {
    commit((s) => {
      const panels = assignPanels(s.layoutId);
      const panel = panels[s.selected];
      if (!panel) return;
      const sample = sampleById(panel.sampleId);
      const idx = (s.shotCycle[s.selected] || 0) + 1;
      s.shotCycle[s.selected] = idx % sample.shots.length;
    });
  });

  const exportBtn = root.querySelector('#export-btn');
  exportBtn.addEventListener('click', () => exportAll(images, state));

  // ---- panel picking, drag to reframe, wheel to zoom ------------------
  let dragging = false;
  let dragStart = null;
  let dragCommitted = false;

  function panelAt(clientX, clientY) {
    const r = preview.getBoundingClientRect();
    const px = (clientX - r.left) / r.width;
    const py = (clientY - r.top) / r.height;
    const panels = assignPanels(state.layoutId);
    for (let i = panels.length - 1; i >= 0; i -= 1) {
      const s = panels[i].slot;
      if (px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) return i;
    }
    return -1;
  }

  preview.addEventListener('pointerdown', (ev) => {
    const idx = panelAt(ev.clientX, ev.clientY);
    if (idx < 0) return;
    preview.setPointerCapture(ev.pointerId);
    dragging = true;
    dragCommitted = false;
    dragStart = { x: ev.clientX, y: ev.clientY, idx };
    state.selected = idx;
    syncPanelUI();
  });

  preview.addEventListener('pointermove', (ev) => {
    if (!dragging || !dragStart) return;
    const r = preview.getBoundingClientRect();
    const dx = (ev.clientX - dragStart.x) / r.width;
    const dy = (ev.clientY - dragStart.y) / r.height;
    if (!dragCommitted) {
      // Snapshot once, at the start of the drag.
      undoStack.push(snapshotOf(state));
      if (undoStack.length > 60) undoStack.shift();
      redoStack.length = 0;
      dragCommitted = true;
    }
    const ov = state.overrides[dragStart.idx] || { zoom: 1, dx: 0, dy: 0 };
    ov.dx = (ov.dx || 0) - dx * 0.6;
    ov.dy = (ov.dy || 0) - dy * 0.6;
    state.overrides[dragStart.idx] = ov;
    dragStart.x = ev.clientX;
    dragStart.y = ev.clientY;
    draw();
  });

  preview.addEventListener('pointerup', () => {
    dragging = false;
    dragStart = null;
  });

  let wheelBurst = false;
  preview.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const idx = state.selected;
    if (idx == null || idx < 0) return;
    if (!wheelBurst) {
      undoStack.push(snapshotOf(state));
      if (undoStack.length > 60) undoStack.shift();
      redoStack.length = 0;
      wheelBurst = true;
      setTimeout(() => { wheelBurst = false; }, 450);
    }
    const ov = state.overrides[idx] || { zoom: 1, dx: 0, dy: 0 };
    ov.zoom = Math.max(1, Math.min(4, (ov.zoom || 1) * (ev.deltaY < 0 ? 1.12 : 0.89)));
    state.overrides[idx] = ov;
    draw();
  }, { passive: false });

  function markActive(row, id, key) {
    for (const b of row.children) {
      b.classList.toggle('active', b.dataset[key] === id);
    }
  }

  function syncControls() {
    markActive(layoutRow, state.layoutId, 'layout');
    markActive(gradeRow, state.gradeId, 'grade');
    titleInput.value = state.title;
    subtitleInput.value = state.subtitle;
    syncPanelUI();
  }

  function syncPanelUI() {
    const panels = assignPanels(state.layoutId);
    const panel = panels[state.selected];
    const label = root.querySelector('#panel-label');
    if (label) {
      label.textContent = panel
        ? `Panel ${state.selected + 1} — ${sampleById(panel.sampleId).label} (${sampleById(panel.sampleId).role})`
        : 'No panel selected';
    }
  }

  // ---- boot -----------------------------------------------------------
  await Promise.all([
    loadFont('Anton', 'fonts/Anton-Regular.ttf', 400),
    loadFont('Pacifico', 'fonts/Pacifico-Regular.ttf', 400),
  ]);
  for (const sample of SAMPLES) {
    try {
      images[sample.id] = await loadImage(sample.src);
    } catch (err) {
      console.warn('sample failed', sample.id, err);
    }
  }
  await document.fonts.ready;
  markActive(layoutRow, state.layoutId, 'layout');
  markActive(gradeRow, state.gradeId, 'grade');
  draw();
  syncPanelUI();
  root.classList.add('ready');
  return { state, draw, undo, redo, images };
}

export async function exportAll(images, state) {
  const off = document.createElement('canvas');
  let i = 0;
  for (const size of EXPORT_SIZES) {
    off.width = size.w;
    off.height = size.h;
    renderCover(off, images, state);
    const url = off.toDataURL('image/png');
    await new Promise((resolve) => setTimeout(resolve, i === 0 ? 0 : 600));
    const a = document.createElement('a');
    a.href = url;
    a.download = `neon-coast-${size.name}-${size.w}x${size.h}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    i += 1;
  }
}

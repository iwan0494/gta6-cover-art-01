// Neon Coast Cover Studio — editor: uploads, per-panel crop, layouts, grades,
// caption editing, undo/redo and one-click export of all three post sizes.
import { LAYOUTS, GRADES, defaultState, drawCover, ensureFonts } from './cover.js';
import { readShotParams, applyShotParams, sizePreviewForShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const hidden = $('coverCanvas');
const statusEl = $('status');

const state = defaultState();
let photos = [];           // HTMLImageElements, in upload order
let history = [];          // JSON snapshots for undo/redo
let future = [];
let dragging = null;       // {x, y} last pointer position on preview

function snapshot() { return JSON.stringify(state); }
function pushHistory() { history.push(snapshot()); if (history.length > 40) history.shift(); future = []; }
function restore(json) { const s = JSON.parse(json); Object.assign(state, s); syncControls(); render(); }
function commit() { pushHistory(); render(); }

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function addPhotos(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) return;
  for (const f of list) {
    const url = URL.createObjectURL(f);
    try { photos.push(await loadImage(url)); } catch (e) { /* skip bad file */ }
  }
  pushHistory();
  state.panels.forEach((p, i) => { p.photo = state.photoMode === 'one' ? 0 : i % photos.length; });
  setStatus(`Foto dimuat: ${photos.length}.`);
  render();
}

async function loadSamples() {
  pushHistory();
  photos = [];
  for (const name of ['samples/boulevard.jpg', 'samples/pier.jpg']) {
    try { photos.push(await loadImage(name)); } catch (e) { /* ignore */ }
  }
  if (!photos.length) { setStatus('Foto contoh gagal dimuat.'); return; }
  state.panels.forEach((p, i) => { p.photo = state.photoMode === 'one' ? 0 : i % photos.length; });
  setStatus('Foto contoh dimuat.');
  render();
}

function render() {
  drawCover(preview, state, photos);
}

function setStatus(msg) { statusEl.textContent = msg; }

function syncControls() {
  $('titleInput').value = state.title;
  $('subInput').value = state.subtitle;
  $('titleSize').value = state.titleSize;
  $('titlePos').value = state.titlePos;
  $('photoMode').value = state.photoMode;
  document.querySelectorAll('#layoutChips button').forEach((b) =>
    b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('#gradeSwatches button').forEach((b) =>
    b.classList.toggle('on', b.dataset.grade === state.grade));
  const pick = $('panelPick');
  const count = LAYOUTS[state.layout].panels;
  pick.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const opt = document.createElement('option');
    opt.value = i; opt.textContent = `Panel ${i + 1}`;
    pick.appendChild(opt);
  }
  pick.value = Math.min(state.activePanel, count - 1);
  const p = state.panels[state.activePanel] || { zoom: 1, dx: 0, dy: 0 };
  $('zoomRange').value = Math.round(p.zoom * 100);
  $('zoomVal').textContent = `${Math.round(p.zoom * 100)}%`;
  $('panX').value = Math.round(p.dx * 100);
  $('panY').value = Math.round(p.dy * 100);
}

function buildLayoutChips() {
  const box = $('layoutChips');
  for (const [key, def] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.layout = key; b.textContent = def.label;
    b.addEventListener('click', () => { pushHistory(); state.layout = key; state.activePanel = 0; syncControls(); render(); });
    box.appendChild(b);
  }
}

function bindControls() {
  $('btnUpload').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', (e) => addPhotos(e.target.files));
  $('btnSamples').addEventListener('click', loadSamples);
  $('photoMode').addEventListener('change', (e) => {
    pushHistory(); state.photoMode = e.target.value;
    state.panels.forEach((p, i) => { p.photo = state.photoMode === 'one' ? 0 : i % Math.max(1, photos.length); });
    render();
  });
  $('panelPick').addEventListener('change', (e) => { state.activePanel = +e.target.value; syncControls(); });
  $('zoomRange').addEventListener('input', (e) => {
    state.panels[state.activePanel].zoom = +e.target.value / 100;
    $('zoomVal').textContent = `${e.target.value}%`; render();
  });
  $('zoomRange').addEventListener('change', pushHistory);
  $('panX').addEventListener('input', (e) => { state.panels[state.activePanel].dx = +e.target.value / 100; render(); });
  $('panX').addEventListener('change', pushHistory);
  $('panY').addEventListener('input', (e) => { state.panels[state.activePanel].dy = +e.target.value / 100; render(); });
  $('panY').addEventListener('change', pushHistory);
  document.querySelectorAll('#gradeSwatches button').forEach((b) =>
    b.addEventListener('click', () => { pushHistory(); state.grade = b.dataset.grade; syncControls(); render(); }));
  $('titleInput').addEventListener('input', (e) => { state.title = e.target.value; render(); });
  $('titleInput').addEventListener('change', pushHistory);
  $('subInput').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
  $('subInput').addEventListener('change', pushHistory);
  $('titleSize').addEventListener('input', (e) => { state.titleSize = +e.target.value; render(); });
  $('titleSize').addEventListener('change', pushHistory);
  $('titlePos').addEventListener('change', (e) => { pushHistory(); state.titlePos = e.target.value; render(); });
  $('btnUndo').addEventListener('click', () => {
    if (!history.length) return;
    future.push(snapshot()); restore(history.pop());
  });
  $('btnRedo').addEventListener('click', () => {
    if (!future.length) return;
    history.push(snapshot()); restore(future.pop());
  });
  $('btnExport').addEventListener('click', exportAll);
  preview.addEventListener('pointerdown', (e) => { dragging = { x: e.clientX, y: e.clientY }; preview.setPointerCapture(e.pointerId); });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = preview.getBoundingClientRect();
    const p = state.panels[state.activePanel];
    p.dx += (e.clientX - dragging.x) / r.width;
    p.dy += (e.clientY - dragging.y) / r.height;
    dragging = { x: e.clientX, y: e.clientY };
    syncControls(); render();
  });
  preview.addEventListener('pointerup', () => { if (dragging) { dragging = null; pushHistory(); } });
}

function exportPng(w, h, name) {
  return new Promise((resolve) => {
    hidden.width = w; hidden.height = h;
    drawCover(hidden, state, photos);
    hidden.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(blob);
    }, 'image/png');
  });
}

async function exportAll() {
  setStatus('Mengekspor 3 ukuran…');
  await ensureFonts();
  await exportPng(1080, 1080, 'neon-coast-1080x1080.png');
  await exportPng(1080, 1350, 'neon-coast-1080x1350.png');
  await exportPng(1920, 1080, 'neon-coast-1920x1080.png');
  setStatus('Selesai — 3 PNG terunduh.');
}

// Screenshot mode: ?shot=cover|editor — used to take the entry screenshots.
// ?shot=cover draws one cover full-frame; ?shot=editor loads the samples
// into the editor UI. Optional &layout= &grade= &title= &photo= (sample name).
export async function shotMode() {
  const params = readShotParams();
  const shot = applyShotParams(state, params);
  if (!shot) return false;
  // Cover shots hide the editor chrome (full-frame cover); editor shots
  // keep the whole UI visible so the screenshot shows the app at work.
  if (shot === 'cover') document.body.classList.add('shot');
  else { preview.style.width = 'auto'; preview.style.height = '560px'; preview.style.margin = '0 auto'; }
  await ensureFonts();
  await loadSamples();
  if (params.photo === 'pier' && photos[1]) state.panels.forEach((p) => { p.photo = 1; });
  sizePreviewForShot(preview, shot);
  syncControls(); render();
  document.title = 'shot-ready';
  return true;
}

buildLayoutChips();
bindControls();
syncControls();
ensureFonts().then(render);
render();
shotMode();

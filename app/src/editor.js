// editor.js — Neon Coast editor: sample photos, uploads, per-panel
// reframe (drag / wheel zoom), layout + grade switching, undo/redo,
// and one-click export to the three post sizes.

import { SAMPLES, sampleById, defaultUploadFace, uploadShots } from './faces.js';
import { LAYOUTS, GRADES, EXPORT_SIZES, renderCover, layoutById } from './cover.js';

export function defaultState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    title: 'NEON COAST',
    subtitle: 'Paid in Sunsets',
    overrides: {}, // panel index -> { sample, shot, dx, dy, zoom }
    custom: [],   // uploaded photos: { id, dataUrl, role, face, shots }
  };
}

export function snapshot(state) {
  return JSON.stringify({ layout: state.layout, grade: state.grade, title: state.title, subtitle: state.subtitle, overrides: state.overrides, custom: state.custom });
}

export function restoreState(state, json) {
  const s = JSON.parse(json);
  state.layout = s.layout; state.grade = s.grade;
  state.title = s.title; state.subtitle = s.subtitle;
  state.overrides = s.overrides || {}; state.custom = s.custom || [];
}

function allSamples(state) {
  return [...SAMPLES, ...state.custom];
}

function imageFor(state, sampleId, cache) {
  if (cache.has(sampleId)) return cache.get(sampleId);
  const s = allSamples(state).find((x) => x.id === sampleId);
  const img = new Image();
  img.src = s ? s.file || s.dataUrl : '';
  cache.set(sampleId, img);
  return img;
}

// Load every photo the current state needs, then call back.
export function loadImages(state, done) {
  const cache = new Map();
  const ids = new Set(SAMPLES.map((s) => s.id));
  Object.values(state.overrides).forEach((o) => { if (o?.sample) ids.add(o.sample); });
  const imgs = [...ids].map((id) => imageFor(state, id, cache));
  let pending = imgs.length;
  if (!pending) { done(cache); return; }
  imgs.forEach((img) => {
    const fin = () => { if (--pending === 0) done(cache); };
    if (img.complete) fin();
    else { img.onload = fin; img.onerror = fin; }
  });
}

export function renderPreview(canvas, state) {
  loadImages(state, (images) => {
    renderCover(canvas, {
      layout: state.layout, grade: state.grade,
      title: state.title, subtitle: state.subtitle,
      images, overrides: state.overrides,
    });
  });
}

export function exportAll(state, onFile) {
  loadImages(state, (images) => {
    EXPORT_SIZES.forEach((size, i) => {
      setTimeout(() => {
        const c = document.createElement('canvas');
        c.width = size.w; c.height = size.h;
        renderCover(c, {
          layout: state.layout, grade: state.grade,
          title: state.title, subtitle: state.subtitle,
          images, overrides: state.overrides,
        });
        c.toBlob((blob) => onFile(blob, `neon-coast-${size.name}-${size.w}x${size.h}.png`), 'image/png');
      }, i * 450); // stagger so the browser never blocks the downloads
    });
  });
}

export function addUpload(state, file, done) {
  const reader = new FileReader();
  reader.onload = () => {
    const id = 'upload-' + Date.now();
    const img = new Image();
    img.onload = () => {
      state.custom.push({
        id, dataUrl: reader.result, role: 'THE GUEST',
        face: defaultUploadFace(), shots: uploadShots(),
        w: img.naturalWidth, h: img.naturalHeight,
      });
      done(id);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

// Cycle the shot of one panel to the next distinct crop of its photo.
export function cycleShot(state, panelIndex) {
  const def = layoutById(state.layout);
  const panels = def.panels(1280, 720);
  const p = panels[panelIndex];
  if (!p) return;
  const ov = state.overrides[panelIndex] || {};
  const sampleId = ov.sample || p.sample;
  const s = allSamples(state).find((x) => x.id === sampleId) || sampleById(sampleId);
  const shots = s.shots;
  const cur = shots.findIndex((x) => x.name === (ov.shot || p.shot));
  const next = shots[(cur + 1) % shots.length];
  state.overrides[panelIndex] = { ...ov, sample: sampleId, shot: next.name, dx: 0, dy: 0, zoom: 1 };
}

// Fill every panel with a different (sample, shot) pair when the layout
// changes, so no cover ever repeats the same crop twice.
export function refillForLayout(state) {
  const def = layoutById(state.layout);
  const panels = def.panels(1280, 720);
  const used = new Set();
  const usedFace = new Set();
  state.overrides = {};
  panels.forEach((p, i) => {
    const s = sampleById(p.sample);
    let shot = s.shots.find((x) => x.name === p.shot) || s.shots[0];
    if (shot.face && usedFace.has(p.sample)) shot = s.shots.find((x) => !x.face);
    if (used.has(p.sample + ':' + shot.name)) {
      shot = s.shots.find((x) => !used.has(p.sample + ':' + x.name)) || shot;
    }
    if (shot.face) usedFace.add(p.sample);
    used.add(p.sample + ':' + shot.name);
    state.overrides[i] = { sample: p.sample, shot: shot.name, dx: 0, dy: 0, zoom: 1 };
  });
}

export { LAYOUTS, GRADES };

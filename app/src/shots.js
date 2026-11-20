// shots.js — deterministic screenshot modes for the submission dossier.
// ?shot=cover  renders the full poster on a bare canvas (no editor UI).
// ?shot=editor renders the editor with the sample photos loaded.
// Both set window.__shotReady = true once the canvas has painted, so a
// headless browser can wait for the exact frame instead of guessing.

import { renderPreview, defaultState } from './editor.js';
import { EXPORT_SIZES } from './cover.js';

function markReady() {
  window.__shotReady = true;
  document.title = 'shot-ready';
}

function fitCanvas(canvas, w, h) {
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}

export function bootShots() {
  const params = new URLSearchParams(location.search);
  const mode = params.get('shot');
  if (!mode) return false;
  const state = defaultState();
  const w = parseInt(params.get('w') || '1280', 10);
  const h = parseInt(params.get('h') || '720', 10);

  if (mode === 'cover') {
    const layout = params.get('layout') || 'hero';
    state.layout = layout;
    document.body.classList.add('shot-cover');
    const holder = document.getElementById('shot-holder');
    const canvas = document.createElement('canvas');
    canvas.id = 'shot-canvas';
    fitCanvas(canvas, w, h);
    holder.appendChild(canvas);
    // Paint twice: once after fonts arrive, once more to be safe.
    const paint = () => renderPreview(canvas, state);
    document.fonts.ready.then(() => { paint(); setTimeout(() => { paint(); markReady(); }, 120); });
    setTimeout(() => { if (!window.__shotReady) { paint(); markReady(); } }, 2500);
    return true;
  }

  if (mode === 'editor') {
    document.body.classList.add('shot-editor');
    const canvas = document.getElementById('preview');
    if (canvas) {
      fitCanvas(canvas, w, h);
      // Build the rail UI too, so the shot shows the real editor.
      if (typeof window.__buildEditorUI === 'function') window.__buildEditorUI();
      renderPreview(canvas, state);
      document.fonts.ready.then(() => {
        renderPreview(canvas, state);
        setTimeout(markReady, 150);
      });
      setTimeout(() => { if (!window.__shotReady) markReady(); }, 2500);
    }
    return true;
  }
  return false;
}

export { EXPORT_SIZES };

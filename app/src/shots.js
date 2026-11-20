// shots.js — mode ?shot= untuk screenshot + gate.
//   ?shot=cover  — cover penuh tanpa chrome editor (dipakai screenshot
//                  1, 3, 4). Param: layout, grade, w, h.
//   ?shot=editor — editor lengkap dengan foto dimuat (screenshot 2).
//   tanpa param  — editor biasa.
// Sinyal siap: window.__shotReady = true, body[data-shot-ready="1"],
// dan document.title = "shot-ready". Font ditunggu via
// document.fonts.ready dengan fallback timeout 1500 ms — shot tidak
// boleh menggantung bila font lambat.

import { renderCover, panelCount, defaultPanels } from './cover.js';
import { initEditor, loadSampleImages } from './editor.js';

const params = new URLSearchParams(location.search);
const mode = params.get('shot') || 'editor';

function markReady() {
  window.__shotReady = true;
  document.body.setAttribute('data-shot-ready', '1');
  document.title = 'shot-ready';
}

async function waitFonts() {
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch (_) {
    // Font gagal dimuat — lanjut dengan fallback, jangan gantung.
  }
}

async function runCoverShot() {
  document.body.setAttribute('data-shot', 'cover');
  const layout = params.get('layout') || 'keyart';
  const grade = params.get('grade') || 'sunset';
  const w = parseInt(params.get('w') || '1280', 10);
  const h = parseInt(params.get('h') || '720', 10);
  const canvas = document.getElementById('stage');
  canvas.width = w;
  canvas.height = h;
  // Sembunyikan kontrol editor dari layout (CSS sudah menanganinya
  // lewat body[data-shot="cover"], ini pengaman tambahan).
  const images = await loadSampleImages();
  await waitFonts();
  const panels = defaultPanels(layout, 7);
  renderCover(canvas.getContext('2d'), w, h, {
    layout, grade,
    title: 'NEON COAST',
    subtitle: 'Paid in Sunsets',
    panels,
    images,
  });
  markReady();
}

async function runEditorShot() {
  await initEditor();
  await waitFonts();
  markReady();
}

if (mode === 'cover') {
  runCoverShot().catch((err) => {
    console.error('cover shot failed', err);
    markReady();
  });
} else {
  runEditorShot().catch((err) => {
    console.error('editor shot failed', err);
    markReady();
  });
}

// shots.js — the ?shot= scenes. The app has two scenes: the editor (the
// tool itself, with a photo loaded) and the cover (the exported poster,
// full-bleed). Automated captures drive them with ?shot=editor and
// ?shot=cover, plus ?w= / ?h= for the canvas size and ?layout= / ?grade=
// to pick a variant. When the scene is ready it sets data-shot-ready on
// <html> so a capture script knows the frame is final.

import { SAMPLES } from './faces.js';
import { renderCover } from './cover.js';
import { bootEditor, freshState, EXPORT_SIZES } from './editor.js';

function params() {
  return new URLSearchParams(window.location.search);
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function loadFont(name, url) {
  try {
    const face = new FontFace(name, `url(${url})`);
    const loaded = await face.load();
    document.fonts.add(loaded);
  } catch (err) {
    console.warn('font failed to load', name, err);
  }
}

export const SCENES = {
  editor: {
    description: 'The editor with a photo loaded: controls left, live cover centre.',
    run: async () => {
      await bootEditor(document.querySelector('#app'));
    },
  },
  cover: {
    description: 'The exported cover, full-bleed, at the requested size.',
    run: async () => {
      const q = params();
      const w = Math.max(480, Math.min(1920, Number(q.get('w')) || 1280));
      const h = Math.max(480, Math.min(1920, Number(q.get('h')) || 720));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.id = 'cover-shot';
      canvas.style.display = 'block';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.objectFit = 'contain';
      document.body.innerHTML = '';
      document.body.appendChild(canvas);
      document.body.style.margin = '0';
      document.body.style.background = '#1b0f2a';
      await Promise.all([
        loadFont('Anton', 'fonts/Anton-Regular.ttf'),
        loadFont('Pacifico', 'fonts/Pacifico-Regular.ttf'),
      ]);
      const images = {};
      for (const sample of SAMPLES) {
        try {
          images[sample.id] = await loadImage(sample.src);
        } catch (err) {
          console.warn('sample failed', sample.id, err);
        }
      }
      await document.fonts.ready;
      const state = freshState();
      state.layoutId = q.get('layout') || 'keyart';
      state.gradeId = q.get('grade') || 'sunset';
      state.title = q.get('title') || 'NEON COAST';
      state.subtitle = q.get('subtitle') || 'Paid in Sunsets';
      renderCover(canvas, images, state);
    },
  },
};

export async function runShot() {
  const q = params();
  const name = q.get('shot') || 'editor';
  const scene = SCENES[name] || SCENES.editor;
  try {
    await scene.run();
  } catch (err) {
    console.error('shot failed', name, err);
  }
  document.documentElement.setAttribute('data-shot-ready', 'true');
  window.dispatchEvent(new Event('shot-ready'));
}

export { EXPORT_SIZES };

// Neon Coast Cover Studio — screenshot scenes (?shot=cover | ?shot=editor).
// Reads the query string and applies a scene to the editor state so the
// entry screenshots are taken from the real running app, not composited.
import { GRADES } from './cover.js';

export function readShotParams() {
  const q = new URLSearchParams(location.search);
  return {
    shot: q.get('shot') || '',
    layout: q.get('layout') || '',
    grade: q.get('grade') || '',
    title: q.get('title') || '',
    subtitle: q.get('sub') || '',
    photo: q.get('photo') || 'boulevard',
  };
}

export function applyShotParams(state, params) {
  if (params.layout) state.layout = params.layout;
  if (params.grade && GRADES[params.grade]) state.grade = params.grade;
  if (params.title) state.title = params.title;
  if (params.subtitle) state.subtitle = params.subtitle;
  return params.shot;
}

// In cover mode the preview canvas fills the whole window so a headless
// screenshot of the page IS the exported cover at window size.
export function sizePreviewForShot(preview, shot) {
  if (shot !== 'cover') return;
  preview.width = Math.round(innerWidth * devicePixelRatio);
  preview.height = Math.round(innerHeight * devicePixelRatio);
  preview.style.width = '100vw';
  preview.style.height = '100vh';
  preview.style.maxHeight = 'none';
}

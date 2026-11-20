// shots.js — deterministic ?shot= modes for screenshots and review.
//   ?shot=cover&photo=<id>&caption=<text>&layout=<id>&grade=<id>&w=&h=
//       renders one cover full-bleed and signals ready.
//   ?shot=editor — boots the editor with the sample cast loaded.
// Anything else boots the editor too. No network, no randomness at render:
// the same query always draws the same cover.

import { SAMPLES, sampleById } from "./faces.js";
import { layoutById, assignPanels, defaultState, renderCover } from "./cover.js";
import { bootEditor } from "./editor.js";

function params() {
  return new URLSearchParams(location.search);
}

function signalReady() {
  document.documentElement.dataset.shotReady = "1";
  window.__shotReady = true;
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("cannot load " + src));
    img.src = src;
  });
}

async function shotCover(q) {
  await document.fonts.ready;
  const images = {};
  for (const s of SAMPLES) {
    try {
      images[s.id] = await loadImage(s.src);
    } catch (e) {
      console.warn(e.message);
    }
  }
  const state = defaultState();
  const layout = q.get("layout");
  if (layout && layoutById(layout)) {
    state.layout = layout;
    state.panels = assignPanels(layout);
  }
  const grade = q.get("grade");
  if (grade) state.grade = grade;
  const caption = q.get("caption");
  if (caption) state.title = caption.toUpperCase().slice(0, 18);
  const heroPhoto = q.get("photo");
  if (heroPhoto && sampleById(heroPhoto)) {
    const heroIdx = state.panels.findIndex((p) => p.hero);
    if (heroIdx >= 0) {
      const photo = sampleById(heroPhoto);
      const faceShot = photo.shots.find((s) => s.id === "face") || photo.shots[0];
      state.panels[heroIdx] = {
        photo: photo.id, shot: faceShot.id, role: photo.role,
        kind: "face", hero: true, tilt: -1.5, zoom: 1, ox: 0, oy: 0,
      };
    }
  }
  const w = Math.max(320, Math.min(2560, parseInt(q.get("w") || "1280", 10) || 1280));
  const h = Math.max(320, Math.min(2560, parseInt(q.get("h") || "720", 10) || 720));
  const canvas = document.getElementById("shotCanvas");
  canvas.width = w;
  canvas.height = h;
  canvas.style.display = "block";
  document.getElementById("app").style.display = "none";
  renderCover(canvas, images, state);
  signalReady();
}

async function shotEditor() {
  await document.fonts.ready;
  await bootEditor();
  signalReady();
}

const mode = params().get("shot") || "editor";
if (mode === "cover") {
  shotCover(params()).catch((e) => {
    console.error(e);
    document.title = "shot failed: " + e.message;
    signalReady();
  });
} else {
  shotEditor().catch((e) => {
    console.error(e);
    document.title = "shot failed: " + e.message;
    signalReady();
  });
}

// Neon Coast Cover Studio — screenshot modes.
//
// ?shot=cover   renders the cover full-bleed, no editor chrome.
// ?shot=editor  opens the editor with the default cast loaded.
// ?shot=portrait / ?shot=square render the cover at those sizes.
// Every mode sets window.__shotReady once the canvas has painted, so a
// headless screenshot script can wait for it instead of guessing.

import { createEditor } from "./editor.js";
import { renderCover, defaultState } from "./cover.js";
import { CAST } from "./faces.js";

const params = new URLSearchParams(location.search);
const mode = params.get("shot") || "editor";

function loadAll() {
  return Promise.all(
    CAST.map(
      (p) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve([p.id, img]);
          img.onerror = () => resolve([p.id, null]);
          img.src = p.src;
        })
    )
  ).then((pairs) => new Map(pairs.filter(([, img]) => img)));
}

function finish() {
  window.__shotReady = true;
  document.title = document.title + " — shot ready";
}

if (mode === "cover" || mode === "portrait" || mode === "square") {
  const sizes = { cover: [1280, 720], portrait: [1024, 1280], square: [1080, 1080] };
  const [W, H] = sizes[mode] || sizes.cover;
  const grade = params.get("grade") || "sunset";
  const layout = params.get("layout") || "keyart";
  const canvas = document.getElementById("cover");
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  document.body.classList.add("cover-mode");
  // The canvas lives inside #editor-ui, so hide the chrome around it —
  // never the container itself.
  document.querySelector(".topbar").style.display = "none";
  document.querySelector(".controls").style.display = "none";
  document.querySelector(".stage .hint").style.display = "none";
  const main = document.getElementById("editor-ui");
  main.style.display = "block";
  main.style.padding = "0";
  main.style.gap = "0";
  Promise.all([loadAll(), document.fonts.load('90px Anton'), document.fonts.load('40px Pacifico')]).then(([images]) => {
    const state = { ...defaultState(), grade, layout };
    renderCover(canvas.getContext("2d"), W, H, state, images);
    requestAnimationFrame(finish);
  });
} else {
  const canvas = document.getElementById("cover");
  canvas.width = 1280;
  canvas.height = 720;
  const editor = createEditor(canvas);
  window.__editor = editor;
  Promise.all([editor.ready, document.fonts.load('90px Anton'), document.fonts.load('40px Pacifico')]).then(() => {
    // Fonts arriving late would repaint the title in fallback; redraw once loaded.
    editor.setState(editor.state);
    requestAnimationFrame(finish);
  });
}

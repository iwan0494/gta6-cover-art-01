// Neon Coast Cover Studio — canvas cover renderer.
//
// One render pass paints the whole poster: background glow, photo panels
// with face-safe crops and inked frames, the halftone title block with its
// chrome 3D title, and the film-poster furniture. Layouts are functions of
// the canvas size, so the same state exports at 1080x1080, 1080x1350 and
// 1920x1080 without a second code path. A face is never drawn twice: the
// assignment below gives every face slot a different photo, and a photo
// only ever repeats through a faceless detail shot.

import { CAST, photoById, shotById, shotWindow } from "./faces.js";
import {
  INK, GOLD, PINK, CREAM, halftoneTile, paintHalftone, inkFrame, roleTag,
  chromeTitle, neonScript, ribbon, billing, seal, barcode, quoteBar,
} from "./poster.js";

export const GRADES = [
  { id: "sunset", name: "Sunset", tint: "#ff7a2f", tintA: 0.16, warm: "#ff2e88", warmA: 0.12, vig: 0.34, glow: "#ff9a3d" },
  { id: "neon", name: "Neon Night", tint: "#2f6bff", tintA: 0.2, warm: "#ff2e88", warmA: 0.16, vig: 0.4, glow: "#ff2e88" },
  { id: "teal", name: "Teal Pink", tint: "#14b8a6", tintA: 0.16, warm: "#f472b6", warmA: 0.12, vig: 0.32, glow: "#2dd4bf" },
  { id: "golden", name: "Golden Hour", tint: "#f59e0b", tintA: 0.22, warm: "#fbbf24", warmA: 0.14, vig: 0.3, glow: "#fde68a" },
  { id: "noir", name: "Noir", tint: "#64748b", tintA: 0.22, warm: "#0f172a", warmA: 0.2, vig: 0.52, glow: "#94a3b8" },
  { id: "vice", name: "Vice Blue", tint: "#2563eb", tintA: 0.24, warm: "#7c3aed", warmA: 0.14, vig: 0.38, glow: "#38bdf8" },
  { id: "heat", name: "Heatwave", tint: "#ef4444", tintA: 0.2, warm: "#f97316", warmA: 0.16, vig: 0.36, glow: "#fb923c" },
  { id: "lavender", name: "Lavender Dusk", tint: "#a78bfa", tintA: 0.18, warm: "#ec4899", warmA: 0.12, vig: 0.36, glow: "#c4b5fd" },
  { id: "monogold", name: "Mono Gold", tint: "#d4af37", tintA: 0.26, warm: "#78350f", warmA: 0.18, vig: 0.44, glow: "#fde68a" },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// A slot: one panel on the cover. Fractions of the canvas.
function slot(photo, shot, x, y, w, h, extra = {}) {
  return { photo, shot, x, y, w, h, tilt: 0, hero: false, ...extra };
}

export const LAYOUTS = [
  {
    id: "keyart",
    name: "Key Art",
    slots(W, H) {
      return [
        slot("graffiti", "face", 0.015, 0.07, 0.17, 0.37),
        slot("portrait", "face", 0.2, 0.055, 0.52, 0.4, { hero: true, tilt: -1.5 }),
        slot("pier", "face", 0.74, 0.07, 0.115, 0.37),
        slot("singer", "face", 0.865, 0.07, 0.12, 0.37),
        slot("boulevard", "face", 0.015, 0.7, 0.32, 0.22),
        slot("pier", "rod", 0.345, 0.7, 0.31, 0.22),
        slot("boulevard", "car", 0.665, 0.7, 0.32, 0.22),
      ];
    },
  },
  {
    id: "hero3",
    name: "Hero + 3",
    slots(W, H) {
      return [
        slot("portrait", "face", 0.02, 0.06, 0.58, 0.86, { hero: true, tilt: -1.2 }),
        slot("graffiti", "face", 0.63, 0.06, 0.35, 0.27),
        slot("pier", "face", 0.63, 0.365, 0.35, 0.27),
        slot("singer", "face", 0.63, 0.67, 0.35, 0.25),
      ];
    },
  },
  {
    id: "quad",
    name: "Four Panel",
    slots(W, H) {
      return [
        slot("boulevard", "face", 0.02, 0.06, 0.47, 0.28),
        slot("pier", "face", 0.51, 0.06, 0.47, 0.28),
        slot("portrait", "face", 0.02, 0.36, 0.47, 0.28),
        slot("singer", "face", 0.51, 0.36, 0.47, 0.28),
      ];
    },
  },
  {
    id: "fullbleed",
    name: "Full Bleed",
    slots(W, H) {
      return [slot("portrait", "smile", 0, 0, 1, 1, { hero: true })];
    },
  },
  {
    id: "nine",
    name: "Nine Panel",
    titleZone: { x: 0.345, y: 0.33, w: 0.31, h: 0.25, stacked: true },
    slots(W, H) {
      const c = 0.325;
      const g = 0.0125;
      const cells = [];
      const order = [
        ["boulevard", "face"], ["pier", "face"], ["graffiti", "face"],
        ["portrait", "face"], null, ["singer", "face"],
        ["boulevard", "car"], ["pier", "rod"], ["singer", "guitar"],
      ];
      order.forEach((o, i) => {
        if (!o) return;
        const col = i % 3;
        const row = Math.floor(i / 3);
        cells.push(slot(o[0], o[1], g + col * (c + g), 0.06 + row * 0.27, c, 0.25));
      });
      return cells;
    },
  },
  {
    id: "snapshot",
    name: "Snapshot",
    slots(W, H) {
      return [
        slot("portrait", "face", 0.28, 0.1, 0.46, 0.52, { hero: true, tilt: -2 }),
        slot("boulevard", "full", 0.03, 0.42, 0.34, 0.3, { tilt: 2.5 }),
        slot("pier", "full", 0.64, 0.44, 0.33, 0.3, { tilt: -2.2 }),
        slot("graffiti", "mural", 0.06, 0.08, 0.22, 0.3, { tilt: -3 }),
        slot("singer", "stage", 0.72, 0.06, 0.24, 0.3, { tilt: 2.8 }),
      ];
    },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

export function defaultState() {
  return {
    layout: "keyart",
    grade: "sunset",
    title: "NEON COAST",
    subtitle: "Paid in Sunsets",
    panels: {}, // slot index -> { dx, dy, zoom, photo, shot }
  };
}

// Guard: no face photo may appear in two face slots of one cover.
export function checkFaceGuard(slots) {
  const seen = new Set();
  for (const s of slots) {
    const photo = photoById(s.photo);
    const sh = shotById(photo, s.shot);
    if (!sh.face) continue;
    if (seen.has(s.photo)) return { ok: false, dup: s.photo };
    seen.add(s.photo);
  }
  return { ok: true };
}

function noiseTile() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d");
  const img = g.createImageData(128, 128);
  let seed = 987654321;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const v = seed % 256;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

let cachedNoise = null;
function grain(ctx, x, y, w, h, alpha) {
  if (!cachedNoise) cachedNoise = noiseTile();
  const pat = ctx.createPattern(cachedNoise, "repeat");
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = pat;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function gradePanel(ctx, x, y, w, h, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const top = ctx.createLinearGradient(x, y, x, y + h);
  top.addColorStop(0, grade.tint);
  top.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = grade.tintA * 2.2;
  ctx.fillStyle = top;
  ctx.fillRect(x, y, w, h);
  const warm = ctx.createLinearGradient(x, y + h, x, y);
  warm.addColorStop(0, grade.warm);
  warm.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = grade.warmA * 2.2;
  ctx.fillStyle = warm;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  // Vignette.
  const vg = ctx.createRadialGradient(
    x + w / 2, y + h / 2, Math.min(w, h) * 0.32,
    x + w / 2, y + h / 2, Math.max(w, h) * 0.72
  );
  vg.addColorStop(0, "rgba(10,4,18,0)");
  vg.addColorStop(1, `rgba(10,4,18,${grade.vig})`);
  ctx.fillStyle = vg;
  ctx.fillRect(x, y, w, h);
  grain(ctx, x, y, w, h, 0.05);
  ctx.restore();
}

function drawPanel(ctx, img, photo, sh, rect, grade, ov, W, H) {
  const aspect = rect.w / rect.h;
  const win = shotWindow(photo, sh, aspect, ov.zoom || 1);
  const dx = (ov.dx || 0) * win.w;
  const dy = (ov.dy || 0) * win.h;
  // Defensive clamp: the source rect must stay inside the photo, or the
  // out-of-bounds part paints as black.
  const fx = Math.max(0, Math.min(1 - win.w, win.x + dx));
  const fy = Math.max(0, Math.min(1 - win.h, win.y + dy));
  const fw = Math.min(win.w, 1 - fx);
  const fh = Math.min(win.h, 1 - fy);
  const sx = fx * img.naturalWidth;
  const sy = fy * img.naturalHeight;
  const sw = fw * img.naturalWidth;
  const shh = fh * img.naturalHeight;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, shh, rect.x, rect.y, rect.w, rect.h);
  gradePanel(ctx, rect.x, rect.y, rect.w, rect.h, grade);
  ctx.restore();
  inkFrame(ctx, rect.x, rect.y, rect.w, rect.h);
  const tagPx = Math.max(10, W * 0.013);
  roleTag(ctx, photo.role, rect.x + 4, rect.y + 4, tagPx);
}

// Main render. images: Map photo id -> HTMLImageElement (or null while loading).
export function renderCover(ctx, W, H, state, images) {
  const grade = gradeById(state.grade);
  const layout = layoutById(state.layout);
  // Background: deep plum with a warm sky glow.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1b0b26");
  bg.addColorStop(0.55, "#220d2e");
  bg.addColorStop(1, "#12061c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.12, 0, W * 0.5, H * 0.12, W * 0.55);
  glow.addColorStop(0, grade.glow + "55");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const slots = layout.slots(W, H);
  const isFull = state.layout === "fullbleed";
  // Quote bar (skip on full-bleed: the photo carries the top).
  if (!isFull) {
    quoteBar(ctx, "\u201CThe most wanted sunset in Leonida\u201D", W * 0.02, H * 0.018, Math.max(11, W * 0.0135), W * 0.7);
    ctx.save();
    ctx.fillStyle = GOLD;
    ctx.font = `900 ${Math.max(10, W * 0.013)}px Anton, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("VOL. 1", W * 0.985, H * 0.032);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(W * 0.955, H * 0.014, W * 0.04, H * 0.036);
    ctx.restore();
  }

  // Panels.
  slots.forEach((s, i) => {
    const ov = state.panels[i] || {};
    const photo = photoById(ov.photo || s.photo);
    const sh = shotById(photo, ov.shot || s.shot);
    const img = images.get(photo.id);
    if (!img) return;
    const rect = { x: s.x * W, y: s.y * H, w: s.w * W, h: s.h * H };
    ctx.save();
    if (s.tilt) {
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      ctx.translate(cx, cy);
      ctx.rotate((s.tilt * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }
    if (s.hero) {
      // Layered drop shadow for the pop-out.
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = W * 0.02;
      ctx.shadowOffsetY = H * 0.012;
      ctx.fillStyle = "#000";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
    drawPanel(ctx, img, photo, sh, rect, grade, ov, W, H);
    ctx.restore();
    if (s.hero) {
      const chipPx = Math.max(10, W * 0.012);
      ctx.save();
      ctx.font = `900 ${chipPx}px Anton, sans-serif`;
      const label = "SUNSET EDITION";
      const tw = ctx.measureText(label).width;
      const pad = chipPx * 0.5;
      const cx0 = rect.x + rect.w - tw - pad * 2 - 6;
      const cy0 = rect.y + 6;
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.moveTo(cx0, cy0);
      ctx.lineTo(cx0 + tw + pad * 2, cy0);
      ctx.lineTo(cx0 + tw + pad * 2 - chipPx * 0.3, cy0 + chipPx * 1.5);
      ctx.lineTo(cx0, cy0 + chipPx * 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, cx0 + pad, cy0 + chipPx * 0.78);
      ctx.restore();
    }
  });

  // Title block. Most layouts put it mid-cover; full-bleed overlays it low;
  // the nine-panel grid leaves its centre cell for a stacked two-line title.
  const tz = layout.titleZone || null;
  const titleTop = isFull ? H * 0.68 : tz ? tz.y * H : H * 0.47;
  const titleH = isFull ? H * 0.2 : tz ? tz.h * H : H * 0.16;
  const titleX = isFull ? W * 0.04 : tz ? tz.x * W : W * 0.055;
  const titleW = isFull ? W * 0.92 : tz ? tz.w * W : W * 0.89;
  if (isFull) {
    ctx.save();
    ctx.fillStyle = "rgba(10,4,18,0.62)";
    ctx.fillRect(titleX - W * 0.01, titleTop - H * 0.02, titleW + W * 0.02, titleH + H * 0.05);
    ctx.restore();
  }
  paintHalftone(ctx, titleX, titleTop, titleW, titleH, 0.14);
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(2, W * 0.002);
  ctx.strokeRect(titleX, titleTop, titleW, titleH);
  ctx.restore();
  const titlePx = Math.min(W * 0.115, titleH * 0.62);
  if (tz && tz.stacked) {
    const words = (state.title || "NEON COAST").split(" ");
    const half = titleH * 0.42;
    chromeTitle(ctx, words[0] || "NEON", titleX + titleW / 2, titleTop + titleH * 0.04, titleW * 0.94, half);
    chromeTitle(ctx, words[1] || "COAST", titleX + titleW / 2, titleTop + titleH * 0.46, titleW * 0.94, half);
    neonScript(ctx, state.subtitle || "Paid in Sunsets", titleX + titleW / 2, titleTop + titleH * 0.86, Math.max(12, W * 0.016));
  } else {
    chromeTitle(ctx, state.title || "NEON COAST", W / 2, titleTop + titleH * 0.1, titleW * 0.94, titlePx);
    neonScript(ctx, state.subtitle || "Paid in Sunsets", W / 2, titleTop + titleH * 0.62, Math.max(14, W * 0.024));
  }

  if (!isFull && !tz) {
    // Ribbon under the title block.
    ribbon(ctx, "EVERYONE WANTS A CUT OF THE SUNSET", W / 2, titleTop + titleH + H * 0.018, W * 0.42, H * 0.038);
    // Billing + barcode + seal.
    billing(
      ctx,
      [
        "NEON COAST  \u2022  A LEONIDA STORY  \u2022  STARRING THE DRIVER  THE CAPTAIN  THE ARTIST  THE LOOKOUT  THE SINGER",
        "DIRECTED BY NEON COAST STUDIO  \u2022  MUSIC BY THE STAGE SINGER  \u2022  SHOT ON LEONIDA BOULEVARD",
      ],
      W / 2,
      H * 0.935,
      Math.max(8, W * 0.0085)
    );
    barcode(ctx, W * 0.02, H * 0.945, W * 0.075, H * 0.035);
    ctx.save();
    ctx.fillStyle = GOLD;
    ctx.font = `900 ${Math.max(10, W * 0.011)}px Anton, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("COMING SOON", W * 0.105, H * 0.962);
    ctx.restore();
    seal(ctx, W * 0.955, H * 0.945, Math.min(W, H) * 0.042);
  } else {
    billing(
      ctx,
      ["NEON COAST  \u2022  A LEONIDA STORY  \u2022  STARRING THE LOOKOUT"],
      W / 2,
      H * 0.93,
      Math.max(8, W * 0.0085)
    );
  }
  grain(ctx, 0, 0, W, H, 0.035);
}

export function renderToCanvas(W, H, state, images) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  renderCover(ctx, W, H, state, images);
  return c;
}

export { CAST };

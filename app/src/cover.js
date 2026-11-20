// cover.js — canvas renderer for the key-art cover.
// Layouts are fractions of the canvas, so one layout renders at 1080x1080,
// 1080x1350 and 1920x1080 alike. Each layout owns its title band, ribbon and
// bottom strip, so no panel ever covers the title. Panels are inked and banded
// like poster art: thick ink frame, gold inner rule, halftone dust, layered
// drop shadow. Face shots are cropped with faceSafeCrop, so a face always
// fits its panel whole — never cut at the neck.

import { SAMPLES, sampleById, shotShowsFace, fitToAspect, faceSafeCrop } from "./faces.js";
import { chromeTitle, scriptSubtitle, roleTag, ribbon, seal, barcode, billing, stars, halftone, TITLE, SUBTITLE, QUOTE, RIBBON_TEXT, BILLING } from "./poster.js";

export const GRADES = [
  { id: "sunset", name: "Sunset", tint: "rgba(232,74,47,0.28)", sky: "rgba(255,170,60,0.55)", warm: 1 },
  { id: "neon", name: "Neon Night", tint: "rgba(255,46,136,0.30)", sky: "rgba(120,60,255,0.50)", warm: 0 },
  { id: "teal", name: "Teal Pink", tint: "rgba(46,196,182,0.26)", sky: "rgba(255,120,180,0.40)", warm: 0 },
  { id: "gold", name: "Golden Hour", tint: "rgba(242,193,78,0.30)", sky: "rgba(255,210,110,0.60)", warm: 1 },
  { id: "noir", name: "Noir", tint: "rgba(10,10,20,0.45)", sky: "rgba(200,200,220,0.18)", warm: 0 },
  { id: "violet", name: "Vice Violet", tint: "rgba(140,60,255,0.32)", sky: "rgba(255,46,136,0.45)", warm: 0 },
  { id: "blood", name: "Blood Orange", tint: "rgba(200,30,10,0.34)", sky: "rgba(255,120,40,0.55)", warm: 1 },
  { id: "miami", name: "Miami Mint", tint: "rgba(60,220,170,0.24)", sky: "rgba(140,255,220,0.45)", warm: 0 },
  { id: "chrome", name: "Chrome Mono", tint: "rgba(120,130,150,0.30)", sky: "rgba(255,255,255,0.30)", warm: 0 },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// ---- layouts ----------------------------------------------------------------
// kind "face" wants a face shot, "detail" a faceless detail shot. band/ribbonY/
// stripY are fractions of the canvas height; heroFirst draws the hero under
// the title band (full-bleed background) instead of over it.
const BAND_KEY = { x: 0.055, y: 0.475, w: 0.89, h: 0.155 };
export const LAYOUTS = [
  {
    id: "key", name: "Key Art", band: BAND_KEY, ribbonY: 0.642, stripY: 0.94,
    slots: [
      { role: "THE ARTIST", kind: "face", rect: { x: 0.020, y: 0.075, w: 0.170, h: 0.385 } },
      { role: "THE LOOKOUT", kind: "face", hero: true, tilt: -1.5, rect: { x: 0.205, y: 0.055, w: 0.480, h: 0.395 } },
      { role: "THE CAPTAIN", kind: "face", rect: { x: 0.700, y: 0.075, w: 0.145, h: 0.385 } },
      { role: "THE SINGER", kind: "face", rect: { x: 0.860, y: 0.075, w: 0.125, h: 0.385 } },
      { role: "THE DRIVER", kind: "face", rect: { x: 0.020, y: 0.700, w: 0.305, h: 0.225 } },
      { role: "THE CAPTAIN", kind: "detail", rect: { x: 0.345, y: 0.700, w: 0.310, h: 0.225 } },
      { role: "THE DRIVER", kind: "detail", rect: { x: 0.675, y: 0.700, w: 0.310, h: 0.225 } },
    ],
  },
  {
    id: "pop", name: "Hero Pop-Out", band: { x: 0.015, y: 0.735, w: 0.97, h: 0.14 }, ribbonY: 0.885, stripY: 0.94,
    slots: [
      { role: "THE LOOKOUT", kind: "face", hero: true, tilt: -1.5, rect: { x: 0.015, y: 0.055, w: 0.545, h: 0.665 } },
      { role: "THE ARTIST", kind: "face", rect: { x: 0.580, y: 0.055, w: 0.405, h: 0.200 } },
      { role: "THE CAPTAIN", kind: "face", rect: { x: 0.580, y: 0.270, w: 0.405, h: 0.200 } },
      { role: "THE SINGER", kind: "face", rect: { x: 0.580, y: 0.485, w: 0.405, h: 0.200 } },
    ],
  },
  {
    id: "hero3", name: "Hero+3", band: BAND_KEY, ribbonY: 0.642, stripY: 0.94,
    slots: [
      { role: "THE LOOKOUT", kind: "face", hero: true, tilt: -1.0, rect: { x: 0.020, y: 0.060, w: 0.960, h: 0.400 } },
      { role: "THE DRIVER", kind: "face", rect: { x: 0.020, y: 0.700, w: 0.305, h: 0.225 } },
      { role: "THE ARTIST", kind: "face", rect: { x: 0.345, y: 0.700, w: 0.310, h: 0.225 } },
      { role: "THE SINGER", kind: "face", rect: { x: 0.675, y: 0.700, w: 0.310, h: 0.225 } },
    ],
  },
  {
    id: "four", name: "Four Panel", band: { x: 0.020, y: 0.660, w: 0.96, h: 0.140 }, ribbonY: 0.815, stripY: 0.905,
    slots: [
      { role: "THE LOOKOUT", kind: "face", hero: true, rect: { x: 0.020, y: 0.060, w: 0.475, h: 0.285 } },
      { role: "THE DRIVER", kind: "face", rect: { x: 0.505, y: 0.060, w: 0.475, h: 0.285 } },
      { role: "THE CAPTAIN", kind: "face", rect: { x: 0.020, y: 0.360, w: 0.475, h: 0.285 } },
      { role: "THE SINGER", kind: "face", rect: { x: 0.505, y: 0.360, w: 0.475, h: 0.285 } },
    ],
  },
  {
    id: "bleed", name: "Full-Bleed", band: BAND_KEY, ribbonY: 0.642, stripY: 0.94, heroFirst: true,
    slots: [
      { role: "THE LOOKOUT", kind: "face", hero: true, rect: { x: 0.000, y: 0.000, w: 1.000, h: 0.920 } },
      { role: "THE DRIVER", kind: "face", rect: { x: 0.030, y: 0.700, w: 0.220, h: 0.200 } },
      { role: "THE SINGER", kind: "face", rect: { x: 0.750, y: 0.700, w: 0.220, h: 0.200 } },
    ],
  },
  {
    id: "nine", name: "Nine Grid", band: { x: 0.020, y: 0.065, w: 0.96, h: 0.140 }, ribbonY: null, stripY: 0.94,
    slots: [
      { role: "THE DRIVER", kind: "face", rect: { x: 0.020, y: 0.220, w: 0.305, h: 0.235 } },
      { role: "THE LOOKOUT", kind: "face", hero: true, rect: { x: 0.345, y: 0.220, w: 0.310, h: 0.235 } },
      { role: "THE ARTIST", kind: "face", rect: { x: 0.675, y: 0.220, w: 0.305, h: 0.235 } },
      { role: "THE CAPTAIN", kind: "face", rect: { x: 0.020, y: 0.470, w: 0.305, h: 0.235 } },
      { role: "THE LOOKOUT", kind: "detail", rect: { x: 0.345, y: 0.470, w: 0.310, h: 0.235 } },
      { role: "THE SINGER", kind: "face", rect: { x: 0.675, y: 0.470, w: 0.305, h: 0.235 } },
      { role: "THE DRIVER", kind: "detail", rect: { x: 0.020, y: 0.720, w: 0.305, h: 0.205 } },
      { role: "THE CAPTAIN", kind: "detail", rect: { x: 0.345, y: 0.720, w: 0.310, h: 0.205 } },
      { role: "THE ARTIST", kind: "detail", rect: { x: 0.675, y: 0.720, w: 0.305, h: 0.205 } },
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// ---- panel assignment with the face guard ---------------------------------
// Every face appears at most once per cover; repeats only via faceless details.
export function assignPanels(layoutId, photos = SAMPLES) {
  const layout = layoutById(layoutId);
  const usedPairs = new Set();
  const usedFaces = new Set();
  const panels = [];
  let cursor = 0;
  for (const slot of layout.slots) {
    let pick = null;
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[(cursor + i) % photos.length];
      const byRole = photo.role === slot.role;
      for (const shot of photo.shots) {
        const key = photo.id + "/" + shot.id;
        if (usedPairs.has(key)) continue;
        const shows = shotShowsFace(photo, shot);
        if (slot.kind === "face" && !shows) continue;
        if (slot.kind === "detail" && shows) continue;
        if (shows && usedFaces.has(photo.id)) continue;
        if (!pick || (byRole && pick.photo.role !== slot.role)) pick = { photo, shot };
        if (byRole && shows) break;
      }
      if (pick && pick.photo.role === slot.role) break;
    }
    if (!pick) {
      outer: for (const photo of photos) {
        for (const shot of photo.shots) {
          if (!usedPairs.has(photo.id + "/" + shot.id) && !shotShowsFace(photo, shot)) {
            pick = { photo, shot };
            break outer;
          }
        }
      }
    }
    if (pick) {
      usedPairs.add(pick.photo.id + "/" + pick.shot.id);
      if (shotShowsFace(pick.photo, pick.shot)) usedFaces.add(pick.photo.id);
      panels.push({ photo: pick.photo.id, shot: pick.shot.id, role: slot.role, kind: slot.kind, hero: !!slot.hero, tilt: slot.tilt || 0, zoom: 1, ox: 0, oy: 0 });
      cursor++;
    }
  }
  return panels;
}

// Count face appearances per photo id — the render guard test uses this.
export function faceCounts(panels) {
  const counts = {};
  for (const p of panels) {
    const photo = sampleById(p.photo);
    const shot = photo.shots.find((s) => s.id === p.shot);
    if (shot && shotShowsFace(photo, shot)) counts[p.photo] = (counts[p.photo] || 0) + 1;
  }
  return counts;
}

export function defaultState() {
  return {
    title: TITLE,
    subtitle: SUBTITLE,
    layout: "key",
    grade: "sunset",
    panels: assignPanels("key"),
  };
}

// ---- grading ---------------------------------------------------------------
let grainCanvas = null;
function grainPattern() {
  if (!grainCanvas) {
    grainCanvas = document.createElement("canvas");
    grainCanvas.width = 160;
    grainCanvas.height = 160;
    const g = grainCanvas.getContext("2d");
    const img = g.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 118 + Math.floor(Math.random() * 20);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  return document.createElement("canvas").getContext("2d").createPattern(grainCanvas, "repeat");
}

function gradePhoto(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh, grade) {
  const off = document.createElement("canvas");
  off.width = Math.max(2, Math.round(dw));
  off.height = Math.max(2, Math.round(dh));
  const o = off.getContext("2d");
  o.drawImage(img, sx, sy, sw, sh, 0, 0, off.width, off.height);
  o.globalCompositeOperation = "overlay";
  o.fillStyle = grade.tint;
  o.fillRect(0, 0, off.width, off.height);
  const sky = o.createRadialGradient(off.width / 2, -off.height * 0.2, 10, off.width / 2, -off.height * 0.2, off.height * 1.1);
  sky.addColorStop(0, grade.sky);
  sky.addColorStop(1, "rgba(0,0,0,0)");
  o.globalCompositeOperation = "soft-light";
  o.fillStyle = sky;
  o.fillRect(0, 0, off.width, off.height);
  const v = o.createRadialGradient(off.width / 2, off.height / 2, Math.min(off.width, off.height) * 0.35, off.width / 2, off.height / 2, Math.max(off.width, off.height) * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(10,4,12,0.42)");
  o.globalCompositeOperation = "source-over";
  o.fillStyle = v;
  o.fillRect(0, 0, off.width, off.height);
  o.globalAlpha = 0.08;
  o.globalCompositeOperation = "overlay";
  o.fillStyle = grainPattern();
  o.fillRect(0, 0, off.width, off.height);
  o.globalAlpha = 1;
  o.globalCompositeOperation = "source-over";
  ctx.drawImage(off, dx, dy, dw, dh);
}

// Source rect for a panel: crop fitted to the panel aspect, zoomed, panned.
function sourceRect(crop, panelAspect, zoom, ox, oy) {
  const fitted = fitToAspect(crop, panelAspect);
  const zw = fitted.w / zoom;
  const zh = fitted.h / zoom;
  let cx = fitted.x + fitted.w / 2 + ox * fitted.w;
  let cy = fitted.y + fitted.h / 2 + oy * fitted.h;
  cx = Math.min(Math.max(cx, zw / 2), 1 - zw / 2);
  cy = Math.min(Math.max(cy, zh / 2), 1 - zh / 2);
  return { x: cx - zw / 2, y: cy - zh / 2, w: zw, h: zh };
}

// ---- the cover -------------------------------------------------------------
export function renderCover(canvas, images, state) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const grade = gradeById(state.grade);
  const layout = layoutById(state.layout);
  const u = Math.min(W, H) / 720; // layout unit

  // plum backdrop + faint halftone dust
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#2a0f22");
  bg.addColorStop(0.55, "#1b0b1e");
  bg.addColorStop(1, "#12060f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  halftone(ctx, 0, 0, W, H, 18 * u, "#000000", 0.08);

  // quote bar
  const qy = H * 0.018;
  stars(ctx, W * 0.022, qy + 4 * u, 13 * u);
  ctx.save();
  ctx.fillStyle = "#e8d8c8";
  ctx.font = `italic ${15 * u}px Georgia, serif`;
  ctx.textBaseline = "top";
  ctx.fillText(`"${QUOTE}"`, W * 0.115, qy);
  ctx.restore();
  ctx.save();
  ctx.font = `${13 * u}px Anton, sans-serif`;
  ctx.fillStyle = "#f2c14e";
  ctx.strokeStyle = "#f2c14e";
  ctx.lineWidth = 1.5 * u;
  const vol = "VOL. 1";
  const vw = ctx.measureText(vol).width + 18 * u;
  ctx.strokeRect(W - vw - W * 0.015, qy - 2 * u, vw, 20 * u);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(vol, W - vw / 2 - W * 0.015, qy + 8 * u);
  ctx.restore();

  const drawPanel = (slot, panel) => {
    const photo = sampleById(panel.photo);
    const img = images[photo.id];
    const shot = photo.shots.find((s) => s.id === panel.shot) || photo.shots[0];
    const r = slot.rect;
    const px = r.x * W, py = r.y * H, pw = r.w * W, ph = r.h * H;
    const aspect = pw / ph;
    // face shots are cropped around the measured face box so the face fits
    // the panel whole; wide panels get a looser crop (more context, smaller
    // face) so the strip still reads as a person, not a mouth.
    const pad = aspect > 1.5 ? 1.2 : 0.25;
    const crop = shotShowsFace(photo, shot) ? faceSafeCrop(photo, aspect, pad) : shot.crop;
    ctx.save();
    ctx.translate(px + pw / 2, py + ph / 2);
    if (slot.tilt) ctx.rotate((slot.tilt * Math.PI) / 180);
    ctx.translate(-pw / 2, -ph / 2);
    // layered drop shadow (depth, not a flat card shadow)
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = 18 * u;
    ctx.shadowOffsetY = 8 * u;
    ctx.fillStyle = "#0d050c";
    ctx.fillRect(-3 * u, -3 * u, pw + 6 * u, ph + 6 * u);
    ctx.shadowColor = "transparent";
    // photo
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, pw, ph);
    ctx.clip();
    if (img) {
      const src = sourceRect(crop, aspect, panel.zoom || 1, panel.ox || 0, panel.oy || 0);
      gradePhoto(ctx, img, src.x * img.naturalWidth, src.y * img.naturalHeight, src.w * img.naturalWidth, src.h * img.naturalHeight, 0, 0, pw, ph, grade);
    } else {
      ctx.fillStyle = "#3a1a30";
      ctx.fillRect(0, 0, pw, ph);
    }
    // faint halftone dust over the photo
    halftone(ctx, 0, 0, pw, ph, 12 * u, "#000000", 0.05);
    ctx.restore();
    // ink frame: thick ink + gold inner rule + 1px pure outline on the image edge
    ctx.lineWidth = Math.max(3, 5 * u);
    ctx.strokeStyle = "#12060f";
    ctx.strokeRect(-2.5 * u, -2.5 * u, pw + 5 * u, ph + 5 * u);
    ctx.lineWidth = Math.max(1.5, 2.5 * u);
    ctx.strokeStyle = "#f2c14e";
    ctx.strokeRect(2 * u, 2 * u, pw - 4 * u, ph - 4 * u);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.strokeRect(0.5, 0.5, pw - 1, ph - 1);
    // role tag, top-left, overlapping the frame
    roleTag(ctx, 4 * u, 4 * u, panel.role, Math.max(11, 15 * u));
    // edition chip on the hero
    if (panel.hero) {
      ctx.save();
      ctx.font = `${Math.max(11, 13 * u)}px Anton, sans-serif`;
      const label = "SUNSET EDITION";
      const tw = ctx.measureText(label).width + 16 * u;
      ctx.translate(pw - tw - 6 * u, 6 * u);
      ctx.transform(1, 0, -0.06, 1, 0, 0);
      ctx.fillStyle = "#f2c14e";
      ctx.fillRect(0, 0, tw, 20 * u);
      ctx.fillStyle = "#1b0b1e";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 8 * u, 10 * u + 1);
      ctx.restore();
    }
    ctx.restore();
  };

  const heroIdx = layout.slots.findIndex((s, i) => state.panels[i] && state.panels[i].hero);
  const drawTitle = () => {
    const band = layout.band;
    const bx = band.x * W, by = band.y * H, bw = band.w * W, bh = band.h * H;
    ctx.save();
    ctx.fillStyle = "#160a14";
    ctx.fillRect(bx, by, bw, bh);
    halftone(ctx, bx, by, bw, bh, 10 * u, "#000000", 0.35);
    ctx.lineWidth = Math.max(2, 3 * u);
    ctx.strokeStyle = "#f2c14e";
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();
    const titlePx = Math.min(bh * 0.62, (bw * 0.92) / (state.title.length * 0.62));
    chromeTitle(ctx, state.title, W / 2, by + bh * 0.06, titlePx, { skew: -0.03, maxWidth: bw * 0.88 });
    scriptSubtitle(ctx, state.subtitle, W / 2, by + bh * 0.66, titlePx * 0.34);
    if (layout.ribbonY != null) {
      ribbon(ctx, W / 2, layout.ribbonY * H, W * 0.46, RIBBON_TEXT, Math.max(11, 15 * u));
    }
  };
  const drawStrip = () => {
    const by = layout.stripY * H;
    barcode(ctx, W * 0.020, by, W * 0.095, H * 0.045);
    ctx.save();
    ctx.fillStyle = "#f2c14e";
    ctx.font = `${Math.max(11, 13 * u)}px Anton, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText("COMING SOON", W * 0.125, by + H * 0.022);
    ctx.restore();
    billing(ctx, W * 0.55, by - H * 0.006, BILLING, Math.max(7, 8.5 * u));
    seal(ctx, W * 0.945, by + H * 0.006, Math.min(W, H) * 0.048);
  };

  if (layout.heroFirst) {
    // full-bleed hero is the background: title and insets sit on top of it
    if (heroIdx >= 0 && state.panels[heroIdx]) drawPanel(layout.slots[heroIdx], state.panels[heroIdx]);
    layout.slots.forEach((slot, i) => {
      if (i === heroIdx) return;
      if (state.panels[i]) drawPanel(slot, state.panels[i]);
    });
    drawTitle();
  } else {
    // panels first, then the title band, then the hero overlapping its top edge
    layout.slots.forEach((slot, i) => {
      if (i === heroIdx) return;
      if (state.panels[i]) drawPanel(slot, state.panels[i]);
    });
    drawTitle();
    if (heroIdx >= 0 && state.panels[heroIdx]) drawPanel(layout.slots[heroIdx], state.panels[heroIdx]);
  }
  drawStrip();
}

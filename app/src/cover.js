// cover.js — the canvas renderer of Neon Coast Cover Studio. It draws the
// whole poster: inked panels with face-safe crops, the chrome title block,
// ribbon, billing, seal and barcode, under one of nine colour grades.
// Layouts are fractions of the canvas, so the same cover renders at any
// export size (1080x1080, 1080x1350, 1920x1080) without re-laying out.

import { SAMPLES, sampleById, faceSafeWindow } from './faces.js';
import {
  TITLE, SUBTITLE, QUOTE, RIBBON, BILLING, BILLING_2,
  halftonePattern, drawChromeTitle, drawNeonSubtitle, drawRoleTag,
  drawQuoteBar, drawRibbon, drawBilling, drawSeal, drawBarcode,
  drawChip, drawVolumeChip,
} from './poster.js';

export const FONTS = {
  display: '"Anton", "Arial Black", sans-serif',
  script: '"Pacifico", cursive',
};

export const GRADES = [
  { id: 'sunset', name: 'Sunset', tint: 'rgba(255,120,40,0.16)', blend: 'overlay', glow: '#ff9a3d', filter: '' },
  { id: 'neon', name: 'Neon Night', tint: 'rgba(255,46,136,0.14)', blend: 'soft-light', glow: '#ff2e88', filter: '' },
  { id: 'teal', name: 'Teal Pink', tint: 'rgba(31,182,166,0.14)', blend: 'overlay', glow: '#1fb6a6', filter: '' },
  { id: 'golden', name: 'Golden Hour', tint: 'rgba(247,201,72,0.15)', blend: 'soft-light', glow: '#f7c948', filter: '' },
  { id: 'noir', name: 'Noir', tint: 'rgba(10,10,30,0.14)', blend: 'overlay', glow: '#8a8aa8', filter: 'grayscale(0.85) contrast(1.15)' },
  { id: 'vice', name: 'Vice Blue', tint: 'rgba(120,60,255,0.13)', blend: 'overlay', glow: '#7a3cff', filter: '' },
  { id: 'heat', name: 'Heatwave', tint: 'rgba(255,60,20,0.18)', blend: 'overlay', glow: '#ff3c14', filter: '' },
  { id: 'lavender', name: 'Lavender Dusk', tint: 'rgba(180,140,255,0.13)', blend: 'soft-light', glow: '#b48cff', filter: '' },
  { id: 'mono', name: 'Mono Gold', tint: 'rgba(247,201,72,0.10)', blend: 'soft-light', glow: '#f7c948', filter: 'grayscale(0.9) sepia(0.25)' },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// Slot geometry is a fraction of the canvas. Title block, ribbon and
// footer live in the same fractional bands in every layout, so the poster
// furniture never collides with a panel at any aspect ratio.
export const LAYOUTS = [
  {
    id: 'keyart', name: 'Key Art',
    slots: [
      { x: 0.205, y: 0.065, w: 0.52, h: 0.40, tilt: -1.5, hero: true },
      { x: 0.02, y: 0.075, w: 0.165, h: 0.38, tilt: 0 },
      { x: 0.745, y: 0.075, w: 0.115, h: 0.38, tilt: 0 },
      { x: 0.87, y: 0.075, w: 0.11, h: 0.38, tilt: 0 },
      { x: 0.02, y: 0.70, w: 0.31, h: 0.225, tilt: 0 },
      { x: 0.345, y: 0.70, w: 0.31, h: 0.225, tilt: 0 },
      { x: 0.67, y: 0.70, w: 0.31, h: 0.225, tilt: 0 },
    ],
  },
  {
    id: 'hero3', name: 'Hero + 3',
    slots: [
      { x: 0.02, y: 0.07, w: 0.62, h: 0.40, tilt: -1.5, hero: true },
      { x: 0.66, y: 0.07, w: 0.32, h: 0.40, tilt: 0 },
      { x: 0.02, y: 0.70, w: 0.31, h: 0.225, tilt: 0 },
      { x: 0.345, y: 0.70, w: 0.31, h: 0.225, tilt: 0 },
      { x: 0.67, y: 0.70, w: 0.31, h: 0.225, tilt: 0 },
    ],
  },
  {
    id: 'four', name: 'Four Panel',
    slots: [
      { x: 0.02, y: 0.07, w: 0.47, h: 0.195, tilt: 0 },
      { x: 0.51, y: 0.07, w: 0.47, h: 0.195, tilt: 0 },
      { x: 0.02, y: 0.275, w: 0.47, h: 0.195, tilt: 0 },
      { x: 0.51, y: 0.275, w: 0.47, h: 0.195, tilt: 0 },
      { x: 0.02, y: 0.70, w: 0.31, h: 0.225, tilt: 0 },
      { x: 0.345, y: 0.70, w: 0.31, h: 0.225, tilt: 0 },
      { x: 0.67, y: 0.70, w: 0.31, h: 0.225, tilt: 0 },
    ],
  },
  {
    id: 'fullbleed', name: 'Full Bleed',
    slots: [
      { x: 0.02, y: 0.07, w: 0.96, h: 0.40, tilt: 0, hero: true },
      { x: 0.02, y: 0.70, w: 0.31, h: 0.225, tilt: 0 },
      { x: 0.345, y: 0.70, w: 0.31, h: 0.225, tilt: 0 },
      { x: 0.67, y: 0.70, w: 0.31, h: 0.225, tilt: 0 },
    ],
  },
  {
    id: 'nine', name: 'Nine Panel',
    slots: [
      { x: 0.02, y: 0.07, w: 0.31, h: 0.13, tilt: 0 },
      { x: 0.345, y: 0.07, w: 0.31, h: 0.13, tilt: 0 },
      { x: 0.67, y: 0.07, w: 0.31, h: 0.13, tilt: 0 },
      { x: 0.02, y: 0.21, w: 0.31, h: 0.13, tilt: 0 },
      { x: 0.345, y: 0.21, w: 0.31, h: 0.13, tilt: 0 },
      { x: 0.67, y: 0.21, w: 0.31, h: 0.13, tilt: 0 },
      { x: 0.02, y: 0.35, w: 0.31, h: 0.12, tilt: 0 },
      { x: 0.345, y: 0.35, w: 0.31, h: 0.12, tilt: 0 },
      { x: 0.67, y: 0.35, w: 0.31, h: 0.12, tilt: 0 },
    ],
  },
  {
    id: 'snapshot', name: 'Snapshot',
    slots: [
      { x: 0.04, y: 0.08, w: 0.34, h: 0.36, tilt: -2 },
      { x: 0.34, y: 0.06, w: 0.34, h: 0.38, tilt: 1.5, hero: true },
      { x: 0.64, y: 0.09, w: 0.32, h: 0.36, tilt: -1 },
      { x: 0.02, y: 0.70, w: 0.31, h: 0.225, tilt: 0 },
      { x: 0.345, y: 0.70, w: 0.31, h: 0.225, tilt: 0 },
      { x: 0.67, y: 0.70, w: 0.31, h: 0.225, tilt: 0 },
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// Assign a distinct (sample, shot) pair to every slot of a layout. The
// hero slot always gets the portrait face close-up. Faces are used once
// each; later slots get faceless detail shots, never from the same sample
// as the previous slot, so no face repeats and no two neighbours show the
// same photo. Pure function — no canvas, no DOM — so Node can sweep it.
export function assignPanels(layoutId, heroId) {
  const layout = layoutById(layoutId);
  const heroSample = heroId && heroId !== 'upload' ? sampleById(heroId) : sampleById('portrait');
  const faceOrder = ['portrait', 'graffiti', 'pier', 'singer', 'boulevard'];
  const detailOrder = ['pier', 'boulevard', 'graffiti', 'singer', 'portrait'];
  const usedFaces = new Set();
  const usedPairs = new Set();
  let detailCursor = 0;
  const panels = [];
  // Reserve the hero's face up front, but only when the layout actually
  // has a hero slot: the hero slot is not always first in the slot list
  // (Snapshot puts it second), and a face must never appear twice on one
  // cover. Layouts without a hero slot keep all five faces available.
  if (layout.slots.some((s) => s.hero)) {
    usedFaces.add(heroSample.id);
    usedPairs.add(`${heroSample.id}/face`);
  }
  for (const slot of layout.slots) {
    if (slot.hero) {
      panels.push({ slot, sampleId: heroId === 'upload' ? 'upload' : heroSample.id, shotId: 'face', hasFace: true });
      usedFaces.add(heroSample.id);
      usedPairs.add(`${heroSample.id}/face`);
      continue;
    }
    // First pass: an unused face shot.
    const facePick = faceOrder.find((id) => !usedFaces.has(id));
    if (facePick) {
      const sample = sampleById(facePick);
      panels.push({ slot, sampleId: sample.id, shotId: 'face', hasFace: true });
      usedFaces.add(sample.id);
      usedPairs.add(`${sample.id}/face`);
      continue;
    }
    // Then faceless detail shots, skipping the previous slot's sample.
    let pick = null;
    for (let i = 0; i < detailOrder.length; i += 1) {
      const id = detailOrder[(detailCursor + i) % detailOrder.length];
      const sample = sampleById(id);
      const detail = sample.shots.find((s) => !s.hasFace);
      if (!detail) continue;
      if (usedPairs.has(`${id}/${detail.id}`)) continue;
      const prev = panels[panels.length - 1];
      if (prev && prev.sampleId === id) continue;
      pick = { sample, shot: detail };
      detailCursor = (detailCursor + i + 1) % detailOrder.length;
      break;
    }
    if (!pick) {
      const sample = sampleById(detailOrder[detailCursor % detailOrder.length]);
      const detail = sample.shots.find((s) => !s.hasFace);
      pick = { sample, shot: detail };
      detailCursor += 1;
    }
    panels.push({ slot, sampleId: pick.sample.id, shotId: pick.shot.id, hasFace: false });
    usedPairs.add(`${pick.sample.id}/${pick.shot.id}`);
  }
  return panels;
}

// Cover-fit a source window into a panel rect, keeping the aspect ratio.
// The window is expanded (never shrunk past the face box) to match the
// panel aspect, then clamped inside the photo. Returns pixel source rect.
function coverWindow(base, aspect, imgW, imgH) {
  let { x, y, w, h } = base;
  const want = w / h;
  if (aspect > want) {
    const nw = Math.min(1, h * aspect);
    const cx = x + w / 2;
    x = Math.max(0, Math.min(1 - nw, cx - nw / 2));
    w = nw;
  } else {
    const nh = Math.min(1, w / aspect);
    const cy = y + h / 2;
    y = Math.max(0, Math.min(1 - nh, cy - nh / 2));
    h = nh;
  }
  return {
    sx: Math.round(x * imgW), sy: Math.round(y * imgH),
    sw: Math.max(1, Math.round(w * imgW)), sh: Math.max(1, Math.round(h * imgH)),
  };
}

function drawPanel(ctx, img, panel, rect, grade, scale, overrides) {
  // An uploaded photo has no measured face: it behaves like a sample with
  // one full-frame shot and the upper-third default window.
  const sample = panel.sampleId === 'upload'
    ? { id: 'upload', role: 'THE STAR', label: 'Your photo', face: null, shots: [{ id: 'full', label: 'Full photo', rect: { x: 0, y: 0, w: 1, h: 1 }, hasFace: false }] }
    : sampleById(panel.sampleId);
  const shot = sample.shots.find((s) => s.id === panel.shotId) || sample.shots[0];
  const aspect = rect.w / rect.h;
  let base;
  if (panel.sampleId === 'upload') {
    base = { x: 0.04, y: 0.03, w: 0.92, h: Math.min(0.92, 0.92 / aspect) };
  } else {
    base = panel.hasFace ? faceSafeWindow(sample, aspect) : shot.rect;
  }
  // Editor overrides: zoom shrinks the window around its centre, drag
  // shifts it. Everything stays clamped inside the photo.
  if (overrides) {
    const z = overrides.zoom || 1;
    const cx = base.x + base.w / 2 + (overrides.dx || 0);
    const cy = base.y + base.h / 2 + (overrides.dy || 0);
    const w = Math.max(0.08, base.w / z);
    const h = Math.max(0.08, base.h / z);
    base = {
      x: Math.max(0, Math.min(1 - w, cx - w / 2)),
      y: Math.max(0, Math.min(1 - h, cy - h / 2)),
      w, h,
    };
  }
  const src = coverWindow(base, aspect, img.naturalWidth, img.naturalHeight);
  ctx.save();
  if (panel.slot.tilt) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((panel.slot.tilt * Math.PI) / 180);
    ctx.translate(-rect.w / 2, -rect.h / 2);
    rect = { x: 0, y: 0, w: rect.w, h: rect.h };
  }
  // Layered drop shadow for the pop-out depth.
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 18 * scale;
  ctx.shadowOffsetY = 8 * scale;
  ctx.fillStyle = '#12081f';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  // Photo, cover-fit, with the grade's filter (noir / mono gold).
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (grade.filter) ctx.filter = grade.filter;
  ctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, rect.x, rect.y, rect.w, rect.h);
  ctx.filter = 'none';
  // Grade tint.
  ctx.globalCompositeOperation = grade.blend;
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  // Faint halftone over the photo, so panels read as printed poster art.
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = halftonePattern(ctx, 3, 9, 1);
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalAlpha = 1;
  ctx.restore();
  // Ink frame: thick gold band + inner dark line + 1px pale outline.
  ctx.lineWidth = Math.max(2, 3 * scale);
  ctx.strokeStyle = '#f2b705';
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.lineWidth = Math.max(1, 1 * scale);
  ctx.strokeStyle = 'rgba(13,4,22,0.9)';
  ctx.strokeRect(rect.x + 4 * scale, rect.y + 4 * scale, rect.w - 8 * scale, rect.h - 8 * scale);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
  // Role tag, top-left inside the frame, shrunk to fit narrow panels.
  drawRoleTag(ctx, sample.role, rect.x + 6 * scale, rect.y + 6 * scale, scale, rect.w - 12 * scale);
  ctx.restore();
}

// The whole poster. `images` maps sample id -> loaded HTMLImageElement.
// `state` = { layoutId, gradeId, title, subtitle, overrides: {slotIndex: {zoom,dx,dy}} }.
export function renderCover(canvas, images, state) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  const scale = Math.min(W, H) / 720;
  const grade = gradeById(state.gradeId);
  const panels = assignPanels(state.layoutId, state.heroSample);
  // Editor shot cycling: replace a panel's shot with the cycled one, but
  // never let a face appear twice — a cycled face shot is skipped if that
  // face is already on the cover.
  if (state.shotCycle) {
    panels.forEach((panel, i) => {
      const cycle = state.shotCycle[i];
      if (cycle == null || panel.sampleId === 'upload') return;
      const sample = sampleById(panel.sampleId);
      const shot = sample.shots[cycle % sample.shots.length];
      if (shot.hasFace) {
        // A face may appear only once: block the cycle if another panel
        // already shows this sample's face.
        const clash = panels.some((p, j) => j !== i && p.hasFace && p.sampleId === panel.sampleId);
        if (clash) return;
      }
      panel.shotId = shot.id;
      panel.hasFace = shot.hasFace;
    });
  }

  // Deep violet ground.
  ctx.fillStyle = '#1b0f2a';
  ctx.fillRect(0, 0, W, H);
  // Sky glow behind the art, in the grade's colour.
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.28, 10, W * 0.5, H * 0.28, W * 0.75);
  glow.addColorStop(0, grade.glow + '55');
  glow.addColorStop(1, 'rgba(27,15,42,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Quote bar + volume chip (chip pinned by its right edge, 2% in).
  drawQuoteBar(ctx, QUOTE, W * 0.02, H * 0.032, W * 0.7, scale, FONTS);
  drawVolumeChip(ctx, 'VOL. 1', W * 0.98, H * 0.018, scale);

  // Panels.
  panels.forEach((panel, i) => {
    const s = panel.slot;
    const rect = { x: s.x * W, y: s.y * H, w: s.w * W, h: s.h * H };
    const img = images[panel.sampleId];
    if (!img) return;
    const overrides = state.overrides ? state.overrides[i] : null;
    drawPanel(ctx, img, panel, rect, grade, scale, overrides);
  });

  // Hero chip, pinned to the hero panel's top-right corner (measured so
  // the right edge lands exactly at the panel's right edge).
  const hero = panels.find((p) => p.slot.hero);
  if (hero) {
    const hx = (hero.slot.x + hero.slot.w) * W;
    const hy = hero.slot.y * H;
    ctx.save();
    ctx.font = `700 ${Math.round(13 * scale)}px ${FONTS.display}`;
    const chipW = ctx.measureText('SUNSET EDITION').width + 18 * scale;
    ctx.restore();
    drawChip(ctx, 'SUNSET EDITION', hx - chipW - 6 * scale, hy + 6 * scale, scale, FONTS);
  }

  // Halftone title block.
  const tb = { x: W * 0.055, y: H * 0.485, w: W * 0.89, h: H * 0.15 };
  ctx.save();
  ctx.fillStyle = '#160a24';
  ctx.fillRect(tb.x, tb.y, tb.w, tb.h);
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = halftonePattern(ctx, 4, 11, 1);
  ctx.fillRect(tb.x, tb.y, tb.w, tb.h);
  ctx.globalAlpha = 1;
  ctx.lineWidth = Math.max(2, 2.5 * scale);
  ctx.strokeStyle = '#f2b705';
  ctx.strokeRect(tb.x, tb.y, tb.w, tb.h);
  ctx.restore();
  // Chrome title, centred once; subtitle right under it in neon script.
  // Baseline at 74% of the block so the caps clear the top edge with
  // margin and the extrusion clears the bottom; the width passed is the
  // smaller of the block width and a height-derived bound, so the title
  // never overflows the block at any aspect ratio.
  const titleTop = tb.y + tb.h * 0.74;
  drawChromeTitle(ctx, state.title || TITLE, W / 2, titleTop, Math.min(W * 0.86, H * 0.88), FONTS);
  drawNeonSubtitle(ctx, state.subtitle || SUBTITLE, W / 2, tb.y + tb.h * 0.88, Math.max(16, 26 * scale), FONTS);

  // Ribbon.
  drawRibbon(ctx, RIBBON, W / 2, H * 0.645, W * 0.56, H * 0.038, FONTS);

  // Footer: barcode + COMING SOON left, billing centred, seal right.
  const fy = H * 0.94;
  drawBarcode(ctx, W * 0.02, fy, W * 0.085, H * 0.045);
  ctx.save();
  ctx.fillStyle = '#f2b705';
  ctx.font = `700 ${Math.round(13 * scale)}px ${FONTS.display}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('COMING SOON', W * 0.115, fy + H * 0.022);
  ctx.restore();
  drawBilling(ctx, [BILLING, BILLING_2], W / 2, fy + H * 0.012, W * 0.6, scale);
  drawSeal(ctx, W * 0.955, fy + H * 0.022, H * 0.026);

  // Grain + vignette over everything, faint.
  const grain = document.createElement('canvas');
  grain.width = 140;
  grain.height = 140;
  const g = grain.getContext('2d');
  const data = g.createImageData(140, 140);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v;
    data.data[i + 3] = 14;
  }
  g.putImageData(data, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = ctx.createPattern(grain, 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  return { panels, grade: grade.id };
}

// Node-side sweep: does every layout keep every face whole? Returns a list
// of failures (empty = all good). Used by the build's own verification.
export function faceGuardSweep() {
  const failures = [];
  const aspects = [1, 4 / 5, 16 / 9, 3 / 4, 9 / 16, 2 / 3, 3 / 2];
  for (const layout of LAYOUTS) {
    const panels = assignPanels(layout.id);
    const seenFaces = new Set();
    for (const panel of panels) {
      if (!panel.hasFace) continue;
      if (seenFaces.has(panel.sampleId)) {
        failures.push(`${layout.id}: face ${panel.sampleId} twice`);
      }
      seenFaces.add(panel.sampleId);
      const sample = sampleById(panel.sampleId);
      for (const aspect of aspects) {
        const win = faceSafeWindow(sample, aspect);
        const f = sample.face;
        const inside =
          win.x <= f.x + 0.001 && win.y <= f.y + 0.001 &&
          win.x + win.w >= f.x + f.w - 0.001 &&
          win.y + win.h >= f.y + f.h - 0.001;
        if (!inside) failures.push(`${layout.id}: ${panel.sampleId} face cut at aspect ${aspect}`);
      }
    }
  }
  return failures;
}

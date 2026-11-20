// cover.js — canvas renderer for Neon Coast Cover Studio.
// Layouts are pure geometry (fractions of the canvas); the face-safe
// crop guard guarantees every face box stays whole inside its panel.

import { SAMPLES, sampleById } from './faces.js';
import { drawRoleTag, drawPosterFurniture } from './poster.js';

const GOLD = '#f5b90c';

export const EXPORT_SIZES = [
  { name: 'square', w: 1080, h: 1080 },
  { name: 'portrait', w: 1080, h: 1350 },
  { name: 'wide', w: 1920, h: 1080 },
];

export const GRADES = [
  { id: 'sunset', name: 'Sunset', tint: '#ff7a2f', glow: '#ffb347', strength: 0.16 },
  { id: 'neon', name: 'Neon Night', tint: '#ff2e88', glow: '#7b2fff', strength: 0.20 },
  { id: 'teal', name: 'Teal Pink', tint: '#00c2a8', glow: '#ff5e8a', strength: 0.16 },
  { id: 'golden', name: 'Golden Hour', tint: '#f5b90c', glow: '#ff8a3d', strength: 0.18 },
  { id: 'noir', name: 'Noir', tint: '#3a3f5c', glow: '#0e0e18', strength: 0.22 },
  { id: 'vice', name: 'Vice Blue', tint: '#2f7bff', glow: '#ff2e88', strength: 0.18 },
  { id: 'heat', name: 'Heatwave', tint: '#ff3b1f', glow: '#ffd23d', strength: 0.17 },
  { id: 'lavender', name: 'Lavender Dusk', tint: '#8a5cff', glow: '#ff7ad9', strength: 0.16 },
  { id: 'mono', name: 'Mono Gold', tint: '#c9a227', glow: '#5c4a12', strength: 0.14 },
];

// Shared poster bands, as fractions of canvas height.
export const BANDS = {
  quote: { y: 0.014, h: 0.038 },
  top: { y: 0.062, h: 0.405 },
  title: { y: 0.490, h: 0.165 },
  ribbon: { y: 0.672, h: 0.042 },
  bottom: { y: 0.728, h: 0.212 },
  footer: { y: 0.952, h: 0.036 },
};

// Panel spec: x/y/w/h are fractions of the canvas. `shot` picks which
// crop of the sample to use; `hero` marks the tilted pop-out panel.
function panel(sample, shot, role, x, y, w, h, tilt = 0, hero = false) {
  return { sample, shot, role, x, y, w, h, tilt, hero };
}

export const LAYOUTS = [
  {
    id: 'hero', name: 'Hero Pop-Out',
    panels: (W, H) => [
      panel('graffiti', 'face', 'THE ARTIST', 0.018, 0.062, 0.168, 0.405),
      panel('portrait', 'face', 'THE LOOKOUT', 0.196, 0.058, 0.562, 0.415, -1.5, true),
      panel('pier', 'face', 'THE CAPTAIN', 0.768, 0.062, 0.108, 0.405),
      panel('singer', 'face', 'THE SINGER', 0.886, 0.062, 0.096, 0.405),
      panel('boulevard', 'face', 'THE DRIVER', 0.018, 0.728, 0.315, 0.212),
      panel('pier', 'detail', 'THE CAPTAIN', 0.348, 0.728, 0.315, 0.212),
      panel('boulevard', 'detail', 'THE DRIVER', 0.678, 0.728, 0.304, 0.212),
    ],
  },
  {
    id: 'hero3', name: 'Hero + 3',
    panels: (W, H) => [
      panel('portrait', 'wide', 'THE LOOKOUT', 0.018, 0.062, 0.540, 0.405, -1, true),
      panel('graffiti', 'face', 'THE ARTIST', 0.570, 0.062, 0.200, 0.405),
      panel('pier', 'face', 'THE CAPTAIN', 0.782, 0.062, 0.200, 0.405),
      panel('singer', 'face', 'THE SINGER', 0.018, 0.728, 0.315, 0.212),
      panel('boulevard', 'face', 'THE DRIVER', 0.348, 0.728, 0.315, 0.212),
      panel('pier', 'detail', 'THE CAPTAIN', 0.678, 0.728, 0.304, 0.212),
    ],
  },
  {
    id: 'four', name: 'Four Panel',
    panels: (W, H) => [
      panel('portrait', 'wide', 'THE LOOKOUT', 0.018, 0.062, 0.480, 0.405),
      panel('pier', 'wide', 'THE CAPTAIN', 0.502, 0.062, 0.480, 0.405),
      panel('boulevard', 'wide', 'THE DRIVER', 0.018, 0.728, 0.480, 0.212),
      panel('graffiti', 'wide', 'THE ARTIST', 0.502, 0.728, 0.480, 0.212),
    ],
  },
  {
    id: 'bleed', name: 'Full Bleed',
    panels: (W, H) => [
      panel('boulevard', 'wide', 'THE DRIVER', 0.0, 0.0, 1.0, 1.0),
      panel('portrait', 'face', 'THE LOOKOUT', 0.030, 0.730, 0.280, 0.210),
      panel('singer', 'face', 'THE SINGER', 0.690, 0.730, 0.280, 0.210),
    ],
  },
  {
    id: 'nine', name: 'Nine Panel',
    panels: (W, H) => {
      const out = [];
      const tops = [
        ['portrait', 'face', 'THE LOOKOUT'], ['graffiti', 'face', 'THE ARTIST'],
        ['pier', 'face', 'THE CAPTAIN'], ['singer', 'face', 'THE SINGER'],
        ['boulevard', 'face', 'THE DRIVER'], ['pier', 'detail', 'THE CAPTAIN'],
      ];
      tops.forEach(([s, sh, r], i) => {
        const col = i % 3, row = Math.floor(i / 3);
        out.push(panel(s, sh, r, 0.018 + col * 0.328, 0.062 + row * 0.205, 0.315, 0.195));
      });
      out.push(panel('boulevard', 'detail', 'THE DRIVER', 0.018, 0.728, 0.315, 0.212));
      out.push(panel('graffiti', 'detail', 'THE ARTIST', 0.348, 0.728, 0.315, 0.212));
      out.push(panel('singer', 'detail', 'THE SINGER', 0.678, 0.728, 0.304, 0.212));
      return out;
    },
  },
  {
    id: 'snap', name: 'Snapshot',
    panels: (W, H) => [
      panel('portrait', 'face', 'THE LOOKOUT', 0.060, 0.075, 0.420, 0.380, -4, true),
      panel('pier', 'face', 'THE CAPTAIN', 0.470, 0.055, 0.300, 0.400, 3),
      panel('boulevard', 'face', 'THE DRIVER', 0.250, 0.300, 0.420, 0.300, 2),
      panel('graffiti', 'detail', 'THE ARTIST', 0.700, 0.330, 0.250, 0.300, -2),
      panel('singer', 'detail', 'THE SINGER', 0.060, 0.728, 0.420, 0.212),
      panel('pier', 'detail', 'THE CAPTAIN', 0.520, 0.728, 0.420, 0.212),
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// ---- face-safe crop -------------------------------------------------
// Returns the source rect (fractions of the image) to draw into a panel
// of the given pixel aspect. The face box is always kept whole, with a
// margin, even in very narrow panels: the window widens to match the
// panel aspect instead of slicing the face.
export function faceSafeWindow(imgW, imgH, face, shotRect, targetAspect) {
  const m = 0.05;
  let r = { x: shotRect.x, y: shotRect.y, w: shotRect.w, h: shotRect.h };
  if (face) {
    const fx0 = face.x - m, fy0 = face.y - m * 1.5;
    const fx1 = face.x + face.w + m, fy1 = face.y + face.h + m;
    const x0 = Math.min(r.x, fx0), y0 = Math.min(r.y, fy0);
    const x1 = Math.max(r.x + r.w, fx1), y1 = Math.max(r.y + r.h, fy1);
    r = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  const curAspect = (r.w * imgW) / (r.h * imgH);
  if (curAspect < targetAspect) {
    const needW = ((r.h * imgH) * targetAspect) / imgW;
    const cx = r.x + r.w / 2;
    r.w = needW; r.x = cx - needW / 2;
  } else {
    const needH = ((r.w * imgW) / targetAspect) / imgH;
    const cy = r.y + r.h / 2;
    r.h = needH; r.y = cy - needH / 2;
  }
  // Clamp inside the image; if the window is wider/taller than the
  // image, pin it to the full frame (the face is still inside, since
  // the window was grown around it).
  if (r.w >= 1) { r.x = 0; r.w = 1; }
  else { r.x = Math.max(0, Math.min(1 - r.w, r.x)); }
  if (r.h >= 1) { r.y = 0; r.h = 1; }
  else { r.y = Math.max(0, Math.min(1 - r.h, r.y)); }
  return r;
}

// Pure geometry helper used by the Node face-guard sweep: for every
// panel of a layout at a canvas size, report the source window and
// whether the face box survives inside it.
export function planPanels(layoutId, W, H) {
  const def = layoutById(layoutId);
  return def.panels(W, H).map((p) => {
    const s = sampleById(p.sample);
    const shot = s.shots.find((x) => x.name === p.shot) || s.shots[0];
    const win = faceSafeWindow(1200, 1800, shot.face ? s.face : null, shot.rect, (p.w * W) / (p.h * H));
    const faceInside = !shot.face || (
      win.x <= s.face.x + 0.001 && win.y <= s.face.y + 0.001 &&
      win.x + win.w >= s.face.x + s.face.w - 0.001 &&
      win.y + win.h >= s.face.y + s.face.h - 0.001
    );
    return { ...p, px: { x: p.x * W, y: p.y * H, w: p.w * W, h: p.h * H }, win, faceInside };
  });
}

// ---- rendering ------------------------------------------------------

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function drawPhoto(ctx, img, win, px, grade, W, H) {
  const sx = win.x * img.naturalWidth, sy = win.y * img.naturalHeight;
  const sw = win.w * img.naturalWidth, sh = win.h * img.naturalHeight;
  ctx.drawImage(img, sx, sy, sw, sh, px.x, px.y, px.w, px.h);
  // Grade tint + sky glow, clipped to the panel.
  ctx.save();
  ctx.beginPath(); ctx.rect(px.x, px.y, px.w, px.h); ctx.clip();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grade.tint; ctx.globalAlpha = grade.strength;
  ctx.fillRect(px.x, px.y, px.w, px.h);
  ctx.globalCompositeOperation = 'source-over';
  const glow = ctx.createLinearGradient(px.x, px.y, px.x, px.y + px.h * 0.55);
  glow.addColorStop(0, grade.glow); glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.22; ctx.fillStyle = glow;
  ctx.fillRect(px.x, px.y, px.w, px.h * 0.55);
  ctx.restore();
}

function inkFrame(ctx, px, hero) {
  ctx.save();
  ctx.lineJoin = 'miter';
  ctx.strokeStyle = '#12061c'; ctx.lineWidth = hero ? 7 : 5;
  ctx.strokeRect(px.x + 1, px.y + 1, px.w - 2, px.h - 2);
  ctx.strokeStyle = '#f5b90c'; ctx.lineWidth = hero ? 3 : 2;
  ctx.strokeRect(px.x + 5, px.y + 5, px.w - 10, px.h - 10);
  // Halftone dots, faint, along the inner edge.
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  const step = 14;
  for (let y = px.y + 12; y < px.y + px.h - 8; y += step) {
    for (let x = px.x + 12; x < px.x + px.w - 8; x += step) {
      if ((x + y) % (step * 2) === 0) ctx.fillRect(x, y, 1.6, 1.6);
    }
  }
  ctx.restore();
}

function grainAndVignette(ctx, W, H) {
  const rnd = seededRandom(W * 7919 + H * 104729);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 900; i++) {
    ctx.fillRect(rnd() * W, rnd() * H, 1.4, 1.4);
  }
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#000000';
  for (let i = 0; i < 900; i++) {
    ctx.fillRect(rnd() * W, rnd() * H, 1.4, 1.4);
  }
  ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(10,4,18,0)');
  v.addColorStop(1, 'rgba(10,4,18,0.42)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

// Assign distinct (sample, shot) pairs to panels. A face shot of a
// sample is used at most once per cover; repeats fall back to that
// sample's faceless detail shot, which is itself used at most once.
export function assignPanels(layoutId, W, H, overrides = {}) {
  const def = layoutById(layoutId);
  const raw = def.panels(W, H);
  const usedFace = new Set();
  const usedPair = new Set();
  return raw.map((p, i) => {
    const ov = overrides[i];
    let sample = ov?.sample || p.sample;
    let shotName = ov?.shot || p.shot;
    const s = sampleById(sample);
    let shot = s.shots.find((x) => x.name === shotName) || s.shots[0];
    if (shot.face && usedFace.has(sample)) {
      shot = s.shots.find((x) => !x.face) || shot;
    }
    if (usedPair.has(sample + ':' + shot.name)) {
      const alt = s.shots.find((x) => x.name !== shot.name && !usedPair.has(sample + ':' + x.name));
      if (alt) shot = alt;
    }
    if (shot.face) usedFace.add(sample);
    usedPair.add(sample + ':' + shot.name);
    return { ...p, sample, shot: shot.name, shotRect: shot.rect, face: shot.face ? s.face : null, faceShot: shot.face, override: ov || null };
  });
}

export function renderCover(canvas, opts) {
  const { layout = 'hero', grade = 'sunset', title = 'NEON COAST', subtitle = 'Paid in Sunsets',
    images, overrides = {} } = opts;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const g = gradeById(grade);

  // Deep violet backdrop with a warm horizon glow.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1c0b2a'); bg.addColorStop(0.55, '#160818'); bg.addColorStop(1, '#0e0416');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const horizon = ctx.createRadialGradient(W * 0.5, H * 0.08, 10, W * 0.5, H * 0.08, W * 0.62);
  horizon.addColorStop(0, 'rgba(255,150,60,0.20)'); horizon.addColorStop(1, 'rgba(255,150,60,0)');
  ctx.fillStyle = horizon; ctx.fillRect(0, 0, W, H * 0.4);

  const panels = assignPanels(layout, W, H, overrides);
  const bleed = layout === 'bleed';
  for (const p of panels) {
    const img = images.get(p.sample);
    if (!img) continue;
    const px = { x: p.x * W, y: p.y * H, w: p.w * W, h: p.h * H };
    const aspect = px.w / px.h;
    let win = faceSafeWindow(img.naturalWidth, img.naturalHeight, p.face, p.shotRect, aspect);
    if (p.override?.zoom && p.override.zoom !== 1) {
      const z = p.override.zoom;
      const cw = win.w / z, ch = win.h / z;
      win = { x: win.x + (win.w - cw) / 2 + (p.override.dx || 0), y: win.y + (win.h - ch) / 2 + (p.override.dy || 0), w: cw, h: ch };
      win.x = Math.max(0, Math.min(1 - win.w, win.x));
      win.y = Math.max(0, Math.min(1 - win.h, win.y));
    }
    ctx.save();
    if (p.hero || p.tilt) {
      ctx.translate(px.x + px.w / 2, px.y + px.h / 2);
      ctx.rotate(((p.tilt || 0) * Math.PI) / 180);
      ctx.translate(-(px.x + px.w / 2), -(px.y + px.h / 2));
      // Layered drop shadow for the pop-out hero.
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 26; ctx.shadowOffsetY = 12;
    }
    if (bleed && p.sample === 'boulevard' && p.shot === 'wide') {
      drawPhoto(ctx, img, win, { x: 0, y: 0, w: W, h: H }, g, W, H);
      ctx.fillStyle = 'rgba(12,4,20,0.28)'; ctx.fillRect(0, 0, W, H);
    } else {
      drawPhoto(ctx, img, win, px, g, W, H);
      inkFrame(ctx, px, p.hero);
      drawRoleTag(ctx, p.role, px);
      if (p.hero) {
        // Gold edition chip, top-right of the hero panel.
        const chipText = 'SUNSET EDITION';
        const cfs = Math.max(10, Math.min(px.h * 0.075, W * 0.014));
        ctx.save();
        ctx.font = `700 ${cfs}px Anton, sans-serif`;
        const ctw = ctx.measureText(chipText).width;
        const cpad = cfs * 0.7;
        const chh = cfs * 1.6;
        const cx0 = px.x + px.w - ctw - cpad * 2 - 8;
        ctx.fillStyle = GOLD;
        ctx.fillRect(cx0, px.y + 8, ctw + cpad * 2, chh);
        ctx.fillStyle = '#1a0b00';
        ctx.textBaseline = 'middle';
        ctx.fillText(chipText, cx0 + cpad, px.y + 8 + chh / 2);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  drawPosterFurniture(ctx, W, H, { title, subtitle, layout });
  grainAndVignette(ctx, W, H);
  return { panels, grade: g.id };
}

export { SAMPLES };

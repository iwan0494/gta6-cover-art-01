// poster.js — film-poster furniture drawn on the canvas: chrome 3D
// title, neon subtitle, quote bar, ribbon, billing block, seal,
// barcode and role tags. Title position is computed exactly once per
// frame so it can never double-center or overflow its block.

import { BANDS } from './cover.js';

const GOLD = '#f5b90c';
const PINK = '#ff2e88';

// Role tag: black chip with a gold underline, shrunk to fit the panel
// width so it never clips at a narrow panel's right edge.
export function drawRoleTag(ctx, role, px) {
  const pad = Math.max(6, px.w * 0.04);
  // Cap the size so a tag on the big hero panel stays a tag, not a banner.
  const cap = Math.max(10, px.h * 0.055);
  let fs = Math.max(9, Math.min(px.h * 0.16, px.w * 0.085, cap));
  ctx.save();
  ctx.font = `700 ${fs}px Anton, sans-serif`;
  let tw = ctx.measureText(role).width;
  while (tw + pad * 2 > px.w - 8 && fs > 7) {
    fs -= 1;
    ctx.font = `700 ${fs}px Anton, sans-serif`;
    tw = ctx.measureText(role).width;
  }
  const th = fs * 1.5;
  ctx.fillStyle = 'rgba(8,3,14,0.92)';
  ctx.fillRect(px.x + 4, px.y + 4, tw + pad * 2, th);
  ctx.fillStyle = GOLD;
  ctx.fillRect(px.x + 4, px.y + 4 + th - 3, tw + pad * 2, 3);
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(role, px.x + 4 + pad, px.y + 4 + th / 2);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, family, weight = 700) {
  let fs = startSize;
  ctx.font = `${weight} ${fs}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && fs > 8) {
    fs -= 2;
    ctx.font = `${weight} ${fs}px ${family}`;
  }
  return fs;
}

function drawChromeTitle(ctx, W, H, title) {
  const band = BANDS.title;
  const bx = W * 0.055, bw = W * 0.89;
  const by = band.y * H, bh = band.h * H;

  // Halftone title block: dark panel, gold frame, faint dot field.
  ctx.save();
  ctx.fillStyle = '#1a0b28';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(2, W * 0.002);
  ctx.strokeRect(bx + 2, by + 2, bw - 4, bh - 4);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  const step = Math.max(9, W * 0.011);
  for (let y = by + 10; y < by + bh - 8; y += step) {
    for (let x = bx + 12; x < bx + bw - 8; x += step) {
      if (((x / step) | 0) % 2 === ((y / step) | 0) % 2) ctx.fillRect(x, y, 2, 2);
    }
  }

  // Title size comes from the block height, so the chrome can never
  // spill over the top of the block (the R4 landscape bug).
  const titleSize = fitFont(ctx, title, bw * 0.94, bh * 0.62, 'Anton, sans-serif');
  const subSize = Math.max(14, titleSize * 0.30);
  const cx = W / 2;
  const titleY = by + bh * 0.56;
  const subY = by + bh * 0.86;

  ctx.save();
  ctx.translate(cx, titleY);
  ctx.transform(1, 0, -0.06, 1, 0, 0); // slight skew, poster style
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${titleSize}px Anton, sans-serif`;
  // Layered extrusion: dark offsets stacked downward.
  const layers = Math.max(3, Math.round(titleSize / 16));
  for (let i = layers; i >= 1; i--) {
    ctx.fillStyle = i % 2 ? '#5c1040' : '#2a0a3a';
    ctx.fillText(title, i * 1.6, i * 2.2);
  }
  // Chrome face: silver -> gold -> pink vertical gradient.
  const grad = ctx.createLinearGradient(0, -titleSize * 0.55, 0, titleSize * 0.55);
  grad.addColorStop(0, '#fdfdfd');
  grad.addColorStop(0.38, '#ffe9a8');
  grad.addColorStop(0.62, '#f5b90c');
  grad.addColorStop(1, '#ff5e8a');
  ctx.fillStyle = grad;
  ctx.fillText(title, 0, 0);
  // Top highlight + dark outline.
  ctx.strokeStyle = 'rgba(20,6,30,0.85)';
  ctx.lineWidth = Math.max(2, titleSize * 0.03);
  ctx.strokeText(title, 0, 0);
  ctx.restore();

  ctx.restore();
  return { subY, subSize, cx };
}

function drawSubtitle(ctx, W, H, subtitle, geom) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${geom.subSize}px Pacifico, cursive`;
  ctx.shadowColor = PINK; ctx.shadowBlur = 18;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(subtitle, geom.cx, geom.subY);
  ctx.shadowColor = '#2fd6ff'; ctx.shadowBlur = 8;
  ctx.fillText(subtitle, geom.cx, geom.subY);
  ctx.restore();
}

function drawQuoteBar(ctx, W, H) {
  const band = BANDS.quote;
  const y = band.y * H + band.h * H * 0.5;
  ctx.save();
  ctx.textBaseline = 'middle';
  const starSize = Math.max(13, H * 0.022);
  ctx.font = `${starSize}px sans-serif`;
  ctx.fillStyle = GOLD;
  const stars = '★★★★★';
  const sx = W * 0.02;
  ctx.fillText(stars, sx, y);
  const qx = sx + ctx.measureText(stars).width + W * 0.012;
  const qSize = Math.max(12, H * 0.02);
  ctx.font = `italic ${qSize}px Georgia, serif`;
  ctx.fillStyle = '#f3e9ff';
  ctx.fillText('\u201cThe most wanted sunset in Leonida\u201d', qx, y);
  // VOL. 1 chip, pinned to the right edge.
  const chip = 'VOL. 1';
  const cSize = Math.max(11, H * 0.018);
  ctx.font = `700 ${cSize}px Anton, sans-serif`;
  const cw = ctx.measureText(chip).width + W * 0.02;
  const ch = cSize * 1.7;
  const cx0 = W * 0.982 - cw;
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.6;
  ctx.strokeRect(cx0, y - ch / 2, cw, ch);
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'center';
  ctx.fillText(chip, cx0 + cw / 2, y);
  ctx.restore();
}

function drawRibbon(ctx, W, H) {
  const band = BANDS.ribbon;
  const y = band.y * H, h = band.h * H;
  const x0 = W * 0.20, x1 = W * 0.80;
  ctx.save();
  ctx.fillStyle = PINK;
  ctx.beginPath();
  ctx.moveTo(x0 + h * 0.5, y); ctx.lineTo(x1 - h * 0.5, y);
  ctx.lineTo(x1, y + h / 2); ctx.lineTo(x1 - h * 0.5, y + h);
  ctx.lineTo(x0 + h * 0.5, y + h); ctx.lineTo(x0, y + h / 2);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x0 + h * 0.5, y, (x1 - x0) - h, 2);
  const text = 'EVERYONE WANTS A CUT OF THE SUNSET';
  const fs = fitFont(ctx, text, (x1 - x0) * 0.86, h * 0.62, 'Anton, sans-serif');
  ctx.font = `700 ${fs}px Anton, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, (x0 + x1) / 2, y + h / 2 + 1);
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = '#0c0614';
  let cx = x;
  const bars = [3, 1, 2, 1, 1, 3, 2, 2, 1, 1, 3, 1, 2, 3, 1, 1, 2, 1, 3, 2];
  for (const b of bars) {
    const bw = b * (w / 44);
    ctx.fillRect(cx, y, bw, h);
    cx += bw + (w / 44);
    if (cx > x + w) break;
  }
  ctx.restore();
}

function drawSeal(ctx, W, H) {
  const band = BANDS.footer;
  const cy = band.y * H + band.h * H * 0.55;
  const r = Math.min(W, H) * 0.038;
  const cx = W * 0.955;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#1a0b28'; ctx.fill();
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(245,185,12,0.6)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.font = `${r * 0.72}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('\u2605', cx, cy - r * 0.22);
  ctx.font = `700 ${r * 0.42}px Anton, sans-serif`;
  ctx.fillText('2026', cx, cy + r * 0.38);
  ctx.restore();
}

function drawFooter(ctx, W, H) {
  const band = BANDS.footer;
  const y = band.y * H, h = band.h * H;
  ctx.save();
  // Barcode + COMING SOON, bottom left.
  const bw = W * 0.075, bh = h * 0.85;
  drawBarcode(ctx, W * 0.018, y + h * 0.05, bw, bh);
  const cSize = Math.max(11, H * 0.018);
  ctx.font = `700 ${cSize}px Anton, sans-serif`;
  ctx.fillStyle = GOLD;
  ctx.textBaseline = 'middle';
  ctx.fillText('COMING SOON', W * 0.018 + bw + W * 0.012, y + h * 0.5);
  // Billing block, centered, shrunk to fit the gap between the
  // COMING SOON label and the seal (never collides with either).
  const left = W * 0.018 + bw + W * 0.012 + ctx.measureText('COMING SOON').width + W * 0.03;
  const right = W * 0.955 - Math.min(W, H) * 0.05;
  const lines = [
    'NEON COAST  \u2022  A LEONIDA STORY  \u2022  STARRING THE DRIVER  THE CAPTAIN  THE ARTIST  THE LOOKOUT  THE SINGER',
    'DIRECTED BY NEON COAST STUDIO  \u2022  MUSIC BY THE STAGE SINGER  \u2022  SHOT ON LEONIDA BOULEVARD',
  ];
  let fs = Math.max(8, H * 0.0135);
  ctx.font = `${fs}px sans-serif`;
  while (Math.max(ctx.measureText(lines[0]).width, ctx.measureText(lines[1]).width) > right - left && fs > 6) {
    fs -= 0.5;
    ctx.font = `${fs}px sans-serif`;
  }
  ctx.fillStyle = 'rgba(243,233,255,0.85)';
  ctx.textAlign = 'center';
  ctx.fillText(lines[0], (left + right) / 2, y + h * 0.28);
  ctx.fillText(lines[1], (left + right) / 2, y + h * 0.74);
  ctx.restore();
  drawSeal(ctx, W, H);
}

export function drawPosterFurniture(ctx, W, H, opts) {
  const { title, subtitle } = opts;
  drawQuoteBar(ctx, W, H);
  const geom = drawChromeTitle(ctx, W, H, title);
  drawSubtitle(ctx, W, H, subtitle, geom);
  drawRibbon(ctx, W, H);
  drawFooter(ctx, W, H);
}

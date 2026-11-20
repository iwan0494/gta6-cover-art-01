// Neon Coast Cover Studio — cover renderer (canvas 2D, all original art).
// Draws a multi-panel GTA-style poster: photos per panel, sunset/neon grade,
// grain + vignette, bold Anton title with a neon Pacifico subtitle.

export const LAYOUTS = {
  hero:   { label: 'Hero + 3',   panels: 4 },
  four:   { label: '4 Panel',    panels: 4 },
  bleed:   { label: 'Full-Bleed', panels: 1 },
  nine:   { label: '9 Panel',    panels: 9 },
  tilt:   { label: 'Snapshot',   panels: 3 },
  story:  { label: 'Story',      panels: 3 },
};

export const GRADES = {
  sunset: { top: '#ff9a3d', mid: '#ff2e88', bot: '#2b0f5e', accent: '#ffc53d', glow: '#ff2e88' },
  neon:   { top: '#22e6c8', mid: '#ff2e88', bot: '#12062e', accent: '#22e6c8', glow: '#ff2e88' },
  teal:   { top: '#00c2ff', mid: '#ff5fa2', bot: '#0a1030', accent: '#00c2ff', glow: '#ff5fa2' },
  golden: { top: '#ffc53d', mid: '#ff7a3d', bot: '#4a1c00', accent: '#ffe9a8', glow: '#ff7a3d' },
  noir:   { top: '#e8e8e8', mid: '#9a9a9a', bot: '#050505', accent: '#ffffff', glow: '#888888' },
};

export function defaultState() {
  return {
    layout: 'hero', grade: 'sunset', photoMode: 'one',
    title: 'NEON COAST', subtitle: 'Vice City nights',
    titleSize: 100, titlePos: 'bottom',
    panels: Array.from({ length: 9 }, () => ({ photo: 0, zoom: 1, dx: 0, dy: 0 })),
    activePanel: 0,
  };
}

// Panel rectangles in unit space (0..1). Title band is drawn over the bottom
// (or top) of the canvas, so panels keep full height and the title sits on top.
export function layoutPanels(layout, W, H) {
  const g = 0.012; // white gutter, unit of min(W,H)
  const gut = g * Math.min(W, H);
  const inset = (x, y, w, h) => ({ x: x + gut / 2, y: y + gut / 2, w: w - gut, h: h - gut });
  switch (layout) {
    case 'four': return [
      inset(0, 0, W / 2, H / 2), inset(W / 2, 0, W / 2, H / 2),
      inset(0, H / 2, W / 2, H / 2), inset(W / 2, H / 2, W / 2, H / 2)];
    case 'bleed': return [inset(0, 0, W, H)];
    case 'nine': {
      const out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
        out.push(inset(c * W / 3, r * H / 3, W / 3, H / 3));
      return out;
    }
    case 'tilt': return [
      { x: W * 0.06, y: H * 0.05, w: W * 0.52, h: H * 0.55, rot: -0.06 },
      { x: W * 0.48, y: H * 0.12, w: W * 0.46, h: H * 0.5, rot: 0.05 },
      { x: W * 0.24, y: H * 0.52, w: W * 0.55, h: H * 0.4, rot: -0.02 }];
    case 'story': return [
      inset(0, 0, W, H * 0.55), inset(0, H * 0.56, W / 2, H * 0.28),
      inset(W / 2, H * 0.56, W / 2, H * 0.28)];
    case 'hero':
    default: return [
      inset(0, 0, W * 0.62, H),
      inset(W * 0.63, 0, W * 0.37, H / 3),
      inset(W * 0.63, H / 3, W * 0.37, H / 3),
      inset(W * 0.63, (2 * H) / 3, W * 0.37, H / 3)];
  }
}

function drawPhotoCover(ctx, img, rect, zoom, dx, dy) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale, dh = ih * scale;
  const cx = rect.x + rect.w / 2 + dx * rect.w, cy = rect.y + rect.h / 2 + dy * rect.h;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
}

let noiseCanvas = null;
function grain(ctx, W, H, seed) {
  if (!noiseCanvas) {
    noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 160; noiseCanvas.height = 160;
    const nctx = noiseCanvas.getContext('2d');
    const img = nctx.createImageData(160, 160);
    let s = seed;
    for (let i = 0; i < img.data.length; i += 4) {
      s = (s * 16807) % 2147483647;
      const v = 96 + (s % 64);
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.globalCompositeOperation = 'overlay';
  const pat = ctx.createPattern(noiseCanvas, 'repeat');
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function gradeWash(ctx, W, H, grade) {
  const g = GRADES[grade] || GRADES.sunset;
  const grad = ctx.createLinearGradient(0, 0, W * 0.25, H);
  grad.addColorStop(0, g.top); grad.addColorStop(0.55, g.mid); grad.addColorStop(1, g.bot);
  ctx.save();
  ctx.globalAlpha = 0.30;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // warm sky glow at the top, cool shadow at the bottom
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.45);
  sky.addColorStop(0, g.top); sky.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.45); ctx.restore();
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
}

function drawTitleBlock(ctx, W, H, state) {
  const g = GRADES[state.grade] || GRADES.sunset;
  const size = Math.min(W, H) * 0.115 * (state.titleSize / 100);
  const bandH = size * 1.9;
  let bandY;
  if (state.titlePos === 'top') bandY = 0;
  else if (state.titlePos === 'center') bandY = (H - bandH) / 2;
  else bandY = H - bandH;
  ctx.save();
  const band = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  band.addColorStop(0, 'rgba(8,2,18,0)');
  band.addColorStop(0.35, 'rgba(8,2,18,0.82)');
  band.addColorStop(1, 'rgba(8,2,18,0.92)');
  ctx.fillStyle = band; ctx.fillRect(0, bandY, W, bandH);
  ctx.fillStyle = g.accent; ctx.fillRect(W * 0.05, bandY + bandH * 0.16, W * 0.08, Math.max(3, size * 0.06));
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const tx = W * 0.05, ty = bandY + bandH * 0.48;
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.strokeStyle = '#12061f'; ctx.lineJoin = 'round';
  ctx.strokeText(state.title.toUpperCase(), tx, ty);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(state.title.toUpperCase(), tx, ty);
  ctx.font = `${size * 0.42}px Pacifico, cursive`;
  ctx.fillStyle = g.accent;
  ctx.shadowColor = g.glow; ctx.shadowBlur = size * 0.35;
  ctx.fillText(state.subtitle, tx, bandY + bandH * 0.82);
  ctx.restore();
  // heat meter: five stars, top-right
  ctx.save();
  ctx.font = `${Math.min(W, H) * 0.022}px sans-serif`;
  ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillStyle = g.accent;
  ctx.shadowColor = g.glow; ctx.shadowBlur = 5;
  ctx.fillText('★★★★★', W * 0.97, H * 0.025);
  ctx.restore();
}

export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d0714'; ctx.fillRect(0, 0, W, H);
  const rects = layoutPanels(state.layout, W, H);
  const count = LAYOUTS[state.layout].panels;
  const frame = Math.max(3, Math.min(W, H) * 0.008);
  for (let i = 0; i < count; i++) {
    const r = rects[i];
    const p = state.panels[i] || { photo: 0, zoom: 1, dx: 0, dy: 0 };
    const img = photos[state.photoMode === 'one' ? 0 : (p.photo % Math.max(1, photos.length))];
    ctx.save();
    ctx.beginPath();
    if (r.rot) {
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.rotate(r.rot);
      ctx.rect(-r.w / 2, -r.h / 2, r.w, r.h);
    } else ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    if (img && img.complete && img.naturalWidth) {
      if (r.rot) drawPhotoCover(ctx, img, { x: -r.w / 2, y: -r.h / 2, w: r.w, h: r.h }, p.zoom, p.dx, p.dy);
      else drawPhotoCover(ctx, img, r, p.zoom, p.dx, p.dy);
    } else {
      const ph = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
      ph.addColorStop(0, '#3d1a5e'); ph.addColorStop(1, '#12061f');
      ctx.fillStyle = ph; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = '#b8a8c8'; ctx.font = `${Math.min(r.w, r.h) * 0.09}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('PILIH FOTO', r.x + r.w / 2, r.y + r.h / 2);
    }
    ctx.restore();
    // white poster frame around each panel
    ctx.save();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = frame;
    ctx.beginPath();
    if (r.rot) {
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2); ctx.rotate(r.rot);
      ctx.rect(-r.w / 2, -r.h / 2, r.w, r.h);
    } else ctx.rect(r.x, r.y, r.w, r.h);
    ctx.stroke(); ctx.restore();
  }
  gradeWash(ctx, W, H, state.grade);
  grain(ctx, W, H, 1234567);
  drawTitleBlock(ctx, W, H, state);
  // outer border
  ctx.save();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = frame * 1.4;
  ctx.strokeRect(frame * 0.7, frame * 0.7, W - frame * 1.4, H - frame * 1.4);
  ctx.restore();
}

export async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('40px Pacifico'),
      document.fonts.ready,
    ]);
  } catch (e) { /* fall back to system fonts */ }
}

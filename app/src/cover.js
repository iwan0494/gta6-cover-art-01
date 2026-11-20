// cover.js — renderer cover 2D di canvas.
// Key Art: key art film crime-epic berbingkai, BUKAN grid foto polos.
// - Hero close-up wajah POP-OUT: digambar miring -1.5deg, membesar
//   melewati batas grid, shadow berlapis, bingkai emas.
// - Panel inked/banded: outline tinta tebal + stroke putih dalam +
//   pita warna grade + overlay halftone — terbaca sebagai poster art.
// - Judul chrome 3D di atas halftone title block (lihat poster.js).
// - Satu wajah tidak pernah muncul dua kali (faces.dealCast).
// - 9 grade: gradient-map wash + radial sky glow + grain + vignette.

import { photoById, shotById, fitRectToAspect, dealCast, HERO_PHOTO_ID, uploadCrop, faceCentre, shotHasFace, fittedStaysFaceless, pickFacelessShot, pickFacelessShotAny } from './faces.js';
import {
  drawChromeTitle, drawNeonScript, drawRoleTag, drawQuoteBar,
  drawRibbon, drawBilling, drawSeal, drawBarcode,
  drawHalftoneBlock, halftonePattern,
} from './poster.js';

// ------------------------------------------------------------------- grade
// bg: warna dasar kanvas. tint: wash warna (dipakai soft-light).
// accent: pita panel + tag + seal. glow: warna radial sky glow.
export const GRADES = [
  { id: 'sunset',  name: 'Sunset',      bg: '#2a0a2e', tint: 'rgba(255,94,60,0.55)',  accent: '#ffc94d', glow: 'rgba(255,110,80,0.55)' },
  { id: 'neon',    name: 'Neon Night',  bg: '#0a0618', tint: 'rgba(255,46,136,0.50)', accent: '#ff2e88', glow: 'rgba(255,46,136,0.45)' },
  { id: 'teal',    name: 'Teal Pink',   bg: '#062a2a', tint: 'rgba(34,230,255,0.45)', accent: '#22e6ff', glow: 'rgba(34,230,255,0.40)' },
  { id: 'gold',    name: 'Golden Hour', bg: '#2e1c05', tint: 'rgba(255,201,77,0.55)',  accent: '#ffd97a', glow: 'rgba(255,180,60,0.55)' },
  { id: 'noir',    name: 'Noir',        bg: '#0c0c10', tint: 'rgba(120,120,140,0.40)', accent: '#e8e8f0', glow: 'rgba(150,150,180,0.30)' },
  { id: 'vice',    name: 'Vice Violet', bg: '#1c0a33', tint: 'rgba(150,80,255,0.50)',  accent: '#b678ff', glow: 'rgba(150,80,255,0.45)' },
  { id: 'blood',   name: 'Blood Orange',bg: '#2e0a08', tint: 'rgba(255,60,20,0.55)',   accent: '#ff6a3d', glow: 'rgba(255,80,30,0.50)' },
  { id: 'mint',    name: 'Miami Mint',  bg: '#06231f', tint: 'rgba(60,255,190,0.42)',  accent: '#3cffb2', glow: 'rgba(60,255,190,0.38)' },
  { id: 'chrome',  name: 'Chrome Mono', bg: '#14161c', tint: 'rgba(200,210,230,0.38)', accent: '#dfe6f2', glow: 'rgba(210,220,240,0.32)' },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// ------------------------------------------------------------------ layout
// Semua rect dalam fraksi 0..1 dari kanvas. `hero: true` = slot hero.
// `title`: zona judul { cx (fraksi W), bandY, bandH, size (fraksi H) }.
export const LAYOUTS = [
  {
    id: 'keyart', name: 'Key Art',
    rects: [
      { x: 0.02, y: 0.10, w: 0.17, h: 0.34 },
      { x: 0.21, y: 0.06, w: 0.44, h: 0.40, hero: true },
      { x: 0.67, y: 0.10, w: 0.15, h: 0.34 },
      { x: 0.84, y: 0.10, w: 0.14, h: 0.34 },
      { x: 0.02, y: 0.70, w: 0.31, h: 0.22 },
      { x: 0.345, y: 0.70, w: 0.31, h: 0.22 },
      { x: 0.67, y: 0.70, w: 0.31, h: 0.22 },
    ],
    title: { cx: 0.5, bandY: 0.475, bandH: 0.155, size: 0.115 },
  },
  {
    id: 'popout', name: 'Hero Pop-Out',
    rects: [
      { x: 0.02, y: 0.06, w: 0.58, h: 0.72, hero: true },
      { x: 0.62, y: 0.06, w: 0.36, h: 0.225 },
      { x: 0.62, y: 0.305, w: 0.36, h: 0.225 },
      { x: 0.62, y: 0.55, w: 0.36, h: 0.23 },
    ],
    title: { cx: 0.5, bandY: 0.795, bandH: 0.135, size: 0.085, ribbon: 'top' },
  },
  {
    id: 'hero3', name: 'Hero+3',
    rects: [
      { x: 0.02, y: 0.06, w: 0.96, h: 0.40, hero: true },
      { x: 0.02, y: 0.645, w: 0.31, h: 0.25 },
      { x: 0.345, y: 0.645, w: 0.31, h: 0.25 },
      { x: 0.67, y: 0.645, w: 0.31, h: 0.25 },
    ],
    title: { cx: 0.5, bandY: 0.465, bandH: 0.125, size: 0.10 },
  },
  {
    id: 'four', name: 'Four Panel',
    rects: [
      { x: 0.02, y: 0.06, w: 0.47, h: 0.36 },
      { x: 0.51, y: 0.06, w: 0.47, h: 0.36 },
      { x: 0.02, y: 0.625, w: 0.47, h: 0.30 },
      { x: 0.51, y: 0.625, w: 0.47, h: 0.30 },
    ],
    title: { cx: 0.5, bandY: 0.435, bandH: 0.13, size: 0.10 },
  },
  {
    id: 'full', name: 'Full-Bleed',
    rects: [{ x: 0, y: 0, w: 1, h: 1, hero: true }],
    title: { cx: 0.5, bandY: 0.68, bandH: 0.17, size: 0.115 },
  },
  {
    id: 'nine', name: 'Nine Grid',
    rects: [
      { x: 0.02, y: 0.06, w: 0.31, h: 0.27 },
      { x: 0.345, y: 0.06, w: 0.31, h: 0.27, hero: true },
      { x: 0.67, y: 0.06, w: 0.31, h: 0.27 },
      { x: 0.02, y: 0.345, w: 0.31, h: 0.27 },
      { x: 0.345, y: 0.345, w: 0.31, h: 0.27 },
      { x: 0.67, y: 0.345, w: 0.31, h: 0.27 },
      { x: 0.02, y: 0.63, w: 0.31, h: 0.27 },
      { x: 0.345, y: 0.63, w: 0.31, h: 0.27 },
      { x: 0.67, y: 0.63, w: 0.31, h: 0.27 },
    ],
    title: { cx: 0.5, bandY: 0.40, bandH: 0.14, size: 0.095 },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// Rect panel dalam piksel.
export function panelRects(layoutId, W, H) {
  const lay = layoutById(layoutId);
  return lay.rects.map((r) => ({
    x: r.x * W, y: r.y * H, w: r.w * W, h: r.h * H, hero: !!r.hero,
  }));
}

export function panelCount(layoutId) {
  return layoutById(layoutId).rects.length;
}

// Panel default: cast dari dealCast, lalu HERO dipastikan berisi
// close-up wajah portrait — dicari lewat indeks hero di layout,
// bukan diasumsikan di posisi 0.
export function defaultPanels(layoutId, seed = 7) {
  const n = panelCount(layoutId);
  const cast = dealCast(n, seed);
  const rects = layoutById(layoutId).rects;
  const heroIdx = rects.findIndex((r) => r.hero);
  if (heroIdx >= 0) {
    const portraitIdx = cast.findIndex((c) => c.photo === HERO_PHOTO_ID);
    if (portraitIdx >= 0 && portraitIdx !== heroIdx) {
      const tmp = cast[heroIdx];
      cast[heroIdx] = cast[portraitIdx];
      cast[portraitIdx] = tmp;
    }
    cast[heroIdx] = { photo: HERO_PHOTO_ID, shot: 'face' };
  }
  const panels = cast.map((c) => ({ photo: c.photo, shot: c.shot, zoom: 1, dx: 0, dy: 0 }));
  // NOTE: guard faceless TIDAK di sini — aspek panel yang benar hanya
  // diketahui saat render (rect piksel, tergantung ukuran kanvas).
  // Penegakannya ada di guardPanelShot(), dipakai renderCover per panel.
  // ANTI-ADJACENCY: dua panel bersebelahan (dalam urutan layout) tidak
  // boleh memakai foto yang sama — walau satu faceless, tetap terbaca
  // sebagai orang yang sama dua kali. Tukar dengan panel non-tetangga.
  for (let i = 1; i < panels.length; i++) {
    if (panels[i].photo === panels[i - 1].photo) {
      for (let j = i + 1; j < panels.length; j++) {
        // Setelah swap: posisi i diisi foto lama j, posisi j diisi foto lama i.
        // Cek keempat tetangga baru (tetangga dalam yang bertukar selalu beda
        // foto, karena foto i dan j berbeda).
        const newIok = panels[j].photo !== panels[i - 1].photo
          && (i + 1 === j || panels[j].photo !== panels[i + 1].photo);
        const newJok = (j - 1 === i || panels[i].photo !== panels[j - 1].photo)
          && (j + 1 >= panels.length || panels[i].photo !== panels[j + 1].photo);
        if (newIok && newJok) {
          const tmp = panels[i];
          panels[i] = panels[j];
          panels[j] = tmp;
          break;
        }
      }
    }
  }
  return panels;
}

// ------------------------------------------------------------------ gambar
// Gambar foto ke dalam rect panel mengikuti shot (face-aware):
// crop disesuaikan ke aspek panel di sekitar pusat shot, lalu zoom
// (skala di sekitar pusat) + geser dx/dy (fraksi dari rect crop).
export function drawPhotoInto(ctx, img, rect, shotRect, zoom = 1, dx = 0, dy = 0) {
  if (!img || !img.naturalWidth) return;
  const aspect = rect.w / rect.h;
  let src = fitRectToAspect(shotRect, aspect);
  // Zoom: perkecil rect sumber di sekitar pusatnya.
  const zw = src.w / zoom;
  const zh = src.h / zoom;
  let sx = src.x + (src.w - zw) / 2 + dx * src.w;
  let sy = src.y + (src.h - zh) / 2 + dy * src.h;
  sx = Math.max(0, Math.min(1 - zw, sx));
  sy = Math.max(0, Math.min(1 - zh, sy));
  ctx.drawImage(
    img,
    sx * img.naturalWidth, sy * img.naturalHeight,
    zw * img.naturalWidth, zh * img.naturalHeight,
    rect.x, rect.y, rect.w, rect.h,
  );
}

// Wash grade: overlay warna + soft-light supaya foto menyatu dengan grade.
export function gradeWash(ctx, rect, grade) {
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  // Kilau langit radial di sudut atas panel.
  const g = ctx.createRadialGradient(
    rect.x + rect.w * 0.7, rect.y + rect.h * 0.08, 0,
    rect.x + rect.w * 0.7, rect.y + rect.h * 0.08, rect.w * 0.9,
  );
  g.addColorStop(0, grade.glow);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

// Bingkai panel ala poster art: outline tinta tebal, stroke putih dalam,
// pita warna grade di bawah, overlay halftone tipis, outline 1px di tepi.
export function framePanel(ctx, rect, grade, isHero = false) {
  const ink = Math.max(3, rect.w * 0.012);
  ctx.save();
  // Outline tinta.
  ctx.strokeStyle = '#0d0718';
  ctx.lineWidth = ink;
  ctx.strokeRect(rect.x + ink / 2, rect.y + ink / 2, rect.w - ink, rect.h - ink);
  // Stroke putih dalam (jarak = tinta + 2px).
  ctx.strokeStyle = isHero ? grade.accent : 'rgba(255,255,255,0.9)';
  ctx.lineWidth = isHero ? Math.max(2.5, rect.w * 0.008) : 1.5;
  const inner = ink + 2;
  ctx.strokeRect(rect.x + inner, rect.y + inner, rect.w - inner * 2, rect.h - inner * 2);
  // Pita warna grade di tepi bawah panel.
  const bandH = Math.max(4, rect.h * 0.035);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(rect.x + ink, rect.y + rect.h - ink - bandH, rect.w - ink * 2, bandH);
  // Overlay halftone tipis di atas foto.
  const pat = halftonePattern(ctx, 12, 1.0, '#000000', 0.05);
  ctx.fillStyle = pat;
  ctx.fillRect(rect.x + ink, rect.y + ink, rect.w - ink * 2, rect.h - ink * 2);
  // Outline 1px low-opacity di tepi gambar (kedalaman konsisten).
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 1;
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
  ctx.restore();
}

// Chip callout kecil di sudut hero ("SUNSET EDITION").
function drawChip(ctx, text, x, y, size, accent) {
  ctx.save();
  ctx.font = `700 ${size}px Anton, 'Arial Black', sans-serif`;
  const w = ctx.measureText(text).width + size * 1.6;
  const h = size * 1.9;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - size * 0.5, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#160412';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
  ctx.restore();
  return w;
}

// Grain film: titik acak tipis di seluruh kanvas.
function grain(ctx, W, H, seed = 42) {
  let s = seed;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < Math.floor((W * H) / 900); i++) {
    ctx.fillRect(rnd() * W, rnd() * H, 1.4, 1.4);
  }
  ctx.fillStyle = '#000000';
  for (let i = 0; i < Math.floor((W * H) / 1400); i++) {
    ctx.fillRect(rnd() * W, rnd() * H, 1.4, 1.4);
  }
  ctx.restore();
}

function vignette(ctx, W, H) {
  const g = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(5,2,10,0.55)');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Guard waktu-render: shot faceless harus tetap faceless setelah di-fit
// ke ASPEK PIKSEL panel ini (rect.w / rect.h — tergantung ukuran kanvas,
// bukan fraksi layout). Fitting bisa menarik wajah masuk lagi; bila bocor,
// ganti ke shot faceless lain yang lolos uji fittedStaysFaceless untuk
// aspek ini (foto sama dulu, lalu foto lain). `usedPairs` = pasangan
// foto:shot yang sudah dipakai panel lain di render ini, supaya tidak
// ada dua panel dengan shot yang sama.
export function guardPanelShot(p, aspect, usedPairs) {
  const photo = photoById(p.photo);
  if (!photo) return { photo: p.photo, shot: p.shot };
  const shot = shotById(photo, p.shot);
  if (!shot || shotHasFace(photo, shot)) return { photo: p.photo, shot: p.shot };
  if (fittedStaysFaceless(photo, shot, aspect)) return { photo: p.photo, shot: p.shot };
  const usedShots = usedPairs
    .filter((q) => q.photo === photo.id)
    .map((q) => q.shot);
  const rep = pickFacelessShot(photo, aspect, usedShots)
    || pickFacelessShotAny(aspect, photo.id, usedPairs);
  return rep || { photo: p.photo, shot: p.shot };
}

// ------------------------------------------------------------------ render
// state: { layout, grade, title, subtitle, panels, images }
// images: Map id -> HTMLImageElement (foto contoh + upload).
export function renderCover(ctx, W, H, state) {
  const grade = gradeById(state.grade);
  const lay = layoutById(state.layout);
  const rects = panelRects(state.layout, W, H);
  const panels = state.panels || defaultPanels(state.layout);

  // Latar + sky glow radial.
  ctx.save();
  ctx.fillStyle = grade.bg;
  ctx.fillRect(0, 0, W, H);
  const sky = ctx.createRadialGradient(
    W * 0.72, H * 0.02, 0, W * 0.72, H * 0.02, W * 0.85,
  );
  sky.addColorStop(0, grade.glow);
  sky.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Quote bar atas.
  drawQuoteBar(ctx, W * 0.02, H * 0.012, W * 0.96,
    'The most wanted sunset in Leonida', Math.max(9, H * 0.016));

  // Panel biasa dulu (hero digambar terakhir supaya menembus di atas).
  const heroIdx = rects.findIndex((r) => r.hero);
  const usedPairs = panels.map((q) => ({ photo: q.photo, shot: q.shot }));
  rects.forEach((rect, i) => {
    if (i === heroIdx) return;
    const p = panels[i] || panels[0];
    const resolved = guardPanelShot(p, rect.w / rect.h, usedPairs);
    usedPairs[i] = resolved;
    const photo = photoById(resolved.photo);
    const shot = photo ? shotById(photo, resolved.shot) : null;
    const img = state.images ? state.images.get(resolved.photo) : null;
    const shotRect = shot ? shot.rect : (img ? uploadCrop() : null);
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (img && shotRect) drawPhotoInto(ctx, img, rect, shotRect, p.zoom, p.dx, p.dy);
    else { ctx.fillStyle = '#241533'; ctx.fillRect(rect.x, rect.y, rect.w, rect.h); }
    gradeWash(ctx, rect, grade);
    ctx.restore();
    framePanel(ctx, rect, grade, false);
    if (photo) {
      drawRoleTag(ctx, photo.role, rect.x + rect.w * 0.06,
        rect.y + rect.h * 0.14, Math.max(8, rect.w * 0.055), grade.accent);
    }
  });

  // HERO pop-out: miring -1.5deg, membesar keluar grid, shadow berlapis.
  if (heroIdx >= 0) {
    const rect = rects[heroIdx];
    const p = panels[heroIdx] || panels[0];
    const resolved = guardPanelShot(p, rect.w / rect.h, usedPairs);
    usedPairs[heroIdx] = resolved;
    const photo = photoById(resolved.photo);
    const shot = photo ? shotById(photo, resolved.shot) : null;
    const img = state.images ? state.images.get(resolved.photo) : null;
    const shotRect = shot ? shot.rect : (img ? uploadCrop() : null);
    // Perbesaran keluar grid: +5% lebar, +7% tinggi.
    const ex = { x: rect.x - rect.w * 0.025, y: rect.y - rect.h * 0.035,
      w: rect.w * 1.05, h: rect.h * 1.07 };
    const cx = ex.x + ex.w / 2;
    const cy = ex.y + ex.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.026); // -1.5 derajat, "tilted snapshot".
    ctx.translate(-cx, -cy);
    // Shadow berlapis (3 lapis, makin jauh makin pudar).
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(ex.x + 6, ex.y + 12, ex.w, ex.h);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(ex.x + 12, ex.y + 22, ex.w, ex.h);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(ex.x + 18, ex.y + 34, ex.w, ex.h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(ex.x, ex.y, ex.w, ex.h);
    ctx.clip();
    if (img && shotRect) drawPhotoInto(ctx, img, ex, shotRect, p.zoom, p.dx, p.dy);
    else { ctx.fillStyle = '#241533'; ctx.fillRect(ex.x, ex.y, ex.w, ex.h); }
    gradeWash(ctx, ex, grade);
    ctx.restore();
    framePanel(ctx, ex, grade, true);
    if (photo) {
      drawRoleTag(ctx, photo.role, ex.x + ex.w * 0.05,
        ex.y + ex.h * 0.13, Math.max(9, ex.w * 0.05), grade.accent);
    }
    // Chip SUNSET EDITION di sudut kanan atas hero.
    drawChip(ctx, 'SUNSET EDITION', ex.x + ex.w * 0.62, ex.y + ex.h * 0.045,
      Math.max(8, ex.w * 0.028), grade.accent);
    ctx.restore();
  }

  // Zona judul: halftone block + chrome 3D + neon script + ribbon.
  const tz = lay.title;
  const bandX = W * 0.06;
  const bandW = W * 0.88;
  const bandY = tz.bandY * H;
  const bandH = tz.bandH * H;
  const titleSize = tz.size * H;
  drawHalftoneBlock(ctx, bandX, bandY, bandW, bandH, grade.accent);
  const title = (state.title || 'NEON COAST').toUpperCase();
  // Kecilkan judul bila lebih lebar dari band.
  let ts = titleSize;
  ctx.font = `900 ${ts}px Anton, 'Arial Black', sans-serif`;
  const tw = ctx.measureText(title).width;
  if (tw > bandW * 0.92) ts = ts * (bandW * 0.92) / tw;
  drawChromeTitle(ctx, title, tz.cx * W, bandY + bandH * 0.62, ts,
    { accent: grade.accent, skew: -0.06 });
  const subtitle = state.subtitle || 'Paid in Sunsets';
  drawNeonScript(ctx, subtitle, tz.cx * W, bandY + bandH * 0.98,
    Math.max(10, titleSize * 0.30));
  const ribbonSize = Math.max(9, titleSize * 0.20);
  const ribbonH = ribbonSize * 1.7;
  // Pop-out: band judul terlalu rendah untuk ribbon di bawahnya (ribbon
  // akan menimpa billing) — ribbon menumpang di tepi ATAS band.
  let ribbonY = bandY + bandH + titleSize * 0.10;
  if (tz.ribbon === 'top' || ribbonY + ribbonH > H * 0.97) ribbonY = bandY - ribbonH * 0.5;
  drawRibbon(ctx, 'EVERYONE WANTS A CUT OF THE SUNSET', tz.cx * W,
    ribbonY, bandW * 0.9, ribbonSize);

  // Billing + barcode + seal + COMING SOON (kaki poster).
  const footY = H * 0.945;
  drawBilling(ctx, [
    'NEON COAST  •  A LEONIDA STORY  •  STARRING THE DRIVER  THE CAPTAIN  THE ARTIST  THE LOOKOUT  THE SINGER',
    'DIRECTED BY NEON COAST STUDIO  •  MUSIC BY THE STAGE SINGER  •  SHOT ON LEONIDA BOULEVARD',
  ], W * 0.58, footY, Math.max(7, H * 0.011), W * 0.60);
  drawBarcode(ctx, W * 0.02, H * 0.925, W * 0.09, H * 0.05);
  ctx.save();
  ctx.font = `700 ${Math.max(8, H * 0.016)}px Anton, 'Arial Black', sans-serif`;
  ctx.fillStyle = '#ffc94d';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('COMING SOON', W * 0.125, H * 0.965);
  ctx.restore();
  drawSeal(ctx, W * 0.935, H * 0.895, Math.max(20, H * 0.062),
    'NEON COAST', '2026', 'LEONIDA');

  grain(ctx, W, H);
  vignette(ctx, W, H);
}

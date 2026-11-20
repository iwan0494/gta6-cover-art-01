// poster.js — furniture poster film, digambar di canvas 2D.
// Judul chrome 3D: gradien vertikal silver -> emas -> pink, outline
// gelap tebal, ekstrusi berlapis (bayangan offset), highlight atas,
// sedikit skew supaya terasa seperti huruf poster retro yang dicetak.
// Subjudul Pacifico neon dengan glow. Role tag miring, quote bar
// berbintang, ribbon, billing block, seal bundar, barcode, halftone.

// Pola titik halftone (dipakai untuk title block + overlay panel).
export function halftonePattern(ctx, size, dot, color, alpha) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.clearRect(0, 0, size, size);
  g.fillStyle = color;
  g.globalAlpha = alpha;
  g.beginPath();
  g.arc(size / 2, size / 2, dot, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(0, 0, dot * 0.7, 0, Math.PI * 2);
  g.arc(size, 0, dot * 0.7, 0, Math.PI * 2);
  g.arc(0, size, dot * 0.7, 0, Math.PI * 2);
  g.arc(size, size, dot * 0.7, 0, Math.PI * 2);
  g.fill();
  return ctx.createPattern(c, 'repeat');
}

// Blok halftone di belakang judul: pita gelap + titik-titik rapat,
// supaya judul chrome "duduk" di atas poster, bukan melayang.
export function drawHalftoneBlock(ctx, x, y, w, h, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(10,4,20,0.82)';
  ctx.fillRect(x, y, w, h);
  const pat = halftonePattern(ctx, 14, 2.2, accent, 0.55);
  ctx.fillStyle = pat;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(2, h * 0.06);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

// Judul chrome 3D. `opts`: { font, skew, accent }.
// Gradien: perak terang -> putih -> emas -> pink gelap (vertikal).
// Ekstrusi: 4 lapis offset gelap ke bawah-kanan + 1 highlight putih tipis.
export function drawChromeTitle(ctx, text, cx, y, size, opts = {}) {
  const accent = opts.accent || '#ffc94d';
  const skew = opts.skew ?? -0.06;
  const font = opts.font || `900 ${size}px Anton, 'Arial Black', sans-serif`;
  ctx.save();
  ctx.translate(cx, y);
  ctx.transform(1, 0, skew, 1, 0, 0);
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const grad = ctx.createLinearGradient(0, -size * 0.85, 0, size * 0.15);
  grad.addColorStop(0.0, '#ffffff');
  grad.addColorStop(0.28, '#dfe6f2');
  grad.addColorStop(0.45, '#9aa7bd');
  grad.addColorStop(0.58, '#ffd97a');
  grad.addColorStop(0.72, '#ff9d5c');
  grad.addColorStop(0.88, '#ff2e88');
  grad.addColorStop(1.0, '#8f1d5e');
  // Ekstrusi berlapis: makin jauh makin gelap.
  const layers = [
    [size * 0.015, size * 0.02, '#3a0d24'],
    [size * 0.03, size * 0.04, '#2a0a1c'],
    [size * 0.05, size * 0.065, '#1c0613'],
    [size * 0.075, size * 0.095, '#12040c'],
  ];
  for (const [dx, dy, col] of layers) {
    ctx.fillStyle = col;
    ctx.fillText(text, dx, dy);
  }
  // Outline gelap tebal di sekeliling huruf.
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#160412';
  ctx.lineWidth = Math.max(2, size * 0.045);
  ctx.strokeText(text, 0, 0);
  // Isi chrome.
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0);
  // Highlight atas: garis putih tipis di puncak huruf.
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 0, -size * 0.02);
  ctx.restore();
  ctx.restore();
  return ctx.measureText(text).width;
}

// Subjudul neon Pacifico dengan glow pink/cyan.
export function drawNeonScript(ctx, text, cx, y, size, color = '#ff5fa8') {
  ctx.save();
  ctx.font = `${size}px Pacifico, cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 0.55;
  ctx.fillStyle = color;
  ctx.fillText(text, cx, y);
  ctx.shadowBlur = size * 0.25;
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.9;
  ctx.fillText(text, cx, y);
  ctx.restore();
}

// Role tag miring hitam dengan teks putih + garis aksen bawah.
export function drawRoleTag(ctx, text, x, y, size, accent = '#ffc94d') {
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, -0.12, 1, 0, 0);
  ctx.font = `700 ${size}px Anton, 'Arial Black', sans-serif`;
  const w = ctx.measureText(text).width;
  const padX = size * 0.55;
  const padY = size * 0.32;
  ctx.fillStyle = 'rgba(8,3,14,0.92)';
  ctx.fillRect(-padX, -size - padY * 0.4, w + padX * 2, size + padY);
  ctx.fillStyle = accent;
  ctx.fillRect(-padX, size + padY * 0.6, w + padX * 2, Math.max(2, size * 0.12));
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, 0, 0);
  ctx.restore();
  return w + padX * 2;
}

// Quote bar atas: 5 bintang emas + kutipan pers + kotak "VOL. 1".
export function drawQuoteBar(ctx, x, y, w, quote, size) {
  const star = (sx, sy, r, col) => {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  ctx.save();
  ctx.fillStyle = 'rgba(8,3,14,0.88)';
  ctx.fillRect(x, y, w, size * 2.1);
  const cy = y + size * 1.05;
  let sx = x + size * 0.9;
  for (let i = 0; i < 5; i++) {
    star(sx, cy, size * 0.55, '#ffc94d');
    sx += size * 1.25;
  }
  ctx.font = `italic 700 ${size}px Georgia, serif`;
  ctx.fillStyle = '#f6f0ff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('"' + quote + '"', sx + size * 0.3, cy);
  // Kotak VOL. 1 di kanan.
  ctx.font = `700 ${size * 0.95}px Anton, 'Arial Black', sans-serif`;
  const label = 'VOL. 1';
  const lw = ctx.measureText(label).width;
  const bx = x + w - lw - size * 1.6;
  ctx.strokeStyle = '#ffc94d';
  ctx.lineWidth = Math.max(1.5, size * 0.08);
  ctx.strokeRect(bx, y + size * 0.35, lw + size * 1.2, size * 1.4);
  ctx.fillStyle = '#ffc94d';
  ctx.textAlign = 'center';
  ctx.fillText(label, bx + (lw + size * 1.2) / 2, cy);
  ctx.restore();
}

// Ribbon pink miring di bawah judul.
export function drawRibbon(ctx, text, cx, y, w, size, color = '#ff2e88') {
  ctx.save();
  ctx.translate(cx, y);
  ctx.transform(1, 0, -0.08, 1, 0, 0);
  ctx.font = `700 ${size}px Anton, 'Arial Black', sans-serif`;
  const tw = ctx.measureText(text).width;
  const bw = Math.min(w, tw + size * 3.2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-bw / 2, 0);
  ctx.lineTo(bw / 2, 0);
  ctx.lineTo(bw / 2 - size * 0.7, size * 1.7);
  ctx.lineTo(-bw / 2 + size * 0.7, size * 1.7);
  ctx.closePath();
  ctx.fill();
  // Ujung pita kiri-kanan (lipatan).
  ctx.fillStyle = '#a3134f';
  ctx.beginPath();
  ctx.moveTo(-bw / 2, 0); ctx.lineTo(-bw / 2 - size * 0.6, size * 0.5);
  ctx.lineTo(-bw / 2 - size * 0.6, size * 1.2); ctx.lineTo(-bw / 2, size * 1.7);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bw / 2, 0); ctx.lineTo(bw / 2 + size * 0.6, size * 0.5);
  ctx.lineTo(bw / 2 + size * 0.6, size * 1.2); ctx.lineTo(bw / 2, size * 1.7);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, size * 0.85);
  ctx.restore();
}

// Billing block: teks kecil rapat ala kredit film.
export function drawBilling(ctx, lines, cx, y, size, width) {
  ctx.save();
  ctx.font = `${size}px 'Arial Narrow', Arial, sans-serif`;
  ctx.fillStyle = 'rgba(246,240,255,0.85)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let yy = y;
  for (const line of lines) {
    ctx.fillText(line, cx, yy, width);
    yy += size * 1.45;
  }
  ctx.restore();
  return yy;
}

// Seal bundar emas dengan teks melingkar.
export function drawSeal(ctx, cx, cy, r, topText, midText, botText) {
  ctx.save();
  ctx.translate(cx, cy);
  // Cincin luar + dalam.
  ctx.fillStyle = '#ffc94d';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a1e46';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffc94d';
  ctx.lineWidth = Math.max(1.5, r * 0.05);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2); ctx.stroke();
  // Teks melingkar atas + bawah.
  const ring = (text, startAngle, endAngle, radius, size, flip) => {
    ctx.save();
    ctx.font = `700 ${size}px Anton, 'Arial Black', sans-serif`;
    ctx.fillStyle = '#ffe9a8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const n = text.length;
    for (let i = 0; i < n; i++) {
      const a = startAngle + ((endAngle - startAngle) * (n === 1 ? 0.5 : i / (n - 1)));
      ctx.save();
      ctx.rotate(a);
      ctx.translate(0, flip ? radius : -radius);
      if (flip) ctx.rotate(Math.PI);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  };
  ring(topText, -Math.PI * 0.78, -Math.PI * 0.22, r * 0.79, r * 0.16, false);
  ring(botText, Math.PI * 0.22, Math.PI * 0.78, r * 0.79, r * 0.16, true);
  // Bintang tengah + teks tengah.
  ctx.fillStyle = '#ffc94d';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r * 0.26 : r * 0.12;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = Math.cos(a) * rr, py = Math.sin(a) * rr - r * 0.08;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
  ctx.font = `700 ${r * 0.24}px Anton, 'Arial Black', sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(midText, 0, r * 0.34);
  ctx.restore();
}

// Barcode hitam-putih di bawah billing.
export function drawBarcode(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  let bx = x + w * 0.04;
  let seed = 1234567;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  ctx.fillStyle = '#0d0718';
  while (bx < x + w * 0.96) {
    const bw = 1 + rnd() * w * 0.03;
    if (rnd() > 0.45) ctx.fillRect(bx, y + h * 0.06, bw, h * 0.88);
    bx += bw + 1 + rnd() * w * 0.012;
  }
  ctx.restore();
}
